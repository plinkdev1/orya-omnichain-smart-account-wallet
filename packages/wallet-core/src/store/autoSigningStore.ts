import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AutoSigningPreference,
  AutoSigningPolicy,
  SigningPreferences,
  SigningMethod,
  ChainId,
} from '../domain/protocols';

interface AutoSigningState {
  preferences: AutoSigningPreference[];
  policies: AutoSigningPolicy[];
  signingPreferences: SigningPreferences;

  addAutoSigningPreference: (preference: AutoSigningPreference) => void;
  updateAutoSigningPreference: (preference: AutoSigningPreference) => void;
  removeAutoSigningPreference: (id: string) => void;
  getAutoSigningPreference: (id: string) => AutoSigningPreference | undefined;
  getPreferencesForProtocol: (protocolId: string) => AutoSigningPreference[];
  getPreferencesForChain: (chainId: ChainId) => AutoSigningPreference[];

  addPolicy: (policy: AutoSigningPolicy) => void;
  updatePolicy: (policy: AutoSigningPolicy) => void;
  removePolicy: (id: string) => void;
  getPolicy: (id: string) => AutoSigningPolicy | undefined;
  getAllPolicies: () => AutoSigningPolicy[];
  enablePolicy: (id: string) => void;
  disablePolicy: (id: string) => void;

  setDefaultSigningMethod: (method: SigningMethod) => void;
  setAllowAutoSign: (allow: boolean) => void;
  clearAll: () => void;
}

const defaultSigningPreferences: SigningPreferences = {
  defaultMethod: 'biometric',
  allowAutoSign: false,
  autoSigningPolicies: [],
};

export const useAutoSigningStore = create<AutoSigningState>()(
  persist(
    (set, get) => ({
      preferences: [],
      policies: [],
      signingPreferences: defaultSigningPreferences,

      addAutoSigningPreference: (preference) => {
        set((state) => ({
          preferences: [...state.preferences, preference],
        }));
      },

      updateAutoSigningPreference: (preference) => {
        set((state) => ({
          preferences: state.preferences.map((p) =>
            p.id === preference.id ? preference : p
          ),
        }));
      },

      removeAutoSigningPreference: (id) => {
        set((state) => ({
          preferences: state.preferences.filter((p) => p.id !== id),
        }));
      },

      getAutoSigningPreference: (id) => {
        return get().preferences.find((p) => p.id === id);
      },

      getPreferencesForProtocol: (protocolId) => {
        return get().preferences.filter((p) => p.protocolId === protocolId);
      },

      getPreferencesForChain: (chainId) => {
        return get().preferences.filter((p) => p.chainId === chainId);
      },

      addPolicy: (policy) => {
        set((state) => ({
          policies: [...state.policies, policy],
        }));
      },

      updatePolicy: (policy) => {
        set((state) => ({
          policies: state.policies.map((p) =>
            p.id === policy.id ? policy : p
          ),
        }));
      },

      removePolicy: (id) => {
        set((state) => ({
          policies: state.policies.filter((p) => p.id !== id),
        }));
      },

      getPolicy: (id) => {
        return get().policies.find((p) => p.id === id);
      },

      getAllPolicies: () => {
        return get().policies;
      },

      enablePolicy: (id) => {
        const policy = get().getPolicy(id);
        if (policy) {
          get().updatePolicy({
            ...policy,
            enabled: true,
            updatedAt: Date.now(),
          });
        }
      },

      disablePolicy: (id) => {
        const policy = get().getPolicy(id);
        if (policy) {
          get().updatePolicy({
            ...policy,
            enabled: false,
            updatedAt: Date.now(),
          });
        }
      },

      setDefaultSigningMethod: (method) => {
        set((state) => ({
          signingPreferences: {
            ...state.signingPreferences,
            defaultMethod: method,
            lastUsedMethod: method,
          },
        }));
      },

      setAllowAutoSign: (allow) => {
        set((state) => ({
          signingPreferences: {
            ...state.signingPreferences,
            allowAutoSign: allow,
          },
        }));
      },

      clearAll: () => {
        set({
          preferences: [],
          policies: [],
          signingPreferences: defaultSigningPreferences,
        });
      },
    }),
    {
      name: 'orya-auto-signing',
      version: 1,
      migrate: (persistedState: any) => persistedState,
    }
  )
);
