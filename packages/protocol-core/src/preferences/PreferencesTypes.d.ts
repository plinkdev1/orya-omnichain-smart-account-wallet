export type FeatureType = 'swap' | 'stake' | 'lend' | 'bridge' | 'aggregator';
export interface ProtocolPreference {
    chainId: string;
    feature: FeatureType;
    preferredProtocol: string;
    fallbackProtocols: string[];
    lastUpdated: Date;
}
export interface UserPreferences {
    protocols: ProtocolPreference[];
    advancedMode: boolean;
    autoSigning: AutoSigningConfig;
    defaultChain: string;
    hiddenTokens: string[];
    favoriteProtocols: string[];
}
export interface AutoSigningConfig {
    enabled: boolean;
    thresholdUSD: number;
    whitelistedContracts: string[];
    expiryHours: number;
    maxDailyAmountUSD: number;
    requireBiometric: boolean;
}
export declare const DEFAULT_PREFERENCES: UserPreferences;
//# sourceMappingURL=PreferencesTypes.d.ts.map