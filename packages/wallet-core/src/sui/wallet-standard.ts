import type {
  Wallet,
  WalletAccount,
} from '@mysten/wallet-standard';
import {
  OryaSUIWalletAccount,
  SignTransactionBlockInput,
  SignTransactionBlockOutput,
  SignAndExecuteTransactionBlockInput,
  SignAndExecuteTransactionBlockOutput,
  SignMessageInput,
  SignMessageOutput,
  SignPersonalMessageInput,
  SignPersonalMessageOutput,
  GetAccountsOutput,
  GetChainOutput,
  SUIChain,
  SUIWalletConfig,
} from './types';
import { SUI_STANDARD_FEATURES } from './features';
import { WalletEventEmitter } from './events';
import type { PrivyService, PrivyWallet } from '../services/privy';
import type { TatumService } from '../services/tatum';

export class OrysaSUIWalletError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrysaSUIWalletError';
  }
}

export class SUIWalletNotConnectedError extends OrysaSUIWalletError {
  constructor() {
    super('SUI Wallet is not connected');
    this.name = 'SUIWalletNotConnectedError';
  }
}

export class SUITransactionRejectedError extends OrysaSUIWalletError {
  constructor(message: string = 'Transaction was rejected') {
    super(message);
    this.name = 'SUITransactionRejectedError';
  }
}

export class SUISigningError extends OrysaSUIWalletError {
  constructor(message: string = 'Signing failed') {
    super(message);
    this.name = 'SUISigningError';
  }
}

export class OrysaSUIWallet {
  readonly version = '1.0.0' as const;
  readonly name: string = 'Orÿa Wallet';
  readonly icon: string =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjMDAwMDAwIi8+Cjwvc3ZnPg==';
  readonly chains: SUIChain[] = [SUIChain.MAINNET, SUIChain.TESTNET];
  readonly features = SUI_STANDARD_FEATURES;
  readonly accounts: OryaSUIWalletAccount[] = [];

  private eventEmitter: WalletEventEmitter;
  private connected = false;
  private currentChain: SUIChain = SUIChain.MAINNET;
  private privyService?: PrivyService;
  private tatumService?: TatumService;
  private selectedWalletId?: string;
  private privySigningFunction?: (tx: Uint8Array) => Promise<Uint8Array>;
  private executeTransactionFunction?: (tx: any) => Promise<string>;

  constructor(config?: Partial<SUIWalletConfig>) {
    this.eventEmitter = new WalletEventEmitter();

    if (config?.name) this.name = config.name;
    if (config?.icon) this.icon = config.icon;
    if (config?.chains) this.chains = config.chains;
  }

  setPrivyService(service: PrivyService): void {
    this.privyService = service;
  }

  setTatumService(service: TatumService): void {
    this.tatumService = service;
  }

  setPrivySigningFunction(fn: (tx: Uint8Array) => Promise<Uint8Array>): void {
    this.privySigningFunction = fn;
  }

  setExecuteTransactionFunction(fn: (tx: any) => Promise<string>): void {
    this.executeTransactionFunction = fn;
  }

  getSelectedWalletId(): string | undefined {
    return this.selectedWalletId;
  }

  setSelectedWalletId(walletId: string): void {
    this.selectedWalletId = walletId;
  }

  async connect(): Promise<void> {
    try {
      this.connected = true;

      if (this.privyService) {
        const wallets = await this.privyService.getUserWallets();
        const suiWallets = wallets.filter((w) => w.chainType === 'sui' || w.chainId === 'sui');

        for (const wallet of suiWallets) {
          const account: OryaSUIWalletAccount = {
            address: wallet.address,
            publicKey: new Uint8Array(Buffer.from(wallet.publicKey, 'hex')),
            label: `SUI Wallet (${wallet.address.slice(0, 6)}...)`,
            icon: this.icon as any,
            chains: this.chains as any,
            features: this.features as any,
          };

          if (!this.accounts.some((a) => a.address === account.address)) {
            this.accounts.push(account);
          }
        }

        if (suiWallets.length > 0 && !this.selectedWalletId) {
          this.selectedWalletId = suiWallets[0].walletId;
        }
      }

      this.eventEmitter.emitAccountsChanged(this.accounts);
    } catch (error) {
      this.connected = false;
      throw new SUIWalletNotConnectedError();
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.accounts.length = 0;
    this.selectedWalletId = undefined;
    this.eventEmitter.emit('accountsChanged', { accounts: [] });
  }

  async addAccount(account: OryaSUIWalletAccount): Promise<void> {
    if (!this.accounts.some((a) => a.address === account.address)) {
      this.accounts.push(account);
      this.eventEmitter.emitAccountsChanged(this.accounts);
    }
  }

  setCurrentChain(chain: SUIChain): void {
    this.currentChain = chain;
    this.eventEmitter.emitChainChanged(chain);
  }

  on(event: string, listener: (data: any) => void): void {
    this.eventEmitter.on(event as any, listener as any);
  }

  off(event: string, listener: (data: any) => void): void {
    this.eventEmitter.off(event as any, listener as any);
  }

  async 'standard:connect'(input?: any): Promise<any> {
    if (!this.connected) {
      await this.connect();
    }
    return {
      accounts: this.accounts,
      features: this.features,
    };
  }

  async 'standard:disconnect'(): Promise<void> {
    await this.disconnect();
  }

  async 'sui:signTransactionBlock'(
    input: SignTransactionBlockInput,
  ): Promise<SignTransactionBlockOutput> {
    if (!this.connected || this.accounts.length === 0) {
      throw new SUIWalletNotConnectedError();
    }

    if (!this.selectedWalletId) {
      throw new SUISigningError('No wallet selected for signing');
    }

    try {
      let transactionBytes: Uint8Array;
      
      if (input.transactionBlock instanceof Uint8Array) {
        transactionBytes = input.transactionBlock;
      } else if (typeof input.transactionBlock === 'object' && input.transactionBlock !== null && 'build' in input.transactionBlock) {
        transactionBytes = await input.transactionBlock.build();
      } else {
        transactionBytes = input.transactionBlock;
      }

      let signature: Uint8Array;

      if (this.privyService) {
        const signResponse = await this.privyService.signMessage({
          walletId: this.selectedWalletId,
          message: Buffer.from(transactionBytes).toString('hex'),
          chainType: 'sui',
        });
        signature = new Uint8Array(Buffer.from(signResponse.signature, 'hex'));
      } else if (this.privySigningFunction) {
        signature = await this.privySigningFunction(transactionBytes);
      } else {
        throw new SUISigningError('No signing function configured');
      }

      return {
        transactionBlock: transactionBytes,
        signature,
      };
    } catch (error) {
      throw new SUISigningError(`Failed to sign transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async 'sui:signAndExecuteTransactionBlock'(
    input: SignAndExecuteTransactionBlockInput,
  ): Promise<SignAndExecuteTransactionBlockOutput> {
    if (!this.connected || this.accounts.length === 0) {
      throw new SUIWalletNotConnectedError();
    }

    if (!this.selectedWalletId) {
      throw new SUISigningError('No wallet selected for signing');
    }

    try {
      let transactionBytes: Uint8Array;

      if (input.transactionBlock instanceof Uint8Array) {
        transactionBytes = input.transactionBlock;
      } else if (typeof input.transactionBlock === 'object' && input.transactionBlock !== null) {
        if ('build' in input.transactionBlock) {
          transactionBytes = await input.transactionBlock.build();
        } else {
          transactionBytes = input.transactionBlock as Uint8Array;
        }
      } else {
        transactionBytes = input.transactionBlock;
      }

      let signature: Uint8Array;

      if (this.privyService) {
        const signResponse = await this.privyService.signMessage({
          walletId: this.selectedWalletId,
          message: Buffer.from(transactionBytes).toString('hex'),
          chainType: 'sui',
        });
        signature = new Uint8Array(Buffer.from(signResponse.signature, 'hex'));
      } else if (this.privySigningFunction) {
        signature = await this.privySigningFunction(transactionBytes);
      } else {
        throw new SUISigningError('No signing function configured');
      }

      let digest: string;

      if (this.tatumService) {
        const txHex = Buffer.from(transactionBytes).toString('hex');
        const result = await this.tatumService.broadcastTransaction({
          chainId: 'sui',
          txData: txHex,
        });
        digest = result.txId;
      } else if (this.executeTransactionFunction) {
        digest = await this.executeTransactionFunction(input.transactionBlock);
      } else {
        throw new SUITransactionRejectedError('No transaction execution function configured');
      }

      return {
        transactionBlock: transactionBytes,
        signature,
        digest,
      };
    } catch (error) {
      throw new SUITransactionRejectedError(
        `Failed to sign and execute transaction: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async 'sui:signMessage'(input: SignMessageInput): Promise<SignMessageOutput> {
    if (!this.connected || this.accounts.length === 0) {
      throw new SUIWalletNotConnectedError();
    }

    if (!this.selectedWalletId) {
      throw new SUISigningError('No wallet selected for signing');
    }

    try {
      const messageBytes =
        typeof input.message === 'string' ? new TextEncoder().encode(input.message) : input.message;

      let signature: Uint8Array;

      if (this.privyService) {
        const signResponse = await this.privyService.signMessage({
          walletId: this.selectedWalletId,
          message: Buffer.from(messageBytes).toString('hex'),
          chainType: 'sui',
        });
        signature = new Uint8Array(Buffer.from(signResponse.signature, 'hex'));
      } else if (this.privySigningFunction) {
        signature = await this.privySigningFunction(messageBytes);
      } else {
        throw new SUISigningError('No signing function configured');
      }

      return {
        messageBytes,
        signature,
      };
    } catch (error) {
      throw new SUISigningError(`Failed to sign message: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async 'sui:signPersonalMessage'(input: SignPersonalMessageInput): Promise<SignPersonalMessageOutput> {
    if (!this.connected || this.accounts.length === 0) {
      throw new SUIWalletNotConnectedError();
    }

    if (!this.selectedWalletId) {
      throw new SUISigningError('No wallet selected for signing');
    }

    try {
      const messageBytes =
        typeof input.message === 'string' ? new TextEncoder().encode(input.message) : input.message;

      const personalMessagePrefix = new TextEncoder().encode(`\x19Sui Signed Message:\n${messageBytes.length}`);
      const fullMessage = new Uint8Array([...personalMessagePrefix, ...messageBytes]);

      let signature: Uint8Array;

      if (this.privyService) {
        const signResponse = await this.privyService.signMessage({
          walletId: this.selectedWalletId,
          message: Buffer.from(fullMessage).toString('hex'),
          chainType: 'sui',
        });
        signature = new Uint8Array(Buffer.from(signResponse.signature, 'hex'));
      } else if (this.privySigningFunction) {
        signature = await this.privySigningFunction(fullMessage);
      } else {
        throw new SUISigningError('No signing function configured');
      }

      return {
        bytes: messageBytes,
        signature,
      };
    } catch (error) {
      throw new SUISigningError(
        `Failed to sign personal message: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async 'sui:getAccounts'(): Promise<GetAccountsOutput> {
    return {
      accounts: this.accounts,
    };
  }

  async 'sui:getChain'(): Promise<GetChainOutput> {
    return {
      chain: this.currentChain,
    };
  }
}

export function createOrysaSUIWallet(config?: Partial<SUIWalletConfig>): OrysaSUIWallet {
  return new OrysaSUIWallet(config);
}
