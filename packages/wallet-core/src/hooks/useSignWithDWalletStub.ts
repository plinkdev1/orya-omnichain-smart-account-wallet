/**
 * useSignWithDWallet Hook Stub
 * Temporary stub while IKA service integration is disabled
 * TODO: Re-enable when IKA SDK incompatibilities are resolved
 */

export interface UseSignWithDWalletReturn {
  signTransaction: (tx: any) => Promise<any>;
  sign: (message: any) => Promise<any>;
  isLoading: boolean;
  error: string | null;
}

export function useSignWithDWallet(): UseSignWithDWalletReturn {
  return {
    signTransaction: async () => {
      throw new Error('IKA transaction signing is not available - feature is disabled');
    },
    sign: async () => {
      throw new Error('IKA signing is not available - feature is disabled');
    },
    isLoading: false,
    error: 'Feature disabled',
  };
}
