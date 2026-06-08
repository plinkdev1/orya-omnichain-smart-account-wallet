/**
 * Wallet types
 */

import { ChainType } from './chain.types';
import { Address, UUID } from './common.types';
import {
  WalletTypeEnum,
  CustodyModel,
  Wallet,
  WalletProfile,
  WalletCapabilities,
  UserSegment,
} from './wallet-profile.types';

export type WalletAddress = Address;

/**
 * Balance info for a single asset on a chain
 */
export interface Balance {
  symbol: string;
  amount: string;
  decimals: number;
  valueUSD: number;
  chainType: ChainType;
  tokenAddress?: Address;
}

export interface WalletAsset {
  symbol: string;
  name: string;
  balance: string;
  chainId: ChainType;
  logoUrl?: string;
  decimals: number;
  valueUSD?: number;
  tokenAddress?: Address;
}

export interface WalletBalance {
  walletId: UUID;
  chainType: ChainType;
  nativeBalance: string;
  totalValueUSD: number;
  lastUpdated: string;
}

export interface ConnectedWallet {
  id: UUID;
  address: Address;
  chainType: ChainType;
  connectedAt: string;
  lastUsedAt?: string;
}

export interface WalletConnection {
  id: UUID;
  walletId: UUID;
  chainType: ChainType;
  connectionStatus: 'active' | 'inactive' | 'disconnected';
  lastHealthCheck: string;
}

export interface SignatureRequest {
  id: string;
  message: string;
  chainType: ChainType;
  status: 'pending' | 'signed' | 'rejected';
  createdAt: string;
}

export interface GasEstimate {
  gasLimit: string;
  gasPrice: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  totalGasFee: string;
  totalGasFeeUSD: number;
}

export { UserSegment, WalletTypeEnum, CustodyModel } from './wallet-profile.types';
export type { Wallet, WalletProfile, WalletCapabilities } from './wallet-profile.types';