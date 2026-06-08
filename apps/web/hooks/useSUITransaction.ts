import { useState, useCallback } from 'react';
import { useSUIWallet } from '@/providers/SUIWalletProvider';

export interface UseSUITransactionState {
  isLoading: boolean;
  error: Error | null;
  data: string | null;
}

export function useSUITransaction() {
  const { signAndExecuteTransactionBlock, selectedAccount } = useSUIWallet();
  const [state, setState] = useState<UseSUITransactionState>({
    isLoading: false,
    error: null,
    data: null,
  });

  const execute = useCallback(
    async (txBlock: Uint8Array) => {
      if (!selectedAccount) {
        const error = new Error('No account selected');
        setState({ isLoading: false, error, data: null });
        throw error;
      }

      try {
        setState({ isLoading: true, error: null, data: null });

        const digest = await signAndExecuteTransactionBlock(txBlock);

        setState({ isLoading: false, error: null, data: digest });
        return digest;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setState({ isLoading: false, error, data: null });
        throw error;
      }
    },
    [signAndExecuteTransactionBlock, selectedAccount]
  );

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, data: null });
  }, []);

  return {
    execute,
    reset,
    ...state,
  };
}
