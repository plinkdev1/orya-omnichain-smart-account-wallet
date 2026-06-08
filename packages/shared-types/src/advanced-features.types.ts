/**
 * Advanced Wallet Features Types
 * Session keys, programmable authorization, recovery policies, and advanced account management
 */

import { UUID, Address, Hash } from './common.types';
import { ChainType } from './chain.types';

/**
 * Session key status
 */
export enum SessionKeyStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  PENDING_ACTIVATION = 'pending_activation',
}

/**
 * Session key permission types
 */
export enum SessionKeyPermission {
  TRANSFER = 'transfer',
  SWAP = 'swap',
  STAKE = 'stake',
  BRIDGE = 'bridge',
  SIGN = 'sign',
  EXECUTE = 'execute',
  APPROVE = 'approve',
  CLAIM_REWARDS = 'claim_rewards',
  BATCH_EXECUTE = 'batch_execute',
}

/**
 * Authorization policy types
 */
export enum AuthorizationPolicyType {
  RATE_LIMIT = 'rate_limit',
  VALUE_LIMIT = 'value_limit',
  WHITELIST = 'whitelist',
  BLACKLIST = 'blacklist',
  TIME_LOCK = 'time_lock',
  GAS_LIMIT = 'gas_limit',
  NONCE_BASED = 'nonce_based',
  CONDITIONAL = 'conditional',
}

/**
 * Recovery policy types
 */
export enum RecoveryPolicyType {
  SOCIAL_RECOVERY = 'social_recovery',
  GUARDIAN_BASED = 'guardian_based',
  TIME_LOCK_RECOVERY = 'time_lock_recovery',
  BACKUP_KEY = 'backup_key',
  HARDWARE_WALLET_LINK = 'hardware_wallet_link',
  MULTISIG_RECOVERY = 'multisig_recovery',
  HYBRID = 'hybrid',
}

/**
 * Recovery status
 */
export enum RecoveryStatus {
  INACTIVE = 'inactive',
  ACTIVE = 'active',
  IN_PROGRESS = 'in_progress',
  RECOVERED = 'recovered',
  FAILED = 'failed',
  INITIATED = 'initiated',
  CONFIRMED = 'confirmed',
}

/**
 * Session key for temporary access grants
 */
export interface SessionKey {
  /** Unique session key identifier */
  id: UUID;
  
  /** Associated wallet address */
  walletAddress: Address;
  
  /** Public key for the session */
  publicKey: string;
  
  /** Session key address (derived from public key) */
  keyAddress: Address;
  
  /** Permissions granted to this session */
  permissions: SessionKeyPermission[];
  
  /** Session status */
  status: SessionKeyStatus;
  
  /** Creation timestamp */
  createdAt: string;
  
  /** Expiration timestamp */
  expiresAt: string;
  
  /** Optional revocation timestamp */
  revokedAt?: string;
  
  /** Nonce for this session */
  nonce: number;
  
  /** Authorization policies applied */
  authorizationPolicies: AuthorizationPolicy[];
  
  /** Optional session-specific metadata */
  metadata?: {
    appId?: string;
    deviceId?: string;
    ipAddress?: string;
    userAgent?: string;
    [key: string]: any;
  };
}

/**
 * Session creation request
 */
export interface SessionKeyRequest {
  /** Wallet to create session for */
  walletAddress: Address;
  
  /** Requested permissions */
  permissions: SessionKeyPermission[];
  
  /** Session duration in seconds */
  durationSeconds: number;
  
  /** Authorization policies */
  authorizationPolicies?: AuthorizationPolicy[];
  
  /** Session metadata */
  metadata?: Record<string, any>;
}

/**
 * Programmable authorization policy
 */
export interface AuthorizationPolicy {
  /** Unique policy identifier */
  id: UUID;
  
  /** Policy type */
  type: AuthorizationPolicyType;
  
  /** Whether policy is enforced */
  isEnforced: boolean;
  
  /** Policy parameters based on type */
  params: AuthorizationPolicyParams;
  
  /** Creation timestamp */
  createdAt: string;
  
  /** Optional expiration */
  expiresAt?: string;
}

/**
 * Authorization policy parameters (polymorphic)
 */
export type AuthorizationPolicyParams = 
  | RateLimitPolicy
  | ValueLimitPolicy
  | WhitelistPolicy
  | BlacklistPolicy
  | TimeLockPolicy
  | GasLimitPolicy
  | NonceBasedPolicy
  | ConditionalPolicy;

/**
 * Rate limit policy (max operations per time window)
 */
export interface RateLimitPolicy {
  /** Maximum operations allowed */
  maxOperations: number;
  
  /** Time window in seconds */
  windowSeconds: number;
  
  /** Current operation count */
  currentCount?: number;
  
  /** Window reset timestamp */
  resetAt?: string;
}

/**
 * Value limit policy (max transaction value)
 */
export interface ValueLimitPolicy {
  /** Maximum value in wei */
  maxValueWei: string;
  
  /** Maximum value in USD (optional) */
  maxValueUsd?: number;
  
  /** Applies per transaction or per day */
  scope: 'per_transaction' | 'per_day' | 'per_week';
  
  /** Cumulative value used */
  cumulativeUsed?: string;
  
  /** Reset timestamp for cumulative tracking */
  resetAt?: string;
}

/**
 * Whitelist policy (allowed addresses)
 */
export interface WhitelistPolicy {
  /** Addresses allowed to receive transfers/interactions */
  allowedAddresses: Address[];
  
  /** Whitelist mode */
  mode: 'strict' | 'permissive';
  
  /** Whether to allow contracts */
  allowContracts: boolean;
  
  /** Whether to allow EOAs */
  allowEOAs: boolean;
}

/**
 * Blacklist policy (disallowed addresses)
 */
export interface BlacklistPolicy {
  /** Addresses blocked */
  blockedAddresses: Address[];
  
  /** Reason for blocking */
  blockReason?: string;
  
  /** Until timestamp for temporary blocks */
  blockedUntil?: string;
}

/**
 * Time lock policy (delay before execution)
 */
export interface TimeLockPolicy {
  /** Delay in seconds before execution allowed */
  delaySeconds: number;
  
  /** Can execute after unlock */
  canExecuteAfter?: string;
  
  /** Pending execution timestamp */
  pendingExecutionAt?: string;
  
  /** Override threshold (admin can bypass) */
  adminOverrideEnabled: boolean;
}

/**
 * Gas limit policy
 */
export interface GasLimitPolicy {
  /** Maximum gas units allowed */
  maxGasUnits: string;
  
  /** Maximum gas price allowed (wei) */
  maxGasPrice: string;
  
  /** Cumulative gas used */
  cumulativeGasUsed?: string;
  
  /** Reset period in seconds */
  resetPeriodSeconds: number;
}

/**
 * Nonce-based policy (sequential execution)
 */
export interface NonceBasedPolicy {
  /** Expected next nonce */
  expectedNonce: number;
  
  /** Current nonce */
  currentNonce: number;
  
  /** Whether gaps are allowed */
  allowGaps: boolean;
}

/**
 * Conditional policy (custom logic)
 */
export interface ConditionalPolicy {
  /** Policy condition in human-readable or code format */
  condition: string;
  
  /** Condition type */
  conditionType: 'custom_logic' | 'chain_call' | 'oracle_based' | 'probabilistic';
  
  /** Oracle address for chain calls */
  oracleAddress?: Address;
  
  /** Oracle call data */
  oracleCallData?: string;
  
  /** Expected oracle return value */
  expectedReturnValue?: string;
}

/**
 * Programmable authorization configuration
 */
export interface ProgrammableAuthorization {
  /** Unique identifier */
  id: UUID;
  
  /** Associated wallet */
  walletAddress: Address;
  
  /** Authorization name */
  name: string;
  
  /** Authorization description */
  description?: string;
  
  /** Authorized parties (addresses or session keys) */
  authorizedParties: Address[];
  
  /** Authorization policies */
  policies: AuthorizationPolicy[];
  
  /** Scope of authorization */
  scope: {
    functions: string[];
    contracts: Address[];
    operations: SessionKeyPermission[];
  };
  
  /** Whether authorization is active */
  isActive: boolean;
  
  /** Creation timestamp */
  createdAt: string;
  
  /** Expiration timestamp */
  expiresAt?: string;
  
  /** Last used timestamp */
  lastUsedAt?: string;
  
  /** Usage count */
  usageCount: number;
}

/**
 * Recovery policy configuration
 */
export interface RecoveryPolicy {
  /** Unique identifier */
  id: UUID;
  
  /** Associated wallet */
  walletAddress: Address;
  
  /** Recovery policy type */
  policyType: RecoveryPolicyType;
  
  /** Recovery status */
  status: RecoveryStatus;
  
  /** Recovery configuration based on type */
  config: RecoveryPolicyConfig;
  
  /** Threshold for recovery confirmation */
  recoveryThreshold: number;
  
  /** Time lock before recovery executes (seconds) */
  executionDelay: number;
  
  /** Creation timestamp */
  createdAt: string;
  
  /** Last updated timestamp */
  updatedAt: string;
  
  /** Whether recovery is currently in progress */
  isRecoveryInProgress: boolean;
  
  /** Current recovery session if in progress */
  activeRecoverySession?: RecoverySession;
}

/**
 * Recovery policy configuration (polymorphic based on type)
 */
export type RecoveryPolicyConfig = 
  | SocialRecoveryConfig
  | GuardianBasedConfig
  | TimeLockRecoveryConfig
  | BackupKeyConfig
  | HardwareWalletConfig
  | MultiSigRecoveryConfig
  | HybridRecoveryConfig;

/**
 * Social recovery configuration
 */
export interface SocialRecoveryConfig {
  /** Social recovery guardians (friends/contacts) */
  guardians: Address[];
  
  /** Required guardians to approve recovery */
  requiredApprovals: number;
  
  /** Guardian invitation state */
  invitationStates?: Record<Address, 'pending' | 'accepted' | 'declined'>;
}

/**
 * Guardian-based recovery configuration
 */
export interface GuardianBasedConfig {
  /** Guardian addresses */
  guardians: Address[];
  
  /** Guardian types */
  guardianTypes: ('EOA' | 'multisig' | 'smart_contract')[];
  
  /** Quorum percentage (0-100) */
  quorumPercentage: number;
  
  /** Guardian rotation period in days */
  rotationPeriodDays?: number;
}

/**
 * Time lock recovery configuration
 */
export interface TimeLockRecoveryConfig {
  /** Time lock duration in seconds */
  lockDurationSeconds: number;
  
  /** Recovery initiator (self or guardian) */
  recoveryInitiator: 'self' | 'guardian' | 'both';
  
  /** Whether to notify guardians on time lock activation */
  notifyGuardians: boolean;
  
  /** Guardian addresses to notify */
  notificationAddresses?: Address[];
}

/**
 * Backup key recovery configuration
 */
export interface BackupKeyConfig {
  /** Encrypted backup key hash */
  backupKeyHash: Hash;
  
  /** Key derivation method */
  derivationMethod: 'bip39' | 'bip44' | 'custom';
  
  /** Backup storage locations */
  storageLocations: ('cloud' | 'hardware' | 'paper' | 'custom')[];
  
  /** Backup key rotation period in days */
  rotationPeriodDays?: number;
}

/**
 * Hardware wallet recovery configuration
 */
export interface HardwareWalletConfig {
  /** Linked hardware wallet addresses */
  linkedDevices: HardwareDeviceLink[];
  
  /** Minimum devices needed for recovery */
  requiredDevices: number;
  
  /** Hardware wallet provider (Ledger, Trezor, etc.) */
  provider: string;
}

/**
 * Hardware device link
 */
export interface HardwareDeviceLink {
  /** Device identifier */
  deviceId: UUID;
  
  /** Device address */
  address: Address;
  
  /** Device type */
  deviceType: string;
  
  /** Whether device is active */
  isActive: boolean;
  
  /** Link timestamp */
  linkedAt: string;
}

/**
 * Multi-sig recovery configuration
 */
export interface MultiSigRecoveryConfig {
  /** Multi-sig wallet address */
  multiSigAddress: Address;
  
  /** Threshold required */
  threshold: number;
  
  /** Signers of the multi-sig */
  signers: Address[];
}

/**
 * Hybrid recovery configuration (combines multiple methods)
 */
export interface HybridRecoveryConfig {
  /** Recovery methods in priority order */
  methods: RecoveryMethod[];
  
  /** Whether all methods must succeed or just one */
  mode: 'all_required' | 'any_valid' | 'priority_based';
  
  /** Fallback method if primary fails */
  fallbackMethod?: RecoveryMethod;
}

/**
 * Recovery method in hybrid setup
 */
export interface RecoveryMethod {
  /** Method type */
  type: RecoveryPolicyType;
  
  /** Priority (lower = higher priority) */
  priority: number;
  
  /** Method configuration */
  config: RecoveryPolicyConfig;
  
  /** Whether this method is active */
  isActive: boolean;
}

/**
 * Active recovery session
 */
export interface RecoverySession {
  /** Session identifier */
  id: UUID;
  
  /** Associated recovery policy */
  policyId: UUID;
  
  /** Wallet being recovered */
  walletAddress: Address;
  
  /** Recovery type */
  recoveryType: RecoveryPolicyType;
  
  /** Approvals received */
  approvalsReceived: Address[];
  
  /** Approvals required */
  approvalsRequired: number;
  
  /** New owner/signer to set */
  newOwner?: Address;
  
  /** Recovery initiated timestamp */
  initiatedAt: string;
  
  /** Execution scheduled for timestamp */
  scheduledExecutionAt: string;
  
  /** Confirmations received */
  confirmations: RecoveryConfirmation[];
}

/**
 * Recovery confirmation from a guardian
 */
export interface RecoveryConfirmation {
  /** Guardian address */
  guardian: Address;
  
  /** Approval status */
  approved: boolean;
  
  /** Confirmation signature */
  signature?: string;
  
  /** Reason if denied */
  denialReason?: string;
  
  /** Timestamp */
  timestamp: string;
}

/**
 * Emergency access key for last-resort recovery
 */
export interface EmergencyAccessKey {
  /** Key identifier */
  id: UUID;
  
  /** Associated wallet */
  walletAddress: Address;
  
  /** Encrypted key material */
  encryptedKey: string;
  
  /** Encryption method */
  encryptionMethod: 'AES-256-GCM' | 'XChaCha20-Poly1305' | 'custom';
  
  /** Key derivation salt */
  salt: string;
  
  /** Backup code for recovery */
  backupCode?: string;
  
  /** Whether key is active */
  isActive: boolean;
  
  /** Key creation timestamp */
  createdAt: string;
  
  /** Last accessed timestamp */
  lastAccessedAt?: string;
  
  /** Key expiration timestamp */
  expiresAt?: string;
}

/**
 * Advanced features audit log
 */
export interface AdvancedFeaturesAuditEntry {
  /** Entry identifier */
  id: UUID;
  
  /** Associated wallet */
  walletAddress: Address;
  
  /** Event type */
  eventType: 'session_created' | 'session_revoked' | 'session_expired' | 'policy_applied' | 'policy_updated' | 'recovery_initiated' | 'recovery_confirmed' | 'recovery_executed' | 'authorization_granted' | 'authorization_revoked';
  
  /** Event actor */
  actor: Address;
  
  /** Associated session key if applicable */
  sessionKeyId?: UUID;
  
  /** Event details */
  details: Record<string, any>;
  
  /** Timestamp */
  timestamp: string;
}

/**
 * Advanced features configuration summary
 */
export interface AdvancedFeaturesConfig {
  /** Wallet address */
  walletAddress: Address;
  
  /** Enabled session keys */
  activeSessions: SessionKey[];
  
  /** Active authorization policies */
  authorizations: ProgrammableAuthorization[];
  
  /** Recovery policies */
  recoveryPolicies: RecoveryPolicy[];
  
  /** Emergency access enabled */
  emergencyAccessEnabled: boolean;
  
  /** Last security audit timestamp */
  lastSecurityAuditAt?: string;
}
