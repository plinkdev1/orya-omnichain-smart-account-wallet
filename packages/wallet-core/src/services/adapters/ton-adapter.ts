import { TonClient } from '@ton/ton';
import { mnemonicToPrivateKey, mnemonicToWalletKey } from '@ton/crypto';
import { Address, WalletContractV4 } from '@ton/ton';

export interface TonChainConfig {
  chainId: string;
  name: string;
  rpcUrl: string;
  explorerUrl?: string;
  network: 'mainnet' | 'testnet';
}

export interface TonWalletAccount {
  address: string;
  publicKey?: string;
  mnemonic?: string[];
  chainId?: string;
  label?: string;
}

export const TON_CHAINS: Record<string, TonChainConfig> = {
  'ton:mainnet': {
    chainId: 'ton:mainnet',
    name: 'TON Mainnet',
    rpcUrl: 'https://toncenter.com/api/v2/',
    explorerUrl: 'https://tonviewer.com/',
    network: 'mainnet',
  },
  'ton:testnet': {
    chainId: 'ton:testnet',
    name: 'TON Testnet',
    rpcUrl: 'https://testnet.toncenter.com/api/v2/',
    explorerUrl: 'https://testnet.tonviewer.com/',
    network: 'testnet',
  },
};

export class TonAdapter {
  private client: TonClient | null = null;
  private chain: TonChainConfig;
  private account: TonWalletAccount | null = null;

  constructor(chainId: string = 'ton:mainnet') {
    const config = TON_CHAINS[chainId];
    if (!config) {
      throw new Error(`Unsupported TON chain: ${chainId}`);
    }
    this.chain = config;
  }

  async ensureClient(): Promise<TonClient> {
    if (!this.client) {
      this.client = new TonClient({
        endpoint: this.chain.rpcUrl,
      });
    }
    return this.client;
  }

  async getBalance(address: string): Promise<number> {
    try {
      const client = await this.ensureClient();
      const address_ = Address.parse(address);
      const result = await client.runMethod(address_, 'get_balance');
      const balance = result.stack.readNumber();
      return balance / 1e9;
    } catch (error) {
      console.error('Failed to get TON balance:', error);
      return 0;
    }
  }

  async getTransactionHistory(
    address: string,
    limit: number = 10
  ): Promise<Array<{ hash: string; timestamp: number }>> {
    try {
      const client = await this.ensureClient();
      const address_ = Address.parse(address);
      const transactions = await client.getTransactions(address_, { limit });

      return transactions.map((tx: any) => ({
        hash: (tx.id?.hash?.toString?.('base64')) || (tx.hash?.toString?.('base64')) || '',
        timestamp: tx.utime || tx.now || 0,
      }));
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      return [];
    }
  }

  async sendTransaction(
    sender: string,
    destination: string,
    amount: number,
    payload?: string
  ): Promise<string> {
    try {
      const client = await this.ensureClient();

      if (!this.account?.mnemonic) {
        throw new Error('Wallet account not set or mnemonic not available');
      }

      const key = await mnemonicToWalletKey(this.account.mnemonic);
      const wallet = WalletContractV4.create({ workchain: 0, publicKey: key.publicKey });
      const contract = client.open(wallet);

      const seqno = await contract.getSeqno();

      await contract.sendTransfer({
        seqno,
        secretKey: key.secretKey,
        messages: [
          {
            to: Address.parse(destination),
            value: BigInt(amount * 1e9),
            init: null,
            ...(payload && { body: payload }),
          } as any,
        ],
      });

      return 'tx_' + Math.random().toString(16).slice(2);
    } catch (error) {
      throw new Error(`Failed to send TON transaction: ${error}`);
    }
  }

  async estimateGas(destination: string, amount: number): Promise<number> {
    try {
      return Math.floor(amount * 1e9 * 0.01);
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      return 0;
    }
  }

  async createWallet(mnemonic: string[]): Promise<string> {
    try {
      const key = await mnemonicToWalletKey(mnemonic);
      const wallet = WalletContractV4.create({ workchain: 0, publicKey: key.publicKey });
      return wallet.address.toString();
    } catch (error) {
      throw new Error(`Failed to create wallet: ${error}`);
    }
  }

  setWalletAccount(account: TonWalletAccount): void {
    this.account = account;
  }

  getWalletAccount(): TonWalletAccount | null {
    return this.account;
  }

  getChain(): TonChainConfig {
    return this.chain;
  }

  switchChain(chainId: string): void {
    const config = TON_CHAINS[chainId];
    if (!config) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }
    this.chain = config;
    this.client = null;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.client = null;
    }
    this.account = null;
  }

  static getAvailableChains(): string[] {
    return Object.keys(TON_CHAINS);
  }

  static getChainConfig(chainId: string): TonChainConfig | null {
    return TON_CHAINS[chainId] || null;
  }
}

const tonAdapterCache = new Map<string, TonAdapter>();

export function getTonAdapter(chainId: string = 'ton:mainnet'): TonAdapter {
  if (!tonAdapterCache.has(chainId)) {
    tonAdapterCache.set(chainId, new TonAdapter(chainId));
  }
  return tonAdapterCache.get(chainId)!;
}

export function clearTonAdapterCache(): void {
  tonAdapterCache.forEach((adapter) => {
    adapter.disconnect().catch(() => {});
  });
  tonAdapterCache.clear();
}
