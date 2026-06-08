/**
 * Biconomy Account Abstraction Provider
 * Implements the IAccountAbstractionProvider interface for Biconomy
 * Integrates NEXUS smart accounts, Supertransactions, and Paymaster
 */

import { ethers } from 'ethers';
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
  Address,
  UserOperationStatus,
} from '@orya/shared-types';
import type {
  IAccountAbstractionProvider,
  AAProviderConfig,
  SmartAccountCreationParams,
  UserOpSubmissionResult,
} from './BiconomyTypes';
import { BiconomyConfig, BiconomyConfigOptions } from './BiconomyConfig';
import { SupertransactionClient } from './SupertransactionClient';
import { NexusAccountManager } from './NexusAccountManager';
import {
  BiconomyNotInitializedError,
  BiconomyInvalidConfigError,
  BiconomySmartAccountError,
  BiconomyPaymasterError,
  BiconomyGasEstimationError,
} from './BiconomyErrors';

export interface BiconomyAAProviderConfig extends AAProviderConfig {
  biconomyApiKey: string;
  biconomyApiId?: string;
  biconomyBundlerId?: string;
  paymasterAddress?: string;
}

/**
 * Biconomy Account Abstraction Provider Implementation
 * Supports NEXUS smart accounts, Supertransactions, and gas sponsorship
 */
export class BiconomyAAProvider implements IAccountAbstractionProvider {
  private config: BiconomyConfig | null = null;
  private biconomyConfig: BiconomyAAProviderConfig | null = null;
  private isInitialized: boolean = false;
  private smartAccounts: Map<string, SmartAccountConfig> = new Map();
  private userOperations: Map<string, UserOperationWithMetadata> = new Map();
  private paymasterConfigs: Map<string, PaymasterConfig> = new Map();
  private supertxClient: SupertransactionClient | null = null;
  private accountManager: NexusAccountManager | null = null;
  private provider: ethers.Provider | null = null;

  async initialize(config: AAProviderConfig): Promise<void> {
    const biconomyConfig = config as BiconomyAAProviderConfig;

    if (!biconomyConfig.biconomyApiKey) {
      throw new BiconomyInvalidConfigError('Biconomy API key is required');
    }

    if (!biconomyConfig.rpcUrl) {
      throw new BiconomyInvalidConfigError('RPC URL is required');
    }

    this.biconomyConfig = biconomyConfig;

    try {
      const configOptions: BiconomyConfigOptions = {
        apiKey: biconomyConfig.biconomyApiKey,
        apiId: biconomyConfig.biconomyApiId,
        bundlerId: biconomyConfig.biconomyBundlerId,
        rpcUrl: biconomyConfig.rpcUrl,
        chainId: biconomyConfig.chainId,
      };

      this.config = new BiconomyConfig(configOptions);
      this.provider = new ethers.JsonRpcProvider(biconomyConfig.rpcUrl);
      this.supertxClient = new SupertransactionClient(this.config);
      this.accountManager = new NexusAccountManager(this.config);

      await this.initializePaymasterConfigs();

      this.isInitialized = true;
    } catch (error) {
      throw new BiconomyInvalidConfigError(
        `Failed to initialize Biconomy provider: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  isConnected(): boolean {
    return this.isInitialized && this.config !== null;
  }

  async createSmartAccount(params: SmartAccountCreationParams): Promise<SmartAccountConfig> {
    this.validateInitialized();

    try {
      const factoryAddress = params.factoryAddress || this.getDefaultFactoryAddress();
      const accountAddress = await this.accountManager!.computeAccountAddress(
        params.ownerAddress as Address,
        factoryAddress as Address
      );

      const smartAccountConfig: SmartAccountConfig = {
        id: `sa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as any,
        type: params.accountType,
        address: accountAddress as any,
        chainType: params.chainId as any,
        owners: [params.ownerAddress as Address],
        entryPointAddress: this.config!.getEntryPointAddress() as any,
        factoryAddress: factoryAddress as Address,
        metadata: {
          provider: 'biconomy',
          createdAt: new Date().toISOString(),
        },
      };

      this.smartAccounts.set(smartAccountConfig.address, smartAccountConfig);
      return smartAccountConfig;
    } catch (error) {
      throw new BiconomySmartAccountError(
        `Failed to create smart account: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getSmartAccountConfig(accountAddress: string): Promise<SmartAccountConfig> {
    this.validateInitialized();

    let config = this.smartAccounts.get(accountAddress);

    if (!config) {
      const isDeployed = await this.accountManager!.isAccountDeployed(accountAddress as Address);

      config = {
        id: `sa_${Date.now()}` as any,
        type: 'simple_account' as SmartAccountType,
        address: accountAddress as Address,
        chainType: this.biconomyConfig!.chainId as any,
        owners: [],
        entryPointAddress: this.config!.getEntryPointAddress() as any,
        metadata: {
          deployed: isDeployed,
          provider: 'biconomy',
        },
      };

      this.smartAccounts.set(accountAddress, config);
    }

    return config;
  }

  async createUserOperation(
    accountAddress: string,
    executionData: ExecutionData,
    validators?: ValidatorConfig[]
  ): Promise<UserOperation> {
    this.validateInitialized();

    try {
      const nonce = await this.accountManager!.getAccountNonce(accountAddress as Address);
      const targets = Array.isArray(executionData.target)
        ? executionData.target
        : [executionData.target];
      const values = Array.isArray(executionData.value)
        ? executionData.value
        : [executionData.value || '0'];
      const datas = Array.isArray(executionData.data)
        ? executionData.data
        : [executionData.data || '0x'];

      const callData = this.encodeCallData(targets[0], values[0], datas[0]);

      return {
        sender: accountAddress as Address,
        nonce,
        initCode: '0x',
        callData,
        callGasLimit: '200000',
        verificationGasLimit: '200000',
        preVerificationGas: '50000',
        maxFeePerGas: '1000000000',
        maxPriorityFeePerGas: '1000000000',
        signature: '0x',
      };
    } catch (error) {
      throw new BiconomySmartAccountError(
        `Failed to create UserOperation: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async estimateUserOpGas(userOp: UserOperation): Promise<UserOpGasEstimate> {
    this.validateInitialized();

    try {
      const gasEstimate = await this.supertxClient!.estimateGas({
        operations: [
          {
            chainId: this.config!.chainId,
            target: userOp.sender,
            data: userOp.callData,
          },
        ],
      });

      return {
        preVerificationGas: gasEstimate.preVerificationGas,
        verificationGasLimit: gasEstimate.verificationGasLimit,
        callGasLimit: gasEstimate.callGasLimit,
        maxFeePerGas: gasEstimate.maxFeePerGas,
        maxPriorityFeePerGas: gasEstimate.maxPriorityFeePerGas,
        totalCost: (
          BigInt(gasEstimate.preVerificationGas) +
          BigInt(gasEstimate.verificationGasLimit) +
          BigInt(gasEstimate.callGasLimit)
        ).toString(),
        totalCostUsd: 0,
      };
    } catch (error) {
      throw new BiconomyGasEstimationError(
        `Gas estimation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async submitUserOperation(userOp: UserOperation): Promise<UserOpSubmissionResult> {
    this.validateInitialized();

    try {
      const result = await this.supertxClient!.executeSupertransaction({
        operations: [
          {
            chainId: this.config!.chainId,
            target: userOp.sender,
            data: userOp.callData,
          },
        ],
      });

      const userOpWithMetadata: UserOperationWithMetadata = {
        ...userOp,
        id: `uop_${Date.now()}` as any,
        walletAddress: userOp.sender,
        status: 'submitted' as UserOperationStatus,
        entryPointVersion: 'v0.6' as any,
        chainType: this.biconomyConfig!.chainId as any,
        userOpHash: result.supertxHash as any,
        bundlerAddress: this.config!.networkConfig.bundlerUrl as any,
        createdAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
      };

      this.userOperations.set(result.supertxHash, userOpWithMetadata);

      return {
        userOpHash: result.supertxHash as any,
        bundlerAddress: this.config!.networkConfig.bundlerUrl as any,
        chainId: this.biconomyConfig!.chainId,
        entryPointAddress: this.config!.getEntryPointAddress() as any,
      };
    } catch (error) {
      throw new Error(
        `Failed to submit UserOperation: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getUserOpStatus(userOpHash: string): Promise<UserOperationWithMetadata> {
    this.validateInitialized();

    const userOp = this.userOperations.get(userOpHash);
    if (!userOp) {
      throw new Error(`UserOperation ${userOpHash} not found`);
    }

    try {
      const status = await this.supertxClient!.getTransactionStatus(userOpHash);
      userOp.status = status.status as UserOperationStatus;
      if (status.blockNumber) {
        userOp.blockNumber = status.blockNumber;
        userOp.includedAt = new Date().toISOString();
      }
    } catch (error) {
      console.error('Failed to fetch transaction status:', error);
    }

    return userOp;
  }

  async cancelUserOperation(userOpHash: string): Promise<boolean> {
    this.validateInitialized();

    try {
      return await this.supertxClient!.cancelTransaction(userOpHash);
    } catch (error) {
      console.error('Failed to cancel UserOperation:', error);
      return false;
    }
  }

  async getPaymasterConfigs(): Promise<PaymasterConfig[]> {
    this.validateInitialized();

    return Array.from(this.paymasterConfigs.values());
  }

  async setPaymaster(paymasterAddress: string, mode: PaymasterMode): Promise<void> {
    this.validateInitialized();

    const config: PaymasterConfig = {
      address: paymasterAddress as Address,
      mode,
      chainType: this.biconomyConfig!.chainId as any,
      supportedAccountTypes: [
        'simple_account' as SmartAccountType,
        'multi_owner' as SmartAccountType,
        'factory_managed' as SmartAccountType,
      ],
      isActive: true,
      sponsorshipRules: {
        maxSponsorshipPercentage: 100,
        maxUsdPerTransaction: 50,
        maxDailyBudgetUsd: 5000,
        minUserBalanceUsd: 10,
      },
      metadata: {
        provider: 'biconomy',
      },
    };

    this.paymasterConfigs.set(paymasterAddress, config);
  }

  async getEntryPointConfig(): Promise<EntryPointConfig> {
    this.validateInitialized();

    return {
      address: this.config!.getEntryPointAddress() as any,
      version: 'v0.6' as any,
      chainType: this.biconomyConfig!.chainId as any,
      rpcUrl: this.biconomyConfig!.rpcUrl as any,
      bundlerUrls: [this.config!.getBundlerUrl()],
      maxBatchSize: 30,
      useExternalBundler: true,
    };
  }

  private validateInitialized(): void {
    if (!this.isInitialized || !this.config) {
      throw new BiconomyNotInitializedError('BiconomyAAProvider not initialized');
    }
  }

  private async initializePaymasterConfigs(): Promise<void> {
    const defaultPaymasterAddress = (this.biconomyConfig as any)?.paymasterAddress ||
      '0x000000000000000000000000000000000000dEaD';

    const sponsoredPaymaster: PaymasterConfig = {
      address: defaultPaymasterAddress as Address,
      mode: 'sponsored' as PaymasterMode,
      chainType: this.biconomyConfig!.chainId as any,
      supportedAccountTypes: [
        'simple_account' as SmartAccountType,
        'multi_owner' as SmartAccountType,
      ],
      isActive: true,
      sponsorshipRules: {
        maxSponsorshipPercentage: 100,
        maxUsdPerTransaction: 50,
        maxDailyBudgetUsd: 5000,
        minUserBalanceUsd: 10,
      },
      metadata: {
        provider: 'biconomy',
        mode: 'sponsored',
      },
    };

    this.paymasterConfigs.set(defaultPaymasterAddress, sponsoredPaymaster);
  }

  private encodeCallData(target: Address, value: string, data: string): string {
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    return abiCoder.encode(['address', 'uint256', 'bytes'], [target, value, data]);
  }

  private getDefaultFactoryAddress(): string {
    return '0x000000000000000000000000000000000000dEaD';
  }
}

export default BiconomyAAProvider;
