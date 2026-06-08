/**
 * Zustand Onboarding State Store
 * Manages onboarding flow state, progress, and user selections
 * Uses @orya/wallet-core storage abstraction for consistent behavior
 * 
 * Flows:
 * - Standard: Create new wallet → Chain selection → Recovery phrase
 * - Import: Import existing wallet → Biometric setup
 * - Connect: Connect external wallet → Success
 */

import { StorageFactory } from '@orya/wallet-core/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Create storage adapter using wallet-core factory
const storageAdapter = StorageFactory.create('mobile', AsyncStorage);

// Convert IStorage interface to Zustand storage format
const zustandStorage = {
  getItem: (name: string) => storageAdapter.getItem(name),
  setItem: (name: string, value: string) => storageAdapter.setItem(name, value),
  removeItem: (name: string) => storageAdapter.removeItem(name),
};

export enum UserSegment {
  NORMIE = 'normie_everyday',
  CRYPTO_NATIVE = 'crypto_native',
  INSTITUTIONAL = 'institutional_suite',
  EXTERNAL_CONNECTED = 'external_connected',
}

export type OnboardingFlow = 'standard' | 'import' | 'connect-external' | 'normie' | 'crypto_native' | 'external' | 'institutional';
export type AuthMethod = 'google' | 'apple' | 'email' | 'phone' | 'create-wallet' | 'import' | 'connect';
export type BiometricType = 'faceId' | 'touchId' | 'fingerprint' | 'none';

export interface OnboardingState {
  // Flow tracking
  currentFlow: OnboardingFlow;
  currentStep: number; // 0-8 for main flow
  authMethod: AuthMethod | null;
  userSegment: UserSegment | null;
  
  // User selections
  selectedChain: string; // 'sui', 'aptos', 'ethereum', 'solana'
  walletAddress: string | null;
  recoveryPhrase: string | null;
  
  // Preferences
  biometricType: BiometricType;
  biometricEnabled: boolean;
  termsAccepted: boolean;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  completedSteps: number[]; // Array of completed step indices
  
  // Actions
  setFlow: (flow: OnboardingFlow) => void;
  setStep: (step: number) => void;
  setAuthMethod: (method: AuthMethod | null) => void;
  setUserSegment: (segment: UserSegment) => void;
  setSelectedChain: (chain: string) => void;
  setWalletAddress: (address: string | null) => void;
  setRecoveryPhrase: (phrase: string | null) => void;
  setBiometricType: (type: BiometricType) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setTermsAccepted: (accepted: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  completeStep: (step: number) => void;
  reset: () => void;
}

const initialState = {
  currentFlow: 'standard' as OnboardingFlow,
  currentStep: 0,
  authMethod: null,
  userSegment: null as UserSegment | null,
  selectedChain: 'sui',
  walletAddress: null,
  recoveryPhrase: null,
  biometricType: 'none' as BiometricType,
  biometricEnabled: false,
  termsAccepted: false,
  isLoading: false,
  error: null,
  completedSteps: [],
};

/**
 * Onboarding Store with Persistence
 * Persists critical data to AsyncStorage to support resuming onboarding
 */
export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setFlow: (flow: OnboardingFlow) => {
        set({ currentFlow: flow });
        console.log('[OnboardingStore] Flow set to:', flow);
      },

      setStep: (step: number) => {
        set({ currentStep: step });
        console.log('[OnboardingStore] Step updated:', step);
      },

      setAuthMethod: (method: AuthMethod | null) => {
        set({ authMethod: method });
        console.log('[OnboardingStore] Auth method:', method);
      },

      setUserSegment: (segment: UserSegment) => {
        set({ userSegment: segment });
        console.log('[OnboardingStore] User segment:', segment);
      },

      setSelectedChain: (chain: string) => {
        set({ selectedChain: chain });
        console.log('[OnboardingStore] Chain selected:', chain);
      },

      setWalletAddress: (address: string | null) => {
        set({ walletAddress: address });
        console.log('[OnboardingStore] Wallet address:', address?.slice(0, 10) + '...');
      },

      setRecoveryPhrase: (phrase: string | null) => {
        set({ recoveryPhrase: phrase });
        console.log('[OnboardingStore] Recovery phrase set');
      },

      setBiometricType: (type: BiometricType) => {
        set({ biometricType: type });
        console.log('[OnboardingStore] Biometric type:', type);
      },

      setBiometricEnabled: (enabled: boolean) => {
        set({ biometricEnabled: enabled });
        console.log('[OnboardingStore] Biometric enabled:', enabled);
      },

      setTermsAccepted: (accepted: boolean) => {
        set({ termsAccepted: accepted });
        console.log('[OnboardingStore] Terms accepted:', accepted);
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
        if (error) {
          console.error('[OnboardingStore] Error:', error);
        }
      },

      completeStep: (step: number) => {
        set((state) => ({
          completedSteps: [...new Set([...state.completedSteps, step])],
        }));
        console.log('[OnboardingStore] Step completed:', step);
      },

      reset: () => {
        set(initialState);
        console.log('[OnboardingStore] ✅ Onboarding state reset');
      },
    }),
    {
      name: '@orya/onboarding-store',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        currentFlow: state.currentFlow,
        currentStep: state.currentStep,
        authMethod: state.authMethod,
        userSegment: state.userSegment,
        selectedChain: state.selectedChain,
        biometricEnabled: state.biometricEnabled,
        completedSteps: state.completedSteps,
      }),
    }
  )
);

/**
 * Debug hook for development
 */
export const useOnboardingDebug = () => {
  const store = useOnboardingStore();

  if (process.env.NODE_ENV === 'development') {
    console.log('[OnboardingStore] Current state:', {
      flow: store.currentFlow,
      step: store.currentStep,
      authMethod: store.authMethod,
      chain: store.selectedChain,
      biometricEnabled: store.biometricEnabled,
      termsAccepted: store.termsAccepted,
    });
  }

  return store;
};