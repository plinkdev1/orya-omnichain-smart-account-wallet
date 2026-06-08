let JsonRpcProvider: any;
try {
  const module = require('@mysten/sui.js');
  JsonRpcProvider = module.JsonRpcProvider;
} catch {
  JsonRpcProvider = class {
    constructor(config: any) {
      console.warn('@mysten/sui.js not available. RPC provider disabled.');
    }
    async call(method: string, params: any[]) {
      throw new Error('@mysten/sui.js not available');
    }
  };
}

export class RateLimitExceededError extends Error {
  constructor(message: string = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitExceededError';
  }
}

export class SUIRpcError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'SUIRpcError';
  }
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

class InMemoryCacheStore implements CacheStore {
  private store = new Map<string, CacheEntry<any>>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

class TokenBucket {
  private tokens: number;
  private lastRefillTime: number;
  private readonly maxTokens: number;
  private readonly refillRate: number;

  constructor(tokensPerSecond: number) {
    this.maxTokens = tokensPerSecond;
    this.tokens = tokensPerSecond;
    this.refillRate = tokensPerSecond / 1000;
    this.lastRefillTime = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefillTime;
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefillTime = now;
  }

  async acquireToken(): Promise<void> {
    let attempt = 0;
    const maxRetries = 10;

    while (attempt < maxRetries) {
      this.refill();

      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }

      const timeUntilNextToken = (1 - this.tokens) / this.refillRate;
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(100, timeUntilNextToken))
      );
      attempt++;
    }

    throw new RateLimitExceededError(
      'Could not acquire rate limit token after retries'
    );
  }
}

export interface OrÿaSUIProviderConfig {
  rpcUrl: string;
  cacheEnabled?: boolean;
  cacheStore?: CacheStore;
  rateLimitPerSecond?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

export class OrÿaSUIProvider {
  private provider: any;
  private cacheStore: CacheStore;
  private cacheEnabled: boolean;
  private rateLimiter: TokenBucket;
  private maxRetries: number;
  private retryDelayMs: number;

  constructor(config: OrÿaSUIProviderConfig) {
    this.provider = new JsonRpcProvider(config.rpcUrl);

    this.cacheEnabled = config.cacheEnabled !== false;
    this.cacheStore = config.cacheStore || new InMemoryCacheStore();
    this.rateLimiter = new TokenBucket(config.rateLimitPerSecond || 10);
    this.maxRetries = config.maxRetries || 3;
    this.retryDelayMs = config.retryDelayMs || 1000;
  }

  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        await this.rateLimiter.acquireToken();
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (error instanceof RateLimitExceededError) {
          throw error;
        }

        const isNetworkError =
          error instanceof Error &&
          (error.message.includes('network') ||
            error.message.includes('fetch') ||
            error.message.includes('ECONNREFUSED') ||
            error.message.includes('ETIMEDOUT'));

        if (isNetworkError && attempt < this.maxRetries) {
          const delayMs = this.retryDelayMs * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        break;
      }
    }

    throw this.parseError(lastError || new Error('Unknown error'), operationName);
  }

  private parseError(error: Error, context: string): Error {
    const message = error.message || String(error);

    const errorMap: Record<string, { code: string; message: string }> = {
      'insufficient gas': {
        code: 'INSUFFICIENT_GAS',
        message: 'Transaction has insufficient gas budget',
      },
      'invalid signature': {
        code: 'INVALID_SIGNATURE',
        message: 'Transaction signature is invalid',
      },
      'object not found': {
        code: 'OBJECT_NOT_FOUND',
        message: 'Requested SUI object not found',
      },
      'transaction failed': {
        code: 'TRANSACTION_FAILED',
        message: 'Transaction execution failed',
      },
      'invalid transaction': {
        code: 'INVALID_TRANSACTION',
        message: 'Transaction format is invalid',
      },
    };

    for (const [key, errorInfo] of Object.entries(errorMap)) {
      if (message.toLowerCase().includes(key)) {
        return new SUIRpcError(errorInfo.message, errorInfo.code, {
          context,
          originalError: message,
        });
      }
    }

    return new SUIRpcError(
      `SUI RPC Error in ${context}: ${message}`,
      'UNKNOWN_ERROR',
      { context, originalError: message }
    );
  }

  async getBalance(address: string): Promise<string> {
    const cacheKey = `sui:balance:${address}`;

    if (this.cacheEnabled) {
      const cached = await this.cacheStore.get<string>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    const balance = await this.executeWithRetry(
      async () => {
        const result = await (this.provider as any).getBalance(address);
        return result.totalBalance;
      },
      `getBalance(${address})`
    );

    if (this.cacheEnabled) {
      await this.cacheStore.set(cacheKey, balance, 30);
    }

    return balance;
  }

  async getCoins(
    address: string,
    coinType?: string
  ): Promise<Array<{ coinObjectId: string; balance: string; coinType: string }>> {
    const cacheKey = `sui:coins:${address}:${coinType || 'all'}`;

    if (this.cacheEnabled) {
      const cached = await this.cacheStore.get<
        Array<{ coinObjectId: string; balance: string; coinType: string }>
      >(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    const coins = await this.executeWithRetry(
      async () => {
        const result = await (this.provider as any).getCoins({
          owner: address,
          coinType,
        });
        return result.data.map((coin: any) => ({
          coinObjectId: coin.coinObjectId,
          balance: coin.balance,
          coinType: coin.coinType,
        }));
      },
      `getCoins(${address}, ${coinType})`
    );

    if (this.cacheEnabled) {
      await this.cacheStore.set(cacheKey, coins, 30);
    }

    return coins;
  }

  async getTransactionBlock(digest: string): Promise<any> {
    const cacheKey = `sui:transaction:${digest}`;

    if (this.cacheEnabled) {
      const cached = await this.cacheStore.get<any>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    const tx = await this.executeWithRetry(
      async () => {
        return await (this.provider as any).getTransactionBlock(digest, {
          showInput: true,
          showRawInput: true,
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showBalanceChanges: true,
        });
      },
      `getTransactionBlock(${digest})`
    );

    if (this.cacheEnabled) {
      await this.cacheStore.set(cacheKey, tx, 300);
    }

    return tx;
  }

  async executeTransactionBlock(
    tx: any,
    signer: any
  ): Promise<any> {
    return this.executeWithRetry(
      async () => {
        const result = await (this.provider as any).signAndExecuteTransactionBlock({
          transactionBlock: tx,
          signer,
        });
        return result;
      },
      'executeTransactionBlock'
    );
  }

  async getObject(
    objectId: string,
    options?: any
  ): Promise<any> {
    const cacheKey = `sui:object:${objectId}`;

    if (this.cacheEnabled) {
      const cached = await this.cacheStore.get<any>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    const obj = await this.executeWithRetry(
      async () => {
        return await (this.provider as any).getObject(objectId, {
          ...options,
          showType: true,
          showContent: true,
          showOwner: true,
          showPreviousTransaction: true,
          showStorageRebate: true,
        });
      },
      `getObject(${objectId})`
    );

    if (this.cacheEnabled) {
      await this.cacheStore.set(cacheKey, obj, 300);
    }

    return obj;
  }

  async queryEvents(
    query: any
  ): Promise<any> {
    const cacheKey = `sui:events:${JSON.stringify(query)}`;

    if (this.cacheEnabled) {
      const cached = await this.cacheStore.get<any>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    const events = await this.executeWithRetry(
      async () => {
        return await (this.provider as any).queryEvents(query);
      },
      'queryEvents'
    );

    if (this.cacheEnabled) {
      await this.cacheStore.set(cacheKey, events, 30);
    }

    return events;
  }

  async clearCache(): Promise<void> {
    await this.cacheStore.clear();
  }

  async clearCacheKey(key: string): Promise<void> {
    await this.cacheStore.delete(key);
  }

  setRateLimitPerSecond(tokensPerSecond: number): void {
    this.rateLimiter = new TokenBucket(tokensPerSecond);
  }

  enableCache(): void {
    this.cacheEnabled = true;
  }

  disableCache(): void {
    this.cacheEnabled = false;
  }

  getProvider(): any {
    return this.provider;
  }
}

export function createSUIProvider(
  config: OrÿaSUIProviderConfig
): OrÿaSUIProvider {
  return new OrÿaSUIProvider(config);
}
