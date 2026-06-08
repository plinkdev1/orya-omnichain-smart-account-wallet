import { IkaClient, getNetworkConfig } from '@ika.xyz/sdk';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

export type IkaNetwork = 'mainnet' | 'testnet' | 'devnet' | 'localnet';

export interface IkaClientConfig {
  network: IkaNetwork;
  suiRpcUrl?: string;
  onError?: (error: Error) => void;
  retryConfig?: {
    maxAttempts: number;
    delayMs: number;
  };
}

export interface IkaNetworkHealth {
  ikaAvailable: boolean;
  suiRpcConnected: boolean;
  latencyMs: number;
  lastCheck: Date;
}

export class IkaClientService {
  private static instance: IkaClientService;
  private client: IkaClient | null = null;
  private suiClient: SuiClient | null = null;
  private network: IkaNetwork;
  private initialized = false;
  private config: IkaClientConfig;
  private health: IkaNetworkHealth | null = null;
  private readonly retryConfig = {
    maxAttempts: 3,
    delayMs: 1000,
  };

  private constructor(config: IkaClientConfig) {
    this.network = config.network;
    this.config = config;
    if (config.retryConfig) {
      this.retryConfig.maxAttempts = config.retryConfig.maxAttempts;
      this.retryConfig.delayMs = config.retryConfig.delayMs;
    }

    const rpcUrl = config.suiRpcUrl || getFullnodeUrl(config.network);
    try {
      this.suiClient = new SuiClient({ url: rpcUrl });
      this.client = new IkaClient({
        suiClient: this.suiClient,
        config: getNetworkConfig(config.network),
      });
      console.log(`IkaClientService: Initialized for network ${config.network}`);
    } catch (error) {
      const message = `Failed to initialize IKA/Sui clients: ${error instanceof Error ? error.message : String(error)}`;
      console.error('IkaClientService:', message);
      if (config.onError) {
        config.onError(new Error(message));
      }
      throw error;
    }
  }

  public static getInstance(config?: IkaClientConfig): IkaClientService {
    if (!IkaClientService.instance) {
      if (!config) {
        throw new Error('IkaClientService: config required for first initialization');
      }
      IkaClientService.instance = new IkaClientService(config);
    }
    return IkaClientService.instance;
  }

  public static resetInstance(): void {
    IkaClientService.instance = undefined as any;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('IkaClientService: already initialized');
      return;
    }

    if (!this.client) {
      throw new Error('IkaClientService: client not initialized');
    }

    try {
      console.log('IkaClientService: initializing...');

      await this.retryAsync(async () => {
        await this.client!.initialize();
      });

      this.initialized = true;
      console.log('IkaClientService: initialized successfully');

      await this.checkHealth();
    } catch (error) {
      const message = `Failed to initialize IKA client: ${error instanceof Error ? error.message : String(error)}`;
      console.error('IkaClientService: initialization failed', message);

      if (this.config.onError) {
        this.config.onError(new Error(message));
      }

      throw error;
    }
  }

  private async retryAsync<T>(fn: () => Promise<T>, attempt = 0): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (attempt < this.retryConfig.maxAttempts - 1) {
        console.warn(`IkaClientService: Retry attempt ${attempt + 1}/${this.retryConfig.maxAttempts}`);
        await new Promise((resolve) => setTimeout(resolve, this.retryConfig.delayMs * (attempt + 1)));
        return this.retryAsync(fn, attempt + 1);
      }
      throw error;
    }
  }

  public async checkHealth(): Promise<IkaNetworkHealth> {
    const startTime = performance.now();

    try {
      const [ikaAvailable, suiRpcConnected] = await Promise.all([
        this.checkIkaAvailability(),
        this.checkSuiRpcConnectivity(),
      ]);

      const latencyMs = Math.round(performance.now() - startTime);

      this.health = {
        ikaAvailable,
        suiRpcConnected,
        latencyMs,
        lastCheck: new Date(),
      };

      return this.health;
    } catch (error) {
      console.warn('IkaClientService: health check failed', error);

      this.health = {
        ikaAvailable: false,
        suiRpcConnected: false,
        latencyMs: Math.round(performance.now() - startTime),
        lastCheck: new Date(),
      };

      return this.health;
    }
  }

  private async checkIkaAvailability(): Promise<boolean> {
    try {
      if (!this.client) return false;

      const networkConfig = getNetworkConfig(this.network);
      return !!networkConfig;
    } catch {
      return false;
    }
  }

  private async checkSuiRpcConnectivity(): Promise<boolean> {
    try {
      if (!this.suiClient) return false;

      const result = await this.suiClient.getRpcApiVersion();
      return !!result;
    } catch {
      return false;
    }
  }

  public getClient(): IkaClient {
    if (!this.client) {
      throw new Error('IkaClientService: client not initialized');
    }

    if (!this.initialized) {
      console.warn('IkaClientService: client not initialized yet, auto-initializing on first use');
    }

    return this.client;
  }

  public getSuiClient(): SuiClient {
    if (!this.suiClient) {
      throw new Error('IkaClientService: Sui client not initialized');
    }

    return this.suiClient;
  }

  public getNetwork(): IkaNetwork {
    return this.network;
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public getHealth(): IkaNetworkHealth | null {
    return this.health;
  }

  public isHealthy(): boolean {
    return this.health?.ikaAvailable === true && this.health?.suiRpcConnected === true;
  }

  public invalidateCache(): void {
    if (this.client) {
      this.client.invalidateCache();
    }
  }

  public getConfig(): IkaClientConfig {
    return { ...this.config };
  }
}

export const getIkaClient = () => {
  return IkaClientService.getInstance().getClient();
};

export const getSuiClient = () => {
  return IkaClientService.getInstance().getSuiClient();
};

export const getIkaClientService = () => {
  return IkaClientService.getInstance();
};
