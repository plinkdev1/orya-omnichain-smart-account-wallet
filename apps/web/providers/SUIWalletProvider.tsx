'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { OrysaSUIWallet } from '@orya/wallet-core';
import type { OryaSUIWalletAccount, SUIChain } from '@orya/wallet-core';

interface SUIWalletContextValue {
  wallet: OrysaSUIWallet | null;
  accounts: OryaSUIWalletAccount[];
  selectedAccount: OryaSUIWalletAccount | null;
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  selectAccount: (account: OryaSUIWalletAccount) => void;
  signTransactionBlock: (tx: Uint8Array) => Promise<Uint8Array>;
  signAndExecuteTransactionBlock: (tx: Uint8Array) => Promise<string>;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
}

const SUIWalletContext = createContext<SUIWalletContextValue | null>(null);

export function SUIWalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<OrysaSUIWallet | null>(null);
  const [accounts, setAccounts] = useState<OryaSUIWalletAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<OryaSUIWalletAccount | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initWallet = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const oryaWallet = new OrysaSUIWallet({
          name: 'Orÿa Wallet',
          version: '1.0.0',
          icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjMDAwMDAwIi8+Cjwvc3ZnPg==',
          chains: ['sui:mainnet' as SUIChain, 'sui:testnet' as SUIChain],
        });

        await oryaWallet.connect();
        const fetchedAccounts = (await oryaWallet['sui:getAccounts']()).accounts;

        setWallet(oryaWallet);
        setAccounts(fetchedAccounts);
        setIsConnected(fetchedAccounts.length > 0);

        if (fetchedAccounts.length > 0) {
          setSelectedAccount(fetchedAccounts[0]);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    initWallet();
  }, []);

  const selectAccount = (account: OryaSUIWalletAccount) => {
    setSelectedAccount(account);
  };

  const signTransactionBlock = async (tx: Uint8Array): Promise<Uint8Array> => {
    if (!wallet) throw new Error('Wallet not initialized');
    if (!selectedAccount) throw new Error('No account selected');

    try {
      const result = await wallet['sui:signTransactionBlock']({
        transactionBlock: tx,
        chain: 'sui:mainnet',
      });
      return result.signature;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  };

  const signAndExecuteTransactionBlock = async (tx: Uint8Array): Promise<string> => {
    if (!wallet) throw new Error('Wallet not initialized');
    if (!selectedAccount) throw new Error('No account selected');

    try {
      const result = await wallet['sui:signAndExecuteTransactionBlock']({
        transactionBlock: tx,
        chain: 'sui:mainnet',
      });
      return result.digest;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  };

  const signMessage = async (message: Uint8Array): Promise<Uint8Array> => {
    if (!wallet) throw new Error('Wallet not initialized');
    if (!selectedAccount) throw new Error('No account selected');

    try {
      const result = await wallet['sui:signMessage']({
        message,
      });
      return result.signature;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  };

  const value: SUIWalletContextValue = {
    wallet,
    accounts,
    selectedAccount,
    isConnected,
    isLoading,
    error,
    selectAccount,
    signTransactionBlock,
    signAndExecuteTransactionBlock,
    signMessage,
  };

  return (
    <SUIWalletContext.Provider value={value}>
      {children}
    </SUIWalletContext.Provider>
  );
}

export const useSUIWallet = () => {
  const context = useContext(SUIWalletContext);
  if (!context) {
    throw new Error('useSUIWallet must be used within SUIWalletProvider');
  }
  return context;
};
