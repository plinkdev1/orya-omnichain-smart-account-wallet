/**
 * Account Abstraction Service - Provider-Agnostic Interface
 * Supports ERC-4337 smart accounts with multiple provider backends
 * Compatible with Alchemy, Biconomy, and OpenZeppelin implementations
 */

import type {
  UserOperation,
  UserOperationWithMetadata,
  SmartAccountConfig,
  SmartAccountType,
  PaymasterConfig,
  PaymasterMode,
  EntryPointConfig,
  UserOpGasEstimate,
  ExecutionData,
  ValidatorConfig,
} from '@orya/shared-types';

export interface AAProviderConfig {
  name: 'alchemy' | 'biconomy' | 'openzeppelin' | 'custom';
  apiKey?: string;
  rpcUrl: string;
  chainId: number;
}

export interface SmartAccountCreationParams {
  ownerAddress: string;
  accountType: SmartAccountType;
  chainId: number;
  factoryAddress?: string;
  saltNonce?: string;
}

export interface UserOpSubmissionResult {
  userOpHash: string;
  bundlerAddress: string;
  chainId: number;
  entryPointAddress: string;
}

/**
 * Provider-agnostic Account Abstraction service interface
 */
export interface IAccountAbstractionProvider {
  /**
   * Initialize the provider with configuration
   */
  initialize(config: AAProviderConfig): Promise<void>;

  /**
   * Check if provider is initialized and connected
   */
  isConnected(): boolean;

  /**
   * Create a new smart account
   */
  createSmartAccount(params: SmartAccountCreationParams): Promise<SmartAccountConfig>;

  /**
   * Get smart account configuration
   */
  getSmartAccountConfig(accountAddress: string): Promise<SmartAccountConfig>;

  /**
   * Create a UserOperation
   */
  createUserOperation(
    accountAddress: string,
    executionData: ExecutionData,
    validators?: ValidatorConfig[]
  ): Promise<UserOperation>;

  /**
   * Estimate gas for a UserOperation
   */
  estimateUserOpGas(userOp: UserOperation): Promise<UserOpGasEstimate>;

  /**
   * Submit a UserOperation to bundler
   */
  submitUserOperation(userOp: UserOperation): Promise<UserOpSubmissionResult>;

  /**
   * Get UserOperation status
   */
  getUserOpStatus(userOpHash: string): Promise<UserOperationWithMetadata>;

  /**
   * Cancel a pending UserOperation
   */
  cancelUserOperation(userOpHash: string): Promise<boolean>;

  /**
   * Get available paymaster configurations
   */
  getPaymasterConfigs(): Promise<PaymasterConfig[]>;

  /**
   * Set paymaster for fee sponsorship
   */
  setPaymaster(paymasterAddress: string, mode: PaymasterMode): Promise<void>;

  /**
   * Get EntryPoint configuration for chain
   */
  getEntryPointConfig(): Promise<EntryPointConfig>;
}

/**
 * Account Abstraction Service
 * Manages provider selection and smart account operations
 */
export class AccountAbstractionService {
  private providers: Map<string, IAccountAbstractionProvider> = new Map();
  private activeProvider: IAccountAbstractionProvider | null = null;
  private defaultProviderName: 'alchemy' | 'biconomy' | 'openzeppelin' = 'alchemy';
  private chainId: number = 1;
  private smartAccounts: Map<string, SmartAccountConfig> = new Map();

  constructor(defaultProvider: 'alchemy' | 'biconomy' | 'openzeppelin' = 'alchemy') {
    this.defaultProviderName = defaultProvider;
  }

  /**
   * Register a provider implementation
   */
  registerProvider(name: string, provider: IAccountAbstractionProvider): void {
    this.providers.set(name, provider);
  }

  /**
   * Initialize with configuration
   */
  async initialize(config: AAProviderConfig): Promise<void> {
    const provider = this.providers.get(config.name);
    if (!provider) {
      throw new Error(`Provider ${config.name} not registered`);
    }

    await provider.initialize(config);
    this.activeProvider = provider;
    this.chainId = config.chainId;
  }

  /**
   * Use a specific provider
   */
  setActiveProvider(name: string): void {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider ${name} not registered`);
    }
    if (!provider.isConnected()) {
      throw new Error(`Provider ${name} not connected`);
    }
    this.activeProvider = provider;
  }

  /**
   * Get active provider
   */
  getActiveProvider(): IAccountAbstractionProvider {
    if (!this.activeProvider) {
      throw new Error('No active AA provider');
    }
    return this.activeProvider;
  }

  /**
   * Create a smart account
   */
  async createSmartAccount(params: SmartAccountCreationParams): Promise<SmartAccountConfig> {
    const provider = this.getActiveProvider();
    const config = await provider.createSmartAccount(params);
    this.smartAccounts.set(config.address, config);
    return config;
  }

  /**
   * Get smart account configuration
   */
  async getSmartAccountConfig(accountAddress: string): Promise<SmartAccountConfig> {
    let config = this.smartAccounts.get(accountAddress);
    if (!config) {
      const provider = this.getActiveProvider();
      config = await provider.getSmartAccountConfig(accountAddress);
      this.smartAccounts.set(accountAddress, config);
    }
    return config;
  }

  /**
   * Create a UserOperation
   */
  async createUserOperation(
    accountAddress: string,
    executionData: ExecutionData,
    validators?: ValidatorConfig[]
  ): Promise<UserOperation> {
    const provider = this.getActiveProvider();
    return provider.createUserOperation(accountAddress, executionData, validators);
  }

  /**
   * Estimate gas for UserOperation
   */
  async estimateUserOpGas(userOp: UserOperation): Promise<UserOpGasEstimate> {
    const provider = this.getActiveProvider();
    return provider.estimateUserOpGas(userOp);
  }

  /**
   * Submit a UserOperation
   */
  async submitUserOperation(userOp: UserOperation): Promise<UserOpSubmissionResult> {
    const provider = this.getActiveProvider();
    return provider.submitUserOperation(userOp);
  }

  /**
   * Get UserOperation status
   */
  async getUserOpStatus(userOpHash: string): Promise<UserOperationWithMetadata> {
    const provider = this.getActiveProvider();
    return provider.getUserOpStatus(userOpHash);
  }

  /**
   * Cancel a pending UserOperation
   */
  async cancelUserOperation(userOpHash: string): Promise<boolean> {
    const provider = this.getActiveProvider();
    return provider.cancelUserOperation(userOpHash);
  }

  /**
   * Get available paymaster configurations
   */
  async getPaymasterConfigs(): Promise<PaymasterConfig[]> {
    const provider = this.getActiveProvider();
    return provider.getPaymasterConfigs();
  }

  /**
   * Set paymaster for fee sponsorship
   */
  async setPaymaster(paymasterAddress: string, mode: PaymasterMode): Promise<void> {
    const provider = this.getActiveProvider();
    return provider.setPaymaster(paymasterAddress, mode);
  }

  /**
   * Get EntryPoint configuration
   */
  async getEntryPointConfig(): Promise<EntryPointConfig> {
    const provider = this.getActiveProvider();
    return provider.getEntryPointConfig();
  }

  /**
   * Get list of registered providers
   */
  getRegisteredProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get list of available providers (connected)
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.entries())
      .filter(([, provider]) => provider.isConnected())
      .map(([name]) => name);
  }
}

export default AccountAbstractionService;
