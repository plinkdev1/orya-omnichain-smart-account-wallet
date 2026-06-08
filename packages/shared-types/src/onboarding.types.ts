/**
 * Onboarding Flow Types
 * Branching architecture for user segmentation and wallet setup
 */

import { UUID } from './common.types';
import { UserSegment, WalletTypeEnum, CustodyModel } from './wallet-profile.types';
import { AuthProvider, KYCStatus } from './auth.types';
import { ChainType } from './chain.types';

export enum OnboardingStep {
  SPLASH = 'splash',
  INTRO_SCREENS = 'intro_screens',
  IDENTITY_QUESTION = 'identity_question',
  NORMIE_SOCIAL_LOGIN = 'normie_social_login',
  NORMIE_CARD_SETUP = 'normie_card_setup',
  NORMIE_BIOMETRIC = 'normie_biometric',
  CRYPTO_WALLET_CHOICE = 'crypto_wallet_choice',
  CRYPTO_CONNECT_EXISTING = 'crypto_connect_existing',
  CRYPTO_CREATE_MPC = 'crypto_create_mpc',
  CRYPTO_PASSKEY_SETUP = 'crypto_passkey_setup',
  EXTERNAL_WALLETCONNECT = 'external_walletconnect',
  EXTERNAL_WALLET_SELECT = 'external_wallet_select',
  INSTITUTIONAL_KYB_FLOW = 'institutional_kyb_flow',
  INSTITUTIONAL_MULTISIG_SETUP = 'institutional_multisig_setup',
  INSTITUTIONAL_ROLE_ASSIGNMENT = 'institutional_role_assignment',
  LANDING_VAULT = 'landing_vault',
  UPGRADE_PROMPT = 'upgrade_prompt',
  COMPLETE = 'complete',
}

export interface OnboardingSessionData {
  sessionId: UUID;
  userId?: UUID;
  authMethod?: AuthProvider;
  email?: string;
  phoneNumber?: string;
  walletAddress?: string;
  mpcShareId?: string;
  kybStatus?: KYCStatus;
  cardToken?: string;
  biometricEnabled?: boolean;
  externalWalletType?: string;
  externalWalletAddress?: string;
  role?: string;
  approvalLimit?: number;
  createdAt: string;
  lastUpdatedAt: string;
  expiresAt: string;
}

export interface OnboardingState {
  step: OnboardingStep;
  userSegment: UserSegment;
  walletType: WalletTypeEnum;
  custodyModel: CustodyModel;
  completedSteps: OnboardingStep[];
  sessionData: OnboardingSessionData;
  skipOptional: boolean;
  isUpgrade: boolean;
}

export interface OnboardingProgress {
  profileId: UUID;
  currentStep: OnboardingStep;
  progressPercentage: number;
  isComplete: boolean;
  startedAt: string;
  completedAt?: string;
}

export interface IdentityQuestionResponse {
  selectedIdentity: UserSegment;
  timestamp: string;
}

export interface WalletChoiceResponse {
  choice: 'existing' | 'new';
  walletType?: string;
  chainPreference?: ChainType;
}

export interface KYBFlowResponse {
  companyName: string;
  registrationNumber: string;
  jurisdiction: string;
  beneficialOwners: BeneficialOwner[];
  legalRepresentative: LegalRepresentative;
}

export interface BeneficialOwner {
  name: string;
  email: string;
  ownershipPercentage: number;
  kycStatus: KYCStatus;
}

export interface LegalRepresentative {
  name: string;
  email: string;
  phone: string;
  title: string;
}

export interface MultiSigSetupResponse {
  signatories: Signatory[];
  requiredApprovals: number;
  chainPreferences: ChainType[];
}

export interface Signatory {
  address: string;
  name: string;
  email: string;
  role: 'admin' | 'approver' | 'viewer';
  approvalLimit?: number;
}

export interface OnboardingConfig {
  segment: UserSegment;
  steps: OnboardingStep[];
  optionalSteps: OnboardingStep[];
  defaultCustodyModel: CustodyModel;
  defaultWalletType: WalletTypeEnum;
  estimatedDuration: number;
}

export const SEGMENT_ONBOARDING_CONFIG: Record<UserSegment, OnboardingConfig> = {
  [UserSegment.NORMIE]: {
    segment: UserSegment.NORMIE,
    steps: [
      OnboardingStep.SPLASH,
      OnboardingStep.INTRO_SCREENS,
      OnboardingStep.IDENTITY_QUESTION,
      OnboardingStep.NORMIE_SOCIAL_LOGIN,
      OnboardingStep.NORMIE_CARD_SETUP,
      OnboardingStep.NORMIE_BIOMETRIC,
      OnboardingStep.LANDING_VAULT,
      OnboardingStep.COMPLETE,
    ],
    optionalSteps: [
      OnboardingStep.NORMIE_CARD_SETUP,
      OnboardingStep.NORMIE_BIOMETRIC,
    ],
    defaultCustodyModel: CustodyModel.CUSTODIAL,
    defaultWalletType: WalletTypeEnum.NORMIE_EVERYDAY,
    estimatedDuration: 5,
  },
  [UserSegment.CRYPTO_NATIVE]: {
    segment: UserSegment.CRYPTO_NATIVE,
    steps: [
      OnboardingStep.SPLASH,
      OnboardingStep.INTRO_SCREENS,
      OnboardingStep.IDENTITY_QUESTION,
      OnboardingStep.CRYPTO_WALLET_CHOICE,
      OnboardingStep.LANDING_VAULT,
      OnboardingStep.COMPLETE,
    ],
    optionalSteps: [OnboardingStep.CRYPTO_PASSKEY_SETUP],
    defaultCustodyModel: CustodyModel.SELF_CUSTODY,
    defaultWalletType: WalletTypeEnum.SUI_NATIVE_SELF,
    estimatedDuration: 3,
  },
  [UserSegment.INSTITUTIONAL]: {
    segment: UserSegment.INSTITUTIONAL,
    steps: [
      OnboardingStep.SPLASH,
      OnboardingStep.INTRO_SCREENS,
      OnboardingStep.IDENTITY_QUESTION,
      OnboardingStep.INSTITUTIONAL_KYB_FLOW,
      OnboardingStep.INSTITUTIONAL_MULTISIG_SETUP,
      OnboardingStep.INSTITUTIONAL_ROLE_ASSIGNMENT,
      OnboardingStep.LANDING_VAULT,
      OnboardingStep.COMPLETE,
    ],
    optionalSteps: [OnboardingStep.INSTITUTIONAL_MULTISIG_SETUP],
    defaultCustodyModel: CustodyModel.SEMI_CUSTODY,
    defaultWalletType: WalletTypeEnum.INSTITUTIONAL_SUITE,
    estimatedDuration: 15,
  },
};
