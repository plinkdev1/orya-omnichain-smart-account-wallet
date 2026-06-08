/**
 * Chainbase integration types
 * Type definitions for Chainbase data structures and API contracts
 */

import { Address, Hash, UUID } from './common.types';
import { ChainType } from './chain.types';

/**
 * Supported data types from Chainbase
 */
export enum ChainbaseDataType {
  BALANCE = 'balance',
  TRANSACTION = 'transaction',
  TOKEN = 'token',
  CONTRACT = 'contract',
  HOLDER = 'holder',
}

/**
 * Chainbase dataset containing indexed blockchain data
 */
export interface ChainbaseDataset {
  /** Unique identifier for the dataset */
  id: UUID;
  /** Chain type associated with this dataset */
  chainType: ChainType;
  /** Type of data in this dataset */
  dataType: ChainbaseDataType;
  /** Timestamp when data was indexed */
  timestamp: string;
  /** The actual data payload */
  data: Record<string, unknown>;
}

/**
 * Balance information for an address on a specific chain
 */
export interface ChainbaseBalance {
  /** Chain type */
  chainType: ChainType;
  /** Wallet address */
  address: Address;
  /** Balance in wei/smallest unit */
  balance: string;
  /** Token decimals */
  decimals: number;
  /** Token symbol */
  symbol: string;
  /** Last time balance was updated */
  lastUpdated: string;
  /** Optional token address for non-native tokens */
  tokenAddress?: Address;
}

/**
 * Transaction data from Chainbase
 */
export interface ChainbaseTransaction {
  /** Transaction hash */
  hash: Hash;
  /** Chain type */
  chainType: ChainType;
  /** From address */
  from: Address;
  /** To address */
  to: Address;
  /** Transaction value in wei */
  value: string;
  /** Transaction timestamp */
  timestamp: string;
  /** Transaction status */
  status: 'pending' | 'confirmed' | 'failed';
  /** Block number */
  blockNumber: number;
  /** Gas used */
  gasUsed?: string;
  /** Gas price in wei */
  gasPrice?: string;
  /** Transaction nonce */
  nonce?: number;
  /** Input data */
  input?: string;
}

/**
 * Token holding information
 */
export interface ChainbaseToken {
  /** Token contract address */
  address: Address;
  /** Chain type */
  chainType: ChainType;
  /** Token symbol */
  symbol: string;
  /** Token name */
  name: string;
  /** Token decimals */
  decimals: number;
  /** Balance of token held */
  balance: string;
  /** Optional USD price */
  priceUSD?: number;
  /** Optional token logo URL */
  logo?: string;
  /** Total supply (optional) */
  totalSupply?: string;
}

/**
 * Total Value Locked (TVL) data from a protocol
 */
export interface ChainbaseTVL {
  /** Protocol name */
  protocol: string;
  /** Chain type */
  chainType: ChainType;
  /** TVL in wei/smallest unit */
  tvl: string;
  /** TVL in USD */
  tvlUSD: number;
  /** Timestamp of TVL data */
  timestamp: string;
}

/**
 * Analytics data for an address
 */
export interface ChainbaseAnalytics {
  /** Chain type */
  chainType: ChainType;
  /** Address being analyzed */
  address: Address;
  /** Total transactions count */
  totalTransactions: number;
  /** Total value transacted */
  totalValue: string;
  /** First transaction date */
  firstTransaction: string;
  /** Last transaction date */
  lastTransaction: string;
  /** Count of unique contracts interacted with */
  uniqueContracts: number;
}

/**
 * Synchronization status for a chain
 */
export interface ChainbaseSyncStatus {
  /** Chain type */
  chainType: ChainType;
  /** Last block number synced */
  lastBlockSynced: number;
  /** Last sync time */
  lastSyncTime: string;
  /** Current sync status */
  status: 'syncing' | 'synced' | 'error';
  /** Optional error message */
  errorMessage?: string;
}

/**
 * Request to get balance information
 */
export interface GetChainbaseBalanceRequest {
  /** Wallet address to query */
  address: Address;
  /** Chain type */
  chainType: ChainType;
}

/**
 * Response for balance query
 */
export interface GetChainbaseBalanceResponse {
  /** Native balance information */
  balance: ChainbaseBalance;
  /** Array of token balances */
  tokens: ChainbaseToken[];
  /** Query timestamp */
  timestamp: string;
}

/**
 * Request to get transaction history
 */
export interface GetChainbaseTransactionsRequest {
  /** Wallet address to query */
  address: Address;
  /** Chain type */
  chainType: ChainType;
  /** Maximum number of transactions to return */
  limit?: number;
  /** Pagination offset */
  offset?: number;
  /** Optional start date filter */
  startDate?: string;
  /** Optional end date filter */
  endDate?: string;
}

/**
 * Response for transaction history query
 */
export interface GetChainbaseTransactionsResponse {
  /** Array of transactions */
  transactions: ChainbaseTransaction[];
  /** Total number of transactions */
  total: number;
  /** Whether more transactions are available */
  hasMore: boolean;
  /** Query timestamp */
  timestamp: string;
}

/**
 * Request to get token holders
 */
export interface GetChainbaseHoldersRequest {
  /** Token contract address */
  tokenAddress: Address;
  /** Chain type */
  chainType: ChainType;
  /** Maximum number of holders to return */
  limit?: number;
  /** Pagination offset */
  offset?: number;
}

/**
 * Response for token holders query
 */
export interface GetChainbaseHoldersResponse {
  /** Array of holder addresses and balances */
  holders: Array<{
    address: Address;
    balance: string;
    percentage: number;
  }>;
  /** Total number of holders */
  total: number;
  /** Total supply of token */
  totalSupply: string;
  /** Query timestamp */
  timestamp: string;
}

/**
 * Request to get contract information
 */
export interface GetChainbaseContractRequest {
  /** Contract address */
  address: Address;
  /** Chain type */
  chainType: ChainType;
}

/**
 * Response for contract information query
 */
export interface GetChainbaseContractResponse {
  /** Contract address */
  address: Address;
  /** Chain type */
  chainType: ChainType;
  /** Contract name */
  name?: string;
  /** Contract symbol (for tokens) */
  symbol?: string;
  /** Creator address */
  creator?: Address;
  /** Contract creation block */
  creationBlock?: number;
  /** Whether contract is verified */
  isVerified: boolean;
  /** Contract source code (if verified) */
  sourceCode?: string;
  /** Contract ABI (if available) */
  abi?: string;
  /** Query timestamp */
  timestamp: string;
}

/**
 * Webhook event from Chainbase
 */
export interface ChainbaseWebhookEvent {
  /** Event ID */
  id: UUID;
  /** Event type */
  eventType: 'balance_change' | 'new_transaction' | 'token_transfer' | 'contract_deployment';
  /** Chain type */
  chainType: ChainType;
  /** Address involved in the event */
  address: Address;
  /** Event data payload */
  data: Record<string, unknown>;
  /** Event timestamp */
  timestamp: string;
  /** Whether event has been processed */
  processed: boolean;
}
