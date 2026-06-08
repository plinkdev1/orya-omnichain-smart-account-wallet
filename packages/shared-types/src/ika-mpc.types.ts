/**
 * IKA 2PC-MPC Type Definitions
 * Shared types for zero-trust wallet architecture across all packages
 */

export type IKANetwork = 'mainnet' | 'testnet' | 'devnet';
export type IKAThreshold = '2-of-2' | '2-of-3';
export type KeyShareType = 'user' | 'network';
export type SigningStatus = 'pending' | 'signed' | 'failed';
export type ShareHealthStatus = 'healthy' | 'degraded' | 'offline';
export type WalletLinkageStatus = 'active' | 'revoked' | 'pending';
export type OverallHealthStatus = 'healthy' | 'degraded' | 'offline';
export type SecurityLevel = 'zero-trust-2pc' | 'zero-trust-2of3';

export interface IKAConfig {
  apiKey: string;
  network: IKANetwork;
  threshold: IKAThreshold;
  privyIntegration: boolean;
}

export interface IKAKeyShare {
  shareId: string;
  publicKey: string;
  keyShareType: KeyShareType;
  metadata?: Record<string, unknown>;
}

export interface IKAWallet {
  shareId: string;
  publicKey: string;
  suiAddress: string;
  threshold: IKAThreshold;
}

export interface IKASigningSession {
  id: string;
  shareId: string;
  message: Uint8Array;
  ikaSignature?: Uint8Array;
  status: SigningStatus;
  createdAt: Date;
  expiresAt: Date;
}

export interface IKAShareHealth {
  status: ShareHealthStatus;
  lastSeen: Date;
  backupShares: number;
}

export interface IKAOwnershipProof {
  shareId: string;
  challenge: string;
  proof: string;
  timestamp: Date;
}

export interface EnhancedWallet {
  address: string;
  privyWalletId: string;
  ikaShareId: string;
  securityLevel: SecurityLevel;
  createdAt: Date;
  threshold: IKAThreshold;
}

export interface EnhancedSigningRequest {
  privyWalletId: string;
  ikaShareId: string;
  transaction: unknown;
  metadata?: Record<string, unknown>;
}

export interface EnhancedSigningResult {
  signature: Uint8Array;
  signingSession: IKASigningSession;
  timestamp: Date;
  proofOfCompletion: string;
}

export interface WalletLinkage {
  privyWalletId: string;
  ikaShareId: string;
  linkType: 'enhanced-mpc';
  linkedAt: Date;
  status: WalletLinkageStatus;
}

export interface HealthCheckResult {
  privyHealthy: boolean;
  ikaHealthy: boolean;
  linkageValid: boolean;
  overallStatus: OverallHealthStatus;
  lastCheck: Date;
}

export interface IKAAuditEntry {
  action: string;
  timestamp: Date;
  details: unknown;
}

export interface CombinedSignatureRequest {
  sessionId: string;
  signatures: Uint8Array[];
  threshold: number;
}
