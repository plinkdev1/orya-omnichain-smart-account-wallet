import type { ChainId } from '@orya/shared-types';

export const COSMOS_WALLET_NAME = 'ORYA';
export const COSMOS_WALLET_VERSION = '1.0.0';

export interface CosmosAccount {
  address: string;
  publicKey?: string;
  label?: string;
  chainId?: string;
}

export interface CosmosChainInfo {
  chainId: string;
  chainName: string;
  rpcUrl?: string;
  rest?: string;
  bip44?: {
    coinType: number;
  };
  prefix?: string;
}

export interface CosmosSignMessageInput {
  message: Uint8Array | string;
}

export interface CosmosSignMessageOutput {
  signature: Uint8Array;
  publicKey: string;
  message: Uint8Array;
}

export interface CosmosSignTransactionInput {
  txBytes: Uint8Array;
}

export interface CosmosSignTransactionOutput {
  signature: Uint8Array;
  publicKey: string;
}

export interface CosmosSendTransactionInput {
  chainId: string;
  signerAddress: string;
  aminoMsgs: any[];
  fee: {
    amount: string;
    denom: string;
  };
  memo?: string;
}

export interface CosmosSendTransactionOutput {
  transactionHash: string;
}

export interface CosmosWalletCapabilities {
  'cosmos:signMessage': {
    version: '1.0.0';
  };
  'cosmos:signTransaction': {
    version: '1.0.0';
  };
  'cosmos:sendTransaction': {
    version: '1.0.0';
  };
}

export class CosmosStandardAdapter {
  private accounts: CosmosAccount[] = [];
  private selectedAccount: CosmosAccount | null = null;
  private chainInfo: CosmosChainInfo = {
    chainId: 'cosmoshub-4',
    chainName: 'Cosmos Hub',
    rpcUrl: 'https://rpc.cosmos.directory/cosmoshub',
    rest: 'https://lcd.cosmos.directory/cosmoshub',
    bip44: { coinType: 118 },
    prefix: 'cosmos',
  };
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private _connecting: boolean = false;

  readonly name = COSMOS_WALLET_NAME;
  readonly version = COSMOS_WALLET_VERSION;
  readonly icon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHJ4PSI2IiBmaWxsPSIjMDAwIi8+PC9zdmc+';

  constructor(accounts: CosmosAccount[] = [], chain?: CosmosChainInfo) {
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

  get accountsArray(): readonly CosmosAccount[] {
    return this.accounts;
  }

  get connected(): boolean {
    return this.selectedAccount !== null;
  }

  get connecting(): boolean {
    return this._connecting;
  }

  get account(): CosmosAccount | null {
    return this.selectedAccount;
  }

  get chain(): CosmosChainInfo {
    return this.chainInfo;
  }

  getCapabilities(): CosmosWalletCapabilities {
    return {
      'cosmos:signMessage': {
        version: '1.0.0',
      },
      'cosmos:signTransaction': {
        version: '1.0.0',
      },
      'cosmos:sendTransaction': {
        version: '1.0.0',
      },
    };
  }

  hasCapability(capability: keyof CosmosWalletCapabilities): boolean {
    return capability in this.getCapabilities();
  }

  async connect(): Promise<{ publicKey: string; accounts: CosmosAccount[] }> {
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

  async signMessage(message: Uint8Array | string, _options?: any): Promise<CosmosSignMessageOutput> {
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
  ): Promise<CosmosSignTransactionOutput> {
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
    input: CosmosSendTransactionInput,
    _options?: any
  ): Promise<CosmosSendTransactionOutput> {
    if (!this.selectedAccount) {
      throw new Error('Wallet not connected');
    }

    this.emit('sendTransaction', {
      input,
      account: this.selectedAccount,
    });

    const hash = 'cosmos_' + Math.random().toString(16).slice(2) + Date.now();

    return {
      transactionHash: hash,
    };
  }

  setAccounts(accounts: CosmosAccount[]): void {
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

  setChain(chain: CosmosChainInfo): void {
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
