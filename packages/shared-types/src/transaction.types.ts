/**
 * Transaction types
 */

import { ChainType } from './chain.types';
import { Address, Hash, UUID } from './common.types';

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum TransactionType {
  SEND = 'send',
  RECEIVE = 'receive',
  SWAP = 'swap',
  STAKE = 'stake',
  UNSTAKE = 'unstake',
  BRIDGE = 'bridge',
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
}

export interface Transaction {
  id: UUID;
  hash: Hash;
  walletId: UUID;
  from: Address;
  to: Address;
  chainType: ChainType;
  type: TransactionType;
  status: TransactionStatus;
  amount: string;
  tokenSymbol: string;
  gasUsed?: string;
  gasFee?: string;
  valueUSD: number;
  timestamp: string;
  blockNumber?: number;
  description?: string;
}

export interface TransactionDetail extends Transaction {
  rawData?: string;
  errorMessage?: string;
  confirmations?: number;
}

export interface TransactionFilter {
  walletId?: UUID;
  chainType?: ChainType;
  type?: TransactionType;
  status?: TransactionStatus;
  startDate?: string;
  endDate?: string;
  minAmount?: string;
  maxAmount?: string;
}

export interface TransactionSummary {
  totalTransactions: number;
  totalVolume: string;
  totalGasFees: string;
  totalValueUSD: number;
  successCount: number;
  failedCount: number;
}