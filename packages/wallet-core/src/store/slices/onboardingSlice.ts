/**
 * Redux Onboarding Slice
 * Manages onboarding state: user segment, wallet type, current step, session data
 * Implements Phase 1.5 branching architecture for 4 user types
 */

import { createSlice, PayloadAction, Slice } from "@reduxjs/toolkit";

export enum UserSegment {
  NORMIE = "normie",
  CRYPTO_NATIVE = "crypto_native",
  INSTITUTIONAL = "institutional",
}

export enum WalletTypeEnum {
  NORMIE_EVERYDAY = "normie_everyday",
  SUI_NATIVE_SELF = "sui_native_self",
  EXTERNAL_CONNECTED = "external_connected",
  INSTITUTIONAL_SUITE = "inst_suite",
}

export enum OnboardingStep {
  SPLASH = "splash",
  INTRO_SCREENS = "intro_screens",
  IDENTITY_QUESTION = "identity_question",
  NORMIE_SOCIAL_LOGIN = "normie_social_login",
  NORMIE_CARD_SETUP = "normie_card_setup",
  NORMIE_BIOMETRIC = "normie_biometric",
  CRYPTO_WALLET_CHOICE = "crypto_wallet_choice",
  CRYPTO_CONNECT_EXISTING = "crypto_connect_existing",
  CRYPTO_MPC_CREATION = "crypto_mpc_creation",
  CRYPTO_PASSKEY = "crypto_passkey",
  EXTERNAL_WALLETCONNECT = "external_walletconnect",
  INSTITUTIONAL_KYB = "institutional_kyb",
  INSTITUTIONAL_MULTISIG = "institutional_multisig",
  LANDING_VAULT = "landing_vault",
  COMPLETE = "complete",
}

export interface SessionData {
  userId?: string;
  userEmail?: string;
  userPhone?: string;
  walletAddress?: string;
  walletName?: string;
  socialProvider?: "google" | "apple" | "email" | "phone";
  mpcStatus?: "pending" | "generating" | "completed";
  externalWalletAddress?: string;
  externalWalletName?: string;
  kyb?: {
    companyName?: string;
    companyRegistration?: string;
    beneficialOwners?: string[];
  };
  passkeyId?: string;
  biometricEnabled?: boolean;
}

export interface OnboardingState {
  isStarted: boolean;
  isComplete: boolean;
  currentStep: OnboardingStep;
  userSegment: UserSegment | null;
  walletType: WalletTypeEnum | null;
  sessionData: SessionData;
  loading: boolean;
  error: string | null;
  stepHistory: OnboardingStep[];
}

const initialState: OnboardingState = {
  isStarted: false,
  isComplete: false,
  currentStep: OnboardingStep.SPLASH,
  userSegment: null,
  walletType: null,
  sessionData: {},
  loading: false,
  error: null,
  stepHistory: [],
};

const VALID_STEP_TRANSITIONS: Record<OnboardingStep, OnboardingStep[]> = {
  [OnboardingStep.SPLASH]: [OnboardingStep.INTRO_SCREENS],
  [OnboardingStep.INTRO_SCREENS]: [OnboardingStep.IDENTITY_QUESTION],
  [OnboardingStep.IDENTITY_QUESTION]: [
    OnboardingStep.NORMIE_SOCIAL_LOGIN,
    OnboardingStep.CRYPTO_WALLET_CHOICE,
    OnboardingStep.EXTERNAL_WALLETCONNECT,
    OnboardingStep.INSTITUTIONAL_KYB,
  ],
  [OnboardingStep.NORMIE_SOCIAL_LOGIN]: [OnboardingStep.NORMIE_CARD_SETUP, OnboardingStep.NORMIE_BIOMETRIC],
  [OnboardingStep.NORMIE_CARD_SETUP]: [OnboardingStep.NORMIE_BIOMETRIC],
  [OnboardingStep.NORMIE_BIOMETRIC]: [OnboardingStep.LANDING_VAULT],
  [OnboardingStep.CRYPTO_WALLET_CHOICE]: [
    OnboardingStep.CRYPTO_CONNECT_EXISTING,
    OnboardingStep.CRYPTO_MPC_CREATION,
  ],
  [OnboardingStep.CRYPTO_CONNECT_EXISTING]: [OnboardingStep.CRYPTO_PASSKEY, OnboardingStep.LANDING_VAULT],
  [OnboardingStep.CRYPTO_MPC_CREATION]: [OnboardingStep.CRYPTO_PASSKEY, OnboardingStep.LANDING_VAULT],
  [OnboardingStep.CRYPTO_PASSKEY]: [OnboardingStep.LANDING_VAULT],
  [OnboardingStep.EXTERNAL_WALLETCONNECT]: [OnboardingStep.LANDING_VAULT],
  [OnboardingStep.INSTITUTIONAL_KYB]: [OnboardingStep.INSTITUTIONAL_MULTISIG, OnboardingStep.LANDING_VAULT],
  [OnboardingStep.INSTITUTIONAL_MULTISIG]: [OnboardingStep.LANDING_VAULT],
  [OnboardingStep.LANDING_VAULT]: [OnboardingStep.COMPLETE],
  [OnboardingStep.COMPLETE]: [],
};

const onboardingSlice: Slice<OnboardingState> = createSlice({
  name: "onboarding",
  initialState,
  reducers: {
    startOnboarding: (state) => {
      state.isStarted = true;
      state.isComplete = false;
      state.currentStep = OnboardingStep.SPLASH;
      state.userSegment = null;
      state.walletType = null;
      state.sessionData = {};
      state.stepHistory = [];
      state.loading = false;
      state.error = null;
    },

    setUserSegment: (state, action: PayloadAction<UserSegment>) => {
      state.userSegment = action.payload;

      const segmentToWalletType: Record<UserSegment, WalletTypeEnum> = {
        [UserSegment.NORMIE]: WalletTypeEnum.NORMIE_EVERYDAY,
        [UserSegment.CRYPTO_NATIVE]: WalletTypeEnum.SUI_NATIVE_SELF,
        [UserSegment.INSTITUTIONAL]: WalletTypeEnum.INSTITUTIONAL_SUITE,
      };

      state.walletType = segmentToWalletType[action.payload];
    },

    setWalletType: (state, action: PayloadAction<WalletTypeEnum>) => {
      state.walletType = action.payload;

      const walletTypeToSegment: Record<WalletTypeEnum, UserSegment> = {
        [WalletTypeEnum.NORMIE_EVERYDAY]: UserSegment.NORMIE,
        [WalletTypeEnum.SUI_NATIVE_SELF]: UserSegment.CRYPTO_NATIVE,
        [WalletTypeEnum.EXTERNAL_CONNECTED]: UserSegment.CRYPTO_NATIVE,
        [WalletTypeEnum.INSTITUTIONAL_SUITE]: UserSegment.INSTITUTIONAL,
      };

      state.userSegment = walletTypeToSegment[action.payload];
    },

    advanceStep: (state, action: PayloadAction<OnboardingStep>) => {
      const nextStep = action.payload;
      const allowedTransitions = VALID_STEP_TRANSITIONS[state.currentStep];

      if (!allowedTransitions.includes(nextStep)) {
        state.error = `Invalid step transition from ${state.currentStep} to ${nextStep}`;
        return;
      }

      state.stepHistory.push(state.currentStep);
      state.currentStep = nextStep;
      state.error = null;
    },

    saveSessionData: (state, action: PayloadAction<Partial<SessionData>>) => {
      state.sessionData = {
        ...state.sessionData,
        ...action.payload,
      };
      state.error = null;
    },

    completeOnboarding: (state) => {
      state.currentStep = OnboardingStep.COMPLETE;
      state.isComplete = true;
      state.loading = false;
      state.error = null;
    },

    resetOnboarding: (state) => {
      Object.assign(state, initialState);
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },

    goBackStep: (state) => {
      if (state.stepHistory.length > 0) {
        state.currentStep = state.stepHistory.pop()!;
        state.error = null;
      }
    },
  },
});

export const {
  startOnboarding,
  setUserSegment,
  setWalletType,
  advanceStep,
  saveSessionData,
  completeOnboarding,
  resetOnboarding,
  setLoading,
  setError,
  clearError,
  goBackStep,
} = onboardingSlice.actions;

export const selectOnboarding = (state: any) => state.onboarding;
export const selectCurrentStep = (state: any) => state.onboarding.currentStep;
export const selectUserSegment = (state: any) => state.onboarding.userSegment;
export const selectWalletType = (state: any) => state.onboarding.walletType;
export const selectSessionData = (state: any) => state.onboarding.sessionData;
export const selectIsComplete = (state: any) => state.onboarding.isComplete;
export const selectIsStarted = (state: any) => state.onboarding.isStarted;
export const selectOnboardingLoading = (state: any) => state.onboarding.loading;
export const selectOnboardingError = (state: any) => state.onboarding.error;
export const selectStepHistory = (state: any) => state.onboarding.stepHistory;

export { onboardingSlice };
export default onboardingSlice.reducer;
