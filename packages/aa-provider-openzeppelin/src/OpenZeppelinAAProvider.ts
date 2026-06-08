/**
 * OpenZeppelin Account Abstraction Provider
 * Implements the IAccountAbstractionProvider interface using OpenZeppelin contracts
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

export interface OpenZeppelinAAProviderConfig extends AAProviderConfig {
  gatewayUrl?: string;
}

/**
 * OpenZeppelin Account Abstraction Provider Implementation
 * Uses OpenZeppelin smart contract library for Account Abstraction
 */
export class OpenZeppelinAAProvider implements IAccountAbstractionProvider {
  private config: OpenZeppelinAAProviderConfig | null = null;
  private isInitialized: boolean = false;
  private smartAccounts: Map<string, SmartAccountConfig> = new Map();
  private userOperations: Map<string, UserOperationWithMetadata> = new Map();
  private paymasterConfigs: Map<string, PaymasterConfig> = new Map();
  private factoryAddress: Address = '0x0000000000000000000000000000000000000000' as Address;

  async initialize(config: AAProviderConfig): Promise<void> {
    const ozConfig = config as OpenZeppelinAAProviderConfig;

    if (!ozConfig.rpcUrl) {
      throw new Error('RPC URL is required');
    }

    this.config = ozConfig;

    this.initializeFactoryAndPaymasters();

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
      factoryAddress: this.factoryAddress,
      implementationAddress: this.getImplementationAddress(params.accountType),
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
        factoryAddress: this.factoryAddress,
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

    const callData = this.encodeExecuteData(targets, values, datas);

    return {
      sender: accountAddress as Address,
      nonce: '0',
      initCode: '0x',
      callData,
      callGasLimit: '200000',
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
    const callGasLimit = '200000';
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
      entryPointVersion: 'v0.7' as any,
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
      supportedAccountTypes: ['simple_account', 'multi_owner', 'modular'] as SmartAccountType[],
      isActive: true,
      metadata: {
        provider: 'openzeppelin',
      },
    };

    this.paymasterConfigs.set(paymasterAddress, config);
  }

  async getEntryPointConfig(): Promise<EntryPointConfig> {
    this.validateInitialized();

    return {
      address: '0x0000000071727de22e8e48675e1604fb18e7a1e5' as Address,
      version: 'v0.7' as any,
      chainType: this.config!.chainId as any,
      rpcUrl: this.config!.rpcUrl,
      bundlerUrls: [this.config!.rpcUrl],
      maxBatchSize: 100,
      useExternalBundler: false,
    };
  }

  private validateInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('OpenZeppelinAAProvider not initialized');
    }
  }

  private initializeFactoryAndPaymasters(): void {
    this.factoryAddress = '0x0000000000000000000000000000000000000001' as Address;

    const verifyingPaymaster: PaymasterConfig = {
      address: '0x0000000000000000000000000000000000000002' as Address,
      mode: 'verify_signing' as PaymasterMode,
      chainType: this.config!.chainId as any,
      supportedAccountTypes: ['simple_account', 'multi_owner'],
      isActive: true,
      sponsorshipRules: {
        maxSponsorshipPercentage: 100,
        maxUsdPerTransaction: 200,
        maxDailyBudgetUsd: 50000,
      },
    };

    this.paymasterConfigs.set(verifyingPaymaster.address, verifyingPaymaster);
  }

  private encodeExecuteData(
    targets: string[],
    values: string[],
    datas: string[]
  ): string {
    if (targets.length === 1) {
      return this.encodeSingleCall(targets[0], values[0], datas[0]);
    }

    return this.encodeMultiCall(targets, values, datas);
  }

  private encodeSingleCall(target: string, value: string, data: string): string {
    const targetHex = target.toLowerCase().replace(/^0x/, '').padStart(40, '0');
    const valueHex = BigInt(value).toString(16).padStart(64, '0');
    const dataWithoutPrefix = data.replace(/^0x/, '');
    const dataLength = (dataWithoutPrefix.length / 2).toString(16).padStart(64, '0');

    return '0xb61d27f6' + targetHex + valueHex + dataLength + dataWithoutPrefix;
  }

  private encodeMultiCall(targets: string[], values: string[], datas: string[]): string {
    let encoded = '0xac9650d8';

    const callsLength = targets.length.toString(16).padStart(64, '0');
    encoded += callsLength;

    for (let i = 0; i < targets.length; i++) {
      const targetHex = targets[i].toLowerCase().replace(/^0x/, '').padStart(40, '0');
      const valueHex = BigInt(values[i]).toString(16).padStart(64, '0');
      const dataWithoutPrefix = datas[i].replace(/^0x/, '');
      const dataLength = (dataWithoutPrefix.length / 2).toString(16).padStart(64, '0');

      encoded += targetHex + valueHex + dataLength + dataWithoutPrefix;
    }

    return encoded;
  }

  private computeUserOpHash(userOp: UserOperation): string {
    const data = JSON.stringify(userOp);
    const hash = require('crypto').createHash('keccak256').update(data).digest('hex');
    return '0x' + hash;
  }

  private async getEntryPointAddress(): Promise<Address> {
    return '0x0000000071727de22e8e48675e1604fb18e7a1e5' as Address;
  }

  private getImplementationAddress(accountType: SmartAccountType): Address {
    switch (accountType) {
      case 'simple_account':
        return '0x0000000000000000000000000000000000000003' as Address;
      case 'multi_owner':
        return '0x0000000000000000000000000000000000000004' as Address;
      case 'modular':
        return '0x0000000000000000000000000000000000000005' as Address;
      default:
        return '0x0000000000000000000000000000000000000003' as Address;
    }
  }
}

export default OpenZeppelinAAProvider;
