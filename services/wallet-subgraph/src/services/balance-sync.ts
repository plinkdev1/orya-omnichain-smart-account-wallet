import { RpcManager } from '../utils/rpc-manager';
import { CacheManager, CACHE_TTL } from '../utils/cache';
import Redis from 'ioredis';
import logger from '../utils/logger';

interface TokenPrice {
  symbol: string;
  price: number;
}

export class BalanceSyncService {
  constructor(
    private rpcManager: RpcManager,
    private cacheManager: CacheManager,
    private redis: Redis,
    private prisma: any
  ) {}

  async syncWalletBalances(
    walletId: string,
    userId: string,
    chainType: string,
    address: string
  ): Promise<any[]> {
    try {
      logger.info('Starting balance sync', { walletId, chainType, address });

      const nativeBalance = await this.rpcManager.getBalance(chainType, address);

      const tokenDecimals = chainType === 'bitcoin' ? 8 : 18;
      const formattedBalance = (BigInt(nativeBalance) / BigInt(10 ** tokenDecimals)).toString();

      const nativePrice = await this.getTokenPrice(this.getNativeTokenSymbol(chainType));

      const usdValue = parseFloat(formattedBalance) * nativePrice;

      const balances = [];
      const nativeSymbol = this.getNativeTokenSymbol(chainType);

      const balance = await this.prisma.balance.upsert({
        where: {
          walletId_tokenAddress: {
            walletId,
            tokenAddress: 'native',
          },
        },
        update: {
          amount: formattedBalance,
          amountUSD: usdValue,
          lastUpdated: new Date(),
        },
        create: {
          walletId,
          tokenAddress: 'native',
          symbol: nativeSymbol,
          decimals: tokenDecimals,
          amount: formattedBalance,
          amountUSD: usdValue,
          lastUpdated: new Date(),
        },
      });

      balances.push(balance);

      const updatedWallet = await this.prisma.wallet.update({
        where: { id: walletId },
        data: { lastSyncedAt: new Date() },
      });

      await this.cacheManager.invalidatePattern(`balances:${walletId}:*`);
      await this.cacheManager.invalidatePattern(`portfolio:${userId}`);

      await this.redis.publish('balance.updated', JSON.stringify({
        walletId,
        balances,
      }));

      logger.info('Balance sync completed', { walletId, balanceCount: balances.length });
      return balances;
    } catch (error) {
      logger.error('Balance sync failed', { walletId, error: (error as Error).message });
      throw error;
    }
  }

  private async getTokenPrice(symbol: string): Promise<number> {
    const cacheKey = `price:${symbol}`;
    const cached = await this.cacheManager.get<number>(cacheKey);
    if (cached) {
      return cached;
    }

    const symbolMap: Record<string, string> = {
      ETH: 'ethereum',
      MATIC: 'polygon',
      ARB: 'arbitrum',
      OP: 'optimism',
      BNB: 'binancecoin',
      AVAX: 'avalanche-2',
      SOL: 'solana',
      SUI: 'sui',
    };

    const pythId = symbolMap[symbol] || symbol.toLowerCase();
    let price = 0;

    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${pythId}&vs_currencies=usd`
      );
      const data = await response.json();
      price = data[pythId]?.usd || 0;
    } catch (error) {
      logger.warn('Failed to fetch token price', { symbol, error: (error as Error).message });
      price = 0;
    }

    if (price > 0) {
      await this.cacheManager.set(cacheKey, price, 300);
    }

    return price;
  }

  private getNativeTokenSymbol(chainType: string): string {
    const symbolMap: Record<string, string> = {
      ethereum: 'ETH',
      base: 'ETH',
      polygon: 'MATIC',
      arbitrum: 'ETH',
      optimism: 'ETH',
      bsc: 'BNB',
      avalanche: 'AVAX',
      solana: 'SOL',
      bitcoin: 'BTC',
      sui: 'SUI',
      aptos: 'APT',
      stacks: 'STX',
      bitlayer: 'BTC',
    };

    return symbolMap[chainType] || chainType.toUpperCase();
  }

  async calculatePortfolioValue(userId: string): Promise<number> {
    const cacheKey = `portfolio:${userId}`;
    const cached = await this.cacheManager.get<number>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    try {
      const balances = await this.prisma.balance.findMany({
        where: {
          wallet: { userId },
        },
      });

      const totalValue = balances.reduce((sum: number, balance: any) => {
        return sum + (balance.amountUSD || 0);
      }, 0);

      await this.cacheManager.set(cacheKey, totalValue, CACHE_TTL.PORTFOLIO_VALUE);
      return totalValue;
    } catch (error) {
      logger.error('Failed to calculate portfolio value', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }
}
