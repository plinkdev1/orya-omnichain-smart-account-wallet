import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  getSolanaAdapter,
  getCosmosAdapter,
  getTonAdapter,
  getNearAdapter,
  getAptosAdapter,
  getMovementAdapter,
} from '../services/adapters';
import type {
  SolanaWalletAccount,
  CosmosWalletAccount,
  TonWalletAccount,
  NearWalletAccount,
  AptosWalletAccount,
  MovementWalletAccount,
} from '../services/adapters';

export type WalletType = 'solana' | 'cosmos' | 'ton' | 'near' | 'aptos' | 'movement' | 'evm';

export interface WalletAccount {
  type: WalletType;
  address: string;
  chainId: string;
  label?: string;
  publicKey?: string;
}

export interface MultiChainWalletContextType {
  accounts: WalletAccount[];
  selectedAccount: WalletAccount | null;
  isConnecting: boolean;
  connectToChain: (type: WalletType, chainId: string, account: any) => Promise<void>;
  disconnectFromChain: (type: WalletType, chainId: string) => Promise<void>;
  switchChain: (type: WalletType, chainId: string) => Promise<void>;
  getBalance: (type: WalletType, address: string) => Promise<number>;
  selectAccount: (account: WalletAccount) => void;
  clearAccounts: () => void;
}

const MultiChainWalletContext = createContext<MultiChainWalletContextType | undefined>(
  undefined
);

interface MultiChainWalletProviderProps {
  children: React.ReactNode;
}

export function MultiChainWalletProvider({ children }: MultiChainWalletProviderProps) {
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<WalletAccount | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectToChain = useCallback(
    async (type: WalletType, chainId: string, account: any) => {
      setIsConnecting(true);
      try {
        switch (type) {
          case 'solana': {
            const solanaAdapter = getSolanaAdapter(chainId);
            solanaAdapter.setWalletAccount(account as SolanaWalletAccount);
            break;
          }

          case 'cosmos': {
            const cosmosAdapter = getCosmosAdapter(chainId);
            cosmosAdapter.setWalletAccount(account as CosmosWalletAccount);
            break;
          }

          case 'ton': {
            const tonAdapter = getTonAdapter(chainId);
            tonAdapter.setWalletAccount(account as TonWalletAccount);
            break;
          }

          case 'near': {
            const nearAdapter = getNearAdapter(chainId);
            nearAdapter.setWalletAccount(account as NearWalletAccount);
            break;
          }

          case 'aptos': {
            const aptosAdapter = getAptosAdapter(chainId);
            aptosAdapter.setWalletAccount(account as AptosWalletAccount);
            break;
          }

          case 'movement': {
            const movementAdapter = getMovementAdapter(chainId);
            movementAdapter.setWalletAccount(account as MovementWalletAccount);
            break;
          }
        }

        const walletAccount: WalletAccount = {
          type,
          address: (account as any).address || (account as any).accountId,
          chainId,
          label: (account as any).label,
          publicKey: (account as any).publicKey,
        };

        setAccounts((prev) => {
          const existing = prev.findIndex(
            (acc) => acc.type === type && acc.chainId === chainId && acc.address === walletAccount.address
          );
          if (existing >= 0) {
            return prev;
          }
          return [...prev, walletAccount];
        });

        setSelectedAccount(walletAccount);
      } catch (error) {
        console.error(`Failed to connect to ${type}:`, error);
        throw error;
      } finally {
        setIsConnecting(false);
      }
    },
    []
  );

  const disconnectFromChain = useCallback(
    async (type: WalletType, chainId: string) => {
      try {
        switch (type) {
          case 'solana': {
            getSolanaAdapter(chainId);
            break;
          }

          case 'cosmos': {
            const cosmosAdapter = getCosmosAdapter(chainId);
            await cosmosAdapter.disconnect();
            break;
          }

          case 'ton': {
            const tonAdapter = getTonAdapter(chainId);
            await tonAdapter.disconnect();
            break;
          }

          case 'near': {
            const nearAdapter = getNearAdapter(chainId);
            await nearAdapter.disconnect();
            break;
          }
        }

        setAccounts((prev) =>
          prev.filter((acc) => !(acc.type === type && acc.chainId === chainId))
        );

        if (
          selectedAccount &&
          selectedAccount.type === type &&
          selectedAccount.chainId === chainId
        ) {
          setSelectedAccount(null);
        }
      } catch (error) {
        console.error(`Failed to disconnect from ${type}:`, error);
      }
    },
    [selectedAccount]
  );

  const switchChain = useCallback(async (type: WalletType, chainId: string) => {
    try {
      switch (type) {
        case 'solana':
          getSolanaAdapter(chainId).switchChain(chainId);
          break;

        case 'cosmos':
          getCosmosAdapter(chainId).switchChain(chainId);
          break;

        case 'ton':
          getTonAdapter(chainId).switchChain(chainId);
          break;

        case 'near':
          getNearAdapter(chainId).switchChain(chainId);
          break;
      }
    } catch (error) {
      console.error(`Failed to switch chain for ${type}:`, error);
      throw error;
    }
  }, []);

  const getBalance = useCallback(async (type: WalletType, address: string) => {
    try {
      switch (type) {
        case 'solana':
          return await getSolanaAdapter().getBalance(address);

        case 'cosmos':
          return await getCosmosAdapter().getBalance(address);

        case 'ton':
          return await getTonAdapter().getBalance(address);

        case 'near':
          return await getNearAdapter().getBalance(address);

        default:
          return 0;
      }
    } catch (error) {
      console.error(`Failed to get balance for ${type}:`, error);
      return 0;
    }
  }, []);

  const selectAccount = useCallback((account: WalletAccount) => {
    setSelectedAccount(account);
  }, []);

  const clearAccounts = useCallback(() => {
    setAccounts([]);
    setSelectedAccount(null);
  }, []);

  const value = useMemo(
    () => ({
      accounts,
      selectedAccount,
      isConnecting,
      connectToChain,
      disconnectFromChain,
      switchChain,
      getBalance,
      selectAccount,
      clearAccounts,
    }),
    [accounts, selectedAccount, isConnecting, connectToChain, disconnectFromChain, switchChain, getBalance, selectAccount, clearAccounts]
  );

  return (
    <MultiChainWalletContext.Provider value={value}>
      {children}
    </MultiChainWalletContext.Provider>
  );
}

export function useMultiChainWallet(): MultiChainWalletContextType {
  const context = useContext(MultiChainWalletContext);
  if (!context) {
    throw new Error(
      'useMultiChainWallet must be used within MultiChainWalletProvider'
    );
  }
  return context;
}
