/**
 * useAccountAbstraction Hook
 * React hook for Account Abstraction operations
 */

import { useCallback, useState } from 'react';
import { AccountAbstractionService } from '../services/account-abstraction';
import type {
  SmartAccountConfig,
  UserOperation,
  UserOpGasEstimate,
  PaymasterConfig,
  ExecutionData,
  ValidatorConfig,
} from '@orya/shared-types';

export interface UseAccountAbstractionState {
  loading: boolean;
  error: string | null;
  smartAccount: SmartAccountConfig | null;
  userOpHash: string | null;
}

export interface UseAccountAbstractionActions {
  createSmartAccount: (
    ownerAddress: string,
    accountType: string
  ) => Promise<SmartAccountConfig>;
  createUserOperation: (
    accountAddress: string,
    executionData: ExecutionData,
    validators?: ValidatorConfig[]
  ) => Promise<UserOperation>;
  estimateGas: (userOp: UserOperation) => Promise<UserOpGasEstimate>;
  submitUserOperation: (userOp: UserOperation) => Promise<string>;
  getPaymasterConfigs: () => Promise<PaymasterConfig[]>;
  setPaymaster: (paymasterAddress: string, mode: string) => Promise<void>;
  clear: () => void;
}

/**
 * React hook for Account Abstraction functionality
 */
export function useAccountAbstraction(
  service: AccountAbstractionService
): UseAccountAbstractionState & UseAccountAbstractionActions {
  const [state, setState] = useState<UseAccountAbstractionState>({
    loading: false,
    error: null,
    smartAccount: null,
    userOpHash: null,
  });

  const createSmartAccount = useCallback(
    async (ownerAddress: string, accountType: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const account = await service.createSmartAccount({
          ownerAddress,
          accountType: accountType as any,
          chainId: 1,
        });
        setState((prev) => ({ ...prev, smartAccount: account, loading: false }));
        return account;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
        throw error;
      }
    },
    [service]
  );

  const createUserOperation = useCallback(
    async (
      accountAddress: string,
      executionData: ExecutionData,
      validators?: ValidatorConfig[]
    ) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const userOp = await service.createUserOperation(
          accountAddress,
          executionData,
          validators
        );
        setState((prev) => ({ ...prev, loading: false }));
        return userOp;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
        throw error;
      }
    },
    [service]
  );

  const estimateGas = useCallback(
    async (userOp: UserOperation) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const estimate = await service.estimateUserOpGas(userOp);
        setState((prev) => ({ ...prev, loading: false }));
        return estimate;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
        throw error;
      }
    },
    [service]
  );

  const submitUserOperation = useCallback(
    async (userOp: UserOperation) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const result = await service.submitUserOperation(userOp);
        setState((prev) => ({
          ...prev,
          userOpHash: result.userOpHash,
          loading: false,
        }));
        return result.userOpHash;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
        throw error;
      }
    },
    [service]
  );

  const getPaymasterConfigs = useCallback(
    async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const configs = await service.getPaymasterConfigs();
        setState((prev) => ({ ...prev, loading: false }));
        return configs;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
        throw error;
      }
    },
    [service]
  );

  const setPaymaster = useCallback(
    async (paymasterAddress: string, mode: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        await service.setPaymaster(paymasterAddress, mode as any);
        setState((prev) => ({ ...prev, loading: false }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
        throw error;
      }
    },
    [service]
  );

  const clear = useCallback(() => {
    setState({
      loading: false,
      error: null,
      smartAccount: null,
      userOpHash: null,
    });
  }, []);

  return {
    ...state,
    createSmartAccount,
    createUserOperation,
    estimateGas,
    submitUserOperation,
    getPaymasterConfigs,
    setPaymaster,
    clear,
  };
}

export default useAccountAbstraction;
