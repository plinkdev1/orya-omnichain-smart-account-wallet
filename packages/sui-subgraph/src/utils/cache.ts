import NodeCache from 'node-cache';

export class CacheManager {
  private cache: NodeCache;

  constructor(stdTTL: number = 300, checkperiod: number = 60) {
    this.cache = new NodeCache({ stdTTL, checkperiod });
  }

  set<T>(key: string, value: T, ttl?: number): void {
    if (ttl !== undefined) {
      this.cache.set(key, value, ttl);
    } else {
      this.cache.set(key, value);
    }
  }

  get<T>(key: string): T | undefined {
    return this.cache.get(key) as T | undefined;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): number {
    return this.cache.del(key);
  }

  clear(): void {
    this.cache.flushAll();
  }

  getStats() {
    return this.cache.getStats();
  }
}

export const walletCache = new CacheManager(300);
export const addressCache = new CacheManager(300);
export const transactionCache = new CacheManager(600);
export const objectCache = new CacheManager(600);
export const eventCache = new CacheManager(60);
