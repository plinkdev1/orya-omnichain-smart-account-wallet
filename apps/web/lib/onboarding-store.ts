import { create } from 'zustand';
import { WalletType, WalletRouter } from './wallet/wallet-router';

export interface OnboardingState {
  // Current step
  currentStep: number;
  
  // User selections
  selectedWalletType: WalletType | null;
  selectedFeatures: string[];
  
  // User data
  email: string;
  displayName: string;
  
  // Wallet data
  walletAddress: string | null;
  walletCreated: boolean;
  
  // Progress
  isLoading: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  
  // Authentication
  isAuthenticated: boolean;
  authProvider: string | null;
  
  // Actions
  setStep: (step: number) => void;
  setWalletType: (type: WalletType) => void;
  setFeature: (featureId: string, enabled: boolean) => void;
  setEmail: (email: string) => void;
  setDisplayName: (name: string) => void;
  setWalletAddress: (address: string) => void;
  setWalletCreated: (created: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (message: string | null) => void;
  setAuthenticated: (authenticated: boolean, provider?: string) => void;
  reset: () => void;
  getSelectedConfig: () => ReturnType<typeof WalletRouter.getWalletConfig> | null;
}

const initialState = {
  currentStep: 0,
  selectedWalletType: null,
  selectedFeatures: [],
  email: '',
  displayName: '',
  walletAddress: null,
  walletCreated: false,
  isLoading: false,
  errorMessage: null,
  successMessage: null,
  isAuthenticated: false,
  authProvider: null,
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  ...initialState,
  
  setStep: (step: number) => set({ currentStep: step }),
  
  setWalletType: (type: WalletType) => {
    set({ 
      selectedWalletType: type,
      selectedFeatures: [],
    });
  },
  
  setFeature: (featureId: string, enabled: boolean) => {
    set(state => {
      const features = state.selectedFeatures;
      if (enabled && !features.includes(featureId)) {
        return { selectedFeatures: [...features, featureId] };
      } else if (!enabled && features.includes(featureId)) {
        return { selectedFeatures: features.filter(f => f !== featureId) };
      }
      return state;
    });
  },
  
  setEmail: (email: string) => set({ email }),
  
  setDisplayName: (name: string) => set({ displayName: name }),
  
  setWalletAddress: (address: string) => set({ walletAddress: address }),
  
  setWalletCreated: (created: boolean) => set({ walletCreated: created }),
  
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  
  setError: (error: string | null) => set({ errorMessage: error }),
  
  setSuccess: (message: string | null) => set({ successMessage: message }),
  
  setAuthenticated: (authenticated: boolean, provider?: string) => {
    set({ 
      isAuthenticated: authenticated,
      authProvider: provider || null,
    });
  },
  
  reset: () => {
    set(initialState);
    // Also clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('onboarding-store');
      localStorage.removeItem('orya-wallet-type');
    }
  },
  
  getSelectedConfig: () => {
    const state = get();
    if (!state.selectedWalletType) return null;
    return WalletRouter.getWalletConfig(state.selectedWalletType);
  },
}));

// Add localStorage persistence
if (typeof window !== 'undefined') {
  useOnboardingStore.subscribe((state) => {
    localStorage.setItem('onboarding-store', JSON.stringify(state));
  });
}
