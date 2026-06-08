import type { ChainId } from '@orya/shared-types';

export const TRON_WALLET_NAME = 'ORYA';
export const TRON_WALLET_VERSION = '1.0.0';

export interface TronAccount {
  address: string;
  publicKey?: string;
  label?: string;
}

export interface TronChainInfo {
  chainId: 'mainnet' | 'shasta' | 'nile';
  fullNode: string;
  solidityNode: string;
  eventServer: string;
  explorerUrl: string;
}

export interface TronSignMessageInput {
  message: string | Uint8Array;
}

export interface TronSignMessageOutput {
  signature: string;
  publicKey: string;
  address: string;
}

export interface TronSignTransactionInput {
  transaction: any;
}

export interface TronSignTransactionOutput {
  signature: string;
  signedTransaction: any;
}

export interface TronSendTransactionInput {
  toAddress: string;
  amount: number;
  tokenId?: string;
}

export interface TronSendTransactionOutput {
  transactionHash: string;
}

export interface TronWalletCapabilities {
  'tron:signMessage': {
    version: '1.0.0';
  };
  'tron:signTransaction': {
    version: '1.0.0';
  };
  'tron:sendTransaction': {
    version: '1.0.0';
  };
}

export class TronStandardAdapter {
  private accounts: TronAccount[] = [];
  private selectedAccount: TronAccount | null = null;
  private chainInfo: TronChainInfo = {
    chainId: 'mainnet',
    fullNode: 'https://api.trongrid.io',
    solidityNode: 'https://api.trongrid.io',
    eventServer: 'https://api.trongrid.io',
    explorerUrl: 'https://tronscan.org',
  };
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private _connecting: boolean = false;

  readonly name = TRON_WALLET_NAME;
  readonly version = TRON_WALLET_VERSION;

  constructor(accounts: TronAccount[] = [], chain?: TronChainInfo) {
    this.accounts = accounts;
    if (accounts.length > 0) {
      this.selectedAccount = accounts[0];
    }
    if (chain) {
      this.chainInfo = chain;
    }
  }

  get chains(): readonly ('mainnet' | 'shasta' | 'nile')[] {
    return [this.chainInfo.chainId];
  }

  get accountsArray(): readonly TronAccount[] {
    return this.accounts;
  }

  get connected(): boolean {
    return this.selectedAccount !== null;
  }

  get connecting(): boolean {
    return this._connecting;
  }

  get account(): TronAccount | null {
    return this.selectedAccount;
  }

  get chain(): TronChainInfo {
    return this.chainInfo;
  }

  getCapabilities(): TronWalletCapabilities {
    return {
      'tron:signMessage': {
        version: '1.0.0',
      },
      'tron:signTransaction': {
        version: '1.0.0',
      },
      'tron:sendTransaction': {
        version: '1.0.0',
      },
    };
  }

  hasCapability(capability: keyof TronWalletCapabilities): boolean {
    return capability in this.getCapabilities();
  }

  async connect(): Promise<{ publicKey: string; accounts: TronAccount[] }> {
    if (this._connecting) {
      throw new Error('Connect attempt already in progress');
    }

    if (!this.selectedAccount) {
      throw new Error('No account available');
    }

    this._connecting = true;

    try {
      this.emit('connect', {
        publicKey: this.selectedAccount.publicKey,
        accounts: this.accounts,
      });

      this._connecting = false;

      return {
        publicKey: this.selectedAccount.publicKey || '',
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

  async signMessage(message: string | Uint8Array): Promise<TronSignMessageOutput> {
    if (!this.selectedAccount) {
      throw new Error('Wallet not connected');
    }

    const messageStr = typeof message === 'string' ? message : new TextDecoder().decode(message);

    this.emit('signMessage', {
      message: messageStr,
      account: this.selectedAccount,
    });

    return {
      signature: '',
      publicKey: this.selectedAccount.publicKey || '',
      address: this.selectedAccount.address,
    };
  }

  async signTransaction(txData: any): Promise<TronSignTransactionOutput> {
    if (!this.selectedAccount) {
      throw new Error('Wallet not connected');
    }

    this.emit('signTransaction', {
      transaction: txData,
      account: this.selectedAccount,
    });

    return {
      signature: '',
      signedTransaction: txData,
    };
  }

  async sendTransaction(input: TronSendTransactionInput): Promise<TronSendTransactionOutput> {
    if (!this.selectedAccount) {
      throw new Error('Wallet not connected');
    }

    this.emit('sendTransaction', {
      input,
      account: this.selectedAccount,
    });

    return {
      transactionHash: '',
    };
  }

  setAccounts(accounts: TronAccount[]): void {
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

  setChain(chain: TronChainInfo): void {
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
