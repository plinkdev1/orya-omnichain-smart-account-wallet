export interface TransGateConnectConfig {
  appId: string;
  zkPass: {
    mode: 'popup' | 'redirect';
    theme: 'light' | 'dark';
  };
  environment: 'prod' | 'sandbox';
}

export interface ZkPassProof {
  vk?: unknown;
  pi?: unknown;
  primaryInput?: unknown;
}

export interface ZkPassVerification {
  verified: boolean;
  transaction_id: string;
  proof: ZkPassProof | null;
  timestamp?: string;
  error?: string;
}

export interface VerificationCredential {
  schema_id: string;
  user_id: string;
  attributes: Record<string, unknown>;
  proof: ZkPassProof;
}

export interface ZkPassVerificationResult {
  success: boolean;
  verification: ZkPassVerification;
  message?: string;
}
