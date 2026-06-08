import type { KycStatus } from '@/components/kyc/UnifiedKycManager';
import type { KycLevel } from './zkyc';

export type FeatureName =
  | 'basic_trading'
  | 'advanced_trading'
  | 'institutional_trading'
  | 'high_limits'
  | 'defi_protocols'
  | 'margin_trading'
  | 'api_access'
  | 'concierge_service';

export interface FeatureRequirement {
  passportMinScore?: number;
  zkpassVerified?: boolean;
  zkycMinLevel?: KycLevel;
}

const FEATURE_REQUIREMENTS: Record<FeatureName, FeatureRequirement> = {
  basic_trading: {
    passportMinScore: 0,
  },
  advanced_trading: {
    passportMinScore: 20,
    zkpassVerified: false,
  },
  institutional_trading: {
    passportMinScore: 50,
    zkycMinLevel: 'professional',
  },
  high_limits: {
    passportMinScore: 50,
    zkycMinLevel: 'advanced',
  },
  defi_protocols: {
    passportMinScore: 20,
  },
  margin_trading: {
    zkycMinLevel: 'professional',
  },
  api_access: {
    passportMinScore: 50,
    zkycMinLevel: 'advanced',
  },
  concierge_service: {
    zkycMinLevel: 'professional',
  },
};

export function checkFeatureAccess(
  address: string,
  feature: FeatureName,
  kycStatus: KycStatus
): boolean {
  const requirements = FEATURE_REQUIREMENTS[feature];

  if (!requirements) {
    return false;
  }

  if (requirements.passportMinScore !== undefined) {
    if (kycStatus.passport.score < requirements.passportMinScore) {
      return false;
    }
  }

  if (requirements.zkpassVerified && !kycStatus.zkpass.verified) {
    return false;
  }

  if (requirements.zkycMinLevel) {
    const levelHierarchy: Record<KycLevel, number> = {
      none: 0,
      basic: 1,
      advanced: 2,
      professional: 3,
    };

    const userLevel = levelHierarchy[kycStatus.zkyc.level as KycLevel] ?? 0;
    const requiredLevel = levelHierarchy[requirements.zkycMinLevel] ?? 0;

    if (userLevel < requiredLevel) {
      return false;
    }
  }

  return true;
}

export function getRequiredVerifications(feature: FeatureName): string[] {
  const requirements = FEATURE_REQUIREMENTS[feature];
  const required: string[] = [];

  if (requirements?.passportMinScore !== undefined) {
    required.push(`Human Passport (score ≥ ${requirements.passportMinScore})`);
  }

  if (requirements?.zkpassVerified) {
    required.push('zkPass Verification');
  }

  if (requirements?.zkycMinLevel) {
    required.push(`zKYC (${requirements.zkycMinLevel} level or higher)`);
  }

  return required;
}

export function getAccessLevel(kycStatus: KycStatus): 'anonymous' | 'verified' | 'trusted' | 'institutional' {
  if (kycStatus.zkyc.level === 'professional') {
    return 'institutional';
  }

  if (
    kycStatus.zkyc.level === 'advanced' &&
    kycStatus.passport.score >= 50
  ) {
    return 'trusted';
  }

  if (kycStatus.passport.score >= 20) {
    return 'verified';
  }

  return 'anonymous';
}

export function getFeaturesByAccessLevel(
  level: 'anonymous' | 'verified' | 'trusted' | 'institutional'
): FeatureName[] {
  const allFeatures: FeatureName[] = [
    'basic_trading',
    'advanced_trading',
    'institutional_trading',
    'high_limits',
    'defi_protocols',
    'margin_trading',
    'api_access',
    'concierge_service',
  ];

  const levelFeatures: Record<string, FeatureName[]> = {
    anonymous: ['basic_trading'],
    verified: ['basic_trading', 'advanced_trading', 'defi_protocols'],
    trusted: [
      'basic_trading',
      'advanced_trading',
      'defi_protocols',
      'high_limits',
      'api_access',
    ],
    institutional: allFeatures,
  };

  return levelFeatures[level] || [];
}

export class FeatureGateManager {
  private kycStatus: KycStatus;

  constructor(kycStatus: KycStatus) {
    this.kycStatus = kycStatus;
  }

  canAccess(feature: FeatureName, address: string): boolean {
    return checkFeatureAccess(address, feature, this.kycStatus);
  }

  getAccessLevel(): ReturnType<typeof getAccessLevel> {
    return getAccessLevel(this.kycStatus);
  }

  getAvailableFeatures(): FeatureName[] {
    return getFeaturesByAccessLevel(this.getAccessLevel());
  }

  getMissingRequirements(feature: FeatureName): string[] {
    const requirements = FEATURE_REQUIREMENTS[feature];
    const missing: string[] = [];

    if (requirements?.passportMinScore !== undefined) {
      if (this.kycStatus.passport.score < requirements.passportMinScore) {
        missing.push(
          `Human Passport score needs to be ≥ ${requirements.passportMinScore} (current: ${this.kycStatus.passport.score})`
        );
      }
    }

    if (requirements?.zkycMinLevel) {
      const levelHierarchy: Record<KycLevel, number> = {
        none: 0,
        basic: 1,
        advanced: 2,
        professional: 3,
      };

      const userLevel = levelHierarchy[this.kycStatus.zkyc.level as KycLevel] ?? 0;
      const requiredLevel = levelHierarchy[requirements.zkycMinLevel] ?? 0;

      if (userLevel < requiredLevel) {
        missing.push(
          `zKYC level needs to be ${requirements.zkycMinLevel} or higher (current: ${this.kycStatus.zkyc.level})`
        );
      }
    }

    return missing;
  }
}
