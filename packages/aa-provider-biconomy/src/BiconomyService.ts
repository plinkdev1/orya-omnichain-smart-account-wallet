/**
 * Biconomy Main Service Orchestrator
 * Coordinates all Biconomy features: accounts, supertransactions, paymaster, MEE
 */

import type { Address, UserOperation } from '@orya/shared-types';
import { BiconomyConfig, BiconomyConfigOptions, BICONOMY_NETWORKS } from './BiconomyConfig';
import { SupertransactionClient } from './SupertransactionClient';
import { NexusAccountManager } from './NexusAccountManager';
import { PaymasterService } from './PaymasterService';
import { MEEExecutor } from './MEEExecutor';
import {
  BiconomyNotInitializedError,
  BiconomyInvalidConfigError,
  BiconomySmartAccountError,
} from './BiconomyErrors';
import type {
  SupertransactionParams,
  SupertransactionResult,
  MultiChainResult,
  NexusSmartAccount,
} from './BiconomyTypes';

export interface BiconomyServiceConfig {
  apiKey: string;
  apiId?: string;
  bundlerId?: string;
  rpcUrl: string;
  chainId: number;
  paymasterAddress?: string;
}

export interface TransactionOptions {
  usePaymaster?: boolean;
  paymasterAddress?: Address;
  gaslessMode?: boolean;
}

/**
 * Main Biconomy Service
 * Provides unified interface for all Biconomy features
 */
export class BiconomyService {
  private config: BiconomyConfig | null = null;
  private supertxClient: SupertransactionClient | null = null;
  private accountManager: NexusAccountManager | null = null;
  private paymasterService: PaymasterService | null = null;
  private meeExecutor: MEEExecutor | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize Biconomy Service
   */
  async initialize(config: BiconomyServiceConfig): Promise<void> {
    try {
      const configOptions: BiconomyConfigOptions = {
        apiKey: config.apiKey,
        apiId: config.apiId,
        bundlerId: config.bundlerId,
        rpcUrl: config.rpcUrl,
        chainId: config.chainId,
      };

      this.config = new BiconomyConfig(configOptions);
      this.supertxClient = new SupertransactionClient(this.config);
      this.accountManager = new NexusAccountManager(this.config);
      this.paymasterService = new PaymasterService(this.config);
      this.meeExecutor = new MEEExecutor();

      this.isInitialized = true;
    } catch (error) {
      throw new BiconomyInvalidConfigError(
        `Failed to initialize Biconomy service: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.config !== null;
  }

  /**
   * Create a NEXUS smart account
   */
  async createSmartAccount(
    ownerAddress: Address,
    factoryAddress?: Address
  ): Promise<NexusSmartAccount> {
    this.validateInitialized();

    try {
      const factory = factoryAddress || '0x000000000000000000000000000000000000dEaD';
      return await this.accountManager!.createAccount(ownerAddress, factory as Address);
    } catch (error) {
      throw new BiconomySmartAccountError(
        `Failed to create smart account: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Execute a supertransaction
   */
  async executeSupertransaction(
    params: SupertransactionParams,
    options?: TransactionOptions
  ): Promise<SupertransactionResult> {
    this.validateInitialized();

    try {
      // Estimate gas
      const gasEstimate = await this.supertxClient!.estimateGas(params);

      // Apply paymaster if enabled
      if (options?.usePaymaster) {
        const paymasterAddress = options.paymasterAddress || '0x000000000000000000000000000000000000dEaD';
        // Paymaster logic would be applied here
      }

      // Execute transaction
      return await this.supertxClient!.executeSupertransaction(params);
    } catch (error) {
      throw new Error(
        `Supertransaction execution failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Execute a multi-chain supertransaction
   */
  async executeMultiChainSupertransaction(
    params: SupertransactionParams
  ): Promise<MultiChainResult> {
    this.validateInitialized();

    try {
      return await this.supertxClient!.executeMultiChain(params);
    } catch (error) {
      throw new Error(
        `Multi-chain execution failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(txHash: string): Promise<{
    status: 'submitted' | 'confirmed' | 'failed';
    blockNumber?: number;
    confirmations?: number;
  }> {
    this.validateInitialized();

    try {
      return await this.supertxClient!.getTransactionStatus(txHash);
    } catch (error) {
      throw new Error(
        `Failed to get transaction status: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Cancel a pending transaction
   */
  async cancelTransaction(txHash: string): Promise<boolean> {
    this.validateInitialized();

    try {
      return await this.supertxClient!.cancelTransaction(txHash);
    } catch (error) {
      throw new Error(
        `Failed to cancel transaction: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Speed up a pending transaction
   */
  async speedUpTransaction(
    txHash: string,
    maxFeePerGas: string,
    maxPriorityFeePerGas: string
  ): Promise<string> {
    this.validateInitialized();

    try {
      return await this.supertxClient!.speedUpTransaction(
        txHash,
        maxFeePerGas,
        maxPriorityFeePerGas
      );
    } catch (error) {
      throw new Error(
        `Failed to speed up transaction: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get supported chains
   */
  async getSupportedChains(): Promise<
    Array<{ chainId: number; name: string; supported: boolean }>
  > {
    this.validateInitialized();

    try {
      return await this.supertxClient!.getSupportedChains();
    } catch (error) {
      throw new Error(
        `Failed to get supported chains: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get paymaster configurations
   */
  getPaymasterService(): PaymasterService {
    this.validateInitialized();
    return this.paymasterService!;
  }

  /**
   * Get account manager
   */
  getAccountManager(): NexusAccountManager {
    this.validateInitialized();
    return this.accountManager!;
  }

  /**
   * Get MEE executor
   */
  getMEEExecutor(): MEEExecutor {
    this.validateInitialized();
    return this.meeExecutor!;
  }

  /**
   * Get current configuration
   */
  getConfig(): BiconomyConfig {
    this.validateInitialized();
    return this.config!;
  }

  /**
   * Get supported chains info
   */
  getSupportedChainsInfo(): typeof BICONOMY_NETWORKS {
    return BICONOMY_NETWORKS;
  }

  private validateInitialized(): void {
    if (!this.isInitialized || !this.config) {
      throw new BiconomyNotInitializedError('BiconomyService not initialized');
    }
  }
}

export default BiconomyService;
