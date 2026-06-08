import type { Chain } from '@orya/shared-types';
import { PublicKey, Connection, Transaction, VersionedTransaction } from '@solana/web3.js';

export interface SolanaChainConfig {
  id: string;
  name: string;
  rpcUrl: string;
  wsUrl?: string;
  explorerUrl?: string;
}

export interface SolanaWalletAccount {
  address: string;
  publicKey?: string;
  chainId?: string;
  label?: string;
}

export const SOLANA_SVM_CHAINS: Record<string, SolanaChainConfig> = {
  'solana:mainnet': {
    id: 'solana:mainnet',
    name: 'Solana Mainnet',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    wsUrl: 'wss://api.mainnet-beta.solana.com',
    explorerUrl: 'https://explorer.solana.com',
  },
  'solana:testnet': {
    id: 'solana:testnet',
    name: 'Solana Testnet',
    rpcUrl: 'https://api.testnet.solana.com',
    wsUrl: 'wss://api.testnet.solana.com',
    explorerUrl: 'https://explorer.solana.com?cluster=testnet',
  },
  'sonic:mainnet': {
    id: 'sonic:mainnet',
    name: 'Sonic Mainnet',
    rpcUrl: 'https://rpc.sonic.game',
    explorerUrl: 'https://explorer.sonic.game',
  },
  'mantis:mainnet': {
    id: 'mantis:mainnet',
    name: 'Mantis Chain',
    rpcUrl: 'https://rpc.mantis.zone',
    explorerUrl: 'https://explorer.mantis.zone',
  },
  'eclipse:mainnet': {
    id: 'eclipse:mainnet',
    name: 'Eclipse Mainnet',
    rpcUrl: 'https://mainnetbeta-rpc.eclipse.xyz',
    explorerUrl: 'https://explorer.eclipse.xyz',
  },
};

export class SolanaSVMAdapter {
  private connection: Connection;
  private chain: SolanaChainConfig;
  private account: SolanaWalletAccount | null = null;

  constructor(chainId: string = 'solana:mainnet') {
    const config = SOLANA_SVM_CHAINS[chainId];
    if (!config) {
      throw new Error(`Unsupported Solana/SVM chain: ${chainId}`);
    }

    this.chain = config;
    this.connection = new Connection(config.rpcUrl, 'confirmed');
  }

  async getBalance(address: string): Promise<number> {
    try {
      const pubkey = new PublicKey(address);
      const balance = await this.connection.getBalance(pubkey);
      return balance;
    } catch (error) {
      console.error('Failed to get Solana balance:', error);
      return 0;
    }
  }

  async getTokenBalance(address: string, tokenMint: string): Promise<number> {
    try {
      const pubkey = new PublicKey(address);
      const tokenAccounts = await this.connection.getTokenAccountsByOwner(pubkey, {
        mint: new PublicKey(tokenMint),
      });

      if (tokenAccounts.value.length === 0) return 0;

      const accountInfo = await this.connection.getParsedAccountInfo(
        tokenAccounts.value[0].pubkey
      );

      return (accountInfo.value?.data as any)?.parsed?.info?.tokenAmount?.uiAmount || 0;
    } catch (error) {
      console.error('Failed to get token balance:', error);
      return 0;
    }
  }

  async buildTransaction(
    payer: string,
    instructions: any[],
    signers: any[] = []
  ): Promise<Transaction | VersionedTransaction> {
    try {
      const payerPubkey = new PublicKey(payer);
      const recentBlockhash = await this.connection.getLatestBlockhash();

      const tx = new Transaction({
        recentBlockhash: recentBlockhash.blockhash,
        feePayer: payerPubkey,
      });

      tx.add(...instructions);

      if (signers.length > 0) {
        tx.partialSign(...signers);
      }

      return tx;
    } catch (error) {
      throw new Error(`Failed to build Solana transaction: ${error}`);
    }
  }

  async sendTransaction(
    transaction: Transaction | VersionedTransaction,
    signers?: any[]
  ): Promise<string> {
    try {
      let signature: string;
      
      if (transaction instanceof Transaction) {
        if (signers && signers.length > 0) {
          transaction.partialSign(...signers);
          signature = await this.connection.sendTransaction(transaction, signers);
        } else {
          signature = await this.connection.sendTransaction(transaction, []);
        }
      } else {
        signature = await this.connection.sendTransaction(transaction);
      }
      
      await this.connection.confirmTransaction(signature, 'finalized');
      return signature;
    } catch (error) {
      throw new Error(`Failed to send Solana transaction: ${error}`);
    }
  }

  async getTransactionStatus(signature: string): Promise<'pending' | 'success' | 'failed'> {
    try {
      const status = await this.connection.getSignatureStatus(signature);
      if (!status || !status.value) return 'failed';
      if (status.value.err) return 'failed';
      if (status.value.confirmationStatus === 'finalized') return 'success';
      return 'pending';
    } catch (error) {
      console.error('Failed to get transaction status:', error);
      return 'failed';
    }
  }

  async estimateGas(): Promise<number> {
    try {
      const recentBlockhash = await this.connection.getLatestBlockhash();
      return 5000;
    } catch (error) {
      return 5000;
    }
  }

  setWalletAccount(account: SolanaWalletAccount): void {
    this.account = account;
  }

  getWalletAccount(): SolanaWalletAccount | null {
    return this.account;
  }

  getChain(): SolanaChainConfig {
    return this.chain;
  }

  getConnection(): Connection {
    return this.connection;
  }

  switchChain(chainId: string): void {
    const config = SOLANA_SVM_CHAINS[chainId];
    if (!config) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }
    this.chain = config;
    this.connection = new Connection(config.rpcUrl, 'confirmed');
  }

  static getAvailableChains(): string[] {
    return Object.keys(SOLANA_SVM_CHAINS);
  }

  static getChainConfig(chainId: string): SolanaChainConfig | null {
    return SOLANA_SVM_CHAINS[chainId] || null;
  }
}

const solanaAdapterCache = new Map<string, SolanaSVMAdapter>();

export function getSolanaAdapter(chainId: string = 'solana:mainnet'): SolanaSVMAdapter {
  if (!solanaAdapterCache.has(chainId)) {
    solanaAdapterCache.set(chainId, new SolanaSVMAdapter(chainId));
  }
  return solanaAdapterCache.get(chainId)!;
}

export function clearSolanaAdapterCache(): void {
  solanaAdapterCache.clear();
}
