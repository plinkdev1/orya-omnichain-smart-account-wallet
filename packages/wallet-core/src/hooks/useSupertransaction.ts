/**
 * useSupertransaction Hook
 * Handles execution of Biconomy supertransactions
 */

import { useState, useCallback } from 'react';
// TODO: @orya/aa-provider-biconomy is not available
// import type { BiconomyService, SupertransactionParams, SupertransactionResult, TransactionOptions } from '@orya/aa-provider-biconomy';

type BiconomyService = any;
type SupertransactionParams = any;
type SupertransactionResult = any;
type TransactionOptions = any;

export interface UseSupertransactionReturn {
  result: SupertransactionResult | null;
  isExecuting: boolean;
  error: Error | null;
  execute: (params: SupertransactionParams, options?: TransactionOptions) => Promise<SupertransactionResult>;
  getStatus: (txHash: string) => Promise<any>;
  cancel: (txHash: string) => Promise<boolean>;
  speedUp: (txHash: string, maxFeePerGas: string, maxPriorityFeePerGas: string) => Promise<string>;
}

/**
 * Hook for executing supertransactions
 */
export function useSupertransaction(service: BiconomyService | null): UseSupertransactionReturn {
  const [result, setResult] = useState<SupertransactionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (params: SupertransactionParams, options?: TransactionOptions): Promise<SupertransactionResult> => {
      if (!service || !service.isReady()) {
        throw new Error('Biconomy service not initialized');
      }

      setIsExecuting(true);
      setError(null);

      try {
        const txResult = await service.executeSupertransaction(params, options);
        setResult(txResult);
        return txResult;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsExecuting(false);
      }
    },
    [service]
  );

  const getStatus = useCallback(
    async (txHash: string) => {
      if (!service || !service.isReady()) {
        throw new Error('Biconomy service not initialized');
      }

      try {
        return await service.getTransactionStatus(txHash);
      } catch (err) {
        console.error('Failed to get transaction status:', err);
        throw err;
      }
    },
    [service]
  );

  const cancel = useCallback(
    async (txHash: string): Promise<boolean> => {
      if (!service || !service.isReady()) {
        throw new Error('Biconomy service not initialized');
      }

      try {
        return await service.cancelTransaction(txHash);
      } catch (err) {
        console.error('Failed to cancel transaction:', err);
        throw err;
      }
    },
    [service]
  );

  const speedUp = useCallback(
    async (txHash: string, maxFeePerGas: string, maxPriorityFeePerGas: string): Promise<string> => {
      if (!service || !service.isReady()) {
        throw new Error('Biconomy service not initialized');
      }

      try {
        return await service.speedUpTransaction(txHash, maxFeePerGas, maxPriorityFeePerGas);
      } catch (err) {
        console.error('Failed to speed up transaction:', err);
        throw err;
      }
    },
    [service]
  );

  return {
    result,
    isExecuting,
    error,
    execute,
    getStatus,
    cancel,
    speedUp,
  };
}

export default useSupertransaction;
