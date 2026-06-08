/**
 * Multi-Signature Wallet Types
 * Comprehensive custody, signing, and threshold signature management
 * Supports M-of-N threshold schemes with advanced custodial models
 */

import { UUID, Address, Hash } from './common.types';
import { ChainType } from './chain.types';

/**
 * Signature threshold types (M-of-N)
 */
export type SignatureThreshold = 
  | '1-of-1' | '1-of-2' | '1-of-3'
  | '2-of-2' | '2-of-3' | '2-of-4' | '2-of-5'
  | '3-of-3' | '3-of-4' | '3-of-5'
  | '4-of-5' | '5-of-5'
  | '4-of-4';

/**
 * Custody models for multi-sig wallets
 */
export enum CustodyType {
  // Full user control
  SELF_CUSTODY = 'self_custody',
  
  // Distributed trust
  MULTI_SIG_2OF2 = 'multi_sig_2of2',
  MULTI_SIG_2OF3 = 'multi_sig_2of3',
  MULTI_SIG_3OF5 = 'multi_sig_3of5',
  
  // Institutional custody with user recovery
  INSTITUTIONAL_WITH_RECOVERY = 'institutional_with_recovery',
  
  // Exchange/Custodian controlled
  EXCHANGE_CUSTODY = 'exchange_custody',
}

/**
 * Signer role types
 */
export enum SignerRole {
  OWNER = 'owner',
  APPROVER = 'approver',
  EXECUTOR = 'executor',
  FINANCIAL_OFFICER = 'financial_officer',
  COMPLIANCE_OFFICER = 'compliance_officer',
  BACKUP = 'backup',
}

/**
 * Signer types
 */
export enum SignerType {
  EOA = 'eoa',              // Externally Owned Account
  SMART_CONTRACT = 'smart_contract',
  HARDWARE_WALLET = 'hardware_wallet',
  MPC_SHARE = 'mpc_share',
  THRESHOLD_KEY = 'threshold_key',
}

/**
 * Signature collection status
 */
export enum SignatureStatus {
  PENDING = 'pending',
  SIGNED = 'signed',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

/**
 * Transaction proposal status
 */
export enum ProposalStatus {
  DRAFT = 'draft',
  PENDING_SIGNATURES = 'pending_signatures',
  READY_FOR_EXECUTION = 'ready_for_execution',
  EXECUTED = 'executed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

/**
 * Multi-signature wallet configuration
 */
export interface MultiSigConfig {
  /** Threshold for signature requirements (M-of-N) */
  threshold: SignatureThreshold;
  
  /** Total number of signers */
  totalSigners: number;
  
  /** List of signer addresses */
  signers: MultiSigSigner[];
  
  /** Custody model used */
  custodyModel: CustodyType;
  
  /** Execution delay in seconds (0 = no delay) */
  executionDelay?: number;
  
  /** Expiration time for proposals in seconds */
  proposalExpiration?: number;
  
  /** Enable emergency recovery */
  emergencyRecoveryEnabled?: boolean;
}

/**
 * Multi-signature signer definition
 */
export interface MultiSigSigner {
  /** Unique signer identifier */
  id: UUID;
  
  /** Blockchain address of the signer */
  address: Address;
  
  /** Signer type (EOA, smart contract, hardware, etc.) */
  type: SignerType;
  
  /** Role of the signer */
  role: SignerRole;
  
  /** Display name */
  name?: string;
  
  /** Whether the signer is currently active */
  isActive: boolean;
  
  /** Signer-specific metadata */
  metadata?: {
    deviceId?: string;
    hardwareWalletType?: string;
    mpcProviderId?: string;
    [key: string]: any;
  };
}

/**
 * Multi-signature wallet
 */
export interface MultiSigWallet {
  /** Unique wallet identifier */
  id: UUID;
  
  /** Wallet address (deterministic from signers and threshold) */
  address: Address;
  
  /** Configuration */
  config: MultiSigConfig;
  
  /** Chain type */
  chainType: ChainType;
  
  /** Custody model */
  custodyModel: CustodyType;
  
  /** Current signers */
  signers: MultiSigSigner[];
  
  /** Key shares for MPC wallets */
  keyShares?: KeyShare[];
  
  /** Wallet creator */
  createdBy: UUID;
  
  /** Creation timestamp */
  createdAt: string;
  
  /** Last update timestamp */
  updatedAt: string;
  
  /** Whether wallet is active */
  isActive: boolean;
  
  /** Nonce for tracking signatures */
  nonce: number;
}

/**
 * Key share for MPC-based multi-sig
 */
export interface KeyShare {
  /** Unique share identifier */
  id: UUID;
  
  /** Associated signer */
  signerId: UUID;
  
  /** Public key */
  publicKey: string;
  
  /** Share index in threshold scheme */
  shareIndex: number;
  
  /** Share type */
  shareType: 'user' | 'network' | 'backup';
  
  /** Whether share is available */
  isAvailable: boolean;
  
  /** Share metadata */
  metadata?: Record<string, any>;
}

/**
 * Transaction signature
 */
export interface TransactionSignature {
  /** Unique signature identifier */
  id: UUID;
  
  /** Associated proposal */
  proposalId: UUID;
  
  /** Signer who provided the signature */
  signerId: UUID;
  
  /** Actual signature data */
  signature: string;
  
  /** Signature type */
  signatureType: 'ECDSA' | 'BLS' | 'schnorr' | 'eoa_signature';
  
  /** Signature collection status */
  status: SignatureStatus;
  
  /** Timestamp when signed */
  signedAt?: string;
  
  /** Signature expiration timestamp */
  expiresAt?: string;
  
  /** Optional rejection reason */
  rejectionReason?: string;
}

/**
 * Transaction proposal for multi-sig execution
 */
export interface TransactionProposal {
  /** Unique proposal identifier */
  id: UUID;
  
  /** Associated wallet */
  walletId: UUID;
  
  /** Multi-sig address */
  multiSigAddress: Address;
  
  /** Proposal status */
  status: ProposalStatus;
  
  /** Transaction data to execute */
  transaction: TransactionData;
  
  /** Proposer address */
  proposer: Address;
  
  /** Collected signatures */
  signatures: TransactionSignature[];
  
  /** Signature threshold requirement */
  threshold: SignatureThreshold;
  
  /** Total signers on wallet */
  totalSigners: number;
  
  /** Required signatures (parsed from threshold) */
  requiredSignatures: number;
  
  /** Execution timestamp */
  executedAt?: string;
  
  /** Transaction hash after execution */
  txHash?: Hash;
  
  /** Failure reason if applicable */
  failureReason?: string;
  
  /** Creation timestamp */
  createdAt: string;
  
  /** Expiration timestamp */
  expiresAt: string;
  
  /** Optional description */
  description?: string;
  
  /** Metadata for tracking */
  metadata?: Record<string, any>;
}

/**
 * Transaction data to be executed
 */
export interface TransactionData {
  /** Target address */
  to: Address;
  
  /** Value to send (in wei/smallest unit) */
  value: string;
  
  /** Call data */
  data: string;
  
  /** Operation type (0 = CALL, 1 = DELEGATECALL, 2 = CREATE) */
  operation: 0 | 1 | 2;
  
  /** Gas limit */
  gasLimit?: string;
  
  /** Gas price / priority fee */
  gasPrice?: string;
  
  /** Max fee per gas (EIP-1559) */
  maxFeePerGas?: string;
  
  /** Max priority fee per gas (EIP-1559) */
  maxPriorityFeePerGas?: string;
  
  /** Payload description */
  description?: string;
}

/**
 * Signature collection batch for efficiency
 */
export interface SignatureBatch {
  /** Batch identifier */
  id: UUID;
  
  /** Associated proposal */
  proposalId: UUID;
  
  /** Signers to collect from */
  targetSigners: UUID[];
  
  /** Collected signatures mapped by signer ID */
  signatures: Record<UUID, TransactionSignature>;
  
  /** Whether batch is complete */
  isComplete: boolean;
  
  /** Creation timestamp */
  createdAt: string;
  
  /** Expected completion timestamp */
  completionDeadline: string;
}

/**
 * Multi-sig wallet history entry
 */
export interface MultiSigAuditEntry {
  /** Unique entry identifier */
  id: UUID;
  
  /** Associated wallet */
  walletId: UUID;
  
  /** Action type */
  action: 'wallet_created' | 'signer_added' | 'signer_removed' | 'threshold_changed' | 'proposal_created' | 'signature_collected' | 'proposal_executed' | 'proposal_failed' | 'recovery_initiated';
  
  /** Actor who performed the action */
  actor: Address;
  
  /** Action details */
  details: Record<string, any>;
  
  /** Timestamp */
  timestamp: string;
  
  /** Transaction hash if applicable */
  txHash?: Hash;
}

/**
 * Custody recovery configuration
 */
export interface CustodyRecovery {
  /** Unique identifier */
  id: UUID;
  
  /** Associated wallet */
  walletId: UUID;
  
  /** Recovery type */
  recoveryType: 'social_recovery' | 'time_lock' | 'backup_key' | 'guardian_based';
  
  /** Guardians or backup addresses */
  guardians: Address[];
  
  /** Threshold of guardians needed to recover */
  guardianThreshold: number;
  
  /** Time lock duration in seconds */
  timeLockDuration?: number;
  
  /** Whether recovery is enabled */
  isEnabled: boolean;
  
  /** Last initiated recovery timestamp */
  lastRecoveryAt?: string;
}

/**
 * Signature request for off-chain signing
 */
export interface OffChainSignatureRequest {
  /** Unique request identifier */
  id: UUID;
  
  /** Associated proposal */
  proposalId: UUID;
  
  /** Message/data to sign */
  message: string;
  
  /** Message hash */
  messageHash: Hash;
  
  /** Signing method */
  signingMethod: 'personal_sign' | 'eth_sign_typed_data' | 'raw' | 'eip712';
  
  /** Domain separator for EIP-712 */
  domain?: Record<string, any>;
  
  /** Types for EIP-712 */
  types?: Record<string, Array<{ name: string; type: string }>>;
  
  /** Creation timestamp */
  createdAt: string;
  
  /** Expiration timestamp */
  expiresAt: string;
}

/**
 * Multi-sig statistics for monitoring
 */
export interface MultiSigStats {
  /** Total wallets created */
  totalWallets: number;
  
  /** Active wallets */
  activeWallets: number;
  
  /** Total proposals */
  totalProposals: number;
  
  /** Executed proposals */
  executedProposals: number;
  
  /** Failed proposals */
  failedProposals: number;
  
  /** Average signature collection time (ms) */
  avgSignatureTime: number;
  
  /** Signature success rate (0-100) */
  signatureSuccessRate: number;
}
