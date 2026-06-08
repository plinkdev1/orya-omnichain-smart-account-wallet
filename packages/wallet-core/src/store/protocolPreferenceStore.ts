import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ProtocolPreference,
  Protocol,
  ChainId,
  FeatureType,
} from '../domain/protocols';

interface ProtocolPreferenceState {
  preferences: ProtocolPreference[];
  availableProtocols: Map<string, Protocol[]>;
  selectedProtocols: Map<string, string>;

  setProtocolPreference: (
    chainId: ChainId,
    feature: FeatureType,
    protocolId: string
  ) => void;
  getProtocolPreference: (
    chainId: ChainId,
    feature: FeatureType
  ) => ProtocolPreference | undefined;
  getPreferredProtocol: (
    chainId: ChainId,
    feature: FeatureType
  ) => Protocol | undefined;
  setAvailableProtocols: (protocols: Protocol[]) => void;
  getAvailableProtocols: (
    chainId: ChainId,
    feature: FeatureType
  ) => Protocol[];
  clearPreference: (chainId: ChainId, feature: FeatureType) => void;
  clearAll: () => void;
}

export const useProtocolPreferenceStore = create<ProtocolPreferenceState>()(
  persist(
    (set, get) => ({
      preferences: [],
      availableProtocols: new Map(),
      selectedProtocols: new Map(),

      setProtocolPreference: (chainId, feature, protocolId) => {
        set((state) => {
          const key = `${chainId}-${feature}`;
          const existingIndex = state.preferences.findIndex(
            (p) => p.chainId === chainId && p.feature === feature
          );

          const newPreference: ProtocolPreference = {
            chainId,
            feature,
            protocolId,
            selectedAt: Date.now(),
          };

          let newPreferences = [...state.preferences];
          if (existingIndex >= 0) {
            newPreferences[existingIndex] = newPreference;
          } else {
            newPreferences.push(newPreference);
          }

          const newSelectedProtocols = new Map(state.selectedProtocols);
          newSelectedProtocols.set(key, protocolId);

          return {
            preferences: newPreferences,
            selectedProtocols: newSelectedProtocols,
          };
        });
      },

      getProtocolPreference: (chainId, feature) => {
        return get().preferences.find(
          (p) => p.chainId === chainId && p.feature === feature
        );
      },

      getPreferredProtocol: (chainId, feature) => {
        const preference = get().getProtocolPreference(chainId, feature);
        if (!preference) return undefined;

        const available = get().getAvailableProtocols(chainId, feature);
        return available.find((p) => p.id === preference.protocolId);
      },

      setAvailableProtocols: (protocols) => {
        set((state) => {
          const newMap = new Map(state.availableProtocols);
          protocols.forEach((protocol) => {
            const key = `${protocol.chain}-${protocol.features[0]}`;
            const existing = newMap.get(key) || [];
            newMap.set(key, existing.concat(protocol));
          });
          return { availableProtocols: newMap };
        });
      },

      getAvailableProtocols: (chainId, feature) => {
        const key = `${chainId}-${feature}`;
        return get().availableProtocols.get(key) || [];
      },

      clearPreference: (chainId, feature) => {
        set((state) => ({
          preferences: state.preferences.filter(
            (p) => !(p.chainId === chainId && p.feature === feature)
          ),
        }));
      },

      clearAll: () => {
        set({
          preferences: [],
          availableProtocols: new Map(),
          selectedProtocols: new Map(),
        });
      },
    }),
    {
      name: 'orya-protocol-preferences',
      version: 1,
      migrate: (persistedState: any) => persistedState,
    }
  )
);
