/**
 * useCreateDWallet Hook Stub
 * Temporary stub while IKA service integration is disabled
 * TODO: Re-enable when IKA SDK incompatibilities are resolved
 */

export interface UseCreateDWalletReturn {
  createDWallet: (options: any) => Promise<void>;
  progress: null;
  isCreating: boolean;
  error: string | null;
  result: null;
}

export function useCreateDWallet(): UseCreateDWalletReturn {
  return {
    createDWallet: async () => {
      throw new Error('IKA dWallet creation is not available - feature is disabled');
    },
    progress: null,
    isCreating: false,
    error: 'Feature disabled',
    result: null,
  };
}
