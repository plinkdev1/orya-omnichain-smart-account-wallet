export type FeatureType = 'swap' | 'stake' | 'lend' | 'bridge' | 'aggregator';

export interface ProtocolPreference {
  chainId: string;
  feature: FeatureType;
  preferredProtocol: string; // Protocol ID
  fallbackProtocols: string[]; // Ordered list of fallbacks
  lastUpdated: Date;
}

export interface UserPreferences {
  // Protocol preferences per chain/feature
  protocols: ProtocolPreference[];
  
  // Global settings
  advancedMode: boolean;
  autoSigning: AutoSigningConfig;
  
  // UI preferences
  defaultChain: string;
  hiddenTokens: string[];
  favoriteProtocols: string[];
}

export interface AutoSigningConfig {
  enabled: boolean;
  thresholdUSD: number; // Auto-sign below this amount
  whitelistedContracts: string[];
  expiryHours: number;
  maxDailyAmountUSD: number;
  requireBiometric: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  protocols: [],
  advancedMode: false,
  autoSigning: {
    enabled: false,
    thresholdUSD: 100,
    whitelistedContracts: [],
    expiryHours: 24,
    maxDailyAmountUSD: 1000,
    requireBiometric: true,
  },
  defaultChain: 'sui',
  hiddenTokens: [],
  favoriteProtocols: [],
};
