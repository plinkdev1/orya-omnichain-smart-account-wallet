import type {
  StakingOpportunity,
  StakingPosition,
  RewardCalculation,
  ProtocolAdapter,
  StakeTokensInput,
  UnstakeTokensInput,
  ClaimRewardsInput,
} from '../types';
import { logger } from '../utils/logger';
import { CACHE_KEYS, CacheManager } from '../utils/cache';
import { ProtocolAdapterRegistry } from '../utils/protocol-adapter-registry';
import type { Redis } from 'ioredis';
import type { PrismaClient } from '@prisma/client';

export class StakingService {
  private cacheManager: CacheManager;
  private protocolAdapters: ProtocolAdapterRegistry;

  constructor(
    private prisma: PrismaClient,
    private redis: Redis,
    protocolAdapters: ProtocolAdapterRegistry
  ) {
    this.cacheManager = new CacheManager(600);
    this.protocolAdapters = protocolAdapters;
  }

  async getStakingOpportunities(
    chainId: string,
    protocol?: string
  ): Promise<StakingOpportunity[]> {
    const cacheKey = CACHE_KEYS.STAKING_OPPORTUNITIES(chainId, protocol);

    try {
      const cached = await this.cacheManager.get<StakingOpportunity[]>(
        this.redis,
        cacheKey
      );
      if (cached) {
        logger.debug({ cacheKey }, 'Cache hit for staking opportunities');
        return cached;
      }
    } catch (error) {
      logger.warn({ error }, 'Cache retrieval failed');
    }

    try {
      const opportunities =
        await this.protocolAdapters.getStakingOpportunities(chainId, protocol);

      await this.cacheManager.set(this.redis, cacheKey, opportunities);
      logger.debug(
        { chainId, protocol, count: opportunities.length },
        'Fetched staking opportunities'
      );

      return opportunities;
    } catch (error) {
      logger.error({ error, chainId, protocol }, 'Failed to fetch staking opportunities');
      return [];
    }
  }

  async getStakingPositions(
    userId: string,
    chainId?: string
  ): Promise<StakingPosition[]> {
    try {
      let query: any = { userId };
      if (chainId) {
        query.chainId = chainId;
      }

      const positions = await this.prisma.stakingPosition.findMany({
        where: query,
        orderBy: { createdAt: 'desc' },
      });

      logger.debug(
        { userId, chainId, count: positions.length },
        'Fetched staking positions'
      );

      return positions;
    } catch (error) {
      logger.error({ error, userId, chainId }, 'Failed to fetch staking positions');
      return [];
    }
  }

  async getStakingPosition(id: string): Promise<StakingPosition | null> {
    const cacheKey = CACHE_KEYS.STAKING_POSITION(id);

    try {
      const cached = await this.cacheManager.get<StakingPosition>(
        this.redis,
        cacheKey
      );
      if (cached) return cached;
    } catch (error) {
      logger.warn({ error }, 'Cache retrieval failed');
    }

    try {
      const position = await this.prisma.stakingPosition.findUnique({
        where: { id },
      });

      if (position) {
        await this.cacheManager.set(this.redis, cacheKey, position);
      }

      return position;
    } catch (error) {
      logger.error({ error, id }, 'Failed to fetch staking position');
      return null;
    }
  }

  async calculateStakingRewards(positionId: string): Promise<RewardCalculation | null> {
    try {
      const position = await this.getStakingPosition(positionId);
      if (!position) return null;

      const adapter = this.protocolAdapters.getByChainAndProtocol(
        position.chainId,
        position.protocol
      );

      const rewards = await adapter.calculateRewards(positionId);
      logger.debug({ positionId, rewards }, 'Calculated staking rewards');

      return rewards;
    } catch (error) {
      logger.error({ error, positionId }, 'Failed to calculate rewards');
      return null;
    }
  }

  async stakeTokens(input: StakeTokensInput): Promise<string> {
    try {
      const adapter = this.protocolAdapters.getByChainAndProtocol(
        input.chainId,
        input.protocol
      );

      const txHash = await adapter.stakeTokens(input);
      logger.info(
        { ...input, txHash },
        'Staking transaction initiated'
      );

      return txHash;
    } catch (error) {
      logger.error({ error, input }, 'Failed to stake tokens');
      throw error;
    }
  }

  async unstakeTokens(input: UnstakeTokensInput): Promise<string> {
    try {
      const adapter = this.protocolAdapters.getByChainAndProtocol(
        input.chainId,
        input.protocol
      );

      const txHash = await adapter.unstakeTokens(input);
      logger.info(
        { ...input, txHash },
        'Unstaking transaction initiated'
      );

      return txHash;
    } catch (error) {
      logger.error({ error, input }, 'Failed to unstake tokens');
      throw error;
    }
  }

  async claimRewards(input: ClaimRewardsInput): Promise<string> {
    try {
      const adapter = this.protocolAdapters.getByChainAndProtocol(
        input.chainId,
        input.protocol
      );

      const txHash = await adapter.claimRewards(input);
      logger.info(
        { ...input, txHash },
        'Claim rewards transaction initiated'
      );

      await this.cacheManager.invalidatePattern(
        this.redis,
        `staking:*${input.positionId}*`
      );

      return txHash;
    } catch (error) {
      logger.error({ error, input }, 'Failed to claim rewards');
      throw error;
    }
  }
}
