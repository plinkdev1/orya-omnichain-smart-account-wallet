/**
 * Biconomy-specific Type Definitions
 * Extended types for Biconomy-specific features
 */

import type {
  Address,
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
  UserOperationStatus,
} from '@orya/shared-types';

export interface AAProviderConfig {
  rpcUrl: string;
  chainId: number;
}

export interface SmartAccountCreationParams {
  ownerAddress: string;
  factoryAddress?: string;
  accountType: SmartAccountType;
  chainId: number;
}

export interface UserOpSubmissionResult {
  userOpHash: string;
  bundlerAddress: string;
  chainId: number;
  entryPointAddress: Address;
}

export interface IAccountAbstractionProvider {
  initialize(config: AAProviderConfig): Promise<void>;
  isConnected(): boolean;
  createSmartAccount(params: SmartAccountCreationParams): Promise<SmartAccountConfig>;
  getSmartAccountConfig(accountAddress: string): Promise<SmartAccountConfig>;
  createUserOperation(
    accountAddress: string,
    executionData: ExecutionData,
    validators?: ValidatorConfig[]
  ): Promise<UserOperation>;
  estimateUserOpGas(userOp: UserOperation): Promise<UserOpGasEstimate>;
  submitUserOperation(userOp: UserOperation): Promise<UserOpSubmissionResult>;
  getUserOpStatus(userOpHash: string): Promise<UserOperationWithMetadata>;
  cancelUserOperation(userOpHash: string): Promise<boolean>;
  getPaymasterConfigs(): Promise<PaymasterConfig[]>;
  setPaymaster(paymasterAddress: string, mode: PaymasterMode): Promise<void>;
  getEntryPointConfig(): Promise<EntryPointConfig>;
}

export interface BiconomyChainOperation {
  chainId: number;
  target: Address;
  value?: string;
  data: string;
}

export interface SupertransactionParams {
  operations: BiconomyChainOperation[];
  deadline?: number;
  refundReceiver?: Address;
  requireSuccess?: boolean;
}

export interface SupertransactionResult {
  transactionHash: string;
  supertxHash: string;
  status: 'submitted' | 'confirmed' | 'failed';
  operations: BiconomyChainOperation[];
  confirmedAt?: string;
}

export interface MultiChainResult {
  supertxHash: string;
  operations: Array<{
    chainId: number;
    transactionHash: string;
    status: 'submitted' | 'confirmed' | 'failed';
  }>;
}

export interface GasEstimateOptions {
  usePaymaster?: boolean;
  tokenAddress?: Address;
}

export interface PaymasterDataResponse {
  paymasterAndData: string;
  preVerificationGas: string;
  verificationGasLimit: string;
  callGasLimit: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}

export interface AccountDeploymentData {
  factory: Address;
  factoryData: string;
}

export interface NexusSmartAccount {
  address: Address;
  owner: Address;
  chainId: number;
  isDeployed: boolean;
  createdAt?: string;
  deploymentTransaction?: string;
}

export interface SessionKeyConfig {
  validAfter?: number;
  validUntil?: number;
  sessionKeyAddress: Address;
  sessionKeyData: string;
  permissionId?: string;
  limits?: {
    valueLimit?: string;
    callLimit?: number;
  };
}

export interface MEEExecutionConfig {
  moduleAddress: Address;
  data: string;
  executionType: 'pre' | 'post' | 'validation';
  policy?: Record<string, any>;
}

export interface BiconomyAccountFactoryParams {
  implementation: Address;
  owner: Address;
  index?: number;
  salt?: string;
}

export interface ChainSupportInfo {
  chainId: number;
  chainName: string;
  supported: boolean;
  bundlerUrl: string;
  paymasterUrl: string;
  rpcUrl: string;
  nftIndexerUrl?: string;
}
