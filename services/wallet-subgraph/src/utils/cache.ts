import Redis from 'ioredis';

export const CACHE_TTL = {
  BALANCES: 30,
  PORTFOLIO_VALUE: 60,
  NFTS: 300,
  WALLET: 300,
  GAS_ESTIMATE: 60,
};

export class CacheManager {
  constructor(private redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  getBalanceCacheKey(walletId: string, tokenAddress?: string): string {
    return tokenAddress
      ? `balance:${walletId}:${tokenAddress}`
      : `balances:${walletId}`;
  }

  getPortfolioValueCacheKey(userId: string): string {
    return `portfolio:${userId}`;
  }

  getNFTsCacheKey(walletId: string, chainId?: string): string {
    return chainId ? `nfts:${walletId}:${chainId}` : `nfts:${walletId}`;
  }

  getWalletCacheKey(walletId: string): string {
    return `wallet:${walletId}`;
  }

  getGasEstimateCacheKey(chainId: string, from: string, to: string): string {
    return `gas:${chainId}:${from}:${to}`;
  }
}
