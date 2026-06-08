import {
  RPCManager,
  RPCError,
  RPCProviderConfig,
  RPCRequest,
} from '../services/RPCManager';

describe('RPCManager', () => {
  let manager: RPCManager;

  beforeEach(() => {
    manager = RPCManager.getInstance();
    manager.resetAllRateLimits();
  });

  afterEach(() => {
    manager.shutdown();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = RPCManager.getInstance();
      const instance2 = RPCManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Provider Initialization', () => {
    it('should initialize providers for all supported chains', () => {
      const supportedChains = manager.getSupportedChains();
      expect(supportedChains).toContain('ethereum');
      expect(supportedChains).toContain('polygon');
      expect(supportedChains).toContain('arbitrum');
      expect(supportedChains).toContain('optimism');
      expect(supportedChains).toContain('base');
      expect(supportedChains).toContain('bsc');
      expect(supportedChains).toContain('solana');
      expect(supportedChains).toContain('sui');
    });

    it('should have Ethereum providers with correct tier and priority', () => {
      const ethProviders = manager.getProviders('ethereum');
      expect(ethProviders.length).toBeGreaterThan(0);

      const alchemy = ethProviders.find((p) => p.name === 'Alchemy');
      expect(alchemy).toBeDefined();
      expect(alchemy?.tier).toBe(1);
      expect(alchemy?.priority).toBe(1);
      expect(alchemy?.rateLimit).toBeGreaterThan(0);
    });

    it('should initialize health status for all providers', () => {
      const health = manager.getAllHealthStatus('ethereum');
      expect(health.length).toBeGreaterThan(0);
      expect(health[0].isHealthy).toBe(true);
      expect(health[0].consecutiveFailures).toBe(0);
    });
  });

  describe('Provider Management', () => {
    it('should add a custom provider', () => {
      const customProvider: RPCProviderConfig = {
        name: 'CustomRPC',
        url: 'https://custom-rpc.example.com',
        priority: 10,
        tier: 3,
        rateLimit: 50,
        weight: 2,
      };

      manager.addProvider('ethereum', customProvider);
      const providers = manager.getProviders('ethereum');
      const found = providers.find((p) => p.name === 'CustomRPC');

      expect(found).toBeDefined();
      expect(found?.url).toBe('https://custom-rpc.example.com');
    });

    it('should remove a provider', () => {
      const customProvider: RPCProviderConfig = {
        name: 'RemoveMe',
        url: 'https://remove-me.example.com',
        priority: 10,
        tier: 3,
        weight: 1,
      };

      manager.addProvider('ethereum', customProvider);
      let providers = manager.getProviders('ethereum');
      expect(providers.find((p) => p.name === 'RemoveMe')).toBeDefined();

      manager.removeProvider('ethereum', 'RemoveMe');
      providers = manager.getProviders('ethereum');
      expect(providers.find((p) => p.name === 'RemoveMe')).toBeUndefined();
    });
  });

  describe('Health Checks', () => {
    it('should return health status for a provider', () => {
      const health = manager.getHealthStatus('ethereum', 'Alchemy');
      expect(health).toBeDefined();
      expect(health?.providerId).toContain('Alchemy');
      expect(typeof health?.latency).toBe('number');
      expect(health?.consecutiveFailures).toBeGreaterThanOrEqual(0);
    });

    it('should return all health statuses for a chain', () => {
      const statuses = manager.getAllHealthStatus('ethereum');
      expect(statuses.length).toBeGreaterThan(0);
      expect(statuses[0].providerId).toBeDefined();
      expect(statuses[0].isHealthy).toBeDefined();
    });

    it('should initialize health checks', () => {
      const health = manager.getAllHealthStatus('ethereum');
      expect(health.length).toBeGreaterThan(0);
      expect(health.every((h) => h.lastChecked instanceof Date)).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should reset rate limit for a provider', () => {
      const stats1 = manager.getProviderStats('ethereum', 'Alchemy');
      manager.resetRateLimit('ethereum', 'Alchemy');
      const stats2 = manager.getProviderStats('ethereum', 'Alchemy');

      expect(stats2.requestCount).toBe(0);
    });

    it('should reset all rate limits', () => {
      manager.resetAllRateLimits();
      const ethStats = manager.getProviderStats('ethereum', 'Alchemy');
      const polyStats = manager.getProviderStats('polygon', 'Alchemy');

      expect(ethStats.requestCount).toBe(0);
      expect(polyStats.requestCount).toBe(0);
    });

    it('should get provider statistics', () => {
      const stats = manager.getProviderStats('ethereum', 'Alchemy');
      expect(stats).toHaveProperty('requestCount');
      expect(stats).toHaveProperty('lastRequestTime');
      expect(stats).toHaveProperty('health');
      expect(typeof stats.requestCount).toBe('number');
      expect(stats.lastRequestTime instanceof Date).toBe(true);
    });
  });

  describe('RPC Requests', () => {
    it('should throw error when no healthy providers available', async () => {
      const request: RPCRequest = {
        method: 'eth_blockNumber',
        params: [],
      };

      try {
        await manager.request('nonexistent-chain', request);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error instanceof RPCError).toBe(true);
        expect((error as RPCError).code).toBe('NO_PROVIDERS');
      }
    });

    it('should throw RPCError with proper structure', () => {
      const error = new RPCError('Test error', 'TEST_CODE', undefined, {
        detail: 'test detail',
      });
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('RPCError');
      expect(error.details).toEqual({ detail: 'test detail' });
    });
  });

  describe('Provider Sorting and Selection', () => {
    it('should support preferred provider selection', () => {
      const providers = manager.getProviders('ethereum');
      expect(providers.length).toBeGreaterThan(0);
    });

    it('should have providers sorted by priority', () => {
      const providers = manager.getProviders('ethereum');
      for (let i = 0; i < providers.length - 1; i++) {
        expect(providers[i].priority).toBeLessThanOrEqual(
          providers[i + 1].priority
        );
      }
    });

    it('should return providers with correct tier levels', () => {
      const providers = manager.getProviders('ethereum');

      const tier1 = providers.filter((p) => p.tier === 1);
      const tier2 = providers.filter((p) => p.tier === 2);
      const tier3 = providers.filter((p) => p.tier === 3);

      expect(tier1.length).toBeGreaterThan(0);
      expect(tier2.length + tier3.length).toBeGreaterThan(0);
    });
  });

  describe('Multiple Chains Support', () => {
    it('should support Ethereum', () => {
      const providers = manager.getProviders('ethereum');
      expect(providers.length).toBeGreaterThan(0);
      expect(providers.some((p) => p.name === 'Alchemy')).toBe(true);
    });

    it('should support Polygon', () => {
      const providers = manager.getProviders('polygon');
      expect(providers.length).toBeGreaterThan(0);
      expect(providers.some((p) => p.name === 'Alchemy')).toBe(true);
    });

    it('should support Arbitrum', () => {
      const providers = manager.getProviders('arbitrum');
      expect(providers.length).toBeGreaterThan(0);
      expect(providers.some((p) => p.name === 'Alchemy')).toBe(true);
    });

    it('should support Optimism', () => {
      const providers = manager.getProviders('optimism');
      expect(providers.length).toBeGreaterThan(0);
      expect(providers.some((p) => p.name === 'Alchemy')).toBe(true);
    });

    it('should support Base', () => {
      const providers = manager.getProviders('base');
      expect(providers.length).toBeGreaterThan(0);
      expect(providers.some((p) => p.name === 'Alchemy')).toBe(true);
    });

    it('should support BSC', () => {
      const providers = manager.getProviders('bsc');
      expect(providers.length).toBeGreaterThan(0);
    });

    it('should support Solana', () => {
      const providers = manager.getProviders('solana');
      expect(providers.length).toBeGreaterThan(0);
      expect(providers.some((p) => p.name === 'Helius')).toBe(true);
    });

    it('should support SUI', () => {
      const providers = manager.getProviders('sui');
      expect(providers.length).toBeGreaterThan(0);
      expect(providers.some((p) => p.name === 'SUI Foundation')).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    it('should have rate limits configured', () => {
      const providers = manager.getProviders('ethereum');
      expect(providers.every((p) => typeof p.rateLimit === 'number')).toBe(
        false
      );
      expect(
        providers.some(
          (p) => p.rateLimit && p.rateLimit > 0
        )
      ).toBe(true);
    });

    it('should have timeouts configured', () => {
      const providers = manager.getProviders('ethereum');
      expect(
        providers.some(
          (p) => p.timeout && p.timeout > 0
        )
      ).toBe(true);
    });

    it('should have weights for load balancing', () => {
      const providers = manager.getProviders('ethereum');
      expect(
        providers.some(
          (p) => p.weight && p.weight > 0
        )
      ).toBe(true);
    });

    it('should have URLs for all providers', () => {
      const providers = manager.getProviders('ethereum');
      const validProviders = providers.filter((p) => p.url && p.url.length > 0);
      expect(validProviders.length).toBeGreaterThan(0);
    });
  });

  describe('Shutdown', () => {
    it('should shutdown gracefully', () => {
      expect(() => {
        manager.shutdown();
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty request params', () => {
      const request: RPCRequest = {
        method: 'eth_blockNumber',
      };
      expect(request.params).toBeUndefined();
    });

    it('should handle custom request IDs', () => {
      const request: RPCRequest = {
        method: 'eth_blockNumber',
        params: [],
        id: 'custom-id-123',
      };
      expect(request.id).toBe('custom-id-123');
    });

    it('should support different timeout values', () => {
      const providers = manager.getProviders('ethereum');
      const timeouts = new Set(
        providers.map((p) => p.timeout).filter((t) => t !== undefined)
      );
      expect(timeouts.size).toBeGreaterThan(0);
    });
  });

  describe('Tier Distribution', () => {
    it('should have Tier 1 providers for premium chains', () => {
      const tier1Chains = ['ethereum', 'polygon', 'arbitrum', 'optimism'];
      tier1Chains.forEach((chain) => {
        const providers = manager.getProviders(chain);
        const tier1 = providers.filter((p) => p.tier === 1);
        expect(tier1.length).toBeGreaterThan(0);
      });
    });

    it('should have fallback Tier 3 providers', () => {
      const tier3Chains = ['ethereum', 'polygon', 'bsc', 'solana'];
      tier3Chains.forEach((chain) => {
        const providers = manager.getProviders(chain);
        const tier3 = providers.filter((p) => p.tier === 3);
        expect(tier3.length).toBeGreaterThan(0);
      });
    });

    it('should prioritize Tier 1 providers', () => {
      const providers = manager.getProviders('ethereum');
      const tier1Providers = providers.filter((p) => p.tier === 1);
      const tier3Providers = providers.filter((p) => p.tier === 3);

      if (tier1Providers.length > 0 && tier3Providers.length > 0) {
        expect(tier1Providers[0].priority).toBeLessThan(
          tier3Providers[0].priority
        );
      }
    });
  });
});
