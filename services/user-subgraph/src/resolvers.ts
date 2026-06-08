import { GraphQLError } from 'graphql';
import {
  User,
  ProtocolPreference,
  KYCStatus,
  KYCProvider,
  FeatureType,
  AutoSigningConfig,
  GraphQLContext,
  UserConnection,
  UserFilter,
  PaginationInput,
} from './types';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  requireAuth,
  canAccessUserData,
} from './middleware/auth';
import { hashPassword, verifyPassword } from './utils/crypto';

interface SignupInput {
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface UpdateProfileInput {
  email?: string;
  advancedMode?: boolean;
}

interface UserPreferencesInput {
  defaultChain?: string;
  hiddenTokens?: string[];
  favoriteProtocols?: string[];
}

interface SetProtocolPreferenceInput {
  chainId: string;
  feature: FeatureType;
  protocolId: string;
  fallbacks?: string[];
}

export const resolvers = {
  Query: {
    me: async (parent: any, args: any, context: GraphQLContext) => {
      const userId = requireAuth(context);
      return context.prisma.user.findUnique({
        where: { id: userId },
        include: {
          preferences: {
            include: {
              autoSigning: true,
            },
          },
          protocolPreferences: true,
        },
      });
    },

    user: async (parent: any, args: { id: string }, context: GraphQLContext) => {
      if (!canAccessUserData(context, args.id)) {
        throw new GraphQLError('Forbidden: Cannot access this user data', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      return context.dataloaders.userById.load(args.id);
    },

    users: async (
      parent: any,
      args: { filter?: UserFilter; pagination?: PaginationInput },
      context: GraphQLContext
    ): Promise<UserConnection> => {
      // Only admins can list users
      if (!context.user?.email || !isAdminEmail(context.user.email)) {
        throw new GraphQLError('Forbidden: Admin access required', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      const where: any = {};
      if (args.filter?.email) where.email = { contains: args.filter.email };
      if (args.filter?.kycStatus) where.kycStatus = args.filter.kycStatus;
      if (args.filter?.advancedMode !== undefined)
        where.advancedMode = args.filter.advancedMode;
      if (args.filter?.search) {
        where.OR = [
          { email: { contains: args.filter.search } },
          { privyId: { contains: args.filter.search } },
        ];
      }

      const total = await context.prisma.user.count({ where });
      const users = await context.prisma.user.findMany({
        where,
        include: {
          preferences: {
            include: {
              autoSigning: true,
            },
          },
          protocolPreferences: true,
        },
        take: args.pagination?.first || 10,
        skip: args.pagination?.after ? 1 : 0,
      });

      const edges = users.map((user, index) => ({
        cursor: Buffer.from(JSON.stringify({ id: user.id })).toString('base64'),
        node: user,
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage: total > (args.pagination?.first || 10),
          hasPreviousPage: !!(args.pagination?.after),
          startCursor: edges[0]?.cursor,
          endCursor: edges[edges.length - 1]?.cursor,
        },
        totalCount: total,
      };
    },
  },

  Mutation: {
    signup: async (
      parent: any,
      args: SignupInput,
      context: GraphQLContext
    ) => {
      // Check if user exists
      const existing = await context.prisma.user.findUnique({
        where: { email: args.email },
      });
      if (existing) {
        throw new GraphQLError('User already exists', {
          extensions: { code: 'USER_ALREADY_EXISTS' },
        });
      }

      const passwordHash = await hashPassword(args.password);

      // Create user with default preferences
      const user = await context.prisma.user.create({
        data: {
          email: args.email,
          passwordHash,
          privyId: `privy_${Date.now()}`,
          firebaseUid: `firebase_${Date.now()}`,
          kycStatus: KYCStatus.NONE,
          advancedMode: false,
          preferences: {
            create: {
              defaultChain: 'sui',
              autoSigning: {
                create: {
                  enabled: false,
                  thresholdUSD: 100,
                  expiryHours: 24,
                  maxDailyAmountUSD: 10000,
                  requireBiometric: true,
                },
              },
            },
          },
        },
        include: {
          preferences: {
            include: {
              autoSigning: true,
            },
          },
        },
      });

      const accessToken = generateAccessToken(user.id, user.email);
      const refreshToken = generateRefreshToken(user.id);

      // Cache user
      const cacheKey = `user:${user.id}`;
      await context.redis.setex(cacheKey, 300, JSON.stringify(user));

      return {
        user,
        accessToken,
        refreshToken,
        expiresIn: 86400,
      };
    },

    login: async (
      parent: any,
      args: LoginInput,
      context: GraphQLContext
    ) => {
      const user = await context.prisma.user.findUnique({
        where: { email: args.email },
        include: {
          preferences: {
            include: {
              autoSigning: true,
            },
          },
        },
      });

      if (!user) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'USER_NOT_FOUND' },
        });
      }

      if (!user.passwordHash) {
        throw new GraphQLError('Invalid credentials', {
          extensions: { code: 'INVALID_CREDENTIALS' },
        });
      }

      const passwordMatch = await verifyPassword(args.password, user.passwordHash);
      if (!passwordMatch) {
        throw new GraphQLError('Invalid credentials', {
          extensions: { code: 'INVALID_CREDENTIALS' },
        });
      }

      const accessToken = generateAccessToken(user.id, user.email);
      const refreshToken = generateRefreshToken(user.id);

      // Cache user
      const cacheKey = `user:${user.id}`;
      await context.redis.setex(cacheKey, 300, JSON.stringify(user));

      return {
        user,
        accessToken,
        refreshToken,
        expiresIn: 86400,
      };
    },

    refreshToken: async (
      parent: any,
      args: { refreshToken: string },
      context: GraphQLContext
    ) => {
      const decoded = verifyRefreshToken(args.refreshToken);
      if (!decoded) {
        throw new GraphQLError('Invalid refresh token', {
          extensions: { code: 'INVALID_TOKEN' },
        });
      }

      const user = await context.prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          preferences: {
            include: {
              autoSigning: true,
            },
          },
        },
      });

      if (!user) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'USER_NOT_FOUND' },
        });
      }

      const accessToken = generateAccessToken(user.id, user.email);
      const newRefreshToken = generateRefreshToken(user.id);

      return {
        user,
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: 86400,
      };
    },

    updateProfile: async (
      parent: any,
      args: { input: UpdateProfileInput },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      const user = await context.prisma.user.update({
        where: { id: userId },
        data: {
          email: args.input.email,
          advancedMode: args.input.advancedMode,
        },
        include: {
          preferences: {
            include: {
              autoSigning: true,
            },
          },
        },
      });

      // Invalidate cache
      await context.redis.del(`user:${userId}`);

      return user;
    },

    updatePreferences: async (
      parent: any,
      args: { input: UserPreferencesInput },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      const prefs = await context.prisma.userPreferences.update({
        where: { userId },
        data: {
          defaultChain: args.input.defaultChain,
          hiddenTokens: args.input.hiddenTokens,
          favoriteProtocols: args.input.favoriteProtocols,
        },
        include: {
          autoSigning: true,
        },
      });

      // Invalidate cache
      await context.redis.del(`user:${userId}`);

      return {
        user: await context.prisma.user.findUnique({
          where: { id: userId },
          include: {
            preferences: {
              include: {
                autoSigning: true,
              },
            },
          },
        }),
      };
    },

    setAdvancedMode: async (
      parent: any,
      args: { enabled: boolean },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      const user = await context.prisma.user.update({
        where: { id: userId },
        data: { advancedMode: args.enabled },
        include: {
          preferences: {
            include: {
              autoSigning: true,
            },
          },
        },
      });

      // Invalidate cache
      await context.redis.del(`user:${userId}`);

      return user;
    },

    setProtocolPreference: async (
      parent: any,
      args: {
        chainId: string;
        feature: FeatureType;
        protocolId: string;
        fallbacks?: string[];
      },
      context: GraphQLContext
    ): Promise<ProtocolPreference> => {
      const userId = requireAuth(context);

      const pref = await context.prisma.protocolPreference.upsert({
        where: {
          userId_chainId_feature: {
            userId,
            chainId: args.chainId,
            feature: args.feature,
          },
        },
        create: {
          userId,
          chainId: args.chainId,
          feature: args.feature,
          preferredProtocol: args.protocolId,
          fallbackProtocols: args.fallbacks || [],
        },
        update: {
          preferredProtocol: args.protocolId,
          fallbackProtocols: args.fallbacks || [],
        },
      });

      // Invalidate cache
      await context.redis.del(`user:${userId}`);

      return pref;
    },

    updateAutoSigningConfig: async (
      parent: any,
      args: { config: any },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      // Get user preferences
      let prefs = await context.prisma.userPreferences.findUnique({
        where: { userId },
        include: { autoSigning: true },
      });

      if (!prefs) {
        throw new GraphQLError('User preferences not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Update or create auto signing config
      if (prefs.autoSigning) {
        await context.prisma.autoSigningConfig.update({
          where: { id: prefs.autoSigning.id },
          data: {
            enabled: args.config.enabled,
            thresholdUSD: args.config.thresholdUSD,
            whitelistedContracts: args.config.whitelistedContracts,
            expiryHours: args.config.expiryHours,
            maxDailyAmountUSD: args.config.maxDailyAmountUSD,
            requireBiometric: args.config.requireBiometric,
          },
        });
      } else {
        await context.prisma.autoSigningConfig.create({
          data: {
            userPrefId: prefs.id,
            enabled: args.config.enabled,
            thresholdUSD: args.config.thresholdUSD,
            whitelistedContracts: args.config.whitelistedContracts,
            expiryHours: args.config.expiryHours,
            maxDailyAmountUSD: args.config.maxDailyAmountUSD,
            requireBiometric: args.config.requireBiometric,
          },
        });
      }

      const user = await context.prisma.user.findUnique({
        where: { id: userId },
        include: {
          preferences: {
            include: {
              autoSigning: true,
            },
          },
        },
      });

      // Invalidate cache
      await context.redis.del(`user:${userId}`);

      return user;
    },

    initiateKYC: async (
      parent: any,
      args: { provider: KYCProvider },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      // Create KYC session (simplified - integrate with actual KYC provider)
      const kycSession = {
        id: `kyc_${Date.now()}`,
        userId,
        provider: args.provider,
        sessionId: `session_${Date.now()}`,
        status: 'PENDING',
        externalUrl: `https://kyc-provider.example.com/session/${Date.now()}`,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      return kycSession;
    },

    submitKYCDocuments: async (
      parent: any,
      args: { sessionId: string; documents: any[] },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      // Simplified submission - integrate with actual KYC provider
      const submission = {
        id: `submission_${Date.now()}`,
        sessionId: args.sessionId,
        status: 'SUBMITTED',
        documents: args.documents.map((d: any) => d.filename || d),
        submittedAt: new Date(),
      };

      return submission;
    },
  },

  Subscription: {
    userUpdated: {
      subscribe: (parent: any, args: { userId: string }, context: GraphQLContext) => {
        // Implement with PubSub
        return context.pubSub?.asyncIterator?.([`USER_UPDATED_${args.userId}`]) || [];
      },
    },
    kycStatusChanged: {
      subscribe: (parent: any, args: { userId: string }, context: GraphQLContext) => {
        return context.pubSub?.asyncIterator?.([`KYC_STATUS_${args.userId}`]) || [];
      },
    },
  },

  User: {
    preferences: async (user: User, args: any, context: GraphQLContext) => {
      if (user.preferences) return user.preferences;
      return context.dataloaders.userPreferences.load(user.id);
    },
  },
};

function isAdminEmail(email?: string): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());
  return adminEmails.includes(email);
}
