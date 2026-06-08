/**
 * SUI Wallet Standard
 * https://github.com/mysten/wallet-standard
 *
 * Enables external dApps to discover and connect to ORYA wallet on SUI network
 */

export const SUI_WALLET_NAME = 'ORYA';
export const SUI_WALLET_VERSION = '1.0.0';

export interface SUIWalletCapabilities {
  'sui:signAndExecuteTransactionBlock': any;
  'sui:signTransactionBlock': any;
  'sui:signMessage': any;
}

export class SUIStandardAdapter {
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  readonly name = SUI_WALLET_NAME;
  readonly version = SUI_WALLET_VERSION;
  readonly icon =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHJ4PSI2IiBmaWxsPSIjMDAwIi8+PC9zdmc+';

  private accounts: string[] = [];
  private chainId: string = 'sui:mainnet';

  constructor(accounts: string[] = [], chain: string = 'sui:mainnet') {
    this.accounts = accounts;
    this.chainId = chain;
  }

  get chains(): readonly string[] {
    return [this.chainId];
  }

  get accountsArray(): readonly string[] {
    return this.accounts;
  }

  async connect(): Promise<{ accounts: string[]; chains: readonly string[] }> {
    this.emit('connect', { accounts: this.accounts, chains: this.chains });
    return {
      accounts: this.accounts,
      chains: this.chains,
    };
  }

  async disconnect(): Promise<void> {
    this.emit('disconnect');
    return;
  }

  async signAndExecuteTransactionBlock(
    input: any
  ): Promise<any> {
    const { transactionBlock, options, account } = input;

    this.emit('signAndExecuteTransactionBlock', {
      transactionBlock,
      options,
      account,
    });

    return {
      digest: '0x' + '0'.repeat(64),
      effects: {
        status: { status: 'success' },
      },
      objectChanges: [],
    };
  }

  async signTransactionBlock(
    input: any
  ): Promise<any> {
    const { transactionBlock, account } = input;

    this.emit('signTransactionBlock', {
      transactionBlock,
      account,
    });

    return {
      transactionBlockBytes: '',
      signature: '0x' + '0'.repeat(128),
    };
  }

  async signMessage(input: any): Promise<any> {
    const { message, account } = input;

    this.emit('signMessage', {
      message,
      account,
    });

    return {
      messageBytes: message,
      signature: '0x' + '0'.repeat(128),
    };
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

  private emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach((listener) => listener(...args));
  }
}
