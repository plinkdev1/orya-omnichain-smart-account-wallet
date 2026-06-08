/**
 * React Hook: Cross-Chain Transfer via Stargate
 * Manages cross-chain token transfers with quote fetching
 */

import { useCallback, useEffect, useState } from 'react';
import {
    getStargateService,
    StargateService,
    TransferQuote,
} from '../services/StargateService';

export interface UseCrossChainTransferReturn {
  quote: TransferQuote | null;
  isLoading: boolean;
  error: string | null;
  getQuote: (
    srcChain: string,
    dstChain: string,
    tokenSymbol: string,
    amount: string,
    slippage?: number
  ) => Promise<void>;
  supportedChains: string[];
  supportedTokens: string[];
  isPairSupported: (
    srcChain: string,
    dstChain: string,
    token: string
  ) => boolean;
  estimateGas: (
    srcChain: string,
    dstChain: string,
    amount: string
  ) => Promise<{ nativeGasFee: string; usdValue: string } | null>;
  calculateMinAmount: (amountOut: string, slippage: number) => string;
}

export function useCrossChainTransfer(): UseCrossChainTransferReturn {
  const [quote, setQuote] = useState<TransferQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stargateService, setStargateService] =
    useState<StargateService | null>(null);

  // Initialize Stargate service
  useEffect(() => {
    try {
      const service = getStargateService();
      setStargateService(service);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize Stargate service');
    }
  }, []);

  const getQuote = useCallback(
    async (
      srcChain: string,
      dstChain: string,
      tokenSymbol: string,
      amount: string,
      slippage: number = 0.1
    ) => {
      if (!stargateService) {
        setError('Stargate service not initialized');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const newQuote = await stargateService.getTransferQuote(
          srcChain,
          dstChain,
          tokenSymbol,
          amount,
          slippage
        );

        if (newQuote) {
          setQuote(newQuote);
        } else {
          setError('Failed to get transfer quote');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to get transfer quote');
        setQuote(null);
      } finally {
        setIsLoading(false);
      }
    },
    [stargateService]
  );

  const estimateGas = useCallback(
    async (srcChain: string, dstChain: string, amount: string) => {
      if (!stargateService) return null;

      try {
        return await stargateService.estimateGasFee(srcChain, dstChain, amount);
      } catch (err) {
        console.error('Failed to estimate gas:', err);
        return null;
      }
    },
    [stargateService]
  );

  const calculateMinAmount = useCallback(
    (amountOut: string, slippage: number) => {
      if (!stargateService) return amountOut;
      return stargateService.calculateMinAmount(amountOut, slippage);
    },
    [stargateService]
  );

  const isPairSupported = useCallback(
    (srcChain: string, dstChain: string, token: string) => {
      if (!stargateService) return false;
      return stargateService.isPairSupported(srcChain, dstChain, token);
    },
    [stargateService]
  );

  return {
    quote,
    isLoading,
    error,
    getQuote,
    supportedChains: stargateService?.getSupportedChains() || [],
    supportedTokens: stargateService?.getSupportedTokens() || [],
    isPairSupported,
    estimateGas,
    calculateMinAmount,
  };
}