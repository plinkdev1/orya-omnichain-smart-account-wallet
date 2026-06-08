import { useKyc } from './context';
import { FeatureGateManager, type FeatureName } from './feature-gates';

export function useFeatureGate(feature: FeatureName) {
  const { kycStatus, address } = useKyc();

  if (!kycStatus || !address) {
    return {
      hasAccess: false,
      level: 'anonymous' as const,
      missingRequirements: [] as string[],
    };
  }

  const manager = new FeatureGateManager(kycStatus);
  const hasAccess = manager.canAccess(feature, address);
  const level = manager.getAccessLevel();
  const missingRequirements = manager.getMissingRequirements(feature);

  return {
    hasAccess,
    level,
    missingRequirements,
  };
}

export function useKycLevel() {
  const { kycStatus, verificationLevel } = useKyc();

  return {
    level: verificationLevel,
    passportScore: kycStatus?.passport.score || 0,
    isPassportVerified: kycStatus?.passport.verified || false,
    isZkycVerified: kycStatus?.zkyc.verified || false,
    zkycLevel: kycStatus?.zkyc.level || 'none',
    isSbtMinted: kycStatus?.zkyc.sbt_minted || false,
  };
}

export function useKycStatus() {
  const { kycStatus, address, loading, error, refreshKycStatus } = useKyc();

  return {
    status: kycStatus,
    address,
    loading,
    error,
    refresh: refreshKycStatus,
  };
}

export function useRequireKyc(feature: FeatureName, onDenied?: () => void) {
  const { hasAccess, missingRequirements } = useFeatureGate(feature);

  if (!hasAccess) {
    onDenied?.();
    return {
      allowed: false,
      requirements: missingRequirements,
    };
  }

  return {
    allowed: true,
    requirements: [],
  };
}
