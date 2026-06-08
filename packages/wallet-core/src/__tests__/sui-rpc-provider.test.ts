import {
  OrÿaSUIProvider,
  RateLimitExceededError,
  SUIRpcError,
  createSUIProvider,
} from '../sui/rpc-provider';

class MockCacheStore {
  private store = new Map<string, any>();

  async get<T>(key: string): Promise<T | null> {
    return this.store.get(key) || null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

class MockJsonRpcProvider {
  getBalance = jest.fn();
  getCoins = jest.fn();
  getTransactionBlock = jest.fn();
  getObject = jest.fn();
  queryEvents = jest.fn();
  signAndExecuteTransactionBlock = jest.fn();
}

jest.mock('@mysten/sui.js', () => ({
  JsonRpcProvider: function () {
    return new MockJsonRpcProvider();
  },
  Connection: jest.fn((config) => config),
}));

describe('OrÿaSUIProvider', () => {
  let provider: OrÿaSUIProvider;
  let mockCacheStore: MockCacheStore;

  beforeEach(() => {
    mockCacheStore = new MockCacheStore();
    provider = new OrÿaSUIProvider({
      rpcUrl: 'https://sui-rpc-test.example.com',
      cacheEnabled: true,
      cacheStore: mockCacheStore as any,
      rateLimitPerSecond: 10,
    });
  });

  describe('Initialization', () => {
    it('should create provider with default config', () => {
      const p = new OrÿaSUIProvider({
        rpcUrl: 'https://sui-rpc-test.example.com',
      });
      expect(p).toBeDefined();
    });

    it('should create provider with custom rate limit', () => {
      const p = new OrÿaSUIProvider({
        rpcUrl: 'https://sui-rpc-test.example.com',
        rateLimitPerSecond: 20,
      });
      expect(p).toBeDefined();
    });

    it('should create provider using factory function', () => {
      const p = createSUIProvider({
        rpcUrl: 'https://sui-rpc-test.example.com',
      });
      expect(p).toBeInstanceOf(OrÿaSUIProvider);
    });
  });

  describe('getBalance', () => {
    it('should fetch balance from provider', async () => {
      const mockProvider = provider['provider'] as any;
      mockProvider.getBalance.mockResolvedValue({ totalBalance: '1000000' });

      const balance = await provider.getBalance('0x123abc');

      expect(balance).toBe('1000000');
      expect(mockProvider.getBalance).toHaveBeenCalledWith({ owner: '0x123abc' });
    });

    it('should cache balance results', async () => {
      const mockProvider = provider['provider'] as any;
      mockProvider.getBalance.mockResolvedValue({ totalBalance: '1000000' });

      const balance1 = await provider.getBalance('0x123abc');
      const balance2 = await provider.getBalance('0x123abc');

      expect(balance1).toBe('1000000');
      expect(balance2).toBe('1000000');
      expect(mockProvider.getBalance).toHaveBeenCalledTimes(1);
    });

    it('should not cache when disabled', async () => {
      provider.disableCache();
      const mockProvider = provider['provider'] as any;
      mockProvider.getBalance.mockResolvedValue({ totalBalance: '1000000' });

      await provider.getBalance('0x123abc');
      await provider.getBalance('0x123abc');

      expect(mockProvider.getBalance).toHaveBeenCalledTimes(2);
    });

    it('should handle errors with retry', async () => {
      const mockProvider = provider['provider'] as any;
      mockProvider.getBalance
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValueOnce({ totalBalance: '1000000' });

      const balance = await provider.getBalance('0x123abc');

      expect(balance).toBe('1000000');
      expect(mockProvider.getBalance).toHaveBeenCalledTimes(2);
    });

    it('should throw SUIRpcError on final failure', async () => {
      const mockProvider = provider['provider'] as any;
      mockProvider.getBalance.mockRejectedValue(new Error('network error'));

      await expect(provider.getBalance('0x123abc')).rejects.toThrow(SUIRpcError);
    });
  });

  describe('getCoins', () => {
    it('should fetch coins for address', async () => {
      const mockCoins = [
        { coinObjectId: 'obj1', balance: '100', coinType: '0x2::sui::SUI' },
      ];
      const mockProvider = provider['provider'] as any;
      mockProvider.getCoins.mockResolvedValue({ data: mockCoins });

      const coins = await provider.getCoins('0x123abc');

      expect(coins).toEqual(mockCoins);
      expect(mockProvider.getCoins).toHaveBeenCalledWith({
        owner: '0x123abc',
        coinType: undefined,
      });
    });

    it('should fetch coins with specific coin type', async () => {
      const mockCoins = [
        { coinObjectId: 'obj1', balance: '100', coinType: '0x2::sui::SUI' },
      ];
      const mockProvider = provider['provider'] as any;
      mockProvider.getCoins.mockResolvedValue({ data: mockCoins });

      const coins = await provider.getCoins('0x123abc', '0x2::sui::SUI');

      expect(coins).toEqual(mockCoins);
      expect(mockProvider.getCoins).toHaveBeenCalledWith({
        owner: '0x123abc',
        coinType: '0x2::sui::SUI',
      });
    });

    it('should cache coins results', async () => {
      const mockCoins = [
        { coinObjectId: 'obj1', balance: '100', coinType: '0x2::sui::SUI' },
      ];
      const mockProvider = provider['provider'] as any;
      mockProvider.getCoins.mockResolvedValue({ data: mockCoins });

      await provider.getCoins('0x123abc');
      await provider.getCoins('0x123abc');

      expect(mockProvider.getCoins).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTransactionBlock', () => {
    it('should fetch transaction block', async () => {
      const mockTx = { digest: 'abc123', effects: {} };
      const mockProvider = provider['provider'] as any;
      mockProvider.getTransactionBlock.mockResolvedValue(mockTx);

      const tx = await provider.getTransactionBlock('abc123');

      expect(tx).toEqual(mockTx);
      expect(mockProvider.getTransactionBlock).toHaveBeenCalled();
    });

    it('should cache transaction blocks permanently', async () => {
      const mockTx = { digest: 'abc123', effects: {} };
      const mockProvider = provider['provider'] as any;
      mockProvider.getTransactionBlock.mockResolvedValue(mockTx);

      await provider.getTransactionBlock('abc123');
      await provider.getTransactionBlock('abc123');

      expect(mockProvider.getTransactionBlock).toHaveBeenCalledTimes(1);
    });
  });

  describe('getObject', () => {
    it('should fetch object', async () => {
      const mockObj = { objectId: 'obj123', content: {} };
      const mockProvider = provider['provider'] as any;
      mockProvider.getObject.mockResolvedValue(mockObj);

      const obj = await provider.getObject('obj123');

      expect(obj).toEqual(mockObj);
      expect(mockProvider.getObject).toHaveBeenCalled();
    });

    it('should cache objects for 5 minutes', async () => {
      const mockObj = { objectId: 'obj123', content: {} };
      const mockProvider = provider['provider'] as any;
      mockProvider.getObject.mockResolvedValue(mockObj);

      await provider.getObject('obj123');
      await provider.getObject('obj123');

      expect(mockProvider.getObject).toHaveBeenCalledTimes(1);
    });
  });

  describe('queryEvents', () => {
    it('should query events', async () => {
      const mockEvents = { data: [], nextCursor: null };
      const mockProvider = provider['provider'] as any;
      mockProvider.queryEvents.mockResolvedValue(mockEvents);

      const query = { filter: { MoveModule: { package: 'pkg', module: 'mod' } } };
      const events = await provider.queryEvents(query as any);

      expect(events).toEqual(mockEvents);
      expect(mockProvider.queryEvents).toHaveBeenCalled();
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limit', async () => {
      const mockProvider = provider['provider'] as any;
      mockProvider.getBalance.mockResolvedValue({ totalBalance: '1000000' });

      provider.disableCache();

      const start = Date.now();
      for (let i = 0; i < 5; i++) {
        await provider.getBalance(`0x${i}`);
      }
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(100);
    });

    it('should update rate limit', async () => {
      provider.setRateLimitPerSecond(100);
      expect(provider).toBeDefined();
    });
  });

  describe('Cache Management', () => {
    it('should clear all cache', async () => {
      const mockProvider = provider['provider'] as any;
      mockProvider.getBalance.mockResolvedValue({ totalBalance: '1000000' });

      await provider.getBalance('0x123abc');
      await provider.clearCache();
      mockProvider.getBalance.mockClear();
      mockProvider.getBalance.mockResolvedValue({ totalBalance: '2000000' });
      const balance = await provider.getBalance('0x123abc');

      expect(balance).toBe('2000000');
      expect(mockProvider.getBalance).toHaveBeenCalledTimes(1);
    });

    it('should clear specific cache key', async () => {
      const mockProvider = provider['provider'] as any;
      mockProvider.getBalance.mockResolvedValue({ totalBalance: '1000000' });

      await provider.getBalance('0x123abc');
      await provider.clearCacheKey('sui:balance:0x123abc');
      mockProvider.getBalance.mockClear();
      mockProvider.getBalance.mockResolvedValue({ totalBalance: '2000000' });
      const balance = await provider.getBalance('0x123abc');

      expect(balance).toBe('2000000');
      expect(mockProvider.getBalance).toHaveBeenCalledTimes(1);
    });

    it('should enable and disable cache', () => {
      provider.disableCache();
      provider.enableCache();
      expect(provider).toBeDefined();
    });
  });

  describe('Error Parsing', () => {
    it('should parse insufficient gas error', async () => {
      const mockProvider = provider['provider'] as any;
      mockProvider.getBalance.mockRejectedValue(
        new Error('insufficient gas for transaction')
      );

      try {
        await provider.getBalance('0x123abc');
        fail('Should throw error');
      } catch (error) {
        expect(error).toBeInstanceOf(SUIRpcError);
        const rpcError = error as SUIRpcError;
        expect(rpcError.code).toBe('INSUFFICIENT_GAS');
      }
    });

    it('should parse invalid signature error', async () => {
      const mockProvider = provider['provider'] as any;
      mockProvider.getBalance.mockRejectedValue(
        new Error('invalid signature provided')
      );

      try {
        await provider.getBalance('0x123abc');
        fail('Should throw error');
      } catch (error) {
        expect(error).toBeInstanceOf(SUIRpcError);
        const rpcError = error as SUIRpcError;
        expect(rpcError.code).toBe('INVALID_SIGNATURE');
      }
    });

    it('should parse object not found error', async () => {
      const mockProvider = provider['provider'] as any;
      mockProvider.getObject.mockRejectedValue(new Error('object not found'));

      try {
        await provider.getObject('invalid-id');
        fail('Should throw error');
      } catch (error) {
        expect(error).toBeInstanceOf(SUIRpcError);
        const rpcError = error as SUIRpcError;
        expect(rpcError.code).toBe('OBJECT_NOT_FOUND');
      }
    });
  });

  describe('Provider Access', () => {
    it('should return underlying JsonRpcProvider', () => {
      const p = provider.getProvider();
      expect(p).toBeDefined();
    });
  });
});
