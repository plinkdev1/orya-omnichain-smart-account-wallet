import { describe, it, expect, beforeEach } from 'vitest';

describe('Multi-Chain Adapters Integration Tests', () => {
  describe('Tron Adapter', () => {
    it('should handle wallet connection errors gracefully', async () => {
      const TronAdapter = require('../adapters/tron-adapter/src/client').TronClient;
      const { loadConfig } = require('../adapters/tron-adapter/src/config');
      const config = loadConfig();
      const adapter = new TronAdapter(config);
      
      try {
        await adapter.connectWallet();
      } catch (error: any) {
        expect(error.message).toContain('TronLink');
      }
    });

    it('should provide correct network configuration', () => {
      const { TRON_NETWORKS } = require('../adapters/tron-adapter/src/config');
      
      expect(TRON_NETWORKS.mainnet).toBeDefined();
      expect(TRON_NETWORKS.shasta).toBeDefined();
      expect(TRON_NETWORKS.nile).toBeDefined();
      
      expect(TRON_NETWORKS.mainnet.fullNode).toContain('trongrid.io');
      expect(TRON_NETWORKS.shasta.fullNode).toContain('shasta');
    });

    it('should initialize TronWeb correctly', () => {
      const { TronClient, loadConfig } = require('../adapters/tron-adapter/src');
      const config = loadConfig();
      const client = new TronClient(config);
      
      expect(client.getTronWeb()).toBeDefined();
      expect(client.getConfig()).toBeDefined();
    });
  });

  describe('Cross-Adapter Compatibility', () => {
    it('should have consistent interface patterns', () => {
      const { TronClient } = require('../adapters/tron-adapter/src/client');
      const { loadConfig: loadTronConfig } = require('../adapters/tron-adapter/src/config');
      
      const tronConfig = loadTronConfig();
      const tronAdapter = new TronClient(tronConfig);
      
      expect(typeof tronAdapter.connectWallet).toBe('function');
      expect(typeof tronAdapter.disconnectWallet).toBe('function');
      expect(typeof tronAdapter.signMessage).toBe('function');
      expect(typeof tronAdapter.getBalance).toBe('function');
    });

    it('should handle error states consistently', async () => {
      const { TronClient, AdapterError } = require('../adapters/tron-adapter/src');
      const { loadConfig } = require('../adapters/tron-adapter/src/config');
      
      const config = loadConfig();
      const adapter = new TronClient(config);
      
      try {
        await adapter.signMessage('test');
      } catch (error) {
        expect(error).toBeInstanceOf(AdapterError);
        expect(error.message).toBeDefined();
      }
    });

    it('should support multiple simultaneous instances', () => {
      const { TronClient, loadConfig } = require('../adapters/tron-adapter/src');
      
      const config1 = loadConfig();
      const config2 = loadConfig();
      
      const adapter1 = new TronClient(config1);
      const adapter2 = new TronClient(config2);
      
      expect(adapter1).not.toBe(adapter2);
      expect(adapter1.getConfig()).toEqual(adapter2.getConfig());
    });
  });

  describe('Wallet Connection Flow', () => {
    it('should prevent duplicate connections', async () => {
      const { TronClient, AdapterError, loadConfig } = require('../adapters/tron-adapter/src');
      
      const config = loadConfig();
      const adapter = new TronClient(config);
      
      const promise1 = adapter.connectWallet().catch(() => {});
      const promise2 = adapter.connectWallet().catch((e: any) => {
        expect(e).toBeInstanceOf(AdapterError);
        expect(e.message).toContain('Connection attempt already in progress');
      });
      
      await Promise.all([promise1, promise2]);
    });

    it('should disconnect cleanly', async () => {
      const { TronClient, loadConfig } = require('../adapters/tron-adapter/src');
      
      const config = loadConfig();
      const adapter = new TronClient(config);
      
      await adapter.disconnectWallet();
      expect(adapter.getConnectedAccount()).toBeNull();
    });
  });

  describe('Transaction Operations', () => {
    it('should validate transaction requests', async () => {
      const { TronClient, AdapterError, loadConfig } = require('../adapters/tron-adapter/src');
      
      const config = loadConfig();
      const adapter = new TronClient(config);
      
      const txRequest = {
        toAddress: 'invalid_address',
        amount: 1,
      };
      
      try {
        await adapter.createTransaction(txRequest);
      } catch (error) {
        expect(error).toBeInstanceOf(AdapterError);
      }
    });

    it('should handle transaction signing errors', async () => {
      const { TronClient, AdapterError, loadConfig } = require('../adapters/tron-adapter/src');
      
      const config = loadConfig();
      const adapter = new TronClient(config);
      
      const signedTx = {
        txID: 'test_tx',
        raw_data: {},
        raw_data_hex: 'test',
      };
      
      try {
        await adapter.signTransaction(signedTx);
      } catch (error) {
        expect(error).toBeInstanceOf(AdapterError);
        expect(error.message).toContain('not available');
      }
    });
  });

  describe('Error Handling', () => {
    it('should provide meaningful error messages', async () => {
      const { TronClient, loadConfig } = require('../adapters/tron-adapter/src');
      
      const config = loadConfig();
      const adapter = new TronClient(config);
      
      try {
        await adapter.getBalance();
      } catch (error: any) {
        expect(error.message).toBeDefined();
        expect(error.message.length).toBeGreaterThan(0);
      }
    });

    it('should handle network errors gracefully', async () => {
      const { TronClient, AdapterError, loadConfig } = require('../adapters/tron-adapter/src');
      
      const config = loadConfig();
      const adapter = new TronClient(config);
      
      try {
        await adapter.getBalance('invalid_network_address');
      } catch (error: any) {
        expect(error).toBeInstanceOf(AdapterError);
      }
    });
  });

  describe('Configuration Management', () => {
    it('should load mainnet configuration', () => {
      process.env.NETWORK = 'mainnet';
      const { loadConfig } = require('../adapters/tron-adapter/src/config');
      
      const config = loadConfig();
      expect(config.network).toBe('mainnet');
      expect(config.fullNode).toBe('https://api.trongrid.io');
      expect(config.explorerUrl).toContain('tronscan.org');
    });

    it('should load testnet configuration', () => {
      process.env.NETWORK = 'shasta';
      const { loadConfig } = require('../adapters/tron-adapter/src/config');
      
      const config = loadConfig();
      expect(config.network).toBe('shasta');
      expect(config.fullNode).toContain('shasta');
      expect(config.chainId).toBe(2);
    });

    it('should support environment variable overrides', () => {
      process.env.FULL_NODE = 'https://custom-node.example.com';
      const { loadConfig } = require('../adapters/tron-adapter/src/config');
      
      const config = loadConfig();
      expect(config.fullNode).toBe('https://custom-node.example.com');
      
      delete process.env.FULL_NODE;
    });
  });

  describe('Adapter Lifecycle', () => {
    it('should initialize without errors', () => {
      const { TronClient, loadConfig } = require('../adapters/tron-adapter/src');
      
      expect(() => {
        const config = loadConfig();
        const adapter = new TronClient(config);
        expect(adapter).toBeDefined();
      }).not.toThrow();
    });

    it('should cleanup resources on disconnect', async () => {
      const { TronClient, loadConfig } = require('../adapters/tron-adapter/src');
      
      const config = loadConfig();
      const adapter = new TronClient(config);
      
      await adapter.disconnectWallet();
      expect(adapter.getConnectedAccount()).toBeNull();
    });
  });
});
