import type { ChainId } from '@orya/shared-types';

export const CARDANO_WALLET_NAME = 'ORYA';
export const CARDANO_WALLET_VERSION = '1.0.0';

export interface CardanoAccount {
  address: string;
  publicKey?: string;
  label?: string;
}

export interface CardanoChainInfo {
  chainId: 'mainnet' | 'preview' | 'preprod';
  kupoUrl: string;
  blockfrostUrl: string;
  explorerUrl: string;
}

export interface CardanoSignMessageInput {
  message: string | Uint8Array;
}

export interface CardanoSignMessageOutput {
  signature: string;
  publicKey: string;
  address: string;
}

export interface CardanoSignTransactionInput {
  transaction: any;
}

export interface CardanoSignTransactionOutput {
  signature: string;
  signedTransaction: any;
}

export interface CardanoSendTransactionInput {
  toAddress: string;
  amount: string;
  ttl?: number;
}

export interface CardanoSendTransactionOutput {
  transactionHash: string;
}

export interface CardanoWalletCapabilities {
  'cardano:signMessage': {
    version: '1.0.0';
  };
  'cardano:signTransaction': {
    version: '1.0.0';
  };
  'cardano:sendTransaction': {
    version: '1.0.0';
  };
}

export class CardanoStandardAdapter {
  private accounts: CardanoAccount[] = [];
  private selectedAccount: CardanoAccount | null = null;
  private chainInfo: CardanoChainInfo = {
    chainId: 'mainnet',
    kupoUrl: 'https://kupo.blockfrost.io',
    blockfrostUrl: 'https://cardano-mainnet.blockfrost.io/api/v0',
    explorerUrl: 'https://cardanoscan.io',
  };
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private _connecting: boolean = false;

  readonly name = CARDANO_WALLET_NAME;
  readonly version = CARDANO_WALLET_VERSION;

  constructor(accounts: CardanoAccount[] = [], chain?: CardanoChainInfo) {
    this.accounts = accounts;
    if (accounts.length > 0) {
      this.selectedAccount = accounts[0];
    }
    if (chain) {
      this.chainInfo = chain;
    }
  }

  get chains(): readonly ('mainnet' | 'preview' | 'preprod')[] {
    return [this.chainInfo.chainId];
  }

  get accountsArray(): readonly CardanoAccount[] {
    return this.accounts;
  }

  get connected(): boolean {
    return this.selectedAccount !== null;
  }

  get connecting(): boolean {
    return this._connecting;
  }

  get account(): CardanoAccount | null {
    return this.selectedAccount;
  }

  get chain(): CardanoChainInfo {
    return this.chainInfo;
  }

  getCapabilities(): CardanoWalletCapabilities {
    return {
      'cardano:signMessage': {
        version: '1.0.0',
      },
      'cardano:signTransaction': {
        version: '1.0.0',
      },
      'cardano:sendTransaction': {
        version: '1.0.0',
      },
    };
  }

  hasCapability(capability: keyof CardanoWalletCapabilities): boolean {
    return capability in this.getCapabilities();
  }

  async connect(): Promise<{ publicKey: string; accounts: CardanoAccount[] }> {
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

  async signMessage(message: string | Uint8Array): Promise<CardanoSignMessageOutput> {
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

  async signTransaction(txData: any): Promise<CardanoSignTransactionOutput> {
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

  async sendTransaction(input: CardanoSendTransactionInput): Promise<CardanoSendTransactionOutput> {
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

  setAccounts(accounts: CardanoAccount[]): void {
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

  setChain(chain: CardanoChainInfo): void {
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
