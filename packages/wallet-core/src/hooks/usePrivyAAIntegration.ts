/**
 * usePrivyAAIntegration Hook
 * React hook for integrated Privy + AA + Session Keys + Batch Operations
 */

import { useCallback, useState } from 'react';
import { PrivyAAIntegrationService, ExecutionContext } from '../services/privy-aa-integration';
import type { Address } from '@orya/shared-types';
import { SessionKeyPermission } from '@orya/shared-types';

export interface UsePrivyAAIntegrationState {
  loading: boolean;
  error: string | null;
  executionContext: ExecutionContext | null;
  isExecuting: boolean;
}

export interface UsePrivyAAIntegrationActions {
  createExecutionContext: (
    walletAddress: Address,
    options?: {
      createSessionKey?: boolean;
      sessionDurationSeconds?: number;
      permissions?: SessionKeyPermission[];
      useAA?: boolean;
    }
  ) => Promise<ExecutionContext>;
  executeTransaction: (
    context: ExecutionContext,
    transaction: {
      to: Address;
      value?: string;
      data?: string;
    },
    permission?: SessionKeyPermission
  ) => Promise<{
    txHash?: string;
    userOpHash?: string;
    batchId?: string;
    method: 'direct' | 'batch' | 'aa';
  }>;
  executeBatch: (
    context: ExecutionContext,
    useAA?: boolean
  ) => Promise<{
    txHash?: string;
    userOpHash?: string;
    results?: Array<{ operationId: string; status: string }>;
  }>;
  revokeSessionKey: (sessionKeyId: string) => void;
  revokeAllSessionKeys: (walletAddress: Address) => void;
  getStats: () => {
    privyWallets: number;
    activeSessions: number;
    pendingBatches: number;
    userOperations: number;
  };
  clear: () => void;
}

/**
 * React hook for Privy AA integration
 */
export function usePrivyAAIntegration(
  service: PrivyAAIntegrationService
): UsePrivyAAIntegrationState & UsePrivyAAIntegrationActions {
  const [state, setState] = useState<UsePrivyAAIntegrationState>({
    loading: false,
    error: null,
    executionContext: null,
    isExecuting: false,
  });

  const createExecutionContext = useCallback(
    async (
      walletAddress: Address,
      options?: {
        createSessionKey?: boolean;
        sessionDurationSeconds?: number;
        permissions?: SessionKeyPermission[];
        useAA?: boolean;
      }
    ) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const context = await service.createExecutionContext(walletAddress, options);
        setState((prev) => ({
          ...prev,
          executionContext: context,
          loading: false,
        }));
        return context;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
        throw error;
      }
    },
    [service]
  );

  const executeTransaction = useCallback(
    async (
      context: ExecutionContext,
      transaction: {
        to: Address;
        value?: string;
        data?: string;
      },
      permission: SessionKeyPermission = SessionKeyPermission.TRANSFER
    ) => {
      setState((prev) => ({ ...prev, isExecuting: true, error: null }));
      try {
        const result = await service.executeTransaction(context, transaction, permission);
        setState((prev) => ({
          ...prev,
          isExecuting: false,
        }));
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({ ...prev, error: errorMessage, isExecuting: false }));
        throw error;
      }
    },
    [service]
  );

  const executeBatch = useCallback(
    async (context: ExecutionContext, useAA: boolean = false) => {
      setState((prev) => ({ ...prev, isExecuting: true, error: null }));
      try {
        const result = await service.executeBatch(context, useAA);
        setState((prev) => ({
          ...prev,
          isExecuting: false,
        }));
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({ ...prev, error: errorMessage, isExecuting: false }));
        throw error;
      }
    },
    [service]
  );

  const revokeSessionKey = useCallback(
    (sessionKeyId: string) => {
      try {
        service.revokeSessionKey(sessionKeyId);
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

  const revokeAllSessionKeys = useCallback(
    (walletAddress: Address) => {
      try {
        service.revokeAllSessionKeys(walletAddress);
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

  const getStats = useCallback(() => {
    return service.getStats();
  }, [service]);

  const clear = useCallback(() => {
    setState({
      loading: false,
      error: null,
      executionContext: null,
      isExecuting: false,
    });
  }, []);

  return {
    ...state,
    createExecutionContext,
    executeTransaction,
    executeBatch,
    revokeSessionKey,
    revokeAllSessionKeys,
    getStats,
    clear,
  };
}

export default usePrivyAAIntegration;
