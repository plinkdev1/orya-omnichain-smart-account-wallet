import { useCallback, useState } from 'react';
import { useAppDispatch } from '../store/hooks';
import { connectWalletSuccess, setPrimaryChain } from '../store/slices/walletSlice';
import { generateMnemonic, generateWallet, type GeneratedWallet } from '../crypto/WalletGenerator';

export interface SuiFirstWalletConfig {
  privyUser?: any;
  dynamicUser?: any;
  onSuccess?: (wallet: SuiFirstWalletResult) => void;
  onError?: (error: Error) => void;
}

export interface SuiFirstWalletResult {
  suiAddress: string;
  suiPublicKey: string;
  suiPrivateKey: string;
  mnemonic: string;
  walletId: string;
  secondaryChains: {
    ethereum: string;
    solana: string;
    aptos: string;
  };
}

export interface UseCreateWalletWithSuiFirstReturn {
  isLoading: boolean;
  error: Error | null;
  wallet: SuiFirstWalletResult | null;
  createWalletWithSuiFirst: (config: SuiFirstWalletConfig) => Promise<SuiFirstWalletResult>;
  reset: () => void;
}

export function useCreateWalletWithSuiFirst(): UseCreateWalletWithSuiFirstReturn {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [wallet, setWallet] = useState<SuiFirstWalletResult | null>(null);

  const createWalletWithSuiFirst = useCallback(
    async (config: SuiFirstWalletConfig): Promise<SuiFirstWalletResult> => {
      try {
        setIsLoading(true);
        setError(null);

        const { privyUser, dynamicUser, onSuccess, onError } = config;

        if (!privyUser && !dynamicUser) {
          throw new Error('Either privyUser or dynamicUser must be provided');
        }

        const userId = privyUser?.id || dynamicUser?.userId || `user_${Date.now()}`;
        const userEmail = privyUser?.email?.address || dynamicUser?.email;

        const mnemonic = generateMnemonic(128);
        const generatedWallet = generateWallet(mnemonic);
        const suiAccount = generatedWallet.accounts.sui;

        const walletId = `wallet_${userId}_${Date.now()}`;

        const result: SuiFirstWalletResult = {
          suiAddress: suiAccount.address,
          suiPublicKey: suiAccount.publicKey,
          suiPrivateKey: suiAccount.privateKey,
          mnemonic,
          walletId,
          secondaryChains: {
            ethereum: generatedWallet.accounts.ethereum.address,
            solana: generatedWallet.accounts.solana.address,
            aptos: generatedWallet.accounts.aptos.address,
          },
        };

        dispatch(
          connectWalletSuccess({
            address: suiAccount.address,
            walletType: 'privy',
            name: `SUI Wallet - ${userEmail || userId}`,
            publicKey: suiAccount.publicKey,
          })
        );

        dispatch(setPrimaryChain('sui:mainnet'));

        setWallet(result);

        if (onSuccess) {
          onSuccess(result);
        }

        setIsLoading(false);
        return result;
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
    [dispatch]
  );

  const reset = useCallback(() => {
    setWallet(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    isLoading,
    error,
    wallet,
    createWalletWithSuiFirst,
    reset,
  };
}
