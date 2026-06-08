/**
 * Chainbase Service - Blockchain data indexing and analytics
 * Provides methods to query balances, transactions, TVL, and analytics
 */

import { ApiClient } from './api-client';
import type {
  ChainbaseBalance,
  ChainbaseTransaction,
  ChainbaseToken,
  ChainbaseTVL,
  ChainbaseAnalytics,
  GetChainbaseBalanceRequest,
  GetChainbaseTransactionsRequest,
} from '@orya/shared-types';

export class ChainbaseService {
  constructor(private apiClient: ApiClient) {}

  /**
   * Get balance for an address on a specific chain
   */
  async getBalance(
    request: GetChainbaseBalanceRequest
  ): Promise<{ balance: ChainbaseBalance; tokens: ChainbaseToken[] }> {
    const query = `
      query GetChainbaseBalance($address: String!, $chainType: String!) {
        chainbaseBalance(address: $address, chainType: $chainType) {
          balance {
            chainType
            address
            balance
            decimals
            symbol
            lastUpdated
            tokenAddress
          }
          tokens {
            address
            chainType
            symbol
            name
            decimals
            balance
            priceUSD
            logo
          }
        }
      }
    `;
    const result = await this.apiClient.query<{
      chainbaseBalance: { balance: ChainbaseBalance; tokens: ChainbaseToken[] };
    }>(query, request);

    if (result.error) {
      throw new Error(`Failed to get Chainbase balance: ${result.error}`);
    }

    if (!result.data) {
      throw new Error('No data returned from Chainbase balance query');
    }

    return result.data.chainbaseBalance;
  }

  /**
   * Get transaction history for an address
   */
  async getTransactions(
    request: GetChainbaseTransactionsRequest
  ): Promise<{ transactions: ChainbaseTransaction[]; total: number; hasMore: boolean }> {
    const query = `
      query GetChainbaseTransactions(
        $address: String!
        $chainType: String!
        $limit: Int
        $offset: Int
        $startDate: String
        $endDate: String
      ) {
        chainbaseTransactions(
          address: $address
          chainType: $chainType
          limit: $limit
          offset: $offset
          startDate: $startDate
          endDate: $endDate
        ) {
          transactions {
            hash
            chainType
            from
            to
            value
            timestamp
            status
            blockNumber
            gasUsed
            gasPrice
            nonce
            input
          }
          total
          hasMore
        }
      }
    `;
    const result = await this.apiClient.query<{
      chainbaseTransactions: {
        transactions: ChainbaseTransaction[];
        total: number;
        hasMore: boolean;
      };
    }>(query, request);

    if (result.error) {
      throw new Error(`Failed to get Chainbase transactions: ${result.error}`);
    }

    if (!result.data) {
      throw new Error('No data returned from Chainbase transactions query');
    }

    return result.data.chainbaseTransactions;
  }

  /**
   * Get TVL for a protocol on a chain
   */
  async getTVL(chainType: string, protocol: string): Promise<ChainbaseTVL> {
    const query = `
      query GetChainbaseTVL($chainType: String!, $protocol: String!) {
        chainbaseTVL(chainType: $chainType, protocol: $protocol) {
          protocol
          chainType
          tvl
          tvlUSD
          timestamp
        }
      }
    `;
    const result = await this.apiClient.query<{ chainbaseTVL: ChainbaseTVL }>(
      query,
      {
        chainType,
        protocol,
      }
    );

    if (result.error) {
      throw new Error(`Failed to get Chainbase TVL: ${result.error}`);
    }

    if (!result.data) {
      throw new Error('No data returned from Chainbase TVL query');
    }

    return result.data.chainbaseTVL;
  }

  /**
   * Get analytics for an address
   */
  async getAnalytics(address: string, chainType: string): Promise<ChainbaseAnalytics> {
    const query = `
      query GetChainbaseAnalytics($address: String!, $chainType: String!) {
        chainbaseAnalytics(address: $address, chainType: $chainType) {
          chainType
          address
          totalTransactions
          totalValue
          firstTransaction
          lastTransaction
          uniqueContracts
        }
      }
    `;
    const result = await this.apiClient.query<{
      chainbaseAnalytics: ChainbaseAnalytics;
    }>(query, { address, chainType });

    if (result.error) {
      throw new Error(`Failed to get Chainbase analytics: ${result.error}`);
    }

    if (!result.data) {
      throw new Error('No data returned from Chainbase analytics query');
    }

    return result.data.chainbaseAnalytics;
  }

  /**
   * Get supported chains
   */
  async getSupportedChains(): Promise<string[]> {
    const query = `
      query GetSupportedChains {
        chainbaseSupportedChains {
          chainType
          name
          isSupported
        }
      }
    `;
    const result = await this.apiClient.query<{
      chainbaseSupportedChains: Array<{ chainType: string; name: string; isSupported: boolean }>;
    }>(query);

    if (result.error) {
      throw new Error(`Failed to get supported chains: ${result.error}`);
    }

    if (!result.data) {
      throw new Error('No data returned from supported chains query');
    }

    return result.data.chainbaseSupportedChains
      .filter((chain) => chain.isSupported)
      .map((chain) => chain.chainType);
  }
}
