/**
 * Biconomy Account Abstraction Provider
 * Implements IAccountAbstractionProvider using Biconomy's AA SDK
 * Features: NEXUS smart accounts, Supertransactions, Paymaster, Gas sponsorship
 */

export { BiconomyAAProvider } from './BiconomyAAProvider';
export type { BiconomyAAProviderConfig } from './BiconomyAAProvider';

export { BiconomyConfig, BICONOMY_NETWORKS } from './BiconomyConfig';
export type { BiconomyNetworkConfig, BiconomyConfigOptions } from './BiconomyConfig';

export { SupertransactionClient } from './SupertransactionClient';
export type { SupertransactionAPIResponse } from './SupertransactionClient';

export { NexusAccountManager } from './NexusAccountManager';
export type { NexusAccountConfig, DeploymentData } from './NexusAccountManager';

export {
  BiconomyError,
  BiconomyNotInitializedError,
  BiconomyInvalidConfigError,
  BiconomyAPIError,
  BiconomyTransactionError,
  BiconomySmartAccountError,
  BiconomyPaymasterError,
  BiconomyGasEstimationError,
} from './BiconomyErrors';

export type {
  BiconomyChainOperation,
  SupertransactionParams,
  SupertransactionResult,
  MultiChainResult,
  GasEstimateOptions,
  PaymasterDataResponse,
  AccountDeploymentData,
  NexusSmartAccount,
  SessionKeyConfig,
  MEEExecutionConfig,
  BiconomyAccountFactoryParams,
  ChainSupportInfo,
} from './BiconomyTypes';

export { PaymasterService } from './PaymasterService';
export type {
  PaymasterSponsorshipRequest,
  PaymasterSponsorshipData,
  GasSponsorshipPolicy,
} from './PaymasterService';

export { MEEExecutor } from './MEEExecutor';
export type {
  ExecutionModule,
  ExecutionHook,
  PolicyRule,
  ExecutionContext,
} from './MEEExecutor';

export { BiconomyService } from './BiconomyService';
export type { BiconomyServiceConfig, TransactionOptions } from './BiconomyService';
