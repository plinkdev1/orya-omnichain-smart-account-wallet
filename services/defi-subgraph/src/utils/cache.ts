import type { Redis } from 'ioredis';

export class CacheManager {
  private readonly ttl: number;

  constructor(ttl: number = 300) {
    this.ttl = ttl;
  }

  async get<T>(redis: Redis, key: string): Promise<T | null> {
    const cached = await redis.get(key);
    if (!cached) return null;
    return JSON.parse(cached) as T;
  }

  async set<T>(redis: Redis, key: string, value: T): Promise<void> {
    await redis.setex(key, this.ttl, JSON.stringify(value));
  }

  async del(redis: Redis, key: string): Promise<void> {
    await redis.del(key);
  }

  async invalidatePattern(redis: Redis, pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  generateKey(prefix: string, ...parts: string[]): string {
    return `${prefix}:${parts.join(':')}`;
  }
}

export const CACHE_KEYS = {
  STAKING_OPPORTUNITIES: (chainId: string, protocol?: string) =>
    protocol ? `staking:opp:${chainId}:${protocol}` : `staking:opp:${chainId}`,
  STAKING_POSITION: (id: string) => `staking:pos:${id}`,
  STAKING_POSITIONS: (userId: string, chainId: string) =>
    `staking:user:${userId}:${chainId}`,
  
  LENDING_MARKETS: (chainId: string, protocol?: string) =>
    protocol ? `lending:market:${chainId}:${protocol}` : `lending:market:${chainId}`,
  LENDING_POSITION: (id: string) => `lending:pos:${id}`,
  LENDING_POSITIONS: (userId: string, chainId: string) =>
    `lending:user:${userId}:${chainId}`,
  
  YIELD_FARMING_OPPORTUNITIES: (chainId: string, protocol?: string) =>
    protocol ? `yield:opp:${chainId}:${protocol}` : `yield:opp:${chainId}`,
  YIELD_FARMING_POSITION: (id: string) => `yield:pos:${id}`,
  YIELD_FARMING_POSITIONS: (userId: string, chainId: string) =>
    `yield:user:${userId}:${chainId}`,
  
  POSITION_SUMMARY: (userId: string, chainId: string) =>
    `summary:${userId}:${chainId}`,
  REWARDS_CALC: (positionId: string) => `rewards:${positionId}`,
  PROTOCOL_HEALTH: (protocol: string, chainId: string) =>
    `health:${protocol}:${chainId}`,
};
