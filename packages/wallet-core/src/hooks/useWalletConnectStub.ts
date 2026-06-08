/**
 * useWalletConnect Hook Stub
 * Temporary stub while WalletConnect v1 integration is disabled
 * TODO: Re-enable when migrating to native ReOwn AppKit v2
 */

export interface UseWalletConnectReturn {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  accounts: string[];
  chainId: number | null;
}

export function useWalletConnect(): UseWalletConnectReturn {
  return {
    connect: async () => {
      throw new Error('WalletConnect is not available - feature is disabled');
    },
    disconnect: async () => {
      throw new Error('WalletConnect is not available - feature is disabled');
    },
    isConnected: false,
    isConnecting: false,
    error: 'Feature disabled',
    accounts: [],
    chainId: null,
  };
}
