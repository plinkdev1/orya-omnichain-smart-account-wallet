import {
  onboardingSlice,
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
  selectCurrentStep,
  selectUserSegment,
  selectWalletType,
  selectSessionData,
  selectIsComplete,
  selectIsStarted,
  selectOnboardingLoading,
  selectOnboardingError,
  selectStepHistory,
  UserSegment,
  WalletTypeEnum,
  OnboardingStep,
  OnboardingState,
} from '../store/slices/onboardingSlice';

describe('onboardingSlice', () => {
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

  describe('reducers', () => {
    it('should handle startOnboarding', () => {
      const state = onboardingSlice.reducer(initialState, startOnboarding());
      expect(state.isStarted).toBe(true);
      expect(state.isComplete).toBe(false);
      expect(state.currentStep).toBe(OnboardingStep.SPLASH);
      expect(state.userSegment).toBeNull();
      expect(state.walletType).toBeNull();
      expect(state.sessionData).toEqual({});
      expect(state.stepHistory).toEqual([]);
    });

    it('should handle setUserSegment - NORMIE', () => {
      let state = onboardingSlice.reducer(initialState, startOnboarding());
      state = onboardingSlice.reducer(state, setUserSegment(UserSegment.NORMIE));
      expect(state.userSegment).toBe(UserSegment.NORMIE);
      expect(state.walletType).toBe(WalletTypeEnum.NORMIE_EVERYDAY);
    });

    it('should handle setUserSegment - CRYPTO_NATIVE', () => {
      let state = onboardingSlice.reducer(initialState, startOnboarding());
      state = onboardingSlice.reducer(state, setUserSegment(UserSegment.CRYPTO_NATIVE));
      expect(state.userSegment).toBe(UserSegment.CRYPTO_NATIVE);
      expect(state.walletType).toBe(WalletTypeEnum.SUI_NATIVE_SELF);
    });

    it('should handle setUserSegment - INSTITUTIONAL', () => {
      let state = onboardingSlice.reducer(initialState, startOnboarding());
      state = onboardingSlice.reducer(state, setUserSegment(UserSegment.INSTITUTIONAL));
      expect(state.userSegment).toBe(UserSegment.INSTITUTIONAL);
      expect(state.walletType).toBe(WalletTypeEnum.INSTITUTIONAL_SUITE);
    });

    it('should handle setWalletType - NORMIE_EVERYDAY', () => {
      let state = onboardingSlice.reducer(initialState, startOnboarding());
      state = onboardingSlice.reducer(state, setWalletType(WalletTypeEnum.NORMIE_EVERYDAY));
      expect(state.walletType).toBe(WalletTypeEnum.NORMIE_EVERYDAY);
      expect(state.userSegment).toBe(UserSegment.NORMIE);
    });

    it('should handle setWalletType - SUI_NATIVE_SELF', () => {
      let state = onboardingSlice.reducer(initialState, startOnboarding());
      state = onboardingSlice.reducer(state, setWalletType(WalletTypeEnum.SUI_NATIVE_SELF));
      expect(state.walletType).toBe(WalletTypeEnum.SUI_NATIVE_SELF);
      expect(state.userSegment).toBe(UserSegment.CRYPTO_NATIVE);
    });

    it('should handle saveSessionData', () => {
      let state = onboardingSlice.reducer(initialState, startOnboarding());
      state = onboardingSlice.reducer(
        state,
        saveSessionData({
          userId: 'user123',
          userEmail: 'test@example.com',
          walletAddress: '0x123',
        })
      );
      expect(state.sessionData.userId).toBe('user123');
      expect(state.sessionData.userEmail).toBe('test@example.com');
      expect(state.sessionData.walletAddress).toBe('0x123');
    });

    it('should handle advanceStep - valid transition SPLASH -> INTRO_SCREENS', () => {
      let state = onboardingSlice.reducer(initialState, startOnboarding());
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.INTRO_SCREENS));
      expect(state.currentStep).toBe(OnboardingStep.INTRO_SCREENS);
      expect(state.stepHistory).toContain(OnboardingStep.SPLASH);
      expect(state.error).toBeNull();
    });

    it('should handle advanceStep - valid transition INTRO_SCREENS -> IDENTITY_QUESTION', () => {
      let state = onboardingSlice.reducer(initialState, startOnboarding());
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.INTRO_SCREENS));
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.IDENTITY_QUESTION));
      expect(state.currentStep).toBe(OnboardingStep.IDENTITY_QUESTION);
      expect(state.stepHistory).toEqual([OnboardingStep.SPLASH, OnboardingStep.INTRO_SCREENS]);
    });

    it('should handle advanceStep - NORMIE path', () => {
      let state = onboardingSlice.reducer(initialState, startOnboarding());
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.INTRO_SCREENS));
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.IDENTITY_QUESTION));
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.NORMIE_SOCIAL_LOGIN));
      expect(state.currentStep).toBe(OnboardingStep.NORMIE_SOCIAL_LOGIN);
      expect(state.error).toBeNull();
    });

    it('should handle advanceStep - invalid transition', () => {
      let state = onboardingSlice.reducer(initialState, startOnboarding());
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.LANDING_VAULT));
      expect(state.currentStep).toBe(OnboardingStep.SPLASH);
      expect(state.error).toContain('Invalid step transition');
    });

    it('should handle goBackStep', () => {
      let state = onboardingSlice.reducer(initialState, startOnboarding());
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.INTRO_SCREENS));
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.IDENTITY_QUESTION));
      state = onboardingSlice.reducer(state, goBackStep());
      expect(state.currentStep).toBe(OnboardingStep.INTRO_SCREENS);
      expect(state.stepHistory).toEqual([OnboardingStep.SPLASH]);
    });

    it('should handle completeOnboarding', () => {
      let state = onboardingSlice.reducer(initialState, startOnboarding());
      state = onboardingSlice.reducer(state, completeOnboarding());
      expect(state.isComplete).toBe(true);
      expect(state.currentStep).toBe(OnboardingStep.COMPLETE);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle resetOnboarding', () => {
      let state = onboardingSlice.reducer(initialState, startOnboarding());
      state = onboardingSlice.reducer(state, setUserSegment(UserSegment.NORMIE));
      state = onboardingSlice.reducer(state, saveSessionData({ userId: 'test' }));
      state = onboardingSlice.reducer(state, setLoading(true));
      state = onboardingSlice.reducer(state, resetOnboarding());
      expect(state).toEqual(initialState);
    });

    it('should handle setLoading', () => {
      let state = onboardingSlice.reducer(initialState, setLoading(true));
      expect(state.loading).toBe(true);
      state = onboardingSlice.reducer(state, setLoading(false));
      expect(state.loading).toBe(false);
    });

    it('should handle setError', () => {
      let state = onboardingSlice.reducer(initialState, setError('Test error'));
      expect(state.error).toBe('Test error');
    });

    it('should handle clearError', () => {
      let state = onboardingSlice.reducer(initialState, setError('Test error'));
      state = onboardingSlice.reducer(state, clearError());
      expect(state.error).toBeNull();
    });
  });

  describe('complete onboarding flows', () => {
    it('should complete NORMIE flow', () => {
      let state = onboardingSlice.reducer(initialState, startOnboarding());
      state = onboardingSlice.reducer(state, setUserSegment(UserSegment.NORMIE));
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.INTRO_SCREENS));
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.IDENTITY_QUESTION));
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.NORMIE_SOCIAL_LOGIN));
      state = onboardingSlice.reducer(
        state,
        saveSessionData({ userEmail: 'user@example.com', socialProvider: 'google' })
      );
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.NORMIE_CARD_SETUP));
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.NORMIE_BIOMETRIC));
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.LANDING_VAULT));
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.COMPLETE));
      state = onboardingSlice.reducer(state, completeOnboarding());

      expect(state.isComplete).toBe(true);
      expect(state.userSegment).toBe(UserSegment.NORMIE);
      expect(state.walletType).toBe(WalletTypeEnum.NORMIE_EVERYDAY);
      expect(state.currentStep).toBe(OnboardingStep.COMPLETE);
      expect(state.sessionData.userEmail).toBe('user@example.com');
      expect(state.sessionData.socialProvider).toBe('google');
    });

    it('should complete CRYPTO_NATIVE flow with new MPC wallet', () => {
      let state = onboardingSlice.reducer(initialState, startOnboarding());
      state = onboardingSlice.reducer(state, setUserSegment(UserSegment.CRYPTO_NATIVE));
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.INTRO_SCREENS));
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.IDENTITY_QUESTION));
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.CRYPTO_WALLET_CHOICE));
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.CRYPTO_MPC_CREATION));
      state = onboardingSlice.reducer(
        state,
        saveSessionData({
          walletAddress: '0xsui123abc',
          mpcStatus: 'completed',
        })
      );
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.CRYPTO_PASSKEY));
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.LANDING_VAULT));
      state = onboardingSlice.reducer(state, completeOnboarding());

      expect(state.isComplete).toBe(true);
      expect(state.userSegment).toBe(UserSegment.CRYPTO_NATIVE);
      expect(state.walletType).toBe(WalletTypeEnum.SUI_NATIVE_SELF);
      expect(state.sessionData.mpcStatus).toBe('completed');
    });

    it('should complete CRYPTO_NATIVE flow with existing wallet', () => {
      let state = onboardingSlice.reducer(initialState, startOnboarding());
      state = onboardingSlice.reducer(state, setUserSegment(UserSegment.CRYPTO_NATIVE));
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.INTRO_SCREENS));
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.IDENTITY_QUESTION));
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.CRYPTO_WALLET_CHOICE));
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.CRYPTO_CONNECT_EXISTING));
      state = onboardingSlice.reducer(
        state,
        saveSessionData({
          walletAddress: '0xexisting123',
          walletName: 'Phantom Wallet',
        })
      );
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.LANDING_VAULT));
      state = onboardingSlice.reducer(state, completeOnboarding());

      expect(state.isComplete).toBe(true);
      expect(state.walletType).toBe(WalletTypeEnum.SUI_NATIVE_SELF);
      expect(state.sessionData.walletName).toBe('Phantom Wallet');
    });

    it('should complete EXTERNAL flow', () => {
      let state = onboardingSlice.reducer(initialState, startOnboarding());
      state = onboardingSlice.reducer(state, setWalletType(WalletTypeEnum.EXTERNAL_CONNECTED));
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.INTRO_SCREENS));
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.IDENTITY_QUESTION));
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.EXTERNAL_WALLETCONNECT));
      state = onboardingSlice.reducer(
        state,
        saveSessionData({
          externalWalletAddress: '0xexternal456',
          externalWalletName: 'MetaMask',
        })
      );
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.LANDING_VAULT));
      state = onboardingSlice.reducer(state, completeOnboarding());

      expect(state.isComplete).toBe(true);
      expect(state.walletType).toBe(WalletTypeEnum.EXTERNAL_CONNECTED);
      expect(state.userSegment).toBe(UserSegment.CRYPTO_NATIVE);
      expect(state.sessionData.externalWalletName).toBe('MetaMask');
    });

    it('should complete INSTITUTIONAL flow', () => {
      let state = onboardingSlice.reducer(initialState, startOnboarding());
      state = onboardingSlice.reducer(state, setUserSegment(UserSegment.INSTITUTIONAL));
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.INTRO_SCREENS));
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.IDENTITY_QUESTION));
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.INSTITUTIONAL_KYB));
      state = onboardingSlice.reducer(
        state,
        saveSessionData({
          kyb: {
            companyName: 'Acme Inc',
            companyRegistration: 'REG123',
            beneficialOwners: ['owner1@example.com'],
          },
        })
      );
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.INSTITUTIONAL_MULTISIG));
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.LANDING_VAULT));
      state = onboardingSlice.reducer(state, completeOnboarding());

      expect(state.isComplete).toBe(true);
      expect(state.userSegment).toBe(UserSegment.INSTITUTIONAL);
      expect(state.walletType).toBe(WalletTypeEnum.INSTITUTIONAL_SUITE);
      expect(state.sessionData.kyb?.companyName).toBe('Acme Inc');
    });
  });

  describe('selectors', () => {
    it('selectCurrentStep should return current step', () => {
      let state = onboardingSlice.reducer(initialState, startOnboarding());
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.INTRO_SCREENS));
      const mockRootState = { onboarding: state };
      expect(selectCurrentStep(mockRootState)).toBe(OnboardingStep.INTRO_SCREENS);
    });

    it('selectUserSegment should return user segment', () => {
      let state = onboardingSlice.reducer(initialState, startOnboarding());
      state = onboardingSlice.reducer(state, setUserSegment(UserSegment.NORMIE));
      const mockRootState = { onboarding: state };
      expect(selectUserSegment(mockRootState)).toBe(UserSegment.NORMIE);
    });

    it('selectWalletType should return wallet type', () => {
      let state = onboardingSlice.reducer(initialState, startOnboarding());
      state = onboardingSlice.reducer(state, setWalletType(WalletTypeEnum.SUI_NATIVE_SELF));
      const mockRootState = { onboarding: state };
      expect(selectWalletType(mockRootState)).toBe(WalletTypeEnum.SUI_NATIVE_SELF);
    });

    it('selectSessionData should return session data', () => {
      let state = onboardingSlice.reducer(initialState, startOnboarding());
      state = onboardingSlice.reducer(
        state,
        saveSessionData({ userId: 'user123', userEmail: 'test@example.com' })
      );
      const mockRootState = { onboarding: state };
      expect(selectSessionData(mockRootState)).toEqual({
        userId: 'user123',
        userEmail: 'test@example.com',
      });
    });

    it('selectIsComplete should return completion status', () => {
      let state = onboardingSlice.reducer(initialState, startOnboarding());
      let mockRootState = { onboarding: state };
      expect(selectIsComplete(mockRootState)).toBe(false);

      state = onboardingSlice.reducer(state, completeOnboarding());
      mockRootState = { onboarding: state };
      expect(selectIsComplete(mockRootState)).toBe(true);
    });

    it('selectIsStarted should return start status', () => {
      let state = onboardingSlice.reducer(initialState, startOnboarding());
      const mockRootState = { onboarding: state };
      expect(selectIsStarted(mockRootState)).toBe(true);
    });

    it('selectOnboardingLoading should return loading state', () => {
      let state = onboardingSlice.reducer(initialState, setLoading(true));
      const mockRootState = { onboarding: state };
      expect(selectOnboardingLoading(mockRootState)).toBe(true);
    });

    it('selectOnboardingError should return error', () => {
      let state = onboardingSlice.reducer(initialState, setError('Test error'));
      const mockRootState = { onboarding: state };
      expect(selectOnboardingError(mockRootState)).toBe('Test error');
    });

    it('selectStepHistory should return step history', () => {
      let state = onboardingSlice.reducer(initialState, startOnboarding());
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.INTRO_SCREENS));
      state = onboardingSlice.reducer(state, advanceStep(OnboardingStep.IDENTITY_QUESTION));
      const mockRootState = { onboarding: state };
      expect(selectStepHistory(mockRootState)).toEqual([
        OnboardingStep.SPLASH,
        OnboardingStep.INTRO_SCREENS,
      ]);
    });
  });
});
