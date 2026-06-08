import { GraphQLContext, Protocol, ProtocolHealth, ProtocolPreference, TransactionIntent, FeatureType, RegisterProtocolInput, UpdateProtocolInput } from './types';

export const resolvers = {
  Query: {
    async protocols(
      parent: any,
      args: { chainId: string; feature: FeatureType },
      context: GraphQLContext
    ): Promise<Protocol[]> {
      const cacheKey = `protocols:${args.chainId}:${args.feature}`;
      
      try {
        const cached = await context.redis.get(cacheKey);
        if (cached) {
          context.logger.debug('Protocols cache hit', { cacheKey });
          return JSON.parse(cached);
        }

        const protocols = await context.prisma.protocol.findMany({
          where: {
            chainId: args.chainId,
            type: args.feature,
            isActive: true,
          },
          include: {
            metadata: true,
          },
        });

        await context.redis.setex(cacheKey, 300, JSON.stringify(protocols));
        return protocols;
      } catch (error) {
        context.logger.error('Error fetching protocols', { error, args });
        throw new Error(`Failed to fetch protocols: ${(error as Error).message}`);
      }
    },

    async protocol(
      parent: any,
      args: { id: string },
      context: GraphQLContext
    ): Promise<Protocol | null> {
      const cacheKey = `protocol:${args.id}`;

      try {
        const cached = await context.redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }

        const protocol = await context.prisma.protocol.findUnique({
          where: { id: args.id },
          include: {
            metadata: true,
          },
        });

        if (protocol) {
          await context.redis.setex(cacheKey, 600, JSON.stringify(protocol));
        }

        return protocol;
      } catch (error) {
        context.logger.error('Error fetching protocol', { error, id: args.id });
        throw new Error(`Failed to fetch protocol: ${(error as Error).message}`);
      }
    },

    async protocolHealth(
      parent: any,
      args: { id: string },
      context: GraphQLContext
    ): Promise<ProtocolHealth> {
      const cacheKey = `protocol:health:${args.id}`;

      try {
        const cached = await context.redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }

        const health = await context.prisma.protocolHealth.findUnique({
          where: { protocolId: args.id },
        });

        if (!health) {
          throw new Error(`Protocol health not found for ${args.id}`);
        }

        await context.redis.setex(cacheKey, 60, JSON.stringify(health));
        return health;
      } catch (error) {
        context.logger.error('Error fetching protocol health', { error, id: args.id });
        throw new Error(`Failed to fetch protocol health: ${(error as Error).message}`);
      }
    },

    async userProtocolPreferences(
      parent: any,
      args: { userId: string },
      context: GraphQLContext
    ): Promise<ProtocolPreference[]> {
      const cacheKey = `user:protocol:prefs:${args.userId}`;

      try {
        const cached = await context.redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }

        const preferences = await context.prisma.protocolPreference.findMany({
          where: { userId: args.userId },
        });

        await context.redis.setex(cacheKey, 300, JSON.stringify(preferences));
        return preferences;
      } catch (error) {
        context.logger.error('Error fetching user protocol preferences', { error, userId: args.userId });
        throw new Error(`Failed to fetch preferences: ${(error as Error).message}`);
      }
    },

    async bestProtocolForIntent(
      parent: any,
      args: { intent: TransactionIntent },
      context: GraphQLContext
    ): Promise<Protocol> {
      const intent = args.intent;

      try {
        if (intent.routingPreference === 'USER_PREFERRED' && context.user?.id) {
          const userPrefs = await context.prisma.protocolPreference.findFirst({
            where: {
              userId: context.user.id,
              chainId: intent.chainId,
              feature: intent.type,
            },
          });

          if (userPrefs) {
            const protocol = await context.prisma.protocol.findUnique({
              where: { id: userPrefs.preferredProtocol },
              include: { metadata: true },
            });

            if (protocol && protocol.isActive) {
              return protocol;
            }
          }
        }

        const protocols = await context.prisma.protocol.findMany({
          where: {
            chainId: intent.chainId,
            type: intent.type,
            isActive: true,
          },
          include: {
            metadata: true,
          },
          orderBy: [
            { tier: 'asc' },
            { metadata: { securityRating: 'desc' } },
          ],
        });

        if (protocols.length === 0) {
          throw new Error(`No available protocols for ${intent.chainId}:${intent.type}`);
        }

        const bestProtocol = protocols[0];
        context.logger.debug('Selected best protocol', {
          protocolId: bestProtocol.id,
          preference: intent.routingPreference,
        });

        return bestProtocol;
      } catch (error) {
        context.logger.error('Error selecting best protocol', { error, intent });
        throw new Error(`Failed to select best protocol: ${(error as Error).message}`);
      }
    },
  },

  Mutation: {
    async registerProtocol(
      parent: any,
      args: { input: RegisterProtocolInput },
      context: GraphQLContext
    ): Promise<Protocol> {
      const input = args.input;

      try {
        const protocol = await context.prisma.protocol.create({
          data: {
            name: input.name,
            chainId: input.chainId,
            type: input.type,
            version: input.version,
            logoUrl: input.logoUrl,
            isActive: true,
            isAudited: false,
            auditors: [],
            tier: input.tier,
            metadata: {
              create: {
                website: input.website,
                docs: input.docs,
                tvl: 0,
                volume24h: 0,
                securityRating: input.securityRating,
                supportedTokens: input.supportedTokens,
                fees: {
                  protocolFee: input.protocolFee,
                  platformFee: input.platformFee,
                  totalFee: input.protocolFee + input.platformFee,
                  feeBreakdown: `Protocol: ${input.protocolFee}%, Platform: ${input.platformFee}%`,
                },
              },
            },
          },
          include: {
            metadata: true,
          },
        });

        const health = await context.prisma.protocolHealth.create({
          data: {
            protocolId: protocol.id,
            isOperational: true,
            latency: 0,
            lastChecked: new Date(),
            issues: [],
          },
        });

        context.logger.info('Protocol registered', { protocolId: protocol.id, name: protocol.name });

        await context.redis.del(`protocols:${input.chainId}:${input.type}`);

        return {
          ...protocol,
          health,
        };
      } catch (error) {
        context.logger.error('Error registering protocol', { error, input });
        throw new Error(`Failed to register protocol: ${(error as Error).message}`);
      }
    },

    async updateProtocol(
      parent: any,
      args: { id: string; input: UpdateProtocolInput },
      context: GraphQLContext
    ): Promise<Protocol> {
      const { id, input } = args;

      try {
        const existing = await context.prisma.protocol.findUnique({
          where: { id },
          include: { metadata: true },
        });

        if (!existing) {
          throw new Error(`Protocol not found: ${id}`);
        }

        const updated = await context.prisma.protocol.update({
          where: { id },
          data: {
            ...(input.name && { name: input.name }),
            ...(input.logoUrl && { logoUrl: input.logoUrl }),
            ...(input.tier && { tier: input.tier }),
            metadata: {
              update: {
                ...(input.website && { website: input.website }),
                ...(input.docs && { docs: input.docs }),
                ...(input.tvl !== undefined && { tvl: input.tvl }),
                ...(input.volume24h !== undefined && { volume24h: input.volume24h }),
                ...(input.securityRating !== undefined && { securityRating: input.securityRating }),
                ...(input.supportedTokens && { supportedTokens: input.supportedTokens }),
                ...(input.protocolFee !== undefined || input.platformFee !== undefined) && {
                  fees: {
                    protocolFee: input.protocolFee ?? existing.metadata.fees.protocolFee,
                    platformFee: input.platformFee ?? existing.metadata.fees.platformFee,
                    totalFee: (input.protocolFee ?? existing.metadata.fees.protocolFee) + (input.platformFee ?? existing.metadata.fees.platformFee),
                    feeBreakdown: `Protocol: ${input.protocolFee ?? existing.metadata.fees.protocolFee}%, Platform: ${input.platformFee ?? existing.metadata.fees.platformFee}%`,
                  },
                },
              },
            },
          },
          include: {
            metadata: true,
          },
        });

        context.logger.info('Protocol updated', { protocolId: id });

        const cacheKey = `protocol:${id}`;
        await context.redis.del(cacheKey);
        await context.redis.del(`protocols:${updated.chainId}:${updated.type}`);

        return updated;
      } catch (error) {
        context.logger.error('Error updating protocol', { error, id, input });
        throw new Error(`Failed to update protocol: ${(error as Error).message}`);
      }
    },

    async activateProtocol(
      parent: any,
      args: { id: string },
      context: GraphQLContext
    ): Promise<Protocol> {
      try {
        const protocol = await context.prisma.protocol.update({
          where: { id: args.id },
          data: { isActive: true },
          include: { metadata: true },
        });

        context.logger.info('Protocol activated', { protocolId: args.id });

        const cacheKey = `protocol:${args.id}`;
        await context.redis.del(cacheKey);
        await context.redis.del(`protocols:${protocol.chainId}:${protocol.type}`);

        return protocol;
      } catch (error) {
        context.logger.error('Error activating protocol', { error, id: args.id });
        throw new Error(`Failed to activate protocol: ${(error as Error).message}`);
      }
    },

    async deactivateProtocol(
      parent: any,
      args: { id: string },
      context: GraphQLContext
    ): Promise<Protocol> {
      try {
        const protocol = await context.prisma.protocol.update({
          where: { id: args.id },
          data: { isActive: false },
          include: { metadata: true },
        });

        context.logger.info('Protocol deactivated', { protocolId: args.id });

        const cacheKey = `protocol:${args.id}`;
        await context.redis.del(cacheKey);
        await context.redis.del(`protocols:${protocol.chainId}:${protocol.type}`);

        return protocol;
      } catch (error) {
        context.logger.error('Error deactivating protocol', { error, id: args.id });
        throw new Error(`Failed to deactivate protocol: ${(error as Error).message}`);
      }
    },
  },

  Subscription: {
    protocolHealthChanged: {
      subscribe: async (
        parent: any,
        args: { protocolId: string },
        context: GraphQLContext
      ) => {
        const pubSub = context.redis;
        const channel = `protocol:health:${args.protocolId}`;

        return pubSub.subscribe(channel, (err: any) => {
          if (err) {
            context.logger.error('Subscription error', { error: err, channel });
          }
        });
      },
      resolve: (payload: any) => payload,
    },
  },

  Protocol: {
    async health(parent: Protocol, args: any, context: GraphQLContext): Promise<ProtocolHealth | null> {
      try {
        return await context.dataloaders?.protocolHealth?.load(parent.id) || null;
      } catch (error) {
        context.logger.error('Error loading protocol health', { error, protocolId: parent.id });
        return null;
      }
    },
  },
};
