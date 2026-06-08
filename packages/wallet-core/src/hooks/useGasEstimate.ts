/**
 * useGasEstimate Hook
 * Handles gas estimation and sponsorship checks
 */

import { useState, useCallback } from 'react';
import type { Address } from '@orya/shared-types';
// TODO: @orya/aa-provider-biconomy is not available
// import type { BiconomyService, SupertransactionParams } from '@orya/aa-provider-biconomy';

type BiconomyService = any;
type SupertransactionParams = any;

export interface GasEstimate {
  preVerificationGas: string;
  verificationGasLimit: string;
  callGasLimit: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  totalEstimatedGas: string;
}

export interface SponsorsshipInfo {
  totalQuotaUsd: number;
  usedQuotaUsd: number;
  remainingQuotaUsd: number;
  resetAt: string;
}

export interface UseGasEstimateReturn {
  estimate: GasEstimate | null;
  sponsorshipInfo: SponsorsshipInfo | null;
  isEstimating: boolean;
  isCheckingSponsorship: boolean;
  error: Error | null;
  estimateGas: (params: SupertransactionParams) => Promise<GasEstimate>;
  checkSponsorship: (userAddress: Address, estimatedUsd: number) => Promise<boolean>;
  getSponsorsshipQuota: (userAddress: Address) => Promise<SponsorsshipInfo>;
}

/**
 * Hook for gas estimation and sponsorship
 */
export function useGasEstimate(service: BiconomyService | null): UseGasEstimateReturn {
  const [estimate, setEstimate] = useState<GasEstimate | null>(null);
  const [sponsorshipInfo, setSponsorshipInfo] = useState<SponsorsshipInfo | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isCheckingSponsorship, setIsCheckingSponsorship] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const estimateGas = useCallback(
    async (params: SupertransactionParams): Promise<GasEstimate> => {
      if (!service || !service.isReady()) {
        throw new Error('Biconomy service not initialized');
      }

      setIsEstimating(true);
      setError(null);

      try {
        // Get supertransaction client for gas estimation
        const config = service.getConfig();
        const gasEstimate = await (service as any).supertxClient.estimateGas(params);

        setEstimate(gasEstimate);
        return gasEstimate;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsEstimating(false);
      }
    },
    [service]
  );

  const checkSponsorship = useCallback(
    async (userAddress: Address, estimatedUsd: number): Promise<boolean> => {
      if (!service || !service.isReady()) {
        throw new Error('Biconomy service not initialized');
      }

      setIsCheckingSponsorship(true);
      setError(null);

      try {
        const paymasterService = service.getPaymasterService();
        return await paymasterService.validateSponsorship(userAddress, estimatedUsd);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return false;
      } finally {
        setIsCheckingSponsorship(false);
      }
    },
    [service]
  );

  const getSponsorsshipQuota = useCallback(
    async (userAddress: Address): Promise<SponsorsshipInfo> => {
      if (!service || !service.isReady()) {
        throw new Error('Biconomy service not initialized');
      }

      try {
        const paymasterService = service.getPaymasterService();
        const quota = await paymasterService.getQuota(userAddress);
        setSponsorshipInfo(quota);
        return quota;
      } catch (err) {
        console.error('Failed to get sponsorship quota:', err);
        throw err;
      }
    },
    [service]
  );

  return {
    estimate,
    sponsorshipInfo,
    isEstimating,
    isCheckingSponsorship,
    error,
    estimateGas,
    checkSponsorship,
    getSponsorsshipQuota,
  };
}

export default useGasEstimate;
