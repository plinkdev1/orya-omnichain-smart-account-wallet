/**
 * Solana Wallet Adapter
 * Implements the Solana Wallet Adapter Standard
 * https://github.com/solana-labs/wallet-adapter
 */

import type {
  Transaction,
  VersionedTransaction,
  SendOptions,
  RpcResponseAndContext,
  SignatureResult,
} from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';

export interface SolanaSignAndSendTransactionFeature {
  'solana:signAndSendTransaction': {
    version: '1.0.0';
  };
}

export interface SolanaSignTransactionFeature {
  'solana:signTransaction': {
    version: '1.0.0';
  };
}

export interface SolanaSignMessageFeature {
  'solana:signMessage': {
    version: '1.0.0';
  };
}

export type SolanaSignInFeature = {
  'solana:signIn': {
    version: '1.0.0';
  };
};

export type SolanaFeatures = SolanaSignAndSendTransactionFeature &
  SolanaSignTransactionFeature &
  SolanaSignMessageFeature &
  SolanaSignInFeature;

export interface SolanaAccount {
  address: string;
  chainId?: string;
  label?: string;
}

export class SolanaWalletAdapter {
  private accounts: SolanaAccount[] = [];
  private selectedAccount: SolanaAccount | null = null;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  constructor(accounts: SolanaAccount[] = []) {
    this.accounts = accounts;
    if (accounts.length > 0) {
      this.selectedAccount = accounts[0];
    }
  }

  get name(): string {
    return 'ORYA';
  }

  get icon(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHJ4PSI2IiBmaWxsPSIjMDAwIi8+PC9zdmc+';
  }

  get connecting(): boolean {
    return false;
  }

  get connected(): boolean {
    return this.selectedAccount !== null;
  }

  get publicKey(): PublicKey | null {
    if (!this.selectedAccount) return null;
    try {
      return new PublicKey(this.selectedAccount.address);
    } catch {
      return null;
    }
  }

  async connect(): Promise<{ publicKey: PublicKey }> {
    if (!this.selectedAccount) {
      throw new Error('No account selected');
    }

    this.emit('connect', this.publicKey);

    return {
      publicKey: this.publicKey!,
    };
  }

  async disconnect(): Promise<void> {
    this.selectedAccount = null;
    this.emit('disconnect');
  }

  async sendTransaction(
    transaction: Transaction | VersionedTransaction,
    connection: any,
    options?: SendOptions
  ): Promise<string> {
    if (!this.selectedAccount) {
      throw new Error('Wallet not connected');
    }

    this.emit('sendTransaction', transaction);

    return 'mock_signature_' + Date.now();
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> {
    if (!this.selectedAccount) {
      throw new Error('Wallet not connected');
    }

    this.emit('signTransaction', transaction);

    return transaction;
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[]
  ): Promise<T[]> {
    if (!this.selectedAccount) {
      throw new Error('Wallet not connected');
    }

    this.emit('signAllTransactions', transactions);

    return transactions;
  }

  async signMessage(message: Uint8Array): Promise<{ signature: Uint8Array; publicKey: PublicKey }> {
    if (!this.selectedAccount) {
      throw new Error('Wallet not connected');
    }

    this.emit('signMessage', message);

    return {
      signature: new Uint8Array(64),
      publicKey: this.publicKey!,
    };
  }

  setAccounts(accounts: SolanaAccount[]): void {
    this.accounts = accounts;
    if (accounts.length > 0 && !this.selectedAccount) {
      this.selectedAccount = accounts[0];
    }
  }

  selectAccount(address: string): void {
    const account = this.accounts.find((acc) => acc.address === address);
    if (account) {
      this.selectedAccount = account;
    }
  }

  on(event: string, listener: (...args: any[]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  off(event: string, listener: (...args: any[]) => void): void {
    this.listeners.get(event)?.delete(listener);
  }

  private emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach((listener) => listener(...args));
  }
}
