/**
 * Solana Wallet Standard
 * https://github.com/solana-labs/wallet-standard
 *
 * Enables external dApps to discover and connect to ORYA wallet on Solana network
 * Implements Solana Wallet Adapter Standard
 */

import type { Transaction, VersionedTransaction } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';

export const SOLANA_WALLET_NAME = 'ORYA';
export const SOLANA_WALLET_VERSION = '1.0.0';

export interface SolanaAccount {
  address: string;
  publicKey?: string;
  label?: string;
  chainId?: string;
}

export interface SolanaChainInfo {
  chainId: string;
  name: string;
  rpcUrl?: string;
}

export interface SolanaSignTransactionInput {
  transaction: Transaction | VersionedTransaction;
  options?: {
    signers?: any[];
    skipPreflight?: boolean;
  };
}

export interface SolanaSignTransactionOutput {
  signature: Uint8Array | string;
  publicKey: PublicKey | string;
}

export interface SolanaSignMessageInput {
  message: Uint8Array | string;
}

export interface SolanaSignMessageOutput {
  signature: Uint8Array;
  publicKey: PublicKey;
  message: Uint8Array;
}

export interface SolanaSignAndSendTransactionInput {
  transaction: Transaction | VersionedTransaction;
  options?: {
    skipPreflight?: boolean;
    preflightCommitment?: string;
    maxRetries?: number;
  };
}

export interface SolanaSignAndSendTransactionOutput {
  signature: string;
  publicKey: PublicKey;
}

export interface SolanaWalletCapabilities {
  'solana:signAndSendTransaction': {
    version: '1.0.0';
  };
  'solana:signTransaction': {
    version: '1.0.0';
  };
  'solana:signMessage': {
    version: '1.0.0';
  };
}

export class SolanaStandardAdapter {
  private accounts: SolanaAccount[] = [];
  private selectedAccount: SolanaAccount | null = null;
  private chainInfo: SolanaChainInfo = { 
    chainId: 'mainnet-beta', 
    name: 'Mainnet Beta',
    rpcUrl: 'https://api.mainnet-beta.solana.com'
  };
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private _connecting: boolean = false;

  readonly name = SOLANA_WALLET_NAME;
  readonly version = SOLANA_WALLET_VERSION;
  readonly icon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHJ4PSI2IiBmaWxsPSIjMDAwIi8+PC9zdmc+';

  constructor(accounts: SolanaAccount[] = [], chain?: SolanaChainInfo) {
    this.accounts = accounts;
    if (accounts.length > 0) {
      this.selectedAccount = accounts[0];
    }
    if (chain) {
      this.chainInfo = chain;
    }
  }

  get chains(): readonly string[] {
    return [this.chainInfo.chainId];
  }

  get accountsArray(): readonly SolanaAccount[] {
    return this.accounts;
  }

  get connected(): boolean {
    return this.selectedAccount !== null;
  }

  get connecting(): boolean {
    return this._connecting;
  }

  get account(): SolanaAccount | null {
    return this.selectedAccount;
  }

  get publicKey(): PublicKey | null {
    if (!this.selectedAccount) return null;
    try {
      return new PublicKey(this.selectedAccount.address);
    } catch {
      return null;
    }
  }

  get chain(): SolanaChainInfo {
    return this.chainInfo;
  }

  getCapabilities(): SolanaWalletCapabilities {
    return {
      'solana:signAndSendTransaction': {
        version: '1.0.0',
      },
      'solana:signTransaction': {
        version: '1.0.0',
      },
      'solana:signMessage': {
        version: '1.0.0',
      },
    };
  }

  hasCapability(capability: keyof SolanaWalletCapabilities): boolean {
    return capability in this.getCapabilities();
  }

  async connect(): Promise<{ publicKey: PublicKey; accounts: SolanaAccount[] }> {
    if (this._connecting) {
      throw new Error('Connect attempt already in progress');
    }

    if (!this.selectedAccount) {
      throw new Error('No account available');
    }

    this._connecting = true;

    try {
      this.emit('connect', {
        publicKey: this.publicKey,
        accounts: this.accounts,
      });

      this._connecting = false;

      return {
        publicKey: this.publicKey!,
        accounts: this.accounts,
      };
    } catch (error) {
      this._connecting = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.selectedAccount = null;
    this.emit('disconnect');
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
    _options?: any
  ): Promise<T> {
    if (!this.selectedAccount) {
      throw new Error('Wallet not connected');
    }

    this.emit('signTransaction', {
      transaction,
      account: this.selectedAccount,
    });

    return transaction;
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[],
    _options?: any
  ): Promise<T[]> {
    if (!this.selectedAccount) {
      throw new Error('Wallet not connected');
    }

    this.emit('signAllTransactions', {
      transactions,
      account: this.selectedAccount,
    });

    return transactions;
  }

  async signMessage(message: Uint8Array | string, _options?: any): Promise<SolanaSignMessageOutput> {
    if (!this.selectedAccount) {
      throw new Error('Wallet not connected');
    }

    const messageBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message;

    this.emit('signMessage', {
      message: messageBytes,
      account: this.selectedAccount,
    });

    return {
      signature: new Uint8Array(64),
      publicKey: this.publicKey!,
      message: messageBytes,
    };
  }

  async signAndSendTransaction(
    transaction: Transaction | VersionedTransaction,
    _connection?: any,
    _options?: any
  ): Promise<SolanaSignAndSendTransactionOutput> {
    if (!this.selectedAccount) {
      throw new Error('Wallet not connected');
    }

    this.emit('signAndSendTransaction', {
      transaction,
      account: this.selectedAccount,
    });

    const signature = 'mock_signature_' + Math.random().toString(16).slice(2) + Date.now();

    return {
      signature,
      publicKey: this.publicKey!,
    };
  }

  setAccounts(accounts: SolanaAccount[]): void {
    this.accounts = accounts;
    if (accounts.length > 0 && !this.selectedAccount) {
      this.selectedAccount = accounts[0];
    }
    this.emit('accountsChanged', accounts);
  }

  selectAccount(address: string): void {
    const account = this.accounts.find((acc) => acc.address === address);
    if (account) {
      this.selectedAccount = account;
      this.emit('accountChanged', account);
    } else {
      throw new Error(`Account with address ${address} not found`);
    }
  }

  setChain(chain: SolanaChainInfo): void {
    this.chainInfo = chain;
    this.emit('chainChanged', chain);
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

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  private emit(event: string, ...args: any[]): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in listener for ${event}:`, error);
        }
      });
    }
  }
}
