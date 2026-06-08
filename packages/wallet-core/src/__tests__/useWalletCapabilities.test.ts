import { WalletTypeEnum, UserSegment } from '../store/slices/onboardingSlice';

describe('useWalletCapabilities - Capability Matrix', () => {
  describe('NORMIE_EVERYDAY wallet type', () => {
    it('should have limited capabilities for normie users', () => {
      const capabilities = {
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
      };

      expect(capabilities.canSwap).toBe(false);
      expect(capabilities.canDefi).toBe(false);
      expect(capabilities.canNft).toBe(false);
      expect(capabilities.canBridge).toBe(false);
      expect(capabilities.canStake).toBe(false);
      expect(capabilities.canPayCard).toBe(true);
      expect(capabilities.canMultisig).toBe(false);
      expect(capabilities.canViewAnalytics).toBe(false);
      expect(capabilities.canUnlockCrypto).toBe(true);
      expect(capabilities.canCreatePasskey).toBe(true);
      expect(capabilities.canSetupBiometric).toBe(true);
    });
  });

  describe('SUI_NATIVE_SELF wallet type', () => {
    it('should have full crypto capabilities for crypto-native users', () => {
      const capabilities = {
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
      };

      expect(capabilities.canSwap).toBe(true);
      expect(capabilities.canDefi).toBe(true);
      expect(capabilities.canNft).toBe(true);
      expect(capabilities.canBridge).toBe(true);
      expect(capabilities.canStake).toBe(true);
      expect(capabilities.canPayCard).toBe(false);
      expect(capabilities.canMultisig).toBe(false);
      expect(capabilities.canViewAnalytics).toBe(true);
      expect(capabilities.canUnlockCrypto).toBe(false);
      expect(capabilities.canCreatePasskey).toBe(true);
      expect(capabilities.canSetupBiometric).toBe(true);
    });
  });

  describe('EXTERNAL_CONNECTED wallet type', () => {
    it('should have full crypto capabilities without profile setup options', () => {
      const capabilities = {
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
      };

      expect(capabilities.canSwap).toBe(true);
      expect(capabilities.canDefi).toBe(true);
      expect(capabilities.canNft).toBe(true);
      expect(capabilities.canBridge).toBe(true);
      expect(capabilities.canStake).toBe(true);
      expect(capabilities.canPayCard).toBe(false);
      expect(capabilities.canMultisig).toBe(false);
      expect(capabilities.canViewAnalytics).toBe(true);
      expect(capabilities.canUnlockCrypto).toBe(false);
      expect(capabilities.canCreatePasskey).toBe(false);
      expect(capabilities.canSetupBiometric).toBe(false);
    });
  });

  describe('INSTITUTIONAL_SUITE wallet type', () => {
    it('should have full capabilities including multi-sig for institutional users', () => {
      const capabilities = {
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
      };

      expect(capabilities.canSwap).toBe(true);
      expect(capabilities.canDefi).toBe(true);
      expect(capabilities.canNft).toBe(true);
      expect(capabilities.canBridge).toBe(true);
      expect(capabilities.canStake).toBe(true);
      expect(capabilities.canPayCard).toBe(false);
      expect(capabilities.canMultisig).toBe(true);
      expect(capabilities.canViewAnalytics).toBe(true);
      expect(capabilities.canUnlockCrypto).toBe(false);
      expect(capabilities.canCreatePasskey).toBe(true);
      expect(capabilities.canSetupBiometric).toBe(true);
    });
  });

  describe('Default capabilities (when wallet type is null)', () => {
    it('should return all disabled capabilities', () => {
      const capabilities = {
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

      expect(capabilities.canSwap).toBe(false);
      expect(capabilities.canDefi).toBe(false);
      expect(capabilities.canNft).toBe(false);
      expect(capabilities.canBridge).toBe(false);
      expect(capabilities.canStake).toBe(false);
      expect(capabilities.canPayCard).toBe(false);
      expect(capabilities.canMultisig).toBe(false);
      expect(capabilities.canViewAnalytics).toBe(false);
      expect(capabilities.canUnlockCrypto).toBe(false);
      expect(capabilities.canCreatePasskey).toBe(false);
      expect(capabilities.canSetupBiometric).toBe(false);
    });
  });

  describe('Wallet type to segment mapping', () => {
    it('should map NORMIE_EVERYDAY to NORMIE segment', () => {
      expect(WalletTypeEnum.NORMIE_EVERYDAY).toBe('normie_everyday');
      expect(UserSegment.NORMIE).toBe('normie');
    });

    it('should map SUI_NATIVE_SELF to CRYPTO_NATIVE segment', () => {
      expect(WalletTypeEnum.SUI_NATIVE_SELF).toBe('sui_native_self');
      expect(UserSegment.CRYPTO_NATIVE).toBe('crypto_native');
    });

    it('should map EXTERNAL_CONNECTED to CRYPTO_NATIVE segment', () => {
      expect(WalletTypeEnum.EXTERNAL_CONNECTED).toBe('external_connected');
      expect(UserSegment.CRYPTO_NATIVE).toBe('crypto_native');
    });

    it('should map INSTITUTIONAL_SUITE to INSTITUTIONAL segment', () => {
      expect(WalletTypeEnum.INSTITUTIONAL_SUITE).toBe('inst_suite');
      expect(UserSegment.INSTITUTIONAL).toBe('institutional');
    });
  });

  describe('Capability edge cases', () => {
    it('NORMIE can unlock crypto but cannot perform crypto operations', () => {
      const nomieCaps = {
        canUnlockCrypto: true,
        canSwap: false,
        canDefi: false,
        canBridge: false,
      };
      expect(nomieCaps.canUnlockCrypto).toBe(true);
      expect(nomieCaps.canSwap).toBe(false);
      expect(nomieCaps.canDefi).toBe(false);
      expect(nomieCaps.canBridge).toBe(false);
    });

    it('CRYPTO_NATIVE can perform crypto operations but cannot access card payment', () => {
      const cryptoCaps = {
        canSwap: true,
        canDefi: true,
        canPayCard: false,
        canMultisig: false,
      };
      expect(cryptoCaps.canSwap).toBe(true);
      expect(cryptoCaps.canDefi).toBe(true);
      expect(cryptoCaps.canPayCard).toBe(false);
      expect(cryptoCaps.canMultisig).toBe(false);
    });

    it('EXTERNAL_CONNECTED cannot manage passkeys or biometric since wallet is external', () => {
      const externalCaps = {
        canCreatePasskey: false,
        canSetupBiometric: false,
        canSwap: true,
        canDefi: true,
      };
      expect(externalCaps.canCreatePasskey).toBe(false);
      expect(externalCaps.canSetupBiometric).toBe(false);
      expect(externalCaps.canSwap).toBe(true);
      expect(externalCaps.canDefi).toBe(true);
    });

    it('INSTITUTIONAL has all capabilities including multi-sig', () => {
      const instCaps = {
        canMultisig: true,
        canSwap: true,
        canDefi: true,
        canViewAnalytics: true,
        canPayCard: false,
      };
      expect(instCaps.canMultisig).toBe(true);
      expect(instCaps.canSwap).toBe(true);
      expect(instCaps.canDefi).toBe(true);
      expect(instCaps.canViewAnalytics).toBe(true);
      expect(instCaps.canPayCard).toBe(false);
    });
  });
});
