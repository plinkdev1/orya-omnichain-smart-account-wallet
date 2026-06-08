import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resolvers } from './resolvers';
import { GraphQLContext, FeatureType, ProtocolTier } from './types';

describe('Protocol Service Resolvers', () => {
  let mockContext: Partial<GraphQLContext>;

  beforeEach(() => {
    mockContext = {
      redis: {
        get: vi.fn(),
        setex: vi.fn(),
        del: vi.fn(),
      },
      prisma: {
        protocol: {
          findMany: vi.fn(),
          findUnique: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
        },
        protocolHealth: {
          findUnique: vi.fn(),
          create: vi.fn(),
        },
        protocolPreference: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
        },
      },
      logger: {
        debug: vi.fn(),
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
      },
      dataloaders: {},
      user: { id: 'user123' },
    };
  });

  describe('Query.protocols', () => {
    it('should return protocols from cache if available', async () => {
      const mockProtocols = [
        {
          id: 'proto1',
          name: 'Test Protocol',
          chainId: 'ethereum',
          type: 'SWAP',
          version: '1.0.0',
          logoUrl: 'https://example.com/logo.png',
          isActive: true,
          isAudited: false,
          auditors: [],
          tier: 'CORE',
          metadata: {
            website: 'https://example.com',
            docs: 'https://docs.example.com',
            tvl: 1000000,
            volume24h: 500000,
            fees: {
              protocolFee: 0.25,
              platformFee: 0.05,
              totalFee: 0.3,
              feeBreakdown: 'Protocol: 0.25%, Platform: 0.05%',
            },
            securityRating: 95,
            supportedTokens: ['ETH', 'USDC'],
          },
        },
      ];

      (mockContext.redis!.get as any).mockResolvedValue(JSON.stringify(mockProtocols));

      const result = await resolvers.Query.protocols(
        null,
        { chainId: 'ethereum', feature: FeatureType.SWAP },
        mockContext as GraphQLContext
      );

      expect(result).toEqual(mockProtocols);
      expect(mockContext.redis!.get).toHaveBeenCalledWith('protocols:ethereum:SWAP');
    });

    it('should fetch from database if not in cache', async () => {
      const mockProtocols = [
        {
          id: 'proto1',
          name: 'Test Protocol',
          chainId: 'ethereum',
          type: 'SWAP',
          version: '1.0.0',
          logoUrl: 'https://example.com/logo.png',
          isActive: true,
          isAudited: false,
          auditors: [],
          tier: 'CORE',
          metadata: {},
        },
      ];

      (mockContext.redis!.get as any).mockResolvedValue(null);
      (mockContext.prisma!.protocol.findMany as any).mockResolvedValue(mockProtocols);

      const result = await resolvers.Query.protocols(
        null,
        { chainId: 'ethereum', feature: FeatureType.SWAP },
        mockContext as GraphQLContext
      );

      expect(result).toEqual(mockProtocols);
      expect(mockContext.prisma!.protocol.findMany).toHaveBeenCalled();
      expect(mockContext.redis!.setex).toHaveBeenCalledWith(
        'protocols:ethereum:SWAP',
        300,
        JSON.stringify(mockProtocols)
      );
    });
  });

  describe('Query.protocol', () => {
    it('should return a single protocol by id', async () => {
      const mockProtocol = {
        id: 'proto1',
        name: 'Test Protocol',
        chainId: 'ethereum',
        type: 'SWAP',
      };

      (mockContext.redis!.get as any).mockResolvedValue(null);
      (mockContext.prisma!.protocol.findUnique as any).mockResolvedValue(mockProtocol);

      const result = await resolvers.Query.protocol(
        null,
        { id: 'proto1' },
        mockContext as GraphQLContext
      );

      expect(result).toEqual(mockProtocol);
    });

    it('should return null if protocol not found', async () => {
      (mockContext.redis!.get as any).mockResolvedValue(null);
      (mockContext.prisma!.protocol.findUnique as any).mockResolvedValue(null);

      const result = await resolvers.Query.protocol(
        null,
        { id: 'nonexistent' },
        mockContext as GraphQLContext
      );

      expect(result).toBeNull();
    });
  });

  describe('Query.protocolHealth', () => {
    it('should return protocol health', async () => {
      const mockHealth = {
        isOperational: true,
        latency: 100,
        lastChecked: new Date(),
        issues: [],
      };

      (mockContext.redis!.get as any).mockResolvedValue(null);
      (mockContext.prisma!.protocolHealth.findUnique as any).mockResolvedValue(mockHealth);

      const result = await resolvers.Query.protocolHealth(
        null,
        { id: 'proto1' },
        mockContext as GraphQLContext
      );

      expect(result).toEqual(mockHealth);
    });

    it('should throw error if health not found', async () => {
      (mockContext.redis!.get as any).mockResolvedValue(null);
      (mockContext.prisma!.protocolHealth.findUnique as any).mockResolvedValue(null);

      expect(
        resolvers.Query.protocolHealth(
          null,
          { id: 'proto1' },
          mockContext as GraphQLContext
        )
      ).rejects.toThrow();
    });
  });

  describe('Query.userProtocolPreferences', () => {
    it('should return user protocol preferences', async () => {
      const mockPreferences = [
        {
          chainId: 'ethereum',
          feature: 'SWAP',
          preferredProtocol: 'uniswap',
          fallbackProtocols: ['sushiswap'],
          lastUpdated: new Date(),
        },
      ];

      (mockContext.redis!.get as any).mockResolvedValue(null);
      (mockContext.prisma!.protocolPreference.findMany as any).mockResolvedValue(mockPreferences);

      const result = await resolvers.Query.userProtocolPreferences(
        null,
        { userId: 'user123' },
        mockContext as GraphQLContext
      );

      expect(result).toEqual(mockPreferences);
    });
  });

  describe('Query.bestProtocolForIntent', () => {
    it('should return user preferred protocol if available', async () => {
      const intent = {
        type: 'SWAP',
        description: 'Swap ETH for USDC',
        inputToken: 'ETH',
        outputToken: 'USDC',
        minOutputAmount: '1000',
        maxSlippage: 0.5,
        deadline: new Date(Date.now() + 60000),
        routingPreference: 'USER_PREFERRED',
        chainId: 'ethereum',
      };

      const mockUserPref = {
        preferredProtocol: 'uniswap',
      };

      const mockProtocol = {
        id: 'uniswap',
        name: 'Uniswap',
        isActive: true,
      };

      (mockContext.prisma!.protocolPreference.findFirst as any).mockResolvedValue(mockUserPref);
      (mockContext.prisma!.protocol.findUnique as any).mockResolvedValue(mockProtocol);

      const result = await resolvers.Query.bestProtocolForIntent(
        null,
        { intent },
        mockContext as GraphQLContext
      );

      expect(result).toEqual(mockProtocol);
    });

    it('should return best protocol if no user preference', async () => {
      const intent = {
        type: 'SWAP',
        chainId: 'ethereum',
        routingPreference: 'BEST_PRICE',
      };

      const mockProtocols = [
        { id: 'proto1', name: 'Protocol 1', tier: 'CORE', isActive: true },
      ];

      (mockContext.prisma!.protocolPreference.findFirst as any).mockResolvedValue(null);
      (mockContext.prisma!.protocol.findMany as any).mockResolvedValue(mockProtocols);

      const result = await resolvers.Query.bestProtocolForIntent(
        null,
        { intent },
        mockContext as GraphQLContext
      );

      expect(result).toEqual(mockProtocols[0]);
    });
  });

  describe('Mutation.registerProtocol', () => {
    it('should register a new protocol', async () => {
      const input = {
        name: 'New Protocol',
        chainId: 'ethereum',
        type: FeatureType.SWAP,
        version: '1.0.0',
        logoUrl: 'https://example.com/logo.png',
        tier: ProtocolTier.VERIFIED,
        website: 'https://example.com',
        docs: 'https://docs.example.com',
        securityRating: 90,
        supportedTokens: ['ETH', 'USDC'],
        protocolFee: 0.25,
        platformFee: 0.05,
      };

      const mockCreatedProtocol = {
        id: 'new-proto',
        ...input,
        isActive: true,
        isAudited: false,
        auditors: [],
        metadata: {
          fees: {
            protocolFee: 0.25,
            platformFee: 0.05,
            totalFee: 0.3,
            feeBreakdown: 'Protocol: 0.25%, Platform: 0.05%',
          },
        },
      };

      const mockHealth = {
        isOperational: true,
        latency: 0,
        lastChecked: new Date(),
        issues: [],
      };

      (mockContext.prisma!.protocol.create as any).mockResolvedValue(mockCreatedProtocol);
      (mockContext.prisma!.protocolHealth.create as any).mockResolvedValue(mockHealth);

      const result = await resolvers.Mutation.registerProtocol(
        null,
        { input },
        mockContext as GraphQLContext
      );

      expect(result.name).toEqual('New Protocol');
      expect(result.health).toEqual(mockHealth);
      expect(mockContext.logger!.info).toHaveBeenCalledWith('Protocol registered', expect.any(Object));
    });
  });

  describe('Mutation.activateProtocol', () => {
    it('should activate a protocol', async () => {
      const mockProtocol = {
        id: 'proto1',
        name: 'Protocol 1',
        isActive: true,
        chainId: 'ethereum',
        type: 'SWAP',
      };

      (mockContext.prisma!.protocol.update as any).mockResolvedValue(mockProtocol);

      const result = await resolvers.Mutation.activateProtocol(
        null,
        { id: 'proto1' },
        mockContext as GraphQLContext
      );

      expect(result.isActive).toBe(true);
      expect(mockContext.redis!.del).toHaveBeenCalled();
    });
  });

  describe('Mutation.deactivateProtocol', () => {
    it('should deactivate a protocol', async () => {
      const mockProtocol = {
        id: 'proto1',
        name: 'Protocol 1',
        isActive: false,
        chainId: 'ethereum',
        type: 'SWAP',
      };

      (mockContext.prisma!.protocol.update as any).mockResolvedValue(mockProtocol);

      const result = await resolvers.Mutation.deactivateProtocol(
        null,
        { id: 'proto1' },
        mockContext as GraphQLContext
      );

      expect(result.isActive).toBe(false);
    });
  });
});
