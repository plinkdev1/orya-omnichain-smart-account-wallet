export type FeatureType = 'swap' | 'stake' | 'lend' | 'bridge' | 'yield' | 'farm';
export type ProtocolType = 'dex' | 'aggregator' | 'orderbook' | 'lending' | 'staking' | 'bridge' | 'yield';
export type SigningMethod = 'biometric' | 'passkey' | 'password' | 'hardware';
export type ChainId = string;

export interface Protocol {
  id: string;
  name: string;
  logo: string;
  apy?: number;
  tvl: string;
  fee: string;
  isAudited: boolean;
  auditors: string[];
  securityRating: number;
  isPreferred?: boolean;
  type: ProtocolType;
  description: string;
  chain: ChainId;
  features: FeatureType[];
}

export interface ProtocolPreference {
  chainId: ChainId;
  feature: FeatureType;
  protocolId: string;
  selectedAt: number;
}

export interface AutoSigningPreference {
  id: string;
  protocolId: string;
  chainId: ChainId;
  enabled: boolean;
  maxAmountUSD?: number;
  maxTransactionSize?: number;
  signingMethod: SigningMethod;
  requiresConfirmation: boolean;
  expiresAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface AutoSigningPolicy {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  rules: AutoSigningRule[];
  createdAt: number;
  updatedAt: number;
}

export interface AutoSigningRule {
  id: string;
  type: 'amount' | 'protocol' | 'chain' | 'time';
  condition: string;
  value: string | number;
  enabled: boolean;
}

export interface ProtocolSelection {
  selected: Protocol | null;
  available: Protocol[];
  loading: boolean;
  error?: string | null;
}

export interface SigningPreferences {
  defaultMethod: SigningMethod;
  allowAutoSign: boolean;
  autoSigningPolicies: AutoSigningPolicy[];
  lastUsedMethod?: SigningMethod;
}
