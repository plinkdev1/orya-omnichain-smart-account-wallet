/**
 * React Hook: Wallet Generation
 * Manages wallet creation, import, and multi-chain account generation
 */

import { useCallback, useState } from 'react';
import {
    GeneratedWallet,
    generateMnemonic,
    importWallet,
    WalletAccount,
} from '../crypto/WalletGenerator';

export interface UseWalletGenerationReturn {
  mnemonic: string | null;
  wallet: GeneratedWallet | null;
  isLoading: boolean;
  error: string | null;
  generateNew: () => Promise<void>;
  importFromMnemonic: (mnemonic: string) => Promise<void>;
  getAccount: (chain: 'ethereum' | 'solana' | 'sui' | 'aptos') => WalletAccount | null;
  exportJSON: () => string | null;
  reset: () => void;
}

export function useWalletGeneration(): UseWalletGenerationReturn {
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [wallet, setWallet] = useState<GeneratedWallet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateNew = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const newMnemonic = generateMnemonic(128); // 12 words
      const newWallet = importWallet(newMnemonic);

      setMnemonic(newMnemonic);
      setWallet(newWallet);
    } catch (err: any) {
      setError(err.message || 'Failed to generate wallet');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const importFromMnemonic = useCallback(async (inputMnemonic: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const newWallet = importWallet(inputMnemonic);

      setMnemonic(inputMnemonic);
      setWallet(newWallet);
    } catch (err: any) {
      setError(err.message || 'Invalid mnemonic');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAccount = useCallback(
    (chain: 'ethereum' | 'solana' | 'sui' | 'aptos') => {
      if (!wallet) return null;
      return wallet.accounts[chain];
    },
    [wallet]
  );

  const exportJSON = useCallback(() => {
    if (!wallet) return null;

    return JSON.stringify(
      {
        mnemonic,
        accounts: wallet.accounts,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }, [wallet, mnemonic]);

  const reset = useCallback(() => {
    setMnemonic(null);
    setWallet(null);
    setError(null);
  }, []);

  return {
    mnemonic,
    wallet,
    isLoading,
    error,
    generateNew,
    importFromMnemonic,
    getAccount,
    exportJSON,
    reset,
  };
}