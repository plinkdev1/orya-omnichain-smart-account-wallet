/**   
 * @orya/wallet-core/store  
 *   
 * Redux store configuration and state management  
 */  
  
// Store  
export { createAppStore, store } from './store';  
export type { AppDispatch, RootState } from './store';  
  
// Auth slice  
export { authSlice, logout, setError, setLoading, setSession, setSessionExpiry, setToken, setUser } from './slices/authSlice';  
export type { AuthState } from './slices/authSlice';  
  
// Wallet slice  
export {  
    addWallet, clearWallets, removeWallet,  
    selectWallet,  
    setBalances, setError as setWalletError, setLoading as setWalletLoading, setWallets, updateBalance, walletSlice  
} from './slices/walletSlice';  
export type { WalletState } from './slices/walletSlice';  
  
// Wallet Profile slice  
export {  
    initializeProfile,  
    updateCapabilities,  
    upgradeProfileToWeb3,  
    updateCustodyModel,  
    addSupportedChain,  
    removeSupportedChain,  
    addWallet as addProfileWallet,  
    removeWallet as removeProfileWallet,  
    setActiveWallet,  
    setProfileLoading,  
    setProfileError,  
    clearProfileError,  
    resetProfile,  
    selectProfile,  
    selectUserSegment,  
    selectWalletType,  
    selectCapabilities,  
    selectCustodyModel,  
    selectWallets,  
    selectActiveWallet,  
    selectProfileLoading,  
    selectProfileError,  
    selectProfileInitialized,  
    walletProfileSlice  
} from './slices/walletProfileSlice';  
export type { WalletProfileState } from './slices/walletProfileSlice';  
  
// Onboarding slice  
export {  
    startOnboarding,  
    setUserSegment,  
    setWalletType,  
    advanceStep,  
    saveSessionData,  
    completeOnboarding,  
    resetOnboarding,  
    setLoading as setOnboardingLoading,  
    setError as setOnboardingError,  
    clearError as clearOnboardingError,  
    goBackStep,  
    selectOnboarding,  
    selectCurrentStep,  
    selectUserSegment as selectOnboardingUserSegment,  
    selectWalletType as selectOnboardingWalletType,  
    selectSessionData,  
    selectIsComplete,  
    selectIsStarted,  
    selectOnboardingLoading,  
    selectOnboardingError,  
    selectStepHistory,  
    onboardingSlice,  
    UserSegment,  
    WalletTypeEnum,  
    OnboardingStep,  
} from './slices/onboardingSlice';  
export type { OnboardingState, SessionData } from './slices/onboardingSlice';  
  
// Hooks  
export {  
    useAppDispatch,  
    useAppSelector,  
    useAuth, useAuthError, useAuthLoading, useAuthSession, useAuthUser, useIsAuthenticated, useSelectedWallet, useSelectedWalletId, useWallet, useWalletBalances, useWalletError, useWalletLoading, useWallets  
} from './hooks';  
  
