import type { UserPreferences, ProtocolPreference, FeatureType } from './PreferencesTypes';
import { DEFAULT_PREFERENCES } from './PreferencesTypes';
export declare class PreferencesStore {
    private static instance;
    private preferences;
    private storageKey;
    private storage;
    private constructor();
    static getInstance(): PreferencesStore;
    private initializeStorage;
    setStorageAdapter(storage: any): void;
    getProtocolPreference(chainId: string, feature: FeatureType): string | null;
    getProtocolPreferences(chainId: string, feature: FeatureType): ProtocolPreference | null;
    setProtocolPreference(chainId: string, feature: FeatureType, preferredProtocol: string, fallbackProtocols?: string[]): void;
    setAutoSigning(enabled: boolean, config?: Partial<typeof DEFAULT_PREFERENCES.autoSigning>): void;
    setAdvancedMode(enabled: boolean): void;
    setDefaultChain(chainId: string): void;
    addHiddenToken(tokenAddress: string): void;
    removeHiddenToken(tokenAddress: string): void;
    addFavoriteProtocol(protocolId: string): void;
    removeFavoriteProtocol(protocolId: string): void;
    getPreferences(): UserPreferences;
    setPreferences(preferences: Partial<UserPreferences>): void;
    reset(): void;
    private save;
    private load;
    export(): string;
    import(data: string): boolean;
}
export declare const preferencesStore: PreferencesStore;
//# sourceMappingURL=PreferencesStore.d.ts.map