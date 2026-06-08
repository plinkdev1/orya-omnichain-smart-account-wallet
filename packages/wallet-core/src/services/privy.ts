/**
 * Privy SDK Wrapper - Embedded Wallet Management
 * Handles Privy's MPC embedded wallets for SUI and other chains
 * Non-custodial: Key shares never exposed to backend or frontend
 */

export interface PrivyConfig {
  appId: string;
  clientId?: string;
  clientSecret?: string;
  environment?: 'development' | 'production';
  apiUrl?: string;
}

export interface PrivyWallet {
  address: string;
  chainId: string;
  chainType: string;
  publicKey: string;
  walletId: string;
  createdAt: Date;
}

export interface PrivyUser {
  id: string;
  email?: string;
  phone?: string;
  wallets: PrivyWallet[];
  linkedAccounts: any[];
}

export interface PrivySignRequest {
  walletId: string;
  message: string;
  chainType?: string;
}

export interface PrivySignResponse {
  signature: string;
  publicKey: string;
  walletId: string;
}

export interface PrivyWalletResult {
  address: string;
  chainId: string;
  chainType: string;
  walletId: string;
}

export interface PrivyTransactionSignRequest {
  walletId: string;
  transaction: any;
  chainType?: string;
}

export interface PrivyCallbacks {
  onWalletCreated?: (wallet: PrivyWalletResult) => void;
  onUserLoggedIn?: (user: PrivyUser) => void;
  onSigningSuccess?: (signature: PrivySignResponse) => void;
  onSigningError?: (error: Error) => void;
  onConnectionError?: (error: Error) => void;
}

export interface PrivyChainOptimization {
  chainType: string;
  gasOptimization: boolean;
  compressionEnabled: boolean;
  signatureScheme: 'ecdsa' | 'ed25519' | 'schnorr';
  batchSigningSupported: boolean;
}

/**
 * Privy Service Wrapper
 * Manages MPC embedded wallets with non-custodial key management
 */
export class PrivyService {
  private config: PrivyConfig;
  private isInitialized: boolean = false;
  private currentUser: PrivyUser | null = null;
  private callbacks: PrivyCallbacks = {};
  private chainOptimizations: Map<string, PrivyChainOptimization> = new Map();
  private retryAttempts: number = 3;
  private retryDelay: number = 1000;

  constructor(config: PrivyConfig) {
    this.config = config;
    this.initializeChainOptimizations();
  }

  /**
   * Initialize default chain optimizations
   */
  private initializeChainOptimizations(): void {
    this.chainOptimizations.set('ethereum', {
      chainType: 'ethereum',
      gasOptimization: true,
      compressionEnabled: true,
      signatureScheme: 'ecdsa',
      batchSigningSupported: true,
    });

    this.chainOptimizations.set('solana', {
      chainType: 'solana',
      gasOptimization: false,
      compressionEnabled: true,
      signatureScheme: 'ed25519',
      batchSigningSupported: true,
    });

    this.chainOptimizations.set('sui', {
      chainType: 'sui',
      gasOptimization: true,
      compressionEnabled: true,
      signatureScheme: 'ecdsa',
      batchSigningSupported: true,
    });

    this.chainOptimizations.set('polygon', {
      chainType: 'polygon',
      gasOptimization: true,
      compressionEnabled: true,
      signatureScheme: 'ecdsa',
      batchSigningSupported: true,
    });

    this.chainOptimizations.set('arbitrum', {
      chainType: 'arbitrum',
      gasOptimization: true,
      compressionEnabled: true,
      signatureScheme: 'ecdsa',
      batchSigningSupported: true,
    });
  }

  /**
   * Register callbacks for lifecycle events
   */
  registerCallbacks(callbacks: PrivyCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Get chain optimization config
   */
  getChainOptimization(chainType: string): PrivyChainOptimization | undefined {
    return this.chainOptimizations.get(chainType.toLowerCase());
  }

  /**
   * Set custom chain optimization
   */
  setChainOptimization(optimization: PrivyChainOptimization): void {
    this.chainOptimizations.set(optimization.chainType.toLowerCase(), optimization);
  }

  /**
   * Retry logic with exponential backoff
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(
          `[Privy] ${operationName} attempt ${attempt + 1} failed: ${lastError.message}`
        );

        if (attempt < this.retryAttempts - 1) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    const error = lastError || new Error(`${operationName} failed after ${this.retryAttempts} attempts`);
    this.callbacks.onConnectionError?.(error);
    throw error;
  }

  /**
   * Initialize Privy service
   * Sets up configuration for Privy SDK
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      if (!this.config.appId) {
        throw new Error('Privy appId is required');
      }
      // Privy SDK initialization happens via React context (PrivyProvider)
      // This method ensures configuration is ready
      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize Privy: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create embedded wallet for a specific chain
   * Supported chains: ethereum, solana, sui, polygon, arbitrum
   * Includes chain-specific optimizations and error recovery
   */
  async createEmbeddedWallet(
    chainType: 'ethereum' | 'solana' | 'sui' | 'polygon' | 'arbitrum'
  ): Promise<PrivyWalletResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const optimization = this.getChainOptimization(chainType);

    return this.retryWithBackoff(
      async () => {
        const response = await fetch('/api/privy/wallet/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chainType,
            optimization: optimization || undefined,
            timestamp: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to create wallet: ${response.statusText}`);
        }

        const wallet = (await response.json()) as PrivyWalletResult;
        this.callbacks.onWalletCreated?.(wallet);
        return wallet;
      },
      `createEmbeddedWallet[${chainType}]`
    );
  }

  /**
   * Get user's Privy wallets
   * Fetches all linked wallets for current user
   */
  async getUserWallets(): Promise<PrivyWallet[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await fetch('/api/privy/wallet/list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch wallets: ${response.statusText}`);
      }

      const data = await response.json() as { wallets: PrivyWallet[] };
      return data.wallets || [];
    } catch (error) {
      throw new Error(`Failed to fetch Privy wallets: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Sign message with Privy wallet
   * MPC ensures private key never leaves device
   * Includes retry logic and callbacks
   */
  async signMessage(request: PrivySignRequest): Promise<PrivySignResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const chainType = request.chainType || 'ethereum';
    const optimization = this.getChainOptimization(chainType);

    return this.retryWithBackoff(
      async () => {
        const response = await fetch('/api/privy/wallet/sign-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletId: request.walletId,
            message: request.message,
            chainType,
            optimization: optimization || undefined,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to sign message: ${response.statusText}`);
        }

        const result = (await response.json()) as PrivySignResponse;
        this.callbacks.onSigningSuccess?.(result);
        return result;
      },
      `signMessage[${chainType}]`
    ).catch((error) => {
      this.callbacks.onSigningError?.(error as Error);
      throw error;
    });
  }

  /**
   * Sign transaction with Privy wallet
   * MPC ensures private key never leaves device during signing
   * Includes chain-specific optimization and retry logic
   */
  async signTransaction(request: PrivyTransactionSignRequest): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const chainType = request.chainType || 'ethereum';
    const optimization = this.getChainOptimization(chainType);

    return this.retryWithBackoff(
      async () => {
        const response = await fetch('/api/privy/wallet/sign-transaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletId: request.walletId,
            transaction: request.transaction,
            chainType,
            optimization: optimization || undefined,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to sign transaction: ${response.statusText}`);
        }

        const result = (await response.json()) as { signature: string };
        return result.signature;
      },
      `signTransaction[${chainType}]`
    ).catch((error) => {
      this.callbacks.onSigningError?.(error as Error);
      throw error;
    });
  }

  /**
   * Batch sign multiple messages (if chain supports it)
   * Reduces round-trips for multi-sig scenarios
   */
  async batchSignMessages(
    walletId: string,
    messages: string[],
    chainType: 'ethereum' | 'solana' | 'sui' | 'polygon' | 'arbitrum'
  ): Promise<PrivySignResponse[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const optimization = this.getChainOptimization(chainType);

    if (!optimization?.batchSigningSupported) {
      throw new Error(`Batch signing not supported for ${chainType}`);
    }

    return this.retryWithBackoff(
      async () => {
        const response = await fetch('/api/privy/wallet/batch-sign', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletId,
            messages,
            chainType,
            optimization,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to batch sign: ${response.statusText}`);
        }

        const results = (await response.json()) as PrivySignResponse[];
        results.forEach((result) => this.callbacks.onSigningSuccess?.(result));
        return results;
      },
      `batchSignMessages[${chainType}]`
    ).catch((error) => {
      this.callbacks.onSigningError?.(error as Error);
      throw error;
    });
  }

  /**
   * Get current user from Privy
   * Retrieves user info and linked wallets
   */
  async getCurrentUser(): Promise<PrivyUser | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await fetch('/api/privy/user', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          return null; // User not authenticated
        }
        throw new Error(`Failed to fetch user: ${response.statusText}`);
      }

      const user = await response.json() as PrivyUser;
      this.currentUser = user;
      return user;
    } catch (error) {
      throw new Error(`Failed to fetch Privy user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Logout from Privy
   * Clears user session
   */
  async logout(): Promise<void> {
    try {
      await fetch('/api/privy/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      this.currentUser = null;
    } catch (error) {
      // Log error but don't throw - logout should always succeed client-side
      console.error('Logout error:', error);
      this.currentUser = null;
    }
  }

  /**
   * Check if Privy is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get Privy config
   */
  getConfig(): PrivyConfig {
    return { ...this.config };
  }
}

/**
 * Privy Service factory
 */
export function createPrivyService(config: PrivyConfig): PrivyService {
  return new PrivyService(config);
}

/**
 * Privy Service singleton instance holder
 */
let privyServiceInstance: PrivyService | null = null;

export function initializePrivyService(config: PrivyConfig): PrivyService {
  if (!privyServiceInstance) {
    privyServiceInstance = createPrivyService(config);
  }
  return privyServiceInstance;
}

export function getPrivyService(): PrivyService | null {
  return privyServiceInstance;
}