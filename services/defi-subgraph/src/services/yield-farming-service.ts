import type {
  YieldFarmingOpportunity,
  YieldFarmingPosition,
  DepositYieldFarmingInput,
  WithdrawYieldFarmingInput,
  HarvestRewardsInput,
} from '../types';
import { logger } from '../utils/logger';
import { CACHE_KEYS, CacheManager } from '../utils/cache';
import { ProtocolAdapterRegistry } from '../utils/protocol-adapter-registry';
import type { Redis } from 'ioredis';
import type { PrismaClient } from '@prisma/client';

export class YieldFarmingService {
  private cacheManager: CacheManager;

  constructor(
    private prisma: PrismaClient,
    private redis: Redis,
    private protocolAdapters: ProtocolAdapterRegistry
  ) {
    this.cacheManager = new CacheManager(600);
  }

  async getYieldFarmingOpportunities(
    chainId: string,
    protocol?: string
  ): Promise<YieldFarmingOpportunity[]> {
    const cacheKey = CACHE_KEYS.YIELD_FARMING_OPPORTUNITIES(chainId, protocol);

    try {
      const cached = await this.cacheManager.get<YieldFarmingOpportunity[]>(
        this.redis,
        cacheKey
      );
      if (cached) {
        logger.debug({ cacheKey }, 'Cache hit for yield farming opportunities');
        return cached;
      }
    } catch (error) {
      logger.warn({ error }, 'Cache retrieval failed');
    }

    try {
      const opportunities: YieldFarmingOpportunity[] = [];

      if (protocol) {
        const adapter = this.protocolAdapters.getByChainAndProtocol(chainId, protocol);
        const opp = await adapter.getYieldFarmingOpportunities();
        opportunities.push(...opp);
      } else {
        const adapters = this.protocolAdapters.getAllAdapters();
        for (const [key, adapter] of adapters) {
          if (key.startsWith(`${chainId}:`)) {
            try {
              const opp = await adapter.getYieldFarmingOpportunities();
              opportunities.push(...opp);
            } catch (error) {
              logger.warn({ key, error }, 'Failed to fetch yield farming opportunities');
            }
          }
        }
      }

      await this.cacheManager.set(this.redis, cacheKey, opportunities);
      logger.debug(
        { chainId, protocol, count: opportunities.length },
        'Fetched yield farming opportunities'
      );

      return opportunities;
    } catch (error) {
      logger.error(
        { error, chainId, protocol },
        'Failed to fetch yield farming opportunities'
      );
      return [];
    }
  }

  async getYieldFarmingOpportunity(
    id: string
  ): Promise<YieldFarmingOpportunity | null> {
    const cacheKey = CACHE_KEYS.YIELD_FARMING_POSITION(id);

    try {
      const cached = await this.cacheManager.get<YieldFarmingOpportunity>(
        this.redis,
        cacheKey
      );
      if (cached) return cached;
    } catch (error) {
      logger.warn({ error }, 'Cache retrieval failed');
    }

    logger.debug({ id }, 'Could not find yield farming opportunity');
    return null;
  }

  async getYieldFarmingPositions(
    userId: string,
    chainId?: string
  ): Promise<YieldFarmingPosition[]> {
    try {
      const positions: YieldFarmingPosition[] = [];

      if (chainId) {
        const adapters = this.protocolAdapters.getAllAdapters();
        for (const [key, adapter] of adapters) {
          if (key.startsWith(`${chainId}:`)) {
            try {
              const pos = await adapter.getYieldFarmingPositions(userId);
              positions.push(...pos);
            } catch (error) {
              logger.warn({ key, error }, 'Failed to fetch yield farming positions');
            }
          }
        }
      } else {
        const adapters = this.protocolAdapters.getAllAdapters();
        for (const [, adapter] of adapters) {
          try {
            const pos = await adapter.getYieldFarmingPositions(userId);
            positions.push(...pos);
          } catch (error) {
            logger.warn({ error }, 'Failed to fetch yield farming positions');
          }
        }
      }

      logger.debug(
        { userId, chainId, count: positions.length },
        'Fetched yield farming positions'
      );

      return positions;
    } catch (error) {
      logger.error({ error, userId, chainId }, 'Failed to fetch yield farming positions');
      return [];
    }
  }

  async getYieldFarmingPosition(id: string): Promise<YieldFarmingPosition | null> {
    const cacheKey = CACHE_KEYS.YIELD_FARMING_POSITION(id);

    try {
      const cached = await this.cacheManager.get<YieldFarmingPosition>(
        this.redis,
        cacheKey
      );
      if (cached) return cached;
    } catch (error) {
      logger.warn({ error }, 'Cache retrieval failed');
    }

    logger.debug({ id }, 'Could not find yield farming position');
    return null;
  }

  async depositYieldFarming(input: DepositYieldFarmingInput): Promise<string> {
    try {
      const adapter = this.protocolAdapters.getByChainAndProtocol(
        input.chainId,
        input.protocol
      );

      const txHash = await adapter.depositYieldFarming(input);
      logger.info({ ...input, txHash }, 'Yield farming deposit initiated');

      return txHash;
    } catch (error) {
      logger.error({ error, input }, 'Failed to deposit in yield farming');
      throw error;
    }
  }

  async withdrawYieldFarming(input: WithdrawYieldFarmingInput): Promise<string> {
    try {
      const adapter = this.protocolAdapters.getByChainAndProtocol(
        input.chainId,
        input.protocol
      );

      const txHash = await adapter.withdrawYieldFarming(input);
      logger.info({ ...input, txHash }, 'Yield farming withdrawal initiated');

      return txHash;
    } catch (error) {
      logger.error({ error, input }, 'Failed to withdraw from yield farming');
      throw error;
    }
  }

  async harvestRewards(input: HarvestRewardsInput): Promise<string> {
    try {
      const adapter = this.protocolAdapters.getByChainAndProtocol(
        input.chainId,
        input.protocol
      );

      const txHash = await adapter.harvestRewards(input);
      logger.info({ ...input, txHash }, 'Yield farming harvest initiated');

      return txHash;
    } catch (error) {
      logger.error({ error, input }, 'Failed to harvest rewards');
      throw error;
    }
  }
}
