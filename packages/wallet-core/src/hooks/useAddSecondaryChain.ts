import { useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addSecondaryChain, switchActiveWallet } from '../store/slices/walletSlice';

export interface SecondaryChainConfig {
  chainId: string; // e.g., 'ethereum:mainnet', 'solana:mainnet'
  address: string;
  walletType: 'external' | 'self-custody';
  walletName: string;
  publicKey: string;
  onSuccess?: (chainId: string) => void;
  onError?: (error: Error) => void;
}

export interface UseAddSecondaryChainReturn {
  isLoading: boolean;
  error: Error | null;
  addedChains: string[];
  addSecondaryChain: (config: SecondaryChainConfig) => Promise<string>;
  removeChain: (chainId: string) => void;
  switchToChain: (chainId: string) => void;
  reset: () => void;
}

export function useAddSecondaryChain(): UseAddSecondaryChainReturn {
  const dispatch = useAppDispatch();
  const walletState = useAppSelector((state: any) => state.wallet);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addChain = useCallback(
    async (config: SecondaryChainConfig): Promise<string> => {
      try {
        setIsLoading(true);
        setError(null);

        const { chainId, address, walletType, walletName, publicKey, onSuccess, onError } = config;

        if (!chainId || !address) {
          throw new Error('chainId and address are required');
        }

        const existingChain = walletState.secondaryChains.find(
          (c: string) => c === chainId
        );

        if (existingChain) {
          throw new Error(`Chain ${chainId} already added`);
        }

        dispatch(addSecondaryChain(chainId));

        if (walletState.connectedWallets) {
          const newWallet = {
            name: walletName || `${chainId} Account`,
            address,
            type: walletType,
            publicKey,
            isActive: false,
            connectedAt: Date.now(),
          };
        }

        setIsLoading(false);

        if (onSuccess) {
          onSuccess(chainId);
        }

        return chainId;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);

        if (config.onError) {
          config.onError(error);
        }

        setIsLoading(false);
        throw error;
      }
    },
    [dispatch, walletState.secondaryChains, walletState.connectedWallets]
  );

  const removeChain = useCallback(
    (chainId: string) => {
      if (walletState.primaryChain === chainId) {
        throw new Error('Cannot remove primary chain');
      }

      const updatedChains = walletState.secondaryChains.filter(
        (c: string) => c !== chainId
      );
      dispatch(addSecondaryChain(chainId));
    },
    [dispatch, walletState.primaryChain, walletState.secondaryChains]
  );

  const switchToChain = useCallback(
    (chainId: string) => {
      const isValidChain =
        walletState.primaryChain === chainId ||
        walletState.secondaryChains.includes(chainId);

      if (!isValidChain) {
        throw new Error(`Chain ${chainId} is not available`);
      }

      const targetAddress = walletState.connectedWallets?.find(
        (w: any) => w.address && w.isActive
      )?.address;

      if (targetAddress) {
        dispatch(switchActiveWallet(targetAddress));
      }
    },
    [dispatch, walletState.primaryChain, walletState.secondaryChains, walletState.connectedWallets]
  );

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    isLoading,
    error,
    addedChains: walletState.secondaryChains,
    addSecondaryChain: addChain,
    removeChain,
    switchToChain,
    reset,
  };
}
