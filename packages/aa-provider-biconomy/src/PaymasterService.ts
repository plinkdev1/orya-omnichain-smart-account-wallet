/**
 * Biconomy Paymaster Service
 * Handles gas sponsorship and ERC-20 payment integrations
 */

import axios, { AxiosInstance } from 'axios';
import type { Address } from '@orya/shared-types';
import { BiconomyPaymasterError, BiconomyAPIError } from './BiconomyErrors';
import type { PaymasterDataResponse } from './BiconomyTypes';
import { BiconomyConfig } from './BiconomyConfig';

export interface PaymasterSponsorshipRequest {
  userOperation: any;
  paymasterAddress: Address;
  mode: 'sponsored' | 'erc20' | 'verify_signing';
  token?: Address;
}

export interface PaymasterSponsorshipData {
  paymasterAndData: string;
  preVerificationGas: string;
  verificationGasLimit: string;
  callGasLimit: string;
}

export interface GasSponsorshipPolicy {
  maxUsdPerTransaction: number;
  maxDailyBudgetUsd: number;
  minUserBalanceUsd: number;
  maxSponsorshipPercentage: number;
  eligibleTokens?: Address[];
  whitelistedAddresses?: Address[];
}

export class PaymasterService {
  private client: AxiosInstance;
  private config: BiconomyConfig;
  private sponsorshipPolicies: Map<string, GasSponsorshipPolicy> = new Map();

  constructor(config: BiconomyConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.paymasterUrl,
      headers: {
        'X-API-Key': config.apiKey,
        'X-API-ID': config.apiId,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.initializeDefaultPolicies();
  }

  /**
   * Get sponsorship data for a UserOperation
   */
  async getSponsorshipData(
    request: PaymasterSponsorshipRequest
  ): Promise<PaymasterDataResponse> {
    try {
      const response = await this.client.post<PaymasterDataResponse>(
        `/sponsorship/${request.mode}`,
        {
          userOperation: request.userOperation,
          paymasterAddress: request.paymasterAddress,
          token: request.token,
        }
      );

      return response.data;
    } catch (error) {
      throw new BiconomyPaymasterError(
        `Failed to get sponsorship data: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Validate sponsorship eligibility
   */
  async validateSponsorship(
    userAddress: Address,
    estimatedGasCostUsd: number,
    paymasterAddress?: Address
  ): Promise<boolean> {
    try {
      const policy = paymasterAddress
        ? this.sponsorshipPolicies.get(paymasterAddress)
        : Array.from(this.sponsorshipPolicies.values())[0];

      if (!policy) {
        return false;
      }

      if (estimatedGasCostUsd > policy.maxUsdPerTransaction) {
        return false;
      }

      if (policy.whitelistedAddresses && !policy.whitelistedAddresses.includes(userAddress)) {
        return false;
      }

      return true;
    } catch (error) {
      throw new BiconomyPaymasterError(
        `Sponsorship validation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get ERC-20 token paymaster data
   */
  async getTokenPaymasterData(
    userOperation: any,
    tokenAddress: Address,
    paymasterAddress: Address
  ): Promise<PaymasterDataResponse> {
    try {
      const response = await this.client.post<PaymasterDataResponse>(
        '/sponsorship/erc20',
        {
          userOperation,
          tokenAddress,
          paymasterAddress,
        }
      );

      return response.data;
    } catch (error) {
      throw new BiconomyPaymasterError(
        `Failed to get token paymaster data: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Estimate gas with paymaster
   */
  async estimateGasWithPaymaster(
    userOperation: any,
    paymasterAddress: Address
  ): Promise<{
    preVerificationGas: string;
    verificationGasLimit: string;
    callGasLimit: string;
  }> {
    try {
      const response = await this.client.post<any>(
        '/gas-estimate',
        {
          userOperation,
          paymasterAddress,
        }
      );

      return response.data;
    } catch (error) {
      throw new BiconomyPaymasterError(
        `Gas estimation with paymaster failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get sponsorship quota for account
   */
  async getQuota(userAddress: Address): Promise<{
    totalQuotaUsd: number;
    usedQuotaUsd: number;
    remainingQuotaUsd: number;
    resetAt: string;
  }> {
    try {
      const response = await this.client.get(`/quota/${userAddress}`);
      return response.data;
    } catch (error) {
      throw new BiconomyPaymasterError(
        `Failed to get quota: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Register custom sponsorship policy
   */
  registerPolicy(
    paymasterAddress: string,
    policy: GasSponsorshipPolicy
  ): void {
    this.sponsorshipPolicies.set(paymasterAddress, policy);
  }

  /**
   * Get sponsorship policy
   */
  getPolicy(paymasterAddress: string): GasSponsorshipPolicy | undefined {
    return this.sponsorshipPolicies.get(paymasterAddress);
  }

  private initializeDefaultPolicies(): void {
    const defaultPolicy: GasSponsorshipPolicy = {
      maxUsdPerTransaction: 50,
      maxDailyBudgetUsd: 5000,
      minUserBalanceUsd: 10,
      maxSponsorshipPercentage: 100,
    };

    this.sponsorshipPolicies.set('default', defaultPolicy);
  }
}

export default PaymasterService;
