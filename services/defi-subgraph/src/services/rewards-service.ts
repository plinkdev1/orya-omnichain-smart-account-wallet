import type { RewardCalculation, PositionSummary } from '../types';
import { logger } from '../utils/logger';
import { CACHE_KEYS, CacheManager } from '../utils/cache';
import { ProtocolAdapterRegistry } from '../utils/protocol-adapter-registry';
import type { Redis } from 'ioredis';
import type { PrismaClient } from '@prisma/client';

export class RewardsService {
  private cacheManager: CacheManager;

  constructor(
    private prisma: PrismaClient,
    private redis: Redis,
    private protocolAdapters: ProtocolAdapterRegistry
  ) {
    this.cacheManager = new CacheManager(300);
  }

  async calculateRewards(positionId: string): Promise<RewardCalculation | null> {
    const cacheKey = CACHE_KEYS.REWARDS_CALC(positionId);

    try {
      const cached = await this.cacheManager.get<RewardCalculation>(
        this.redis,
        cacheKey
      );
      if (cached) {
        logger.debug({ cacheKey }, 'Cache hit for rewards calculation');
        return cached;
      }
    } catch (error) {
      logger.warn({ error }, 'Cache retrieval failed');
    }

    try {
      const stakingPos = await this.prisma.stakingPosition.findUnique({
        where: { id: positionId },
      });

      if (stakingPos) {
        const adapter = this.protocolAdapters.getByChainAndProtocol(
          stakingPos.chainId,
          stakingPos.protocol
        );

        const rewards = await adapter.calculateRewards(positionId);
        if (rewards) {
          await this.cacheManager.set(this.redis, cacheKey, rewards);
          return rewards;
        }
      }

      logger.debug({ positionId }, 'No position found for rewards calculation');
      return null;
    } catch (error) {
      logger.error({ error, positionId }, 'Failed to calculate rewards');
      return null;
    }
  }

  async getPositionSummary(
    userId: string,
    chainId: string
  ): Promise<PositionSummary> {
    const cacheKey = CACHE_KEYS.POSITION_SUMMARY(userId, chainId);

    try {
      const cached = await this.cacheManager.get<PositionSummary>(
        this.redis,
        cacheKey
      );
      if (cached) {
        logger.debug({ cacheKey }, 'Cache hit for position summary');
        return cached;
      }
    } catch (error) {
      logger.warn({ error }, 'Cache retrieval failed');
    }

    try {
      const stakingPositions = await this.prisma.stakingPosition.findMany({
        where: { userId, chainId },
      });

      const lendingPositions = await this.prisma.lendingPosition.findMany({
        where: { userId, chainId },
      });

      let totalStakedUSD = 0;
      let totalBorrowedUSD = 0;
      let totalCollateralUSD = 0;
      let totalRewardsUSD = 0;
      let totalHealthFactor = 0;

      for (const pos of stakingPositions) {
        totalStakedUSD += parseFloat(pos.stakedAmountUSD.toString());
        totalRewardsUSD += 0;
      }

      for (const pos of lendingPositions) {
        totalBorrowedUSD += pos.borrowAmountUSD;
        totalCollateralUSD += pos.collateralAmountUSD;
        totalHealthFactor += pos.healthFactor;
      }

      const riskLevel =
        totalHealthFactor > 2
          ? 'LOW'
          : totalHealthFactor > 1.5
            ? 'MEDIUM'
            : 'HIGH';

      const summary: PositionSummary = {
        userId,
        chainId,
        totalStakedUSD,
        totalBorrowedUSD,
        totalCollateralUSD,
        totalFarmingUSD: 0,
        totalRewardsUSD,
        totalValueLockedUSD:
          totalStakedUSD + totalCollateralUSD,
        healthFactor:
          lendingPositions.length > 0
            ? totalHealthFactor / lendingPositions.length
            : 1,
        riskLevel,
      };

      await this.cacheManager.set(this.redis, cacheKey, summary);
      logger.debug({ userId, chainId }, 'Calculated position summary');

      return summary;
    } catch (error) {
      logger.error({ error, userId, chainId }, 'Failed to calculate position summary');

      return {
        userId,
        chainId,
        totalStakedUSD: 0,
        totalBorrowedUSD: 0,
        totalCollateralUSD: 0,
        totalFarmingUSD: 0,
        totalRewardsUSD: 0,
        totalValueLockedUSD: 0,
        healthFactor: 0,
        riskLevel: 'UNKNOWN',
      };
    }
  }

  async estimateAnnualRewards(
    stakedAmountUSD: number,
    apy: number
  ): Promise<number> {
    return (stakedAmountUSD * apy) / 100;
  }

  async estimateDailyRewards(
    stakedAmountUSD: number,
    apy: number
  ): Promise<number> {
    return this.estimateAnnualRewards(stakedAmountUSD, apy) / 365;
  }

  async estimateHourlyRewards(
    stakedAmountUSD: number,
    apy: number
  ): Promise<number> {
    return this.estimateDailyRewards(stakedAmountUSD, apy) / 24;
  }
}
