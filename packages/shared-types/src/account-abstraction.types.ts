/**
 * Account Abstraction (ERC-4337) Types
 * Smart account operations, UserOperations, EntryPoints, and paymaster integration
 * Compatible with OpenZeppelin, Alchemy, Biconomy, and Safe AA standards
 */

import { UUID, Address, Hash } from './common.types';
import { ChainType } from './chain.types';

/**
 * ERC-4337 UserOperation states
 */
export enum UserOperationStatus {
  SUBMITTED = 'submitted',
  MEMPOOL = 'mempool',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  REJECTED = 'rejected',
}

/**
 * EntryPoint contract versions
 */
export enum EntryPointVersion {
  V06 = 'v0.6',
  V07 = 'v0.7',
}

/**
 * Smart account implementation types
 */
export enum SmartAccountType {
  SIMPLE_ACCOUNT = 'simple_account',
  MULTI_OWNER = 'multi_owner',
  FACTORY_MANAGED = 'factory_managed',
  SAFE_PROXY = 'safe_proxy',
  KERNEL = 'kernel',
  PERMISSIONLESS = 'permissionless',
  MODULAR = 'modular',
}

/**
 * Paymaster operation modes
 */
export enum PaymasterMode {
  SPONSORED = 'sponsored',
  ERC20_ORACLE = 'erc20_oracle',
  ERC20_SESSION = 'erc20_session',
  VERIFY_SIGNING = 'verify_signing',
  STAKED = 'staked',
}

/**
 * UserOperation struct (ERC-4337)
 * Represents a transaction-like object that users send to a bundler
 */
export interface UserOperation {
  /** Sender account address */
  sender: Address;
  
  /** Anti-replay param (at least the value returned by entrypoint.getNonce). */
  nonce: string;
  
  /** Factory for account initialization */
  initCode?: string;
  
  /** Account execution function call data */
  callData: string;
  
  /** Amount of gas to allocate the account execution */
  callGasLimit: string;
  
  /** Amount of gas to allocate for the verification process */
  verificationGasLimit: string;
  
  /** Gas used in the preVerificationGas of the bundle */
  preVerificationGas: string;
  
  /** Maximum fee per gas (similar to maxFeePerGas in EIP-1559) */
  maxFeePerGas: string;
  
  /** Max priority fee per gas */
  maxPriorityFeePerGas: string;
  
  /** Address of paymaster sponsoring the transaction */
  paymasterAndData?: string;
  
  /** Signature data for validation */
  signature: string;
  
  /** Factory address if creating new account */
  factory?: Address;
  
  /** Optional initData for factory */
  initData?: string;
}

/**
 * UserOperation with extended metadata
 */
export interface UserOperationWithMetadata extends UserOperation {
  /** Unique operation identifier */
  id: UUID;
  
  /** Associated wallet address */
  walletAddress: Address;
  
  /** Operation status */
  status: UserOperationStatus;
  
  /** EntryPoint version */
  entryPointVersion: EntryPointVersion;
  
  /** Chain */
  chainType: ChainType;
  
  /** User operation hash (keccak256 of packed userOp) */
  userOpHash: Hash;
  
  /** Bundler address */
  bundlerAddress?: Address;
  
  /** Transaction hash after being bundled */
  txHash?: Hash;
  
  /** Block number after inclusion */
  blockNumber?: number;
  
  /** Gas actually used */
  actualGasUsed?: string;
  
  /** Actual transaction fee */
  actualGasCost?: string;
  
  /** Failure reason if applicable */
  failureReason?: string;
  
  /** Creation timestamp */
  createdAt: string;
  
  /** Submission timestamp */
  submittedAt?: string;
  
  /** Inclusion timestamp */
  includedAt?: string;
  
  /** Optional memo */
  memo?: string;
}

/**
 * EntryPoint contract interface information
 */
export interface EntryPointConfig {
  /** EntryPoint address */
  address: Address;
  
  /** EntryPoint version */
  version: EntryPointVersion;
  
  /** Chain type */
  chainType: ChainType;
  
  /** RPC URL for EntryPoint interactions */
  rpcUrl: string;
  
  /** Bundler RPC URLs for submission */
  bundlerUrls: string[];
  
  /** Maximum batch size for bundling */
  maxBatchSize: number;
  
  /** Whether to use external bundler or internal */
  useExternalBundler: boolean;
}

/**
 * Smart Account configuration
 */
export interface SmartAccountConfig {
  /** Unique identifier */
  id: UUID;
  
  /** Account type */
  type: SmartAccountType;
  
  /** Account address */
  address: Address;
  
  /** Factory address */
  factoryAddress?: Address;
  
  /** Implementation address for proxy accounts */
  implementationAddress?: Address;
  
  /** EntryPoint used by this account */
  entryPointAddress: Address;
  
  /** Chain */
  chainType: ChainType;
  
  /** Owners/signers of the account */
  owners: Address[];
  
  /** Threshold for multi-sig smart accounts */
  threshold?: number;
  
  /** Enabled modules (for modular accounts) */
  modules?: ModuleConfig[];
  
  /** Account-specific metadata */
  metadata?: Record<string, any>;
}

/**
 * Smart Account module configuration
 */
export interface ModuleConfig {
  /** Module address */
  address: Address;
  
  /** Module type (Validation, Execution, Hook, etc.) */
  type: 'validation' | 'execution' | 'hook' | 'fallback';
  
  /** Whether module is enabled */
  isEnabled: boolean;
  
  /** Module parameters */
  params?: Record<string, any>;
}

/**
 * Paymaster configuration and sponsorship rules
 */
export interface PaymasterConfig {
  /** Paymaster address */
  address: Address;
  
  /** Paymaster operation mode */
  mode: PaymasterMode;
  
  /** Chain */
  chainType: ChainType;
  
  /** Supported account types */
  supportedAccountTypes: SmartAccountType[];
  
  /** Whether paymaster is active */
  isActive: boolean;
  
  /** Sponsorship conditions */
  sponsorshipRules?: SponsorshipRules;
  
  /** Metadata */
  metadata?: Record<string, any>;
}

/**
 * Sponsorship rules for paymaster
 */
export interface SponsorshipRules {
  /** Maximum percentage of transaction cost sponsored (0-100) */
  maxSponsorshipPercentage: number;
  
  /** Maximum USD value sponsored per transaction */
  maxUsdPerTransaction?: number;
  
  /** Maximum daily sponsorship budget in USD */
  maxDailyBudgetUsd?: number;
  
  /** Minimum user balance required to be sponsored */
  minUserBalanceUsd?: number;
  
  /** Eligible token types for ERC20 sponsorship */
  eligibleTokens?: Address[];
  
  /** Whitelist of addresses that can be sponsored */
  whitelistAddresses?: Address[];
  
  /** Blacklist of addresses that cannot be sponsored */
  blacklistAddresses?: Address[];
}

/**
 * Call data for UserOperation execution
 */
export interface ExecutionData {
  /** Target address (can be multiple for batch execution) */
  target: Address | Address[];
  
  /** Value to send (in wei) */
  value: string | string[];
  
  /** Function call data */
  data: string | string[];
}

/**
 * Bundled UserOperations for submission
 */
export interface UserOperationBundle {
  /** Bundle identifier */
  id: UUID;
  
  /** UserOperations in bundle */
  userOps: UserOperationWithMetadata[];
  
  /** Bundler address */
  bundlerAddress: Address;
  
  /** EntryPoint address */
  entryPointAddress: Address;
  
  /** Bundle status */
  status: 'pending' | 'submitted' | 'confirmed' | 'failed';
  
  /** Transaction hash after bundling */
  txHash?: Hash;
  
  /** Creation timestamp */
  createdAt: string;
  
  /** Submission timestamp */
  submittedAt?: string;
  
  /** Confirmation timestamp */
  confirmedAt?: string;
}

/**
 * AccountFactory configuration for creating accounts
 */
export interface AccountFactory {
  /** Factory address */
  address: Address;
  
  /** Account implementation type */
  accountType: SmartAccountType;
  
  /** Chain */
  chainType: ChainType;
  
  /** Factory contract ABI-compatible function for creating accounts */
  createAccountFunction: string;
  
  /** Parameters for account creation */
  params?: Record<string, any>;
}

/**
 * Validator configuration for account validation
 */
export interface ValidatorConfig {
  /** Validator address/type identifier */
  id: string;
  
  /** Validator type */
  type: 'owner_signer' | 'multi_sig' | 'ecdsa' | 'schnorr' | 'erc1271';
  
  /** Associated owners/operators */
  operators?: Address[];
  
  /** Validation mode */
  mode: 'permissive' | 'strict' | 'custom';
  
  /** Custom validation logic (if applicable) */
  customValidator?: string;
}

/**
 * Gas fee structure for UserOperation
 */
export interface UserOpGasEstimate {
  /** Pre-verification gas */
  preVerificationGas: string;
  
  /** Verification gas limit */
  verificationGasLimit: string;
  
  /** Call gas limit */
  callGasLimit: string;
  
  /** Max fee per gas */
  maxFeePerGas: string;
  
  /** Max priority fee per gas */
  maxPriorityFeePerGas: string;
  
  /** Total estimated cost in wei */
  totalCost: string;
  
  /** Total estimated cost in USD */
  totalCostUsd: number;
}

/**
 * Account abstraction statistics
 */
export interface AAStats {
  /** Total UserOperations submitted */
  totalUserOps: number;
  
  /** Successful UserOperations */
  successfulUserOps: number;
  
  /** Failed UserOperations */
  failedUserOps: number;
  
  /** Average gas used per UserOp */
  averageGasUsed: string;
  
  /** Average cost per UserOp (wei) */
  averageCostWei: string;
  
  /** Paymaster sponsorship efficiency */
  sponsorshipEfficiency: number;
  
  /** Account creation count */
  accountCreationCount: number;
}

/**
 * Permission for modular smart accounts (EIP-2535 or similar)
 */
export interface SmartAccountPermission {
  /** Permission identifier */
  id: UUID;
  
  /** Target function selector or contract */
  target: Address | string;
  
  /** Allowed operators */
  allowedOperators: Address[];
  
  /** Permission constraints */
  constraints?: {
    maxValue?: string;
    dailyLimit?: string;
    timelock?: number;
    rateLimits?: number;
  };
  
  /** Whether permission is active */
  isActive: boolean;
  
  /** Creation timestamp */
  createdAt: string;
  
  /** Expiration timestamp */
  expiresAt?: string;
}

/**
 * Account abstraction audit log entry
 */
export interface AAuditEntry {
  /** Entry identifier */
  id: UUID;
  
  /** Account address */
  accountAddress: Address;
  
  /** Event type */
  eventType: 'account_created' | 'user_op_submitted' | 'user_op_executed' | 'validator_updated' | 'module_added' | 'permission_granted';
  
  /** Actor */
  actor: Address;
  
  /** Event details */
  details: Record<string, any>;
  
  /** Timestamp */
  timestamp: string;
  
  /** Associated UserOp hash if applicable */
  userOpHash?: Hash;
}

/**
 * Recovery path for smart accounts
 */
export interface AccountRecovery {
  /** Recovery identifier */
  id: UUID;
  
  /** Account to recover */
  accountAddress: Address;
  
  /** Recovery type */
  recoveryType: 'owner_rotation' | 'validator_update' | 'module_remediation';
  
  /** Guardian addresses with recovery rights */
  guardians: Address[];
  
  /** Required confirmations from guardians */
  requiredConfirmations: number;
  
  /** Timelock duration before recovery executes (seconds) */
  timelockDuration: number;
  
  /** Recovery initiated timestamp */
  initiatedAt?: string;
  
  /** Recovery execution timestamp */
  executedAt?: string;
}
