export type KycStatus = 'pending' | 'verified' | 'rejected' | 'expired' | 'error';
export type KycLevel = 'none' | 'basic' | 'advanced' | 'professional';
export type WebhookEventType =
  | 'kyc.verified'
  | 'kyc.rejected'
  | 'kyc.pending'
  | 'sbt.minted'
  | 'sbt.revoked';

export interface ZkycVerification {
  user_id: string;
  status: KycStatus;
  level: KycLevel;
  verified: boolean;
  sbt_minted: boolean;
  sbt_id?: string;
  sbt_token_address?: string;
  created_at: string;
  verified_at?: string;
  expires_at?: string;
  error?: string;
}

export interface ZkycSBTMintRequest {
  user_id: string;
  wallet_address: string;
  kyc_level: KycLevel;
  attributes?: Record<string, unknown>;
}

export interface ZkycWebhookPayload {
  event_type: WebhookEventType;
  timestamp: string;
  user_id: string;
  data: Record<string, unknown>;
}

export interface ZkycProviderConfig {
  provider: 'sumsub' | 'persona' | 'jumio' | 'onfido';
  apiKey: string;
  secretKey: string;
}

export interface SoulboundToken {
  id: string;
  address: string;
  owner: string;
  kyc_level: KycLevel;
  minted_at: string;
  expires_at?: string;
  metadata: Record<string, unknown>;
}
