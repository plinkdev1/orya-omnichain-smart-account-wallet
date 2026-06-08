/**
 * Alchemy Account Abstraction Provider
 * Implements the IAccountAbstractionProvider interface for Alchemy
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
  Address,
} from '@orya/shared-types';
import type {
  IAccountAbstractionProvider,
  AAProviderConfig,
  SmartAccountCreationParams,
  UserOpSubmissionResult,
} from '@orya/wallet-core';

export interface AlchemyAAProviderConfig extends AAProviderConfig {
  alchemyApiKey: string;
}

/**
 * Alchemy Account Abstraction Provider Implementation
 */
export class AlchemyAAProvider implements IAccountAbstractionProvider {
  private config: AlchemyAAProviderConfig | null = null;
  private isInitialized: boolean = false;
  private smartAccounts: Map<string, SmartAccountConfig> = new Map();
  private userOperations: Map<string, UserOperationWithMetadata> = new Map();
  private paymasterConfigs: Map<string, PaymasterConfig> = new Map();

  async initialize(config: AAProviderConfig): Promise<void> {
    const alchemyConfig = config as AlchemyAAProviderConfig;

    if (!alchemyConfig.alchemyApiKey) {
      throw new Error('Alchemy API key is required');
    }

    if (!alchemyConfig.rpcUrl) {
      throw new Error('RPC URL is required');
    }

    this.config = alchemyConfig;

    this.initializePaymasterConfigs();

    this.isInitialized = true;
  }

  isConnected(): boolean {
    return this.isInitialized && this.config !== null;
  }

  async createSmartAccount(params: SmartAccountCreationParams): Promise<SmartAccountConfig> {
    this.validateInitialized();

    const smartAccountConfig: SmartAccountConfig = {
      id: `sa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: params.accountType,
      address: `0x${Math.random().toString(16).substr(2, 40)}` as Address,
      chainType: this.config!.chainId as any,
      owners: [params.ownerAddress],
      entryPointAddress: await this.getEntryPointAddress(),
      factoryAddress: params.factoryAddress,
    };

    this.smartAccounts.set(smartAccountConfig.address, smartAccountConfig);

    return smartAccountConfig;
  }

  async getSmartAccountConfig(accountAddress: string): Promise<SmartAccountConfig> {
    this.validateInitialized();

    let config = this.smartAccounts.get(accountAddress);

    if (!config) {
      config = {
        id: `sa_${Date.now()}`,
        type: 'simple_account' as SmartAccountType,
        address: accountAddress as Address,
        chainType: this.config!.chainId as any,
        owners: [],
        entryPointAddress: await this.getEntryPointAddress(),
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

    const targets = Array.isArray(executionData.target)
      ? executionData.target
      : [executionData.target];
    const values = Array.isArray(executionData.value)
      ? executionData.value
      : [executionData.value || '0'];
    const datas = Array.isArray(executionData.data)
      ? executionData.data
      : [executionData.data || '0x'];

    const callData = this.encodeMultiCallData(targets, values, datas);

    return {
      sender: accountAddress as Address,
      nonce: '0',
      initCode: '0x',
      callData,
      callGasLimit: '100000',
      verificationGasLimit: '100000',
      preVerificationGas: '21000',
      maxFeePerGas: '1000000000',
      maxPriorityFeePerGas: '1000000000',
      signature: '0x',
    };
  }

  async estimateUserOpGas(userOp: UserOperation): Promise<UserOpGasEstimate> {
    this.validateInitialized();

    const preVerificationGas = '21000';
    const verificationGasLimit = '100000';
    const callGasLimit = '100000';
    const maxFeePerGas = userOp.maxFeePerGas;
    const maxPriorityFeePerGas = userOp.maxPriorityFeePerGas;

    const totalGasUnits = BigInt(preVerificationGas) +
      BigInt(verificationGasLimit) +
      BigInt(callGasLimit);

    const totalCost = totalGasUnits * BigInt(maxFeePerGas);
    const totalCostUsd = Number(totalCost) / 1e18 * 2000;

    return {
      preVerificationGas,
      verificationGasLimit,
      callGasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
      totalCost: totalCost.toString(),
      totalCostUsd,
    };
  }

  async submitUserOperation(userOp: UserOperation): Promise<UserOpSubmissionResult> {
    this.validateInitialized();

    const userOpHash = this.computeUserOpHash(userOp);

    const result: UserOpSubmissionResult = {
      userOpHash,
      bundlerAddress: '0x' + Math.random().toString(16).substr(2, 40),
      chainId: this.config!.chainId,
      entryPointAddress: await this.getEntryPointAddress(),
    };

    const userOpWithMetadata: UserOperationWithMetadata = {
      ...userOp,
      id: `uop_${Date.now()}`,
      walletAddress: userOp.sender,
      status: 'submitted' as any,
      entryPointVersion: 'v0.6' as any,
      chainType: this.config!.chainId as any,
      userOpHash,
      bundlerAddress: result.bundlerAddress,
      createdAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
    };

    this.userOperations.set(userOpHash, userOpWithMetadata);

    return result;
  }

  async getUserOpStatus(userOpHash: string): Promise<UserOperationWithMetadata> {
    this.validateInitialized();

    const userOp = this.userOperations.get(userOpHash);
    if (!userOp) {
      throw new Error(`UserOperation ${userOpHash} not found`);
    }

    return userOp;
  }

  async cancelUserOperation(userOpHash: string): Promise<boolean> {
    this.validateInitialized();

    const userOp = this.userOperations.get(userOpHash);
    if (!userOp) {
      return false;
    }

    userOp.status = 'rejected' as any;
    return true;
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
      chainType: this.config!.chainId as any,
      supportedAccountTypes: [
        'simple_account',
        'multi_owner',
        'factory_managed',
        'safe_proxy',
      ] as SmartAccountType[],
      isActive: true,
      metadata: {
        provider: 'alchemy',
      },
    };

    this.paymasterConfigs.set(paymasterAddress, config);
  }

  async getEntryPointConfig(): Promise<EntryPointConfig> {
    this.validateInitialized();

    return {
      address: '0x5fbdb2315678afccb333f5dfa1846a3bfc48e5ec' as Address,
      version: 'v0.6' as any,
      chainType: this.config!.chainId as any,
      rpcUrl: this.config!.rpcUrl,
      bundlerUrls: [
        `https://${this.config!.chainId}.g.alchemy.com/v2/${this.config!.alchemyApiKey}`,
      ],
      maxBatchSize: 50,
      useExternalBundler: true,
    };
  }

  private validateInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('AlchemyAAProvider not initialized');
    }
  }

  private initializePaymasterConfigs(): void {
    const sponsoredPaymaster: PaymasterConfig = {
      address: '0x4e3fbd56cd56c3e1ae6d70daf2b3a06213ffd8e9' as Address,
      mode: 'sponsored' as PaymasterMode,
      chainType: this.config!.chainId as any,
      supportedAccountTypes: ['simple_account', 'multi_owner'],
      isActive: true,
      sponsorshipRules: {
        maxSponsorshipPercentage: 100,
        maxUsdPerTransaction: 100,
        maxDailyBudgetUsd: 10000,
        minUserBalanceUsd: 0,
      },
    };

    this.paymasterConfigs.set(sponsoredPaymaster.address, sponsoredPaymaster);
  }

  private encodeMultiCallData(
    targets: string[],
    values: string[],
    datas: string[]
  ): string {
    let encoded = '0x';

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i].toLowerCase().replace(/^0x/, '');
      const value = values[i].padStart(64, '0');
      const dataWithoutPrefix = datas[i].replace(/^0x/, '');
      const dataLength = (dataWithoutPrefix.length / 2).toString(16).padStart(64, '0');

      encoded += target + value + dataLength + dataWithoutPrefix;
    }

    return encoded;
  }

  private computeUserOpHash(userOp: UserOperation): string {
    const data = JSON.stringify(userOp);
    const hash = require('crypto').createHash('keccak256').update(data).digest('hex');
    return '0x' + hash;
  }

  private async getEntryPointAddress(): Promise<Address> {
    return '0x5fbdb2315678afccb333f5dfa1846a3bfc48e5ec' as Address;
  }
}

export default AlchemyAAProvider;
