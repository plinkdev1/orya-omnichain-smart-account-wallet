import { useMemo } from 'react';
import { useAppSelector } from '../store/hooks';
import type { RootState } from '../store/store';
import { WalletTypeEnum } from '../store/slices/onboardingSlice';

export interface WalletCapabilities {
  canSwap: boolean;
  canDefi: boolean;
  canNft: boolean;
  canBridge: boolean;
  canStake: boolean;
  canPayCard: boolean;
  canMultisig: boolean;
  canViewAnalytics: boolean;
  canUnlockCrypto: boolean;
  canCreatePasskey: boolean;
  canSetupBiometric: boolean;
}

export const CAPABILITY_MATRIX: Record<WalletTypeEnum, WalletCapabilities> = {
  [WalletTypeEnum.NORMIE_EVERYDAY]: {
    canSwap: false,
    canDefi: false,
    canNft: false,
    canBridge: false,
    canStake: false,
    canPayCard: true,
    canMultisig: false,
    canViewAnalytics: false,
    canUnlockCrypto: true,
    canCreatePasskey: true,
    canSetupBiometric: true,
  },
  [WalletTypeEnum.SUI_NATIVE_SELF]: {
    canSwap: true,
    canDefi: true,
    canNft: true,
    canBridge: true,
    canStake: true,
    canPayCard: false,
    canMultisig: false,
    canViewAnalytics: true,
    canUnlockCrypto: false,
    canCreatePasskey: true,
    canSetupBiometric: true,
  },
  [WalletTypeEnum.EXTERNAL_CONNECTED]: {
    canSwap: true,
    canDefi: true,
    canNft: true,
    canBridge: true,
    canStake: true,
    canPayCard: false,
    canMultisig: false,
    canViewAnalytics: true,
    canUnlockCrypto: false,
    canCreatePasskey: false,
    canSetupBiometric: false,
  },
  [WalletTypeEnum.INSTITUTIONAL_SUITE]: {
    canSwap: true,
    canDefi: true,
    canNft: true,
    canBridge: true,
    canStake: true,
    canPayCard: false,
    canMultisig: true,
    canViewAnalytics: true,
    canUnlockCrypto: false,
    canCreatePasskey: true,
    canSetupBiometric: true,
  },
};

export interface UseWalletCapabilitiesReturn extends WalletCapabilities {
  walletType: WalletTypeEnum | null;
  isLoading: boolean;
  isReady: boolean;
}

export function useWalletCapabilities(): UseWalletCapabilitiesReturn {
  const walletType = useAppSelector((state: RootState) => state.onboarding.walletType);
  const isOnboardingComplete = useAppSelector((state: RootState) => state.onboarding.isComplete);

  return useMemo(() => {
    const capabilities = walletType ? CAPABILITY_MATRIX[walletType] : getDefaultCapabilities();

    return {
      ...capabilities,
      walletType,
      isLoading: !isOnboardingComplete,
      isReady: isOnboardingComplete && walletType !== null,
    };
  }, [walletType, isOnboardingComplete]);
}

function getDefaultCapabilities(): WalletCapabilities {
  return {
    canSwap: false,
    canDefi: false,
    canNft: false,
    canBridge: false,
    canStake: false,
    canPayCard: false,
    canMultisig: false,
    canViewAnalytics: false,
    canUnlockCrypto: false,
    canCreatePasskey: false,
    canSetupBiometric: false,
  };
}
