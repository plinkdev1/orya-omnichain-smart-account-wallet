import type {
  LendingMarket,
  LendingPosition,
  DepositLendingInput,
  BorrowLendingInput,
  RepayLendingInput,
} from '../types';
import { logger } from '../utils/logger';
import { CACHE_KEYS, CacheManager } from '../utils/cache';
import { ProtocolAdapterRegistry } from '../utils/protocol-adapter-registry';
import type { Redis } from 'ioredis';
import type { PrismaClient } from '@prisma/client';

export class LendingService {
  private cacheManager: CacheManager;

  constructor(
    private prisma: PrismaClient,
    private redis: Redis,
    private protocolAdapters: ProtocolAdapterRegistry
  ) {
    this.cacheManager = new CacheManager(600);
  }

  async getLendingMarkets(
    chainId: string,
    protocol?: string
  ): Promise<LendingMarket[]> {
    const cacheKey = CACHE_KEYS.LENDING_MARKETS(chainId, protocol);

    try {
      const cached = await this.cacheManager.get<LendingMarket[]>(
        this.redis,
        cacheKey
      );
      if (cached) {
        logger.debug({ cacheKey }, 'Cache hit for lending markets');
        return cached;
      }
    } catch (error) {
      logger.warn({ error }, 'Cache retrieval failed');
    }

    try {
      const markets = await this.protocolAdapters.getLendingMarkets(
        chainId,
        protocol
      );

      await this.cacheManager.set(this.redis, cacheKey, markets);
      logger.debug(
        { chainId, protocol, count: markets.length },
        'Fetched lending markets'
      );

      return markets;
    } catch (error) {
      logger.error({ error, chainId, protocol }, 'Failed to fetch lending markets');
      return [];
    }
  }

  async getLendingMarket(id: string): Promise<LendingMarket | null> {
    const cacheKey = CACHE_KEYS.LENDING_POSITION(id);

    try {
      const cached = await this.cacheManager.get<LendingMarket>(
        this.redis,
        cacheKey
      );
      if (cached) return cached;
    } catch (error) {
      logger.warn({ error }, 'Cache retrieval failed');
    }

    try {
      const market = await this.prisma.protocol.findFirst({
        where: { id },
        include: { metadata: true },
      });

      if (!market) return null;

      const lendingMarket: LendingMarket = {
        id: market.id,
        chainId: market.chainId,
        protocol: market.name,
        assetAddress: '',
        assetName: '',
        assetSymbol: '',
        supplyApy: 0,
        borrowApy: 0,
        totalSupply: '0',
        totalBorrow: '0',
        utilizationRate: 0,
        isActive: market.isActive,
        metadata: market.metadata?.metadata as any,
        createdAt: market.createdAt,
      };

      await this.cacheManager.set(this.redis, cacheKey, lendingMarket);
      return lendingMarket;
    } catch (error) {
      logger.error({ error, id }, 'Failed to fetch lending market');
      return null;
    }
  }

  async getLendingPositions(
    userId: string,
    chainId?: string
  ): Promise<LendingPosition[]> {
    try {
      let query: any = { userId };
      if (chainId) {
        query.chainId = chainId;
      }

      const positions = await this.prisma.lendingPosition.findMany({
        where: query,
        orderBy: { createdAt: 'desc' },
      });

      logger.debug(
        { userId, chainId, count: positions.length },
        'Fetched lending positions'
      );

      return positions.map((pos) => ({
        id: pos.id,
        userId: pos.userId,
        chainId: pos.chainId,
        protocol: pos.protocol,
        collateralToken: pos.collateralToken,
        collateralAmount: pos.collateralAmount,
        collateralAmountUSD: pos.collateralAmountUSD,
        borrowToken: pos.borrowToken,
        borrowAmount: pos.borrowAmount,
        borrowAmountUSD: pos.borrowAmountUSD,
        healthFactor: pos.healthFactor,
        supplyApy: 0,
        borrowApy: 0,
        status: pos.status as any,
        metadata: pos.metadata as any,
        createdAt: pos.createdAt,
        updatedAt: pos.updatedAt,
      }));
    } catch (error) {
      logger.error({ error, userId, chainId }, 'Failed to fetch lending positions');
      return [];
    }
  }

  async getLendingPosition(id: string): Promise<LendingPosition | null> {
    const cacheKey = CACHE_KEYS.LENDING_POSITION(id);

    try {
      const cached = await this.cacheManager.get<LendingPosition>(
        this.redis,
        cacheKey
      );
      if (cached) return cached;
    } catch (error) {
      logger.warn({ error }, 'Cache retrieval failed');
    }

    try {
      const position = await this.prisma.lendingPosition.findUnique({
        where: { id },
      });

      if (position) {
        const lendingPos: LendingPosition = {
          id: position.id,
          userId: position.userId,
          chainId: position.chainId,
          protocol: position.protocol,
          collateralToken: position.collateralToken,
          collateralAmount: position.collateralAmount,
          collateralAmountUSD: position.collateralAmountUSD,
          borrowToken: position.borrowToken,
          borrowAmount: position.borrowAmount,
          borrowAmountUSD: position.borrowAmountUSD,
          healthFactor: position.healthFactor,
          supplyApy: position.interestRate,
          borrowApy: position.interestRate,
          status: position.status as any,
          metadata: position.metadata as any,
          createdAt: position.createdAt,
          updatedAt: position.updatedAt,
        };

        await this.cacheManager.set(this.redis, cacheKey, lendingPos);
        return lendingPos;
      }

      return null;
    } catch (error) {
      logger.error({ error, id }, 'Failed to fetch lending position');
      return null;
    }
  }

  async depositLending(input: DepositLendingInput): Promise<string> {
    try {
      const adapter = this.protocolAdapters.getByChainAndProtocol(
        input.chainId,
        input.protocol
      );

      const txHash = await adapter.depositLending(input);
      logger.info({ ...input, txHash }, 'Lending deposit initiated');

      return txHash;
    } catch (error) {
      logger.error({ error, input }, 'Failed to deposit lending');
      throw error;
    }
  }

  async borrowLending(input: BorrowLendingInput): Promise<string> {
    try {
      const adapter = this.protocolAdapters.getByChainAndProtocol(
        input.chainId,
        input.protocol
      );

      const txHash = await adapter.borrowLending(input);
      logger.info({ ...input, txHash }, 'Lending borrow initiated');

      return txHash;
    } catch (error) {
      logger.error({ error, input }, 'Failed to borrow from lending');
      throw error;
    }
  }

  async repayLending(input: RepayLendingInput): Promise<string> {
    try {
      const adapter = this.protocolAdapters.getByChainAndProtocol(
        input.chainId,
        input.protocol
      );

      const txHash = await adapter.repayLending(input);
      logger.info({ ...input, txHash }, 'Lending repay initiated');

      return txHash;
    } catch (error) {
      logger.error({ error, input }, 'Failed to repay lending');
      throw error;
    }
  }
}
