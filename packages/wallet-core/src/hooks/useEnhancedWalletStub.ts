/**
 * useEnhancedWallet Hook Stub
 * Temporary stub while IKA integration is disabled
 * TODO: Re-enable when IKA SDK incompatibilities are resolved
 */

export interface UseEnhancedWalletState {
  wallet: null;
  isLoading: boolean;
  error: string | null;
  isEnhanced: boolean;
}

export interface UseEnhancedWalletActions {
  enhance: () => Promise<void>;
  revoke: () => Promise<void>;
}

export interface UseEnhancedWalletReturn extends UseEnhancedWalletState, UseEnhancedWalletActions {}

export function useEnhancedWallet(): UseEnhancedWalletReturn {
  return {
    wallet: null,
    isLoading: false,
    error: 'Feature disabled',
    isEnhanced: false,
    enhance: async () => {
      throw new Error('Enhanced wallet feature is not available - feature is disabled');
    },
    revoke: async () => {
      throw new Error('Enhanced wallet feature is not available - feature is disabled');
    },
  };
}

export function useEnhancedWalletTransaction() {
  return {
    signTransaction: async () => {
      throw new Error('Enhanced wallet feature is not available - feature is disabled');
    },
    isLoading: false,
    error: 'Feature disabled',
  };
}

export function useEnhancedWalletHealth() {
  return {
    health: null,
    isHealthy: false,
    error: 'Feature disabled',
  };
}
