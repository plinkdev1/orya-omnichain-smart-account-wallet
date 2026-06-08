/**
 * Aptos Wallet Standard
 * https://aptos.dev/guides/building-your-own-wallet
 *
 * Enables external dApps to discover and connect to ORYA wallet on Aptos
 */

export interface AptosAccount {
  address: string;
  publicKey?: string;
  label?: string;
}

export interface AptosChainInfo {
  chainId: string;
  name: string;
}

export interface AptosSignTransactionInput {
  transaction: any;
  options?: {
    maxGasAmount?: string;
    gasUnitPrice?: string;
  };
}

export interface AptosSignMessageInput {
  message: string;
  nonce?: string;
}

export interface AptosSignMessageOutput {
  signature: string;
  publicKey: string;
  message: string;
}

export class AptosStandardAdapter {
  private accounts: AptosAccount[] = [];
  private selectedAccount: AptosAccount | null = null;
  private chainInfo: AptosChainInfo = { chainId: '1', name: 'mainnet' };
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  constructor(accounts: AptosAccount[] = [], chain?: AptosChainInfo) {
    this.accounts = accounts;
    if (accounts.length > 0) {
      this.selectedAccount = accounts[0];
    }
    if (chain) {
      this.chainInfo = chain;
    }
  }

  get name(): string {
    return 'ORYA';
  }

  get icon(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHJ4PSI2IiBmaWxsPSIjMDAwIi8+PC9zdmc+';
  }

  get connected(): boolean {
    return this.selectedAccount !== null;
  }

  get account(): AptosAccount | null {
    return this.selectedAccount;
  }

  get chain(): AptosChainInfo {
    return this.chainInfo;
  }

  async connect(): Promise<{ accounts: AptosAccount[]; chain: AptosChainInfo }> {
    if (!this.selectedAccount) {
      throw new Error('No account available');
    }

    this.emit('connect', {
      accounts: this.accounts,
      chain: this.chainInfo,
    });

    return {
      accounts: this.accounts,
      chain: this.chainInfo,
    };
  }

  async disconnect(): Promise<void> {
    this.selectedAccount = null;
    this.emit('disconnect');
  }

  async signTransaction(input: AptosSignTransactionInput): Promise<string> {
    if (!this.selectedAccount) {
      throw new Error('Wallet not connected');
    }

    this.emit('signTransaction', input);

    return 'mock_transaction_signature_' + Date.now();
  }

  async signMessage(input: AptosSignMessageInput): Promise<AptosSignMessageOutput> {
    if (!this.selectedAccount) {
      throw new Error('Wallet not connected');
    }

    this.emit('signMessage', input);

    return {
      signature: '0x' + '0'.repeat(128),
      publicKey: this.selectedAccount.publicKey || '0x' + '0'.repeat(64),
      message: input.message,
    };
  }

  async signAndSubmitTransaction(input: any): Promise<{ hash: string }> {
    if (!this.selectedAccount) {
      throw new Error('Wallet not connected');
    }

    this.emit('signAndSubmitTransaction', input);

    return {
      hash: '0x' + Math.random().toString(16).slice(2, 66),
    };
  }

  setAccounts(accounts: AptosAccount[]): void {
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

  setChain(chain: AptosChainInfo): void {
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

  private emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach((listener) => listener(...args));
  }
}
