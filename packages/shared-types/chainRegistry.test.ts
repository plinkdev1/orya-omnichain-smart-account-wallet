import { ChainRegistry, initializeChainRegistry, getChainRegistry, loadChainRegistry } from './chainRegistry';
import type { Chain } from './chains';

describe('ChainRegistry', () => {
  let registry: ChainRegistry;

  beforeEach(() => {
    registry = new ChainRegistry({ environment: 'development' });
  });

  describe('Initialization', () => {
    it('should initialize with default config', async () => {
      await registry.initialize();
      expect(registry).toBeDefined();
    });

    it('should load default chains on initialization', async () => {
      await registry.initialize();
      const chains = registry.getAllChains();
      expect(chains.length).toBeGreaterThan(0);
    });

    it('should not reinitialize if already initialized', async () => {
      await registry.initialize();
      const chains1 = registry.getAllChains();
      await registry.initialize();
      const chains2 = registry.getAllChains();
      expect(chains1.length).toBe(chains2.length);
    });
  });

  describe('Chain Retrieval', () => {
    beforeEach(async () => {
      await registry.initialize();
    });

    it('should get a chain by ID', () => {
      const chain = registry.getChain('sui:mainnet');
      expect(chain).toBeDefined();
      expect(chain?.id).toBe('sui:mainnet');
    });

    it('should return undefined for non-existent chain', () => {
      const chain = registry.getChain('invalid:chain' as any);
      expect(chain).toBeUndefined();
    });

    it('should get all chains', () => {
      const chains = registry.getAllChains();
      expect(Array.isArray(chains)).toBe(true);
      expect(chains.length).toBeGreaterThan(0);
    });

    it('should get only enabled chains', () => {
      const enabledChains = registry.getEnabledChains();
      enabledChains.forEach((chain) => {
        expect(chain.isEnabled).toBe(true);
      });
    });

    it('should sort chains by priority', () => {
      const chains = registry.getEnabledChains();
      for (let i = 1; i < chains.length; i++) {
        expect(chains[i].priority).toBeGreaterThanOrEqual(chains[i - 1].priority);
      }
    });

    it('should get only mainnet chains', () => {
      const mainnetChains = registry.getMainnetChains();
      mainnetChains.forEach((chain) => {
        expect(chain.isTestnet).toBe(false);
      });
    });

    it('should get only testnet chains', () => {
      const testnetChains = registry.getTestnetChains();
      testnetChains.forEach((chain) => {
        expect(chain.isTestnet).toBe(true);
      });
    });
  });

  describe('Chain Filtering', () => {
    beforeEach(async () => {
      await registry.initialize();
    });

    it('should get chains by type', () => {
      const evmChains = registry.getChainsByType('evm');
      expect(evmChains.length).toBeGreaterThan(0);
      evmChains.forEach((chain) => {
        expect(chain.type).toBe('evm');
      });
    });

    it('should get chains by VM family', () => {
      const moveChains = registry.getChainsByVMFamily('MoveVM');
      expect(moveChains.length).toBeGreaterThan(0);
    });

    it('should get chains by symbol', () => {
      const ethChains = registry.getChainsBySymbol('ETH');
      expect(ethChains.length).toBeGreaterThan(0);
      ethChains.forEach((chain) => {
        expect(chain.symbol).toBe('ETH');
      });
    });

    it('should search chains by name', () => {
      const results = registry.searchChains('Ethereum');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('Ethereum');
    });

    it('should search chains by symbol', () => {
      const results = registry.searchChains('SUI');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should search chains case-insensitively', () => {
      const results = registry.searchChains('ethereum');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Chain Validation', () => {
    it('should validate chain schema', () => {
      const validChain: Chain = {
        id: 'test:mainnet' as any,
        name: 'Test Chain',
        symbol: 'TEST',
        type: 'evm',
        icon: '/icons/test.svg',
        rpcUrl: 'https://rpc.test.io',
        explorerUrl: 'https://explorer.test.io',
        nativeCurrency: { name: 'Test', symbol: 'TEST', decimals: 18 },
        isTestnet: false,
        isEnabled: true,
        priority: 100,
        status: 'healthy',
      };

      const result = registry.addChain(validChain);
      expect(result).toBe(true);
    });

    it('should reject chain with missing required fields', () => {
      const invalidChain: any = {
        name: 'Test Chain',
        symbol: 'TEST',
      };

      const result = registry.addChain(invalidChain);
      expect(result).toBe(false);
    });

    it('should track validation errors', () => {
      const invalidChain: any = {
        name: 'Test Chain',
      };

      registry.addChain(invalidChain);
      expect(registry.hasValidationErrors()).toBe(true);
      const errors = registry.getValidationErrors();
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Chain Management', () => {
    beforeEach(async () => {
      await registry.initialize();
    });

    it('should add a new chain', () => {
      const newChain: Chain = {
        id: 'newchain:mainnet' as any,
        name: 'New Chain',
        symbol: 'NEW',
        type: 'evm',
        icon: '/icons/new.svg',
        rpcUrl: 'https://rpc.newchain.io',
        explorerUrl: 'https://explorer.newchain.io',
        nativeCurrency: { name: 'New', symbol: 'NEW', decimals: 18 },
        isTestnet: false,
        isEnabled: true,
        priority: 200,
        status: 'healthy',
      };

      const initialCount = registry.getAllChains().length;
      const result = registry.addChain(newChain);
      const finalCount = registry.getAllChains().length;

      expect(result).toBe(true);
      expect(finalCount).toBe(initialCount + 1);
    });

    it('should update a chain', () => {
      const chainId = 'sui:mainnet' as any;
      const updated = registry.updateChain(chainId, { status: 'degraded' });

      expect(updated).toBe(true);
      const chain = registry.getChain(chainId);
      expect(chain?.status).toBe('degraded');
    });

    it('should remove a chain', () => {
      const newChain: Chain = {
        id: 'removeme:mainnet' as any,
        name: 'Remove Me',
        symbol: 'RMV',
        type: 'evm',
        icon: '/icons/rmv.svg',
        rpcUrl: 'https://rpc.removeme.io',
        explorerUrl: 'https://explorer.removeme.io',
        nativeCurrency: { name: 'RMV', symbol: 'RMV', decimals: 18 },
        isTestnet: false,
        isEnabled: true,
        priority: 300,
        status: 'healthy',
      };

      registry.addChain(newChain);
      const initialCount = registry.getAllChains().length;
      const removed = registry.removeChain('removeme:mainnet' as any);
      const finalCount = registry.getAllChains().length;

      expect(removed).toBe(true);
      expect(finalCount).toBe(initialCount - 1);
    });
  });

  describe('Statistics and Export', () => {
    beforeEach(async () => {
      await registry.initialize();
    });

    it('should provide chain statistics', () => {
      const stats = registry.getStatistics();

      expect(stats.totalChains).toBeGreaterThan(0);
      expect(stats.enabledChains).toBeGreaterThan(0);
      expect(stats.mainnetChains).toBeGreaterThan(0);
      expect(typeof stats.byType).toBe('object');
      expect(typeof stats.byVMFamily).toBe('object');
    });

    it('should export chains in standard format', () => {
      const exported = registry.exportChains();

      expect(exported.version).toBe('1.0.0');
      expect(exported.timestamp).toBeDefined();
      expect(exported.environment).toBe('development');
      expect(exported.totalChains).toBeGreaterThan(0);
      expect(Array.isArray(exported.chains)).toBe(true);
      expect(Array.isArray(exported.vmFamilies)).toBe(true);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance from singleton', () => {
      const instance1 = getChainRegistry();
      const instance2 = getChainRegistry();

      expect(instance1).toBe(instance2);
    });

    it('should initialize with same config', async () => {
      const registry1 = initializeChainRegistry({ environment: 'production' });
      const registry2 = initializeChainRegistry({ environment: 'staging' });

      expect(registry1).toBe(registry2);
    });
  });

  describe('Async Loading', () => {
    it('should load and initialize registry asynchronously', async () => {
      const loadedRegistry = await loadChainRegistry({ environment: 'development' });

      expect(loadedRegistry).toBeDefined();
      const chains = loadedRegistry.getAllChains();
      expect(chains.length).toBeGreaterThan(0);
    });

    it('should handle initialization errors gracefully', async () => {
      const errorRegistry = new ChainRegistry({
        environment: 'production',
        externalRegistryUrl: 'https://invalid-registry-url-that-does-not-exist.io/chains',
      });

      await errorRegistry.initialize();
      const chains = errorRegistry.getAllChains();
      expect(chains.length).toBeGreaterThan(0);
    });
  });

  describe('Gas Configuration', () => {
    beforeEach(async () => {
      await registry.initialize();
    });

    it('should include gas config for Sui chains', () => {
      const suiChain = registry.getChain('sui:mainnet');
      expect(suiChain?.gasConfig).toBeDefined();
      expect(suiChain?.gasConfig?.type).toBe('move');
    });

    it('should include features for each chain', () => {
      const chains = registry.getEnabledChains();
      chains.forEach((chain) => {
        if (chain.features) {
          expect(typeof chain.features).toBe('object');
        }
      });
    });
  });

  describe('VM Family Mapping', () => {
    beforeEach(async () => {
      await registry.initialize();
    });

    it('should have MoveVM family chains', () => {
      const moveChains = registry.getChainsByVMFamily('MoveVM');
      expect(moveChains.length).toBeGreaterThan(0);
    });

    it('should have EVM family chains', () => {
      const evmChains = registry.getChainsByVMFamily('EVM');
      expect(evmChains.length).toBeGreaterThan(0);
    });

    it('should have SVM family chains', () => {
      const svmChains = registry.getChainsByVMFamily('SVM');
      expect(svmChains.length).toBeGreaterThan(0);
    });

    it('should have Cosmos family chains', () => {
      const cosmosChains = registry.getChainsByVMFamily('Cosmos');
      expect(cosmosChains.length).toBeGreaterThan(0);
    });
  });
});
