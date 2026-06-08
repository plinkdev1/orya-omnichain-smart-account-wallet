/**
 * Wallet Profile and Custody Model Types
 * Unified system for user segmentation and wallet management
 */

import { UUID, Address } from './common.types';
import { ChainType } from './chain.types';

export enum UserSegment {
  NORMIE = 'normie',
  CRYPTO_NATIVE = 'crypto_native',
  INSTITUTIONAL = 'institutional',
}

export enum WalletTypeEnum {
  NORMIE_EVERYDAY = 'normie_everyday',
  SUI_NATIVE_SELF = 'sui_native_self',
  EXTERNAL_CONNECTED = 'external_connected',
  INSTITUTIONAL_SUITE = 'inst_suite',
  SMART_ACCOUNT = 'smart_account',
  ACCOUNT_ABSTRACTION = 'account_abstraction',
}

export enum CustodyModel {
  CUSTODIAL = 'custodial',
  SEMI_CUSTODY = 'semi_custody',
  SELF_CUSTODY = 'self_custody',
}

export interface WalletCapabilities {
  canSwap: boolean;
  canBridge: boolean;
  canStake: boolean;
  canDefi: boolean;
  canNft: boolean;
  canPayCard: boolean;
  canMultisig: boolean;
}

export interface WalletProfile {
  id: UUID;
  userId: UUID;
  userSegment: UserSegment;
  primaryWalletType: WalletTypeEnum;
  custodyModel: CustodyModel;
  capabilities: WalletCapabilities;
  createdAt: string;
  upgradedAt?: string;
}

export interface Wallet {
  id: UUID;
  profileId: UUID;
  type: WalletTypeEnum;
  custodyModel: CustodyModel;
  nativeSUI: boolean;
  mpcEnabled: boolean;
  multiSigEnabled: boolean;
  aaEnabled?: boolean;
  smartAccountType?: string;
  supportedChains: ChainType[];
  address: Address;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSegmentCapabilities {
  segment: UserSegment;
  defaultWalletType: WalletTypeEnum;
  allowedWalletTypes: WalletTypeEnum[];
  defaultCustodyModel: CustodyModel;
  capabilities: WalletCapabilities;
}
