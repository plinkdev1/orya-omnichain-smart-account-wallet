/**
 * Wallet Domain Entity
 * Core wallet data and business logic
 */

export enum WalletType {
  NORMIE = 'normie',
  CRYPTO_NATIVE = 'crypto_native',
  INSTITUTIONAL = 'institutional',
  EXTERNAL = 'external',
}

export enum CustodyModel {
  CUSTODIAL = 'custodial',
  SELF_CUSTODY = 'self_custody',
  EXTERNAL = 'external',
  MULTI_SIG = 'multi_sig',
}

export interface WalletProfile {
  id: string;
  userId: string;
  walletType: WalletType;
  custodyModel: CustodyModel;
  primaryBlockchain: string;
  supportedBlockchains: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletAddress {
  address: string;
  blockchain: string;
  isActive: boolean;
  label?: string;
}

export interface Wallet {
  id: string;
  profile: WalletProfile;
  addresses: WalletAddress[];
  balance?: {
    total: number;
    currency: string;
  };
}
