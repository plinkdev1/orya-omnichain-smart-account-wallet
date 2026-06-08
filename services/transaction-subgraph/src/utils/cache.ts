import type Redis from 'ioredis';

export class CacheManager {
  private readonly defaultTTL = 300;

  constructor(private redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = this.defaultTTL): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.warn(`Cache set failed for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.warn(`Cache delete failed for key ${key}:`, error);
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.redis.mget(keys);
      return values.map((v) => (v ? JSON.parse(v) : null));
    } catch {
      return keys.map(() => null);
    }
  }

  async mset<T>(data: Record<string, T>, ttl: number = this.defaultTTL): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();
      Object.entries(data).forEach(([key, value]) => {
        pipeline.setex(key, ttl, JSON.stringify(value));
      });
      await pipeline.exec();
    } catch (error) {
      console.warn('Cache mset failed:', error);
    }
  }

  async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.warn(`Cache invalidate failed for pattern ${pattern}:`, error);
    }
  }
}
