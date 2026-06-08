/**
 * useBatchOperations Hook
 * React hook for managing batch operations
 */

import { useCallback, useState } from 'react';
import { BatchOperationsService, Batch, BatchStatus, BatchOperation } from '../services/batch-operations';
import type { UUID, ChainType } from '@orya/shared-types';

export interface UseBatchOperationsState {
  loading: boolean;
  error: string | null;
  currentBatch: Batch | null;
  batches: Batch[];
}

export interface UseBatchOperationsActions {
  createBatch: (walletAddress: string, chainType: ChainType, chainId: number) => Batch;
  addOperation: (batchId: UUID, operation: Omit<BatchOperation, 'id'>) => BatchOperation;
  removeOperation: (batchId: UUID, operationId: string) => boolean;
  estimateGas: (batchId: UUID) => Promise<string>;
  submitBatch: (batchId: UUID) => Promise<void>;
  cancelBatch: (batchId: UUID) => void;
  getBatch: (batchId: UUID) => Batch | undefined;
  getBatchesForWallet: (walletAddress: string) => Batch[];
  clear: () => void;
}

/**
 * React hook for batch operations
 */
export function useBatchOperations(
  service: BatchOperationsService
): UseBatchOperationsState & UseBatchOperationsActions {
  const [state, setState] = useState<UseBatchOperationsState>({
    loading: false,
    error: null,
    currentBatch: null,
    batches: [],
  });

  const createBatch = useCallback(
    (walletAddress: string, chainType: ChainType, chainId: number) => {
      try {
        const batch = service.createBatch(walletAddress, chainType, chainId);
        setState((prev) => ({
          ...prev,
          currentBatch: batch,
          batches: [...prev.batches, batch],
        }));
        return batch;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    [service]
  );

  const addOperation = useCallback(
    (batchId: UUID, operation: Omit<BatchOperation, 'id'>) => {
      try {
        const op = service.addOperation(batchId, operation);
        setState((prev) => ({
          ...prev,
          error: null,
        }));
        return op;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    [service]
  );

  const removeOperation = useCallback(
    (batchId: UUID, operationId: string) => {
      try {
        const removed = service.removeOperation(batchId, operationId);
        setState((prev) => ({
          ...prev,
          error: null,
        }));
        return removed;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    [service]
  );

  const estimateGas = useCallback(
    async (batchId: UUID) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const gasEstimate = await service.estimateBatchGas(batchId);
        setState((prev) => ({ ...prev, loading: false }));
        return gasEstimate;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
        throw error;
      }
    },
    [service]
  );

  const submitBatch = useCallback(
    async (batchId: UUID) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const batch = service.getBatch(batchId);
        if (!batch) {
          throw new Error('Batch not found');
        }

        service.markAsReadyForSigning(batchId);
        service.markAsSubmitted(batchId);

        setState((prev) => ({
          ...prev,
          currentBatch: batch,
          loading: false,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
        throw error;
      }
    },
    [service]
  );

  const cancelBatch = useCallback(
    (batchId: UUID) => {
      try {
        service.cancelBatch(batchId);
        setState((prev) => ({
          ...prev,
          error: null,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    [service]
  );

  const getBatch = useCallback(
    (batchId: UUID) => {
      return service.getBatch(batchId);
    },
    [service]
  );

  const getBatchesForWallet = useCallback(
    (walletAddress: string) => {
      return service.getBatchesForWallet(walletAddress);
    },
    [service]
  );

  const clear = useCallback(() => {
    setState({
      loading: false,
      error: null,
      currentBatch: null,
      batches: [],
    });
  }, []);

  return {
    ...state,
    createBatch,
    addOperation,
    removeOperation,
    estimateGas,
    submitBatch,
    cancelBatch,
    getBatch,
    getBatchesForWallet,
    clear,
  };
}

export default useBatchOperations;
