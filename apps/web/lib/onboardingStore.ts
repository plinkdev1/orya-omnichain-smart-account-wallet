'use client';

/**
 * Zustand Onboarding State Store (Web Version)
 * Manages onboarding flow state, progress, and user selections
 * 
 * Mirrors mobile implementation with localStorage persistence
 * 
 * Flows:
 * - Standard: Create new wallet → Chain selection → Recovery phrase
 * - Import: Import existing wallet → Biometric setup → Success
 * - Connect: Connect external wallet → Biometric setup → Success
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type OnboardingFlow = 'standard' | 'import' | 'connect-external';
export type AuthMethod = 'google' | 'apple' | 'email' | 'phone' | 'create-wallet' | 'import' | 'connect';
export type BiometricType = 'webauthn' | 'passwordless' | 'none';
export type WalletSecurityLevel = 'human-network' | 'orya-standard' | 'orya-enhanced';
export type UserSegment = 'normie' | 'crypto-native' | 'institutional' | 'external';

export interface OnboardingState {
  // Flow tracking
  currentFlow: OnboardingFlow;
  currentStep: number; // 0-8 for main flow
  authMethod: AuthMethod | null;
  userSegment: UserSegment | null;

  // User selections
  selectedChain: string; // 'sui', 'aptos', 'ethereum', 'solana', etc.
  walletAddress: string | null;
  recoveryPhrase: string | null;
  walletSecurityLevel: WalletSecurityLevel;

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
  setUserSegment: (segment: UserSegment | null) => void;
  setSelectedChain: (chain: string) => void;
  setWalletAddress: (address: string | null) => void;
  setRecoveryPhrase: (phrase: string | null) => void;
  setWalletSecurityLevel: (level: WalletSecurityLevel) => void;
  setBiometricType: (type: BiometricType) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setTermsAccepted: (accepted: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  completeStep: (step: number) => void;
  reset: () => void;
}

const initialState: Omit<OnboardingState, keyof {
  setFlow: any;
  setStep: any;
  setAuthMethod: any;
  setUserSegment: any;
  setSelectedChain: any;
  setWalletAddress: any;
  setRecoveryPhrase: any;
  setWalletSecurityLevel: any;
  setBiometricType: any;
  setBiometricEnabled: any;
  setTermsAccepted: any;
  setLoading: any;
  setError: any;
  completeStep: any;
  reset: any;
}> = {
  currentFlow: 'standard',
  currentStep: 0,
  authMethod: null,
  userSegment: null,
  selectedChain: 'sui',
  walletAddress: null,
  recoveryPhrase: null,
  walletSecurityLevel: 'orya-standard',
  biometricType: 'none',
  biometricEnabled: false,
  termsAccepted: false,
  isLoading: false,
  error: null,
  completedSteps: [],
};

/**
 * Onboarding Store with localStorage Persistence
 * Persists critical data to support resuming onboarding
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

      setUserSegment: (segment: UserSegment | null) => {
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

      setWalletSecurityLevel: (level: WalletSecurityLevel) => {
        set({ walletSecurityLevel: level });
        console.log('[OnboardingStore] Wallet security level:', level);
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
      storage: createJSONStorage(() => ({
        getItem: (key) => {
          if (typeof window === 'undefined') return null;
          return localStorage.getItem(key);
        },
        setItem: (key, value) => {
          if (typeof window === 'undefined') return;
          localStorage.setItem(key, value);
        },
        removeItem: (key) => {
          if (typeof window === 'undefined') return;
          localStorage.removeItem(key);
        },
      })),
      partialize: (state) => ({
        currentFlow: state.currentFlow,
        currentStep: state.currentStep,
        authMethod: state.authMethod,
        userSegment: state.userSegment,
        selectedChain: state.selectedChain,
        walletSecurityLevel: state.walletSecurityLevel,
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