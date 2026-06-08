/**
 * TON Wallet Standard
 * https://ton.org/
 *
 * Enables external dApps to discover and connect to ORYA wallet on TON network
 * Implements TONConnect standard
 */

export const TON_WALLET_NAME = 'ORYA';
export const TON_WALLET_VERSION = '1.0.0';

export interface TonAccount {
  address: string;
  publicKey?: string;
  label?: string;
  chainId?: string;
}

export interface TonChainInfo {
  chainId: string;
  name: string;
  rpcUrl?: string;
  explorerUrl?: string;
}

export interface TonSignMessageInput {
  message: Uint8Array | string;
}

export interface TonSignMessageOutput {
  signature: Uint8Array;
  publicKey: string;
  message: Uint8Array;
}

export interface TonSignTransactionInput {
  txBytes: Uint8Array;
}

export interface TonSignTransactionOutput {
  signature: Uint8Array;
  publicKey: string;
}

export interface TonSendTransactionInput {
  chainId: string;
  signerAddress: string;
  transaction: {
    to: string;
    value: string;
    init?: string;
    data?: string;
  };
  memo?: string;
}

export interface TonSendTransactionOutput {
  transactionHash: string;
  boc?: string;
}

export interface TonWalletCapabilities {
  'ton:signMessage': {
    version: '1.0.0';
  };
  'ton:signTransaction': {
    version: '1.0.0';
  };
  'ton:sendTransaction': {
    version: '1.0.0';
  };
}

export class TonStandardAdapter {
  private accounts: TonAccount[] = [];
  private selectedAccount: TonAccount | null = null;
  private chainInfo: TonChainInfo = {
    chainId: 'mainnet',
    name: 'TON Mainnet',
    rpcUrl: 'https://toncenter.com/api/v2/',
    explorerUrl: 'https://tonviewer.com/',
  };
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private _connecting: boolean = false;

  readonly name = TON_WALLET_NAME;
  readonly version = TON_WALLET_VERSION;
  readonly icon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHJ4PSI2IiBmaWxsPSIjMDAwIi8+PC9zdmc+';

  constructor(accounts: TonAccount[] = [], chain?: TonChainInfo) {
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

  get accountsArray(): readonly TonAccount[] {
    return this.accounts;
  }

  get connected(): boolean {
    return this.selectedAccount !== null;
  }

  get connecting(): boolean {
    return this._connecting;
  }

  get account(): TonAccount | null {
    return this.selectedAccount;
  }

  get chain(): TonChainInfo {
    return this.chainInfo;
  }

  getCapabilities(): TonWalletCapabilities {
    return {
      'ton:signMessage': {
        version: '1.0.0',
      },
      'ton:signTransaction': {
        version: '1.0.0',
      },
      'ton:sendTransaction': {
        version: '1.0.0',
      },
    };
  }

  hasCapability(capability: keyof TonWalletCapabilities): boolean {
    return capability in this.getCapabilities();
  }

  async connect(): Promise<{ publicKey: string; accounts: TonAccount[] }> {
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

  async signMessage(message: Uint8Array | string, _options?: any): Promise<TonSignMessageOutput> {
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
      publicKey: this.selectedAccount.publicKey || '',
      message: messageBytes,
    };
  }

  async signTransaction(
    txBytes: Uint8Array,
    _options?: any
  ): Promise<TonSignTransactionOutput> {
    if (!this.selectedAccount) {
      throw new Error('Wallet not connected');
    }

    this.emit('signTransaction', {
      txBytes,
      account: this.selectedAccount,
    });

    return {
      signature: new Uint8Array(64),
      publicKey: this.selectedAccount.publicKey || '',
    };
  }

  async sendTransaction(
    input: TonSendTransactionInput,
    _options?: any
  ): Promise<TonSendTransactionOutput> {
    if (!this.selectedAccount) {
      throw new Error('Wallet not connected');
    }

    this.emit('sendTransaction', {
      input,
      account: this.selectedAccount,
    });

    const hash = 'ton_' + Math.random().toString(16).slice(2) + Date.now();

    return {
      transactionHash: hash,
    };
  }

  setAccounts(accounts: TonAccount[]): void {
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

  setChain(chain: TonChainInfo): void {
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
