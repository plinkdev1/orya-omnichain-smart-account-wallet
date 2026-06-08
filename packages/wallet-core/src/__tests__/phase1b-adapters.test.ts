import {
  SolanaSVMAdapter,
  SOLANA_SVM_CHAINS,
  CosmosExtendedAdapter,
  COSMOS_CHAINS,
  TonAdapter,
  TON_CHAINS,
  NearAdapter,
  NEAR_CHAINS,
} from '../services/adapters';

describe('Phase 1B: Multi-Chain Adapters', () => {
  describe('Solana/SVM Adapter', () => {
    it('should initialize Solana adapter with mainnet', () => {
      const adapter = new SolanaSVMAdapter('solana:mainnet');
      expect(adapter.getChain().id).toBe('solana:mainnet');
      expect(adapter.getChain().name).toBe('Solana Mainnet');
    });

    it('should support all SVM chains', () => {
      const chains = SolanaSVMAdapter.getAvailableChains();
      expect(chains).toContain('solana:mainnet');
      expect(chains).toContain('sonic:mainnet');
      expect(chains).toContain('mantis:mainnet');
      expect(chains).toContain('eclipse:mainnet');
    });

    it('should get chain config by ID', () => {
      const config = SolanaSVMAdapter.getChainConfig('sonic:mainnet');
      expect(config).toBeDefined();
      expect(config?.name).toBe('Sonic Mainnet');
      expect(config?.rpcUrl).toContain('sonic');
    });

    it('should switch chains', () => {
      const adapter = new SolanaSVMAdapter('solana:mainnet');
      adapter.switchChain('sonic:mainnet');
      expect(adapter.getChain().id).toBe('sonic:mainnet');
    });

    it('should throw on unsupported chain', () => {
      expect(() => {
        new SolanaSVMAdapter('invalid:chain');
      }).toThrow();
    });
  });

  describe('Cosmos Extended Adapter', () => {
    it('should initialize Cosmos adapter with Cosmos Hub', () => {
      const adapter = new CosmosExtendedAdapter('cosmoshub-4');
      expect(adapter.getChain().chainId).toBe('cosmoshub-4');
      expect(adapter.getChain().chainName).toBe('Cosmos Hub');
    });

    it('should support 15+ Cosmos chains', () => {
      const chains = CosmosExtendedAdapter.getAvailableChains();
      expect(chains.length).toBeGreaterThanOrEqual(15);
      expect(chains).toContain('cosmoshub-4');
      expect(chains).toContain('osmosis-1');
      expect(chains).toContain('celestia');
      expect(chains).toContain('injective-1');
      expect(chains).toContain('dydx-mainnet-1');
    });

    it('should get chain config with proper decimals', () => {
      const config = CosmosExtendedAdapter.getChainConfig('osmosis-1');
      expect(config).toBeDefined();
      expect(config?.decimals).toBe(6);
      expect(config?.prefix).toBe('osmo');
    });

    it('should switch chains and update RPC', () => {
      const adapter = new CosmosExtendedAdapter('cosmoshub-4');
      const oldChain = adapter.getChain();
      adapter.switchChain('osmosis-1');
      const newChain = adapter.getChain();
      expect(newChain.chainId).not.toBe(oldChain.chainId);
    });

    it('should handle different coin types for EVM compatibility', () => {
      const evmChain = CosmosExtendedAdapter.getChainConfig('injective-1');
      const cosmosChain = CosmosExtendedAdapter.getChainConfig('cosmoshub-4');
      expect(evmChain?.coinType).toBe(60);
      expect(cosmosChain?.coinType).toBe(118);
    });
  });

  describe('TON Adapter', () => {
    it('should initialize TON adapter with mainnet', () => {
      const adapter = new TonAdapter('ton:mainnet');
      expect(adapter.getChain().chainId).toBe('ton:mainnet');
      expect(adapter.getChain().name).toBe('TON Mainnet');
    });

    it('should support both mainnet and testnet', () => {
      const chains = TonAdapter.getAvailableChains();
      expect(chains).toContain('ton:mainnet');
      expect(chains).toContain('ton:testnet');
    });

    it('should get TON chain config', () => {
      const config = TonAdapter.getChainConfig('ton:testnet');
      expect(config).toBeDefined();
      expect(config?.network).toBe('testnet');
      expect(config?.rpcUrl).toContain('testnet');
    });

    it('should switch between mainnet and testnet', () => {
      const adapter = new TonAdapter('ton:mainnet');
      const mainnetChain = adapter.getChain();
      adapter.switchChain('ton:testnet');
      const testnetChain = adapter.getChain();
      expect(mainnetChain.network).toBe('mainnet');
      expect(testnetChain.network).toBe('testnet');
    });

    it('should handle wallet account operations', () => {
      const adapter = new TonAdapter();
      const account = {
        address: 'EQDk2VTwic6gQ2GR5rBLW3BX5wQQVffall0KLvfsQNxFD27u',
        publicKey: '0x123',
        mnemonic: ['word1', 'word2'],
      };
      adapter.setWalletAccount(account);
      expect(adapter.getWalletAccount()).toEqual(account);
    });
  });

  describe('NEAR Adapter', () => {
    it('should initialize NEAR adapter with mainnet', () => {
      const adapter = new NearAdapter('near:mainnet');
      expect(adapter.getChain().chainId).toBe('near:mainnet');
      expect(adapter.getChain().name).toBe('NEAR Mainnet');
    });

    it('should support NEAR and Aurora networks', () => {
      const chains = NearAdapter.getAvailableChains();
      expect(chains).toContain('near:mainnet');
      expect(chains).toContain('near:testnet');
      expect(chains).toContain('aurora:mainnet');
      expect(chains).toContain('aurora:testnet');
    });

    it('should get NEAR chain config with correct node URLs', () => {
      const mainnetConfig = NearAdapter.getChainConfig('near:mainnet');
      const auroraConfig = NearAdapter.getChainConfig('aurora:mainnet');

      expect(mainnetConfig).toBeDefined();
      expect(mainnetConfig?.nodeUrl).toContain('mainnet.near.org');
      expect(mainnetConfig?.network).toBe('mainnet');

      expect(auroraConfig).toBeDefined();
      expect(auroraConfig?.nodeUrl).toContain('aurora');
    });

    it('should switch chains and update RPC provider', () => {
      const adapter = new NearAdapter('near:mainnet');
      const oldChain = adapter.getChain();
      adapter.switchChain('near:testnet');
      const newChain = adapter.getChain();
      expect(oldChain.network).toBe('mainnet');
      expect(newChain.network).toBe('testnet');
    });

    it('should handle wallet account operations', () => {
      const adapter = new NearAdapter();
      const account = {
        accountId: 'example.testnet',
        publicKey: '0x456',
      };
      adapter.setWalletAccount(account);
      expect(adapter.getWalletAccount()?.accountId).toBe('example.testnet');
    });
  });

  describe('Cross-Adapter Compatibility', () => {
    it('should maintain separate instances per chain', () => {
      const solanaMainet = new SolanaSVMAdapter('solana:mainnet');
      const solanaSonic = new SolanaSVMAdapter('sonic:mainnet');

      expect(solanaMainet.getChain().id).not.toBe(solanaSonic.getChain().id);
    });

    it('should support wallet account types across adapters', () => {
      const solanaAdapter = new SolanaSVMAdapter();
      const cosmosAdapter = new CosmosExtendedAdapter();
      const tonAdapter = new TonAdapter();
      const nearAdapter = new NearAdapter();

      expect(solanaAdapter).toBeDefined();
      expect(cosmosAdapter).toBeDefined();
      expect(tonAdapter).toBeDefined();
      expect(nearAdapter).toBeDefined();
    });
  });

  describe('Adapter Chain Configuration Validation', () => {
    it('should have valid RPC URLs for all Solana/SVM chains', () => {
      Object.values(SOLANA_SVM_CHAINS).forEach((chain) => {
        expect(chain.rpcUrl).toBeDefined();
        expect(chain.rpcUrl.length).toBeGreaterThan(0);
      });
    });

    it('should have valid RPC and REST endpoints for all Cosmos chains', () => {
      Object.values(COSMOS_CHAINS).forEach((chain) => {
        expect(chain.rpc).toBeDefined();
        expect(chain.rest).toBeDefined();
        expect(chain.chainId).toBeDefined();
      });
    });

    it('should have valid RPC URLs for all TON chains', () => {
      Object.values(TON_CHAINS).forEach((chain) => {
        expect(chain.rpcUrl).toBeDefined();
        expect(chain.network).toMatch(/mainnet|testnet/);
      });
    });

    it('should have valid node URLs for all NEAR chains', () => {
      Object.values(NEAR_CHAINS).forEach((chain) => {
        expect(chain.nodeUrl).toBeDefined();
        expect(chain.network).toMatch(/mainnet|testnet/);
      });
    });
  });
});
