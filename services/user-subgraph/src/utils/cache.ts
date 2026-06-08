import Redis from 'ioredis';
import { Logger } from 'pino';

const DEFAULT_TTL = 300; // 5 minutes

export class CacheManager {
  constructor(
    private redis: Redis,
    private logger: Logger
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key);
      if (cached) {
        this.logger.debug('Cache hit', { key });
        return JSON.parse(cached);
      }
      this.logger.debug('Cache miss', { key });
      return null;
    } catch (error) {
      this.logger.warn('Cache get error', { key, error });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = DEFAULT_TTL): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
      this.logger.debug('Cache set', { key, ttl });
    } catch (error) {
      this.logger.warn('Cache set error', { key, error });
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      this.logger.debug('Cache deleted', { key });
    } catch (error) {
      this.logger.warn('Cache delete error', { key, error });
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.debug('Cache pattern deleted', { pattern, count: keys.length });
      }
    } catch (error) {
      this.logger.warn('Cache pattern delete error', { pattern, error });
    }
  }

  async invalidateUser(userId: string): Promise<void> {
    await this.delPattern(`user:${userId}:*`);
    await this.del(`user:${userId}`);
  }
}

export function getCacheKey(entity: string, id: string): string {
  return `${entity}:${id}`;
}

export function getCachePatternKey(entity: string, userId: string): string {
  return `${entity}:${userId}:*`;
}
