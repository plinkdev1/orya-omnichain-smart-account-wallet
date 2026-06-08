import { IkaClient } from '@ika.xyz/sdk';
import { SuiClient } from '@mysten/sui/client';
import { UserKeysService, generateSecureRandomSeed } from './user-keys.service';
import { KeyStorageService } from './key-storage.service';
import { DWalletCreationService, CreateDWalletParams } from './dwallet-creation.service';
import { PresignService, CreatePresignParams } from './presign.service';
import { SigningService, SignMessageParams } from './signing.service';
import { IkaClientService } from './ika-client.service';

export interface IkaSdkConfig {
  network: 'testnet' | 'mainnet' | 'devnet' | 'localnet';
  suiRpcUrl?: string;
  userId: string;
  userPassword?: string;
  autoInitialize?: boolean;
}

export interface DWalletCreationFlow {
  dwalletId: string;
  dwalletCapId: string;
  address: string;
  encryptedUserShareId: string;
  publicOutput: Uint8Array;
  timestamp: Date;
}

export interface ZeroTrustWalletState {
  isInitialized: boolean;
  userKeysReady: boolean;
  dWalletCreated: boolean;
  dWallet?: DWalletCreationFlow;
  encryptionKeyRegistered: boolean;
  lastUpdated: Date;
}

export interface SigningContext {
  dWalletId: string;
  dWalletCapId: string;
  presignId?: string;
  presignCapId?: string;
  encryptedUserShareId: string;
}

export class IkaSdkWrapper {
  private config: IkaSdkConfig;
  private ikaClient: IkaClient;
  private suiClient: SuiClient;
  private userKeysService: UserKeysService;
  private keyStorageService: KeyStorageService;
  private dWalletService: DWalletCreationService;
  private presignService: PresignService;
  private signingService: SigningService;
  private state: ZeroTrustWalletState;
  private ikaCoinId: string = '';

  constructor(config: IkaSdkConfig) {
    this.config = config;

    const ikaClientService = IkaClientService.getInstance({
      network: config.network,
      suiRpcUrl: config.suiRpcUrl,
    });

    this.ikaClient = ikaClientService.getClient();
    this.suiClient = ikaClientService.getSuiClient();

    this.userKeysService = new UserKeysService();
    this.keyStorageService = new KeyStorageService();
    this.dWalletService = new DWalletCreationService(this.ikaClient, this.suiClient);
    this.presignService = new PresignService(this.ikaClient, this.suiClient);
    this.signingService = new SigningService(this.ikaClient, this.suiClient);

    this.state = {
      isInitialized: false,
      userKeysReady: false,
      dWalletCreated: false,
      encryptionKeyRegistered: false,
      lastUpdated: new Date(),
    };

    if (config.autoInitialize) {
      this.initialize().catch(console.error);
    }
  }

  public async initialize(): Promise<void> {
    try {
      console.log('IkaSdkWrapper: Initializing...');

      const ikaClientService = IkaClientService.getInstance();
      await ikaClientService.initialize();

      const health = await ikaClientService.checkHealth();
      console.log('Network health:', health);

      if (!health.ikaAvailable || !health.suiRpcConnected) {
        throw new Error('Network health check failed: IKA or Sui RPC unavailable');
      }

      console.log('IkaSdkWrapper: Initialization complete');
      this.updateState({ isInitialized: true });
    } catch (error) {
      const message = `Initialization failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error('IkaSdkWrapper:', message);
      throw error;
    }
  }

  public async initializeUserKeys(seed?: Uint8Array): Promise<{ suiAddress: string; publicKey: string }> {
    try {
      console.log('IkaSdkWrapper: Initializing user keys...');

      const keysSeed = seed || generateSecureRandomSeed();
      await this.userKeysService.initializeFromSeed(keysSeed);

      const suiAddress = this.userKeysService.getSuiAddress();
      const publicKeyBytes = this.userKeysService.getPublicKeyBytes();
      const publicKey = Buffer.from(publicKeyBytes).toString('hex');

      console.log(`User address: ${suiAddress}`);
      console.log(`User public key: ${publicKey}`);

      this.updateState({ userKeysReady: true });

      return { suiAddress, publicKey };
    } catch (error) {
      const message = `Failed to initialize user keys: ${error instanceof Error ? error.message : String(error)}`;
      console.error('IkaSdkWrapper:', message);
      throw error;
    }
  }

  public async storeUserKeys(password?: string): Promise<void> {
    try {
      if (!this.userKeysService.isInitialized()) {
        throw new Error('User keys not initialized. Call initializeUserKeys first.');
      }

      const pwd = password || this.config.userPassword;
      if (!pwd) {
        throw new Error('Password required to store keys');
      }

      const serialized = this.userKeysService.serializeKeys();
      await this.keyStorageService.storeKeys(serialized, pwd);

      console.log('IkaSdkWrapper: Keys stored securely');
    } catch (error) {
      const message = `Failed to store keys: ${error instanceof Error ? error.message : String(error)}`;
      console.error('IkaSdkWrapper:', message);
      throw error;
    }
  }

  public async restoreUserKeys(password?: string): Promise<void> {
    try {
      const pwd = password || this.config.userPassword;
      if (!pwd) {
        throw new Error('Password required to restore keys');
      }

      const encrypted = await this.keyStorageService.retrieveKeys(pwd);
      if (!encrypted) {
        throw new Error('No stored keys found');
      }

      await this.userKeysService.initializeFromBytes(encrypted);

      console.log('IkaSdkWrapper: Keys restored successfully');
      this.updateState({ userKeysReady: true });
    } catch (error) {
      const message = `Failed to restore keys: ${error instanceof Error ? error.message : String(error)}`;
      console.error('IkaSdkWrapper:', message);
      throw error;
    }
  }

  public async hasStoredKeys(): Promise<boolean> {
    return this.keyStorageService.hasStoredKeys();
  }

  public async createZeroTrustDWallet(ikaCoinId: string): Promise<DWalletCreationFlow> {
    try {
      if (!this.userKeysService.isInitialized()) {
        throw new Error('User keys not initialized');
      }

      if (!this.state.isInitialized) {
        await this.initialize();
      }

      console.log('IkaSdkWrapper: Starting DWallet creation (4-step DKG flow)...');

      const userKeys = this.userKeysService.getKeys();

      const result = await this.dWalletService.createZeroTrustDWallet({
        userId: this.config.userId,
        userKeys,
        ikaCoinId,
        onProgress: (progress) => {
          console.log(`DKG Step ${progress.step}/4: ${progress.message}`);
          if (progress.transactionDigest) {
            console.log(`  Transaction: ${progress.transactionDigest}`);
          }
        },
      });

      const dWalletFlow: DWalletCreationFlow = {
        dwalletId: result.dwalletId,
        dwalletCapId: result.dwalletCapId,
        address: result.address,
        encryptedUserShareId: result.encryptedUserShareId,
        publicOutput: result.publicOutput,
        timestamp: new Date(),
      };

      this.ikaCoinId = ikaCoinId;
      this.updateState({
        dWalletCreated: true,
        dWallet: dWalletFlow,
        encryptionKeyRegistered: true,
      });

      console.log('IkaSdkWrapper: DWallet creation successful');
      console.log(`  dWallet ID: ${result.dwalletId}`);
      console.log(`  Address: ${result.address}`);

      return dWalletFlow;
    } catch (error) {
      const message = `DWallet creation failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error('IkaSdkWrapper:', message);
      throw error;
    }
  }

  public async createPresignCapability(context: SigningContext): Promise<{ presignId: string; presignCapId: string }> {
    try {
      if (!this.userKeysService.isInitialized()) {
        throw new Error('User keys not initialized');
      }

      console.log('IkaSdkWrapper: Creating presign capability...');

      const userKeys = this.userKeysService.getKeys();

      const result = await this.presignService.createPresign({
        dWalletId: context.dWalletId,
        userKeys,
        ikaCoinId: this.ikaCoinId || '',
      });

      console.log(`Presign created: ${result.presignId}`);

      await this.presignService.waitForPresignCompletion(result.presignId);

      console.log('IkaSdkWrapper: Presign ready for signing');

      return {
        presignId: result.presignId,
        presignCapId: result.presignCapId,
      };
    } catch (error) {
      const message = `Presign creation failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error('IkaSdkWrapper:', message);
      throw error;
    }
  }

  public async signMessage(
    message: Uint8Array,
    context: SigningContext & { presignId: string; presignCapId: string }
  ): Promise<{ signature: Uint8Array; transactionDigest: string }> {
    try {
      if (!this.userKeysService.isInitialized()) {
        throw new Error('User keys not initialized');
      }

      console.log('IkaSdkWrapper: Signing message with zero-trust dWallet...');

      const userKeys = this.userKeysService.getKeys();

      const result = await this.signingService.signMessage({
        dWalletId: context.dWalletId,
        dWalletCapId: context.dWalletCapId,
        message,
        presignId: context.presignId,
        encryptedUserShareId: context.encryptedUserShareId,
        userKeys,
        ikaCoinId: this.ikaCoinId || '',
      });

      console.log(`Signature: ${Buffer.from(result.signature).toString('hex').substring(0, 32)}...`);
      console.log(`Transaction: ${result.transactionDigest}`);

      return {
        signature: result.signature,
        transactionDigest: result.transactionDigest,
      };
    } catch (error) {
      const message = `Message signing failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error('IkaSdkWrapper:', message);
      throw error;
    }
  }

  public async signTransaction(
    transactionData: Uint8Array,
    context: SigningContext & { presignId: string; presignCapId: string }
  ): Promise<{ signature: Uint8Array; transactionDigest: string }> {
    try {
      if (!this.userKeysService.isInitialized()) {
        throw new Error('User keys not initialized');
      }

      console.log('IkaSdkWrapper: Signing transaction with zero-trust dWallet...');

      const userKeys = this.userKeysService.getKeys();

      const result = await this.signingService.signTransaction({
        dWalletId: context.dWalletId,
        dWalletCapId: context.dWalletCapId,
        transactionData,
        presignId: context.presignId,
        encryptedUserShareId: context.encryptedUserShareId,
        userKeys,
        ikaCoinId: this.ikaCoinId || '',
      });

      console.log('IkaSdkWrapper: Transaction signed successfully');

      return {
        signature: result.signature,
        transactionDigest: result.transactionDigest,
      };
    } catch (error) {
      const message = `Transaction signing failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error('IkaSdkWrapper:', message);
      throw error;
    }
  }

  public async checkWalletHealth(): Promise<{ healthy: boolean; reason?: string }> {
    try {
      const ikaClientService = IkaClientService.getInstance();
      const health = await ikaClientService.checkHealth();

      const isHealthy = health.ikaAvailable && health.suiRpcConnected;

      return {
        healthy: isHealthy,
        reason: !isHealthy ? `IKA: ${health.ikaAvailable}, Sui RPC: ${health.suiRpcConnected}` : undefined,
      };
    } catch (error) {
      return {
        healthy: false,
        reason: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public getState(): ZeroTrustWalletState {
    return { ...this.state };
  }

  public getSuiAddress(): string {
    if (!this.userKeysService.isInitialized()) {
      throw new Error('User keys not initialized');
    }

    return this.userKeysService.getSuiAddress();
  }

  public getPublicKey(): string {
    if (!this.userKeysService.isInitialized()) {
      throw new Error('User keys not initialized');
    }

    return Buffer.from(this.userKeysService.getPublicKeyBytes()).toString('hex');
  }

  public getDWallet(): DWalletCreationFlow | undefined {
    return this.state.dWallet;
  }

  public clearKeys(): void {
    this.userKeysService.clear();
    this.keyStorageService.clearKeys();
    this.updateState({ userKeysReady: false, dWalletCreated: false });
  }

  private updateState(updates: Partial<ZeroTrustWalletState>): void {
    this.state = {
      ...this.state,
      ...updates,
      lastUpdated: new Date(),
    };
  }
}

export async function initializeIkaSdk(config: IkaSdkConfig): Promise<IkaSdkWrapper> {
  const wrapper = new IkaSdkWrapper(config);

  if (config.autoInitialize !== false) {
    await wrapper.initialize();
  }

  return wrapper;
}
