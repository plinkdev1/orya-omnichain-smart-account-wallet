import { DEFAULT_PREFERENCES } from './PreferencesTypes';
export class PreferencesStore {
    constructor() {
        this.preferences = DEFAULT_PREFERENCES;
        this.storageKey = 'orya_user_preferences';
        this.storage = null;
        this.initializeStorage();
    }
    static getInstance() {
        if (!PreferencesStore.instance) {
            PreferencesStore.instance = new PreferencesStore();
        }
        return PreferencesStore.instance;
    }
    async initializeStorage() {
        if (typeof window !== 'undefined' && window.localStorage) {
            this.storage = window.localStorage;
        }
        await this.load();
    }
    setStorageAdapter(storage) {
        this.storage = storage;
    }
    getProtocolPreference(chainId, feature) {
        const preference = this.preferences.protocols.find((p) => p.chainId === chainId && p.feature === feature);
        return preference?.preferredProtocol || null;
    }
    getProtocolPreferences(chainId, feature) {
        return (this.preferences.protocols.find((p) => p.chainId === chainId && p.feature === feature) || null);
    }
    setProtocolPreference(chainId, feature, preferredProtocol, fallbackProtocols = []) {
        const index = this.preferences.protocols.findIndex((p) => p.chainId === chainId && p.feature === feature);
        const newPreference = {
            chainId,
            feature,
            preferredProtocol,
            fallbackProtocols,
            lastUpdated: new Date(),
        };
        if (index >= 0) {
            this.preferences.protocols[index] = newPreference;
        }
        else {
            this.preferences.protocols.push(newPreference);
        }
        this.save();
    }
    setAutoSigning(enabled, config) {
        this.preferences.autoSigning = {
            ...this.preferences.autoSigning,
            enabled,
            ...config,
        };
        this.save();
    }
    setAdvancedMode(enabled) {
        this.preferences.advancedMode = enabled;
        this.save();
    }
    setDefaultChain(chainId) {
        this.preferences.defaultChain = chainId;
        this.save();
    }
    addHiddenToken(tokenAddress) {
        if (!this.preferences.hiddenTokens.includes(tokenAddress)) {
            this.preferences.hiddenTokens.push(tokenAddress);
            this.save();
        }
    }
    removeHiddenToken(tokenAddress) {
        this.preferences.hiddenTokens = this.preferences.hiddenTokens.filter((t) => t !== tokenAddress);
        this.save();
    }
    addFavoriteProtocol(protocolId) {
        if (!this.preferences.favoriteProtocols.includes(protocolId)) {
            this.preferences.favoriteProtocols.push(protocolId);
            this.save();
        }
    }
    removeFavoriteProtocol(protocolId) {
        this.preferences.favoriteProtocols = this.preferences.favoriteProtocols.filter((p) => p !== protocolId);
        this.save();
    }
    getPreferences() {
        return { ...this.preferences };
    }
    setPreferences(preferences) {
        this.preferences = {
            ...this.preferences,
            ...preferences,
        };
        this.save();
    }
    reset() {
        this.preferences = { ...DEFAULT_PREFERENCES };
        this.save();
    }
    async save() {
        if (!this.storage)
            return;
        try {
            const serialized = JSON.stringify(this.preferences, (key, value) => {
                if (key === 'lastUpdated' && value instanceof Date) {
                    return value.toISOString();
                }
                return value;
            });
            this.storage.setItem(this.storageKey, serialized);
        }
        catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }
    async load() {
        if (!this.storage)
            return;
        try {
            const stored = this.storage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                this.preferences = {
                    ...parsed,
                    protocols: (parsed.protocols || []).map((p) => ({
                        ...p,
                        lastUpdated: new Date(p.lastUpdated),
                    })),
                };
            }
        }
        catch (error) {
            console.error('Failed to load preferences:', error);
            this.preferences = { ...DEFAULT_PREFERENCES };
        }
    }
    export() {
        return JSON.stringify(this.preferences, null, 2);
    }
    import(data) {
        try {
            const parsed = JSON.parse(data);
            this.preferences = {
                ...parsed,
                protocols: (parsed.protocols || []).map((p) => ({
                    ...p,
                    lastUpdated: new Date(p.lastUpdated),
                })),
            };
            this.save();
            return true;
        }
        catch (error) {
            console.error('Failed to import preferences:', error);
            return false;
        }
    }
}
export const preferencesStore = PreferencesStore.getInstance();
//# sourceMappingURL=PreferencesStore.js.map