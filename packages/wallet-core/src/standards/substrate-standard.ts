import type { ChainId } from '@orya/shared-types';

export const SUBSTRATE_WALLET_NAME = 'ORYA';
export const SUBSTRATE_WALLET_VERSION = '1.0.0';

export interface SubstrateAccount {
  address: string;
  publicKey?: string;
  label?: string;
  ss58Prefix?: number;
}

export interface SubstrateChainInfo {
  chainId: 'polkadot' | 'kusama' | 'rococo' | 'westend';
  rpcUrl: string;
  ss58Prefix: number;
  explorerUrl: string;
}

export interface SubstrateSignMessageInput {
  message: string | Uint8Array;
}

export interface SubstrateSignMessageOutput {
  signature: string;
  publicKey: string;
  address: string;
}

export interface SubstrateSignTransactionInput {
  transaction: any;
}

export interface SubstrateSignTransactionOutput {
  signature: string;
  signedTransaction: any;
}

export interface SubstrateSendTransactionInput {
  toAddress: string;
  amount: string;
  tip?: string;
  nonce?: number;
}

export interface SubstrateSendTransactionOutput {
  transactionHash: string;
}

export interface SubstrateWalletCapabilities {
  'substrate:signMessage': {
    version: '1.0.0';
  };
  'substrate:signTransaction': {
    version: '1.0.0';
  };
  'substrate:sendTransaction': {
    version: '1.0.0';
  };
}

export class SubstrateStandardAdapter {
  private accounts: SubstrateAccount[] = [];
  private selectedAccount: SubstrateAccount | null = null;
  private chainInfo: SubstrateChainInfo = {
    chainId: 'polkadot',
    rpcUrl: 'wss://rpc.polkadot.io',
    ss58Prefix: 0,
    explorerUrl: 'https://polkadot.subscan.io',
  };
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private _connecting: boolean = false;

  readonly name = SUBSTRATE_WALLET_NAME;
  readonly version = SUBSTRATE_WALLET_VERSION;

  constructor(accounts: SubstrateAccount[] = [], chain?: SubstrateChainInfo) {
    this.accounts = accounts;
    if (accounts.length > 0) {
      this.selectedAccount = accounts[0];
    }
    if (chain) {
      this.chainInfo = chain;
    }
  }

  get chains(): readonly ('polkadot' | 'kusama' | 'rococo' | 'westend')[] {
    return [this.chainInfo.chainId];
  }

  get accountsArray(): readonly SubstrateAccount[] {
    return this.accounts;
  }

  get connected(): boolean {
    return this.selectedAccount !== null;
  }

  get connecting(): boolean {
    return this._connecting;
  }

  get account(): SubstrateAccount | null {
    return this.selectedAccount;
  }

  get chain(): SubstrateChainInfo {
    return this.chainInfo;
  }

  getCapabilities(): SubstrateWalletCapabilities {
    return {
      'substrate:signMessage': {
        version: '1.0.0',
      },
      'substrate:signTransaction': {
        version: '1.0.0',
      },
      'substrate:sendTransaction': {
        version: '1.0.0',
      },
    };
  }

  hasCapability(capability: keyof SubstrateWalletCapabilities): boolean {
    return capability in this.getCapabilities();
  }

  async connect(): Promise<{ publicKey: string; accounts: SubstrateAccount[] }> {
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

  async signMessage(message: string | Uint8Array): Promise<SubstrateSignMessageOutput> {
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

  async signTransaction(txData: any): Promise<SubstrateSignTransactionOutput> {
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

  async sendTransaction(input: SubstrateSendTransactionInput): Promise<SubstrateSendTransactionOutput> {
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

  setAccounts(accounts: SubstrateAccount[]): void {
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

  setChain(chain: SubstrateChainInfo): void {
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
