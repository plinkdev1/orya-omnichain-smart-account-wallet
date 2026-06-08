import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TronClient, Account, TransactionRequest, SignedTransaction, loadConfig, AdapterError } from '../src';

describe('TronClient', () => {
  let client: TronClient;

  beforeEach(() => {
    const config = loadConfig();
    client = new TronClient(config);
  });

  describe('Configuration', () => {
    it('should load config correctly', () => {
      const config = loadConfig();
      expect(config).toBeDefined();
      expect(config.network).toBe('mainnet');
      expect(config.fullNode).toBe('https://api.trongrid.io');
      expect(config.chainId).toBe(1);
    });

    it('should initialize with correct network', () => {
      const config = loadConfig();
      expect(config.solidityNode).toBeDefined();
      expect(config.eventServer).toBeDefined();
      expect(config.explorerUrl).toBe('https://tronscan.org');
    });
  });

  describe('Client Initialization', () => {
    it('should create TronClient instance', () => {
      expect(client).toBeDefined();
      expect(client.getTronWeb()).toBeDefined();
    });

    it('should have correct config', () => {
      const config = client.getConfig();
      expect(config).toBeDefined();
      expect(config.fullNode).toBeDefined();
    });
  });

  describe('Wallet Connection', () => {
    it('should throw error when TronLink not available', async () => {
      const result = client.connectWallet();
      await expect(result).rejects.toThrow(AdapterError);
    });

    it('should initially have no connected account', () => {
      const account = client.getConnectedAccount();
      expect(account).toBeNull();
    });

    it('should return null account after disconnect', async () => {
      await client.disconnectWallet();
      const account = client.getConnectedAccount();
      expect(account).toBeNull();
    });
  });

  describe('Account Management', () => {
    it('should throw error when getting balance without connected wallet', async () => {
      const result = client.getBalance();
      await expect(result).rejects.toThrow(AdapterError);
    });

    it('should throw error when getting token balance without connected wallet', async () => {
      const result = client.getTokenBalance('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t');
      await expect(result).rejects.toThrow(AdapterError);
    });
  });

  describe('Transaction Creation', () => {
    it('should throw error when creating transaction without connected wallet', async () => {
      const request: TransactionRequest = {
        toAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        amount: 1,
      };

      const result = client.createTransaction(request);
      await expect(result).rejects.toThrow(AdapterError);
    });
  });

  describe('Message Signing', () => {
    it('should throw error when signing message without connected wallet', async () => {
      const result = client.signMessage('test message');
      await expect(result).rejects.toThrow(AdapterError);
    });
  });

  describe('Transaction Signing', () => {
    it('should throw error when signing transaction without connected wallet', async () => {
      const tx: SignedTransaction = {
        txID: 'test',
        raw_data: {},
        raw_data_hex: 'test',
      };

      const result = client.signTransaction(tx);
      await expect(result).rejects.toThrow(AdapterError);
    });
  });

  describe('Error Handling', () => {
    it('should throw AdapterError with meaningful message', async () => {
      try {
        await client.getBalance();
      } catch (error) {
        expect(error).toBeInstanceOf(AdapterError);
        expect((error as AdapterError).message).toContain('No address provided');
      }
    });

    it('should prevent multiple simultaneous connections', async () => {
      const connectPromise1 = client.connectWallet().catch(() => {});
      const connectPromise2 = client.connectWallet().catch((e) => {
        expect(e).toBeInstanceOf(AdapterError);
        expect(e.message).toContain('Connection attempt already in progress');
      });

      await Promise.all([connectPromise1, connectPromise2]);
    });
  });

  describe('Network Configuration', () => {
    it('should support mainnet', () => {
      process.env.NETWORK = 'mainnet';
      const config = loadConfig();
      expect(config.network).toBe('mainnet');
      expect(config.fullNode).toBe('https://api.trongrid.io');
    });

    it('should support shasta testnet', () => {
      process.env.NETWORK = 'shasta';
      const config = loadConfig();
      expect(config.network).toBe('shasta');
      expect(config.fullNode).toBe('https://api.shasta.trongrid.io');
      expect(config.chainId).toBe(2);
    });

    it('should support nile testnet', () => {
      process.env.NETWORK = 'nile';
      const config = loadConfig();
      expect(config.network).toBe('nile');
      expect(config.fullNode).toBe('https://api.nileex.cn');
      expect(config.chainId).toBe(3);
    });

    it('should default to mainnet if invalid network', () => {
      process.env.NETWORK = 'invalid';
      const config = loadConfig();
      expect(config.network).toBe('invalid');
      expect(config.fullNode).toBe('https://api.trongrid.io');
    });
  });

  describe('TronWeb Instance', () => {
    it('should provide TronWeb instance', () => {
      const tronweb = client.getTronWeb();
      expect(tronweb).toBeDefined();
      expect(typeof tronweb).toBe('object');
    });
  });
});
