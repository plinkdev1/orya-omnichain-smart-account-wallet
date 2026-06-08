import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { GraphQLContext } from './types';
import { resolvers } from './resolvers';
import { ProtocolAdapterRegistry } from './utils/protocol-adapter-registry';
import type { ProtocolAdapter } from './types';

const mockPrisma = {
  stakingPosition: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  lendingPosition: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
};

const mockRedis = {
  get: vi.fn(),
  setex: vi.fn(),
  del: vi.fn(),
  keys: vi.fn(),
};

const mockLogger = {
  info: vi.fn(),
  debug: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};

const mockAdapter: ProtocolAdapter = {
  name: 'test-protocol',
  chainId: 'ethereum',
  getStakingOpportunities: vi.fn(),
  getStakingPositions: vi.fn(),
  getLendingMarkets: vi.fn(),
  getLendingPositions: vi.fn(),
  getYieldFarmingOpportunities: vi.fn(),
  getYieldFarmingPositions: vi.fn(),
  calculateRewards: vi.fn(),
  stakeTokens: vi.fn(),
  unstakeTokens: vi.fn(),
  claimRewards: vi.fn(),
  depositLending: vi.fn(),
  borrowLending: vi.fn(),
  repayLending: vi.fn(),
  depositYieldFarming: vi.fn(),
  withdrawYieldFarming: vi.fn(),
  harvestRewards: vi.fn(),
  checkHealth: vi.fn(),
};

describe('DeFi Subgraph Resolvers', () => {
  let context: GraphQLContext;
  let protocolAdapters: ProtocolAdapterRegistry;

  beforeEach(() => {
    vi.clearAllMocks();

    protocolAdapters = new ProtocolAdapterRegistry();
    protocolAdapters.register('ethereum:test', mockAdapter);

    context = {
      user: { id: 'test-user' },
      prisma: mockPrisma,
      redis: mockRedis,
      logger: mockLogger,
      protocolAdapters,
    } as any;
  });

  describe('Query - Staking', () => {
    it('should fetch staking opportunities', async () => {
      const mockOpportunities = [
        {
          id: '1',
          chainId: 'ethereum',
          protocol: 'test',
          tokenAddress: '0x123',
          apy: 5.5,
          tvl: 1000000,
          minStake: '100',
          rewardToken: '0x456',
          isActive: true,
          createdAt: new Date(),
        },
      ];

      vi.mocked(mockAdapter.getStakingOpportunities).mockResolvedValue(mockOpportunities);

      const result = await resolvers.Query.stakingOpportunities(
        null,
        { chainId: 'ethereum' },
        context
      );

      expect(result).toEqual(mockOpportunities);
      expect(mockAdapter.getStakingOpportunities).toHaveBeenCalled();
    });

    it('should fetch staking positions for a user', async () => {
      const mockPositions = [
        {
          id: '1',
          userId: 'test-user',
          chainId: 'ethereum',
          protocol: 'test',
          tokenAddress: '0x123',
          stakedAmount: '1000',
          rewardsEarned: '50',
          rewardToken: '0x456',
          apy: 5.5,
          stakedAt: new Date(),
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.stakingPosition.findMany.mockResolvedValue(mockPositions);

      const result = await resolvers.Query.stakingPositions(
        null,
        { userId: 'test-user' },
        context
      );

      expect(result).toEqual(mockPositions);
      expect(mockPrisma.stakingPosition.findMany).toHaveBeenCalledWith({
        where: { userId: 'test-user' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should fetch a single staking position', async () => {
      const mockPosition = {
        id: '1',
        userId: 'test-user',
        chainId: 'ethereum',
        protocol: 'test',
        tokenAddress: '0x123',
        stakedAmount: '1000',
        rewardsEarned: '50',
        rewardToken: '0x456',
        apy: 5.5,
        stakedAt: new Date(),
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.stakingPosition.findUnique.mockResolvedValue(mockPosition);
      mockRedis.get.mockResolvedValue(null);

      const result = await resolvers.Query.stakingPosition(
        null,
        { id: '1' },
        context
      );

      expect(result).toEqual(mockPosition);
      expect(mockPrisma.stakingPosition.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('Query - Lending', () => {
    it('should fetch lending markets', async () => {
      const mockMarkets = [
        {
          id: '1',
          chainId: 'ethereum',
          protocol: 'aave',
          assetAddress: '0x123',
          assetName: 'Ether',
          assetSymbol: 'ETH',
          supplyApy: 2.5,
          borrowApy: 4.5,
          totalSupply: '1000000',
          totalBorrow: '500000',
          utilizationRate: 0.5,
          isActive: true,
          createdAt: new Date(),
        },
      ];

      vi.mocked(mockAdapter.getLendingMarkets).mockResolvedValue(mockMarkets);

      const result = await resolvers.Query.lendingMarkets(
        null,
        { chainId: 'ethereum' },
        context
      );

      expect(result).toEqual(mockMarkets);
      expect(mockAdapter.getLendingMarkets).toHaveBeenCalled();
    });

    it('should fetch lending positions for a user', async () => {
      const mockPositions = [
        {
          id: '1',
          userId: 'test-user',
          chainId: 'ethereum',
          protocol: 'aave',
          collateralToken: '0x123',
          collateralAmount: '10',
          collateralAmountUSD: 20000,
          borrowToken: '0x456',
          borrowAmount: '5000',
          borrowAmountUSD: 5000,
          healthFactor: 2.0,
          interestRate: 4.5,
          status: 'ACTIVE',
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.lendingPosition.findMany.mockResolvedValue(mockPositions);

      const result = await resolvers.Query.lendingPositions(
        null,
        { userId: 'test-user' },
        context
      );

      expect(result).toHaveLength(1);
      expect(mockPrisma.lendingPosition.findMany).toHaveBeenCalledWith({
        where: { userId: 'test-user' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('Query - Yield Farming', () => {
    it('should fetch yield farming opportunities', async () => {
      const mockOpportunities = [
        {
          id: '1',
          chainId: 'ethereum',
          protocol: 'uniswap',
          farmAddress: '0x123',
          lpToken: '0x456',
          rewardTokens: ['0x789'],
          apys: [15.5],
          tvl: 50000000,
          isActive: true,
          createdAt: new Date(),
        },
      ];

      vi.mocked(mockAdapter.getYieldFarmingOpportunities).mockResolvedValue(mockOpportunities);

      const result = await resolvers.Query.yieldFarmingOpportunities(
        null,
        { chainId: 'ethereum' },
        context
      );

      expect(result).toEqual(mockOpportunities);
    });
  });

  describe('Mutation - Staking', () => {
    it('should stake tokens', async () => {
      const txHash = '0xabc123';
      vi.mocked(mockAdapter.stakeTokens).mockResolvedValue(txHash);

      const result = await resolvers.Mutation.stakeTokens(
        null,
        {
          chainId: 'ethereum',
          protocol: 'test',
          amount: '1000',
        },
        context
      );

      expect(result).toEqual({ id: txHash });
      expect(mockAdapter.stakeTokens).toHaveBeenCalledWith({
        chainId: 'ethereum',
        protocol: 'test',
        amount: '1000',
        validator: undefined,
      });
    });

    it('should unstake tokens', async () => {
      const txHash = '0xdef456';
      vi.mocked(mockAdapter.unstakeTokens).mockResolvedValue(txHash);

      const result = await resolvers.Mutation.unstakeTokens(
        null,
        {
          chainId: 'ethereum',
          protocol: 'test',
          positionId: '1',
          amount: '500',
        },
        context
      );

      expect(result).toEqual({ id: txHash });
      expect(mockAdapter.unstakeTokens).toHaveBeenCalledWith({
        chainId: 'ethereum',
        protocol: 'test',
        positionId: '1',
        amount: '500',
      });
    });

    it('should claim rewards', async () => {
      const txHash = '0xghi789';
      vi.mocked(mockAdapter.claimRewards).mockResolvedValue(txHash);

      const result = await resolvers.Mutation.claimRewards(
        null,
        {
          chainId: 'ethereum',
          protocol: 'test',
          positionId: '1',
        },
        context
      );

      expect(result).toEqual({ id: txHash });
      expect(mockAdapter.claimRewards).toHaveBeenCalledWith({
        chainId: 'ethereum',
        protocol: 'test',
        positionId: '1',
      });
    });
  });

  describe('Mutation - Lending', () => {
    it('should deposit in lending', async () => {
      const txHash = '0xjkl012';
      vi.mocked(mockAdapter.depositLending).mockResolvedValue(txHash);

      const result = await resolvers.Mutation.depositLending(
        null,
        {
          chainId: 'ethereum',
          protocol: 'aave',
          assetAddress: '0x123',
          amount: '10',
        },
        context
      );

      expect(result).toEqual({ id: txHash });
      expect(mockAdapter.depositLending).toHaveBeenCalled();
    });

    it('should borrow from lending', async () => {
      const txHash = '0xmno345';
      vi.mocked(mockAdapter.borrowLending).mockResolvedValue(txHash);

      const result = await resolvers.Mutation.borrowLending(
        null,
        {
          chainId: 'ethereum',
          protocol: 'aave',
          assetAddress: '0x456',
          amount: '5000',
        },
        context
      );

      expect(result).toEqual({ id: txHash });
      expect(mockAdapter.borrowLending).toHaveBeenCalled();
    });

    it('should repay lending', async () => {
      const txHash = '0xpqr678';
      vi.mocked(mockAdapter.repayLending).mockResolvedValue(txHash);

      const result = await resolvers.Mutation.repayLending(
        null,
        {
          chainId: 'ethereum',
          protocol: 'aave',
          assetAddress: '0x456',
          amount: '2500',
        },
        context
      );

      expect(result).toEqual({ id: txHash });
      expect(mockAdapter.repayLending).toHaveBeenCalled();
    });
  });

  describe('Mutation - Yield Farming', () => {
    it('should deposit in yield farming', async () => {
      const txHash = '0xstu901';
      vi.mocked(mockAdapter.depositYieldFarming).mockResolvedValue(txHash);

      const result = await resolvers.Mutation.depositYieldFarming(
        null,
        {
          chainId: 'ethereum',
          protocol: 'uniswap',
          farmAddress: '0x123',
          lpTokenAmount: '100',
        },
        context
      );

      expect(result).toEqual({ id: txHash });
      expect(mockAdapter.depositYieldFarming).toHaveBeenCalled();
    });

    it('should harvest rewards', async () => {
      const txHash = '0xvwx234';
      vi.mocked(mockAdapter.harvestRewards).mockResolvedValue(txHash);

      const result = await resolvers.Mutation.harvestRewards(
        null,
        {
          chainId: 'ethereum',
          protocol: 'uniswap',
          positionId: '1',
        },
        context
      );

      expect(result).toEqual({ id: txHash });
      expect(mockAdapter.harvestRewards).toHaveBeenCalled();
    });
  });
});
