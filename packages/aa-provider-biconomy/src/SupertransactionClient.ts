/**
 * Biconomy Supertransaction API Client
 * Handles communication with Biconomy Supertransaction API
 */

import axios, { AxiosInstance } from 'axios';
import type { UserOperation } from '@orya/shared-types';
import {
  BiconomyAPIError,
  BiconomyTransactionError,
} from './BiconomyErrors';
import type {
  SupertransactionParams,
  SupertransactionResult,
  MultiChainResult,
  PaymasterDataResponse,
} from './BiconomyTypes';
import { BiconomyConfig } from './BiconomyConfig';

export interface SupertransactionAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export class SupertransactionClient {
  private client: AxiosInstance;
  private config: BiconomyConfig;
  private apiBaseUrl: string = 'https://supertransaction.biconomy.io/api/v1';

  constructor(config: BiconomyConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: this.apiBaseUrl,
      headers: {
        'X-API-Key': config.apiKey,
        'X-API-ID': config.apiId,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (axios.isAxiosError(error)) {
          const statusCode = error.response?.status;
          const errorData = error.response?.data as any;
          const message = errorData?.message || errorData?.error || error.message;

          throw new BiconomyAPIError(
            `Biconomy API error: ${message}`,
            statusCode,
            errorData
          );
        }
        throw error;
      }
    );
  }

  /**
   * Execute a single-chain supertransaction
   */
  async executeSupertransaction(
    params: SupertransactionParams
  ): Promise<SupertransactionResult> {
    try {
      const response = await this.client.post<
        SupertransactionAPIResponse<SupertransactionResult>
      >('/execute', {
        operations: params.operations,
        deadline: params.deadline,
        refundReceiver: params.refundReceiver,
        requireSuccess: params.requireSuccess ?? true,
      });

      if (!response.data.success || !response.data.data) {
        throw new BiconomyTransactionError(
          'Failed to execute supertransaction',
          response.data
        );
      }

      return response.data.data;
    } catch (error) {
      if (error instanceof BiconomyAPIError) {
        throw error;
      }
      throw new BiconomyTransactionError(
        `Supertransaction execution failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Execute a multi-chain supertransaction
   */
  async executeMultiChain(
    params: SupertransactionParams
  ): Promise<MultiChainResult> {
    try {
      const response = await this.client.post<
        SupertransactionAPIResponse<MultiChainResult>
      >('/execute-multichain', {
        operations: params.operations,
        deadline: params.deadline,
        atomic: true,
        requireSuccess: params.requireSuccess ?? true,
      });

      if (!response.data.success || !response.data.data) {
        throw new BiconomyTransactionError(
          'Failed to execute multi-chain supertransaction',
          response.data
        );
      }

      return response.data.data;
    } catch (error) {
      if (error instanceof BiconomyAPIError) {
        throw error;
      }
      throw new BiconomyTransactionError(
        `Multi-chain execution failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get supported chains
   */
  async getSupportedChains(): Promise<
    Array<{ chainId: number; name: string; supported: boolean }>
  > {
    try {
      const response = await this.client.get<SupertransactionAPIResponse>(
        '/chains'
      );
      if (!response.data.success || !response.data.data) {
        throw new Error('Failed to fetch supported chains');
      }
      return response.data.data;
    } catch (error) {
      throw new BiconomyAPIError(
        `Failed to get supported chains: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Estimate gas for supertransaction
   */
  async estimateGas(params: SupertransactionParams): Promise<{
    preVerificationGas: string;
    verificationGasLimit: string;
    callGasLimit: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    totalEstimatedGas: string;
  }> {
    try {
      const response = await this.client.post<SupertransactionAPIResponse>(
        '/estimate-gas',
        {
          operations: params.operations,
          refundReceiver: params.refundReceiver,
        }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error('Failed to estimate gas');
      }

      return response.data.data;
    } catch (error) {
      throw new BiconomyAPIError(
        `Gas estimation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get paymaster sponsorship data
   */
  async getPaymasterData(
    userOp: UserOperation,
    paymasterAddress: string
  ): Promise<PaymasterDataResponse> {
    try {
      const response = await this.client.post<
        SupertransactionAPIResponse<PaymasterDataResponse>
      >('/paymaster/sponsorship', {
        userOp,
        paymasterAddress,
      });

      if (!response.data.success || !response.data.data) {
        throw new Error('Failed to get paymaster data');
      }

      return response.data.data;
    } catch (error) {
      throw new BiconomyAPIError(
        `Paymaster data retrieval failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(
    transactionHash: string
  ): Promise<{
    status: 'submitted' | 'confirmed' | 'failed';
    blockNumber?: number;
    confirmations?: number;
  }> {
    try {
      const response = await this.client.get<SupertransactionAPIResponse>(
        `/status/${transactionHash}`
      );

      if (!response.data.success || !response.data.data) {
        throw new Error('Failed to get transaction status');
      }

      return response.data.data;
    } catch (error) {
      throw new BiconomyAPIError(
        `Failed to get transaction status: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Cancel a pending supertransaction
   */
  async cancelTransaction(transactionHash: string): Promise<boolean> {
    try {
      const response = await this.client.post<SupertransactionAPIResponse<boolean>>(
        `/cancel/${transactionHash}`,
        {}
      );

      if (!response.data.success) {
        throw new Error('Failed to cancel transaction');
      }

      return response.data.data ?? false;
    } catch (error) {
      throw new BiconomyAPIError(
        `Failed to cancel transaction: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Speed up pending transaction
   */
  async speedUpTransaction(
    transactionHash: string,
    maxFeePerGas: string,
    maxPriorityFeePerGas: string
  ): Promise<string> {
    try {
      const response = await this.client.post<SupertransactionAPIResponse<string>>(
        `/speed-up/${transactionHash}`,
        {
          maxFeePerGas,
          maxPriorityFeePerGas,
        }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error('Failed to speed up transaction');
      }

      return response.data.data;
    } catch (error) {
      throw new BiconomyAPIError(
        `Failed to speed up transaction: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

export default SupertransactionClient;
