/**
 * NEAR Wallet Standard
 * https://near.org/
 *
 * Enables external dApps to discover and connect to ORYA wallet on NEAR network
 * Implements NEAR Wallet Selector standard
 */

export const NEAR_WALLET_NAME = 'ORYA';
export const NEAR_WALLET_VERSION = '1.0.0';

export interface NearAccount {
  accountId: string;
  publicKey?: string;
  label?: string;
  chainId?: string;
}

export interface NearChainInfo {
  chainId: string;
  name: string;
  networkId: 'mainnet' | 'testnet';
  rpcUrl?: string;
  explorerUrl?: string;
}

export interface NearSignMessageInput {
  message: Uint8Array | string;
}

export interface NearSignMessageOutput {
  signature: Uint8Array;
  publicKey: string;
  message: Uint8Array;
}

export interface NearSignTransactionInput {
  transaction: {
    signerId: string;
    publicKey: string;
    nonce: number;
    receiverId: string;
    actions: any[];
    blockHash: string;
  };
}

export interface NearSignTransactionOutput {
  signature: Uint8Array;
  publicKey: string;
  hash: string;
}

export interface NearSendTransactionInput {
  chainId: string;
  signerAccountId: string;
  receiverId: string;
  actions: any[];
}

export interface NearSendTransactionOutput {
  transactionHash: string;
  status: 'success' | 'failed' | 'pending';
}

export interface NearWalletCapabilities {
  'near:signMessage': {
    version: '1.0.0';
  };
  'near:signTransaction': {
    version: '1.0.0';
  };
  'near:sendTransaction': {
    version: '1.0.0';
  };
}

export class NearStandardAdapter {
  private accounts: NearAccount[] = [];
  private selectedAccount: NearAccount | null = null;
  private chainInfo: NearChainInfo = {
    chainId: 'mainnet',
    name: 'NEAR Mainnet',
    networkId: 'mainnet',
    rpcUrl: 'https://rpc.mainnet.near.org',
    explorerUrl: 'https://explorer.mainnet.near.org/',
  };
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private _connecting: boolean = false;

  readonly name = NEAR_WALLET_NAME;
  readonly version = NEAR_WALLET_VERSION;
  readonly icon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHJ4PSI2IiBmaWxsPSIjMDAwIi8+PC9zdmc+';

  constructor(accounts: NearAccount[] = [], chain?: NearChainInfo) {
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

  get accountsArray(): readonly NearAccount[] {
    return this.accounts;
  }

  get connected(): boolean {
    return this.selectedAccount !== null;
  }

  get connecting(): boolean {
    return this._connecting;
  }

  get account(): NearAccount | null {
    return this.selectedAccount;
  }

  get chain(): NearChainInfo {
    return this.chainInfo;
  }

  getCapabilities(): NearWalletCapabilities {
    return {
      'near:signMessage': {
        version: '1.0.0',
      },
      'near:signTransaction': {
        version: '1.0.0',
      },
      'near:sendTransaction': {
        version: '1.0.0',
      },
    };
  }

  hasCapability(capability: keyof NearWalletCapabilities): boolean {
    return capability in this.getCapabilities();
  }

  async connect(): Promise<{ accountId: string; accounts: NearAccount[] }> {
    if (this._connecting) {
      throw new Error('Connect attempt already in progress');
    }

    if (!this.selectedAccount) {
      throw new Error('No account available');
    }

    this._connecting = true;

    try {
      this.emit('connect', {
        accountId: this.selectedAccount.accountId,
        accounts: this.accounts,
      });

      this._connecting = false;

      return {
        accountId: this.selectedAccount.accountId,
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

  async signMessage(message: Uint8Array | string, _options?: any): Promise<NearSignMessageOutput> {
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
    transaction: NearSignTransactionInput['transaction'],
    _options?: any
  ): Promise<NearSignTransactionOutput> {
    if (!this.selectedAccount) {
      throw new Error('Wallet not connected');
    }

    this.emit('signTransaction', {
      transaction,
      account: this.selectedAccount,
    });

    return {
      signature: new Uint8Array(64),
      publicKey: this.selectedAccount.publicKey || '',
      hash: 'near_' + Math.random().toString(16).slice(2),
    };
  }

  async sendTransaction(
    input: NearSendTransactionInput,
    _options?: any
  ): Promise<NearSendTransactionOutput> {
    if (!this.selectedAccount) {
      throw new Error('Wallet not connected');
    }

    this.emit('sendTransaction', {
      input,
      account: this.selectedAccount,
    });

    const hash = 'near_' + Math.random().toString(16).slice(2) + Date.now();

    return {
      transactionHash: hash,
      status: 'success',
    };
  }

  setAccounts(accounts: NearAccount[]): void {
    this.accounts = accounts;
    if (accounts.length > 0 && !this.selectedAccount) {
      this.selectedAccount = accounts[0];
    }
    this.emit('accountsChanged', accounts);
  }

  selectAccount(accountId: string): void {
    const account = this.accounts.find((acc) => acc.accountId === accountId);
    if (account) {
      this.selectedAccount = account;
      this.emit('accountChanged', account);
    } else {
      throw new Error(`Account with ID ${accountId} not found`);
    }
  }

  setChain(chain: NearChainInfo): void {
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
