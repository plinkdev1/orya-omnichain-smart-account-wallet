import { providers } from 'near-api-js';
import type { AccessKeyView } from 'near-api-js/lib/providers/provider';

export interface NearChainConfig {
  chainId: string;
  name: string;
  nodeUrl: string;
  walletUrl?: string;
  helperUrl?: string;
  explorerUrl?: string;
  network: 'mainnet' | 'testnet';
}

export interface NearWalletAccount {
  accountId: string;
  publicKey?: string;
  privateKey?: string;
  chainId?: string;
  label?: string;
}

export const NEAR_CHAINS: Record<string, NearChainConfig> = {
  'near:mainnet': {
    chainId: 'near:mainnet',
    name: 'NEAR Mainnet',
    nodeUrl: 'https://rpc.mainnet.near.org',
    walletUrl: 'https://wallet.mainnet.near.org',
    helperUrl: 'https://helper.mainnet.near.org',
    explorerUrl: 'https://explorer.mainnet.near.org/',
    network: 'mainnet',
  },
  'near:testnet': {
    chainId: 'near:testnet',
    name: 'NEAR Testnet',
    nodeUrl: 'https://rpc.testnet.near.org',
    walletUrl: 'https://wallet.testnet.near.org',
    helperUrl: 'https://helper.testnet.near.org',
    explorerUrl: 'https://explorer.testnet.near.org/',
    network: 'testnet',
  },
  'aurora:mainnet': {
    chainId: 'aurora:mainnet',
    name: 'Aurora Mainnet',
    nodeUrl: 'https://mainnet.aurora.dev',
    explorerUrl: 'https://explorer.aurora.dev/',
    network: 'mainnet',
  },
  'aurora:testnet': {
    chainId: 'aurora:testnet',
    name: 'Aurora Testnet',
    nodeUrl: 'https://testnet.aurora.dev',
    explorerUrl: 'https://explorer.testnet.aurora.dev/',
    network: 'testnet',
  },
};

export class NearAdapter {
  private provider: providers.JsonRpcProvider | null = null;
  private chain: NearChainConfig;
  private account: NearWalletAccount | null = null;

  constructor(chainId: string = 'near:mainnet') {
    const config = NEAR_CHAINS[chainId];
    if (!config) {
      throw new Error(`Unsupported NEAR chain: ${chainId}`);
    }
    this.chain = config;
    this.provider = new providers.JsonRpcProvider({ url: config.nodeUrl });
  }

  async getBalance(accountId: string): Promise<number> {
    try {
      if (!this.provider) {
        this.provider = new providers.JsonRpcProvider({ url: this.chain.nodeUrl });
      }
      const accountState = await this.provider.query({
        request_type: 'view_account',
        account_id: accountId,
        finality: 'final',
      });

      const balance = (accountState as any).amount;
      return parseFloat(balance) / 1e24;
    } catch (error) {
      console.error('Failed to get NEAR balance:', error);
      return 0;
    }
  }

  async getAccessKeys(accountId: string): Promise<AccessKeyView[]> {
    try {
      if (!this.provider) {
        this.provider = new providers.JsonRpcProvider({ url: this.chain.nodeUrl });
      }
      const result = await this.provider.query({
        request_type: 'view_access_key_list',
        account_id: accountId,
        finality: 'final',
      });

      return (result as any).keys || [];
    } catch (error) {
      console.error('Failed to get access keys:', error);
      return [];
    }
  }

  async getAccount(accountId: string): Promise<any> {
    try {
      if (!this.provider) {
        this.provider = new providers.JsonRpcProvider({ url: this.chain.nodeUrl });
      }
      return await this.provider.query({
        request_type: 'view_account',
        account_id: accountId,
        finality: 'final',
      });
    } catch (error) {
      console.error('Failed to get account:', error);
      return null;
    }
  }

  async getTransactionStatus(txHash: string, accountId: string): Promise<'pending' | 'success' | 'failed'> {
    try {
      if (!this.provider) {
        this.provider = new providers.JsonRpcProvider({ url: this.chain.nodeUrl });
      }
      const tx = await this.provider.txStatus(txHash, accountId);
      if ((tx as any).status?.SuccessValue !== undefined) return 'success';
      if ((tx as any).status?.Failure) return 'failed';
      return 'pending';
    } catch (error) {
      console.error('Failed to get transaction status:', error);
      return 'failed';
    }
  }

  async getBlockHeight(): Promise<number> {
    try {
      if (!this.provider) {
        this.provider = new providers.JsonRpcProvider({ url: this.chain.nodeUrl });
      }
      const status = await this.provider.status();
      return status.sync_info.latest_block_height;
    } catch (error) {
      console.error('Failed to get block height:', error);
      return 0;
    }
  }

  async estimateGas(): Promise<number> {
    try {
      return 300000000000000;
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      return 300000000000000;
    }
  }

  setWalletAccount(account: NearWalletAccount): void {
    this.account = account;
  }

  getWalletAccount(): NearWalletAccount | null {
    return this.account;
  }

  getChain(): NearChainConfig {
    return this.chain;
  }

  switchChain(chainId: string): void {
    const config = NEAR_CHAINS[chainId];
    if (!config) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }
    this.chain = config;
    this.provider = new providers.JsonRpcProvider({ url: config.nodeUrl });
  }

  async disconnect(): Promise<void> {
    this.provider = null;
    this.account = null;
  }

  static getAvailableChains(): string[] {
    return Object.keys(NEAR_CHAINS);
  }

  static getChainConfig(chainId: string): NearChainConfig | null {
    return NEAR_CHAINS[chainId] || null;
  }
}

const nearAdapterCache = new Map<string, NearAdapter>();

export function getNearAdapter(chainId: string = 'near:mainnet'): NearAdapter {
  if (!nearAdapterCache.has(chainId)) {
    nearAdapterCache.set(chainId, new NearAdapter(chainId));
  }
  return nearAdapterCache.get(chainId)!;
}

export function clearNearAdapterCache(): void {
  nearAdapterCache.forEach((adapter) => {
    adapter.disconnect().catch(() => {});
  });
  nearAdapterCache.clear();
}
