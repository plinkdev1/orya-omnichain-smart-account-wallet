import type { UserPreferences, ProtocolPreference, FeatureType } from './PreferencesTypes';
import { DEFAULT_PREFERENCES } from './PreferencesTypes';

export class PreferencesStore {
  private static instance: PreferencesStore;
  private preferences: UserPreferences = DEFAULT_PREFERENCES;
  private storageKey = 'orya_user_preferences';
  private storage: Storage | null = null;

  private constructor() {
    this.initializeStorage();
  }

  static getInstance(): PreferencesStore {
    if (!PreferencesStore.instance) {
      PreferencesStore.instance = new PreferencesStore();
    }
    return PreferencesStore.instance;
  }

  private async initializeStorage(): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      this.storage = window.localStorage;
    }
    await this.load();
  }

  setStorageAdapter(storage: any): void {
    this.storage = storage;
  }

  getProtocolPreference(chainId: string, feature: FeatureType): string | null {
    const preference = this.preferences.protocols.find(
      (p) => p.chainId === chainId && p.feature === feature
    );
    return preference?.preferredProtocol || null;
  }

  getFallbackProtocols(chainId: string, feature: FeatureType): string[] {
    const preference = this.preferences.protocols.find(
      (p) => p.chainId === chainId && p.feature === feature
    );
    return preference?.fallbackProtocols || [];
  }

  getProtocolPreferences(chainId: string, feature: FeatureType): ProtocolPreference | null {
    return (
      this.preferences.protocols.find(
        (p) => p.chainId === chainId && p.feature === feature
      ) || null
    );
  }

  setProtocolPreference(
    chainId: string,
    feature: FeatureType,
    preferredProtocol: string,
    fallbackProtocols: string[] = []
  ): void {
    const index = this.preferences.protocols.findIndex(
      (p) => p.chainId === chainId && p.feature === feature
    );

    const newPreference: ProtocolPreference = {
      chainId,
      feature,
      preferredProtocol,
      fallbackProtocols,
      lastUpdated: new Date(),
    };

    if (index >= 0) {
      this.preferences.protocols[index] = newPreference;
    } else {
      this.preferences.protocols.push(newPreference);
    }

    this.save();
  }

  setAutoSigning(enabled: boolean, config?: Partial<typeof DEFAULT_PREFERENCES.autoSigning>): void {
    this.preferences.autoSigning = {
      ...this.preferences.autoSigning,
      enabled,
      ...config,
    };
    this.save();
  }

  setAdvancedMode(enabled: boolean): void {
    this.preferences.advancedMode = enabled;
    this.save();
  }

  setDefaultChain(chainId: string): void {
    this.preferences.defaultChain = chainId;
    this.save();
  }

  addHiddenToken(tokenAddress: string): void {
    if (!this.preferences.hiddenTokens.includes(tokenAddress)) {
      this.preferences.hiddenTokens.push(tokenAddress);
      this.save();
    }
  }

  removeHiddenToken(tokenAddress: string): void {
    this.preferences.hiddenTokens = this.preferences.hiddenTokens.filter(
      (t) => t !== tokenAddress
    );
    this.save();
  }

  addFavoriteProtocol(protocolId: string): void {
    if (!this.preferences.favoriteProtocols.includes(protocolId)) {
      this.preferences.favoriteProtocols.push(protocolId);
      this.save();
    }
  }

  removeFavoriteProtocol(protocolId: string): void {
    this.preferences.favoriteProtocols = this.preferences.favoriteProtocols.filter(
      (p) => p !== protocolId
    );
    this.save();
  }

  getPreferences(): UserPreferences {
    return { ...this.preferences };
  }

  setPreferences(preferences: Partial<UserPreferences>): void {
    this.preferences = {
      ...this.preferences,
      ...preferences,
    };
    this.save();
  }

  reset(): void {
    this.preferences = { ...DEFAULT_PREFERENCES };
    this.save();
  }

  private async save(): Promise<void> {
    if (!this.storage) return;

    try {
      const serialized = JSON.stringify(this.preferences, (key, value) => {
        if (key === 'lastUpdated' && value instanceof Date) {
          return value.toISOString();
        }
        return value;
      });
      this.storage.setItem(this.storageKey, serialized);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }

  private async load(): Promise<void> {
    if (!this.storage) return;

    try {
      const stored = this.storage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as UserPreferences;
        this.preferences = {
          ...parsed,
          protocols: (parsed.protocols || []).map((p) => ({
            ...p,
            lastUpdated: new Date(p.lastUpdated),
          })),
        };
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      this.preferences = { ...DEFAULT_PREFERENCES };
    }
  }

  export(): string {
    return JSON.stringify(this.preferences, null, 2);
  }

  import(data: string): boolean {
    try {
      const parsed = JSON.parse(data) as UserPreferences;
      this.preferences = {
        ...parsed,
        protocols: (parsed.protocols || []).map((p) => ({
          ...p,
          lastUpdated: new Date(p.lastUpdated),
        })),
      };
      this.save();
      return true;
    } catch (error) {
      console.error('Failed to import preferences:', error);
      return false;
    }
  }
}

export const preferencesStore = PreferencesStore.getInstance();
