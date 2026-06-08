/**
 * Platform-Agnostic useWallet Hook
 * Combines Redux state with wallet business logic
 * Provides unified interface for wallet operations across web and mobile
 * 
 * PROMPT C1: Platform-Agnostic Hooks
 * This is a React hook that integrates with Redux for state management
 * Use directly in components or wrap in app-specific hooks
 */

import type { Balance, Wallet } from '@orya/shared-types';
import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import type { RootState } from '../store/store';
import {
    addWallet as addWalletAction,
    removeWallet as removeWalletAction,
    selectWallet as selectWalletAction,
    setBalances,
    setError,
    setLoading,
    setWallets,
    updateBalance as updateBalanceAction,
} from '../store/wallet.slice';

/**
 * Business logic interface for wallet operations
 * Platform-agnostic - can be used by any UI framework
 */
export interface WalletLogic {
  addWallet: (wallet: Wallet) => void;
  switchWallet: (walletId: string) => void;
  removeWallet: (walletId: string) => void;
  updateBalances: (walletId: string, balances: Balance[]) => void;
  updateBalance: (walletId: string, balance: Balance) => void;
  setIsLoading: (loading: boolean) => void;
  setErrorMessage: (error: string | null) => void;
  clearWallets: () => void;
}

/**
 * Complete return type including state + logic
 */
export interface UseWalletReturn extends WalletLogic {
  // State
  wallets: Wallet[];
  selectedWalletId: string | null;
  selectedWallet: Wallet | null;
  balances: Record<string, Balance[]>;
  loading: boolean;
  error: string | null;
}

/**
 * Platform-agnostic wallet hook
 * Integrates Redux store with wallet business logic
 * 
 * @returns {UseWalletReturn} Complete wallet state and operations
 * 
 * @example
 * // In component
 * function WalletComponent() {
 *   const { wallets, selectedWallet, loading, error, addWallet, switchWallet } = useWallet();
 *   
 *   return (
 *     <div>
 *       {loading && <p>Loading...</p>}
 *       {error && <p>Error: {error}</p>}
 *       {wallets.map(w => (
 *         <WalletCard 
 *           key={w.id} 
 *           wallet={w}
 *           onSelect={() => switchWallet(w.id)}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 */
export function useWallet(): UseWalletReturn {
  const dispatch = useAppDispatch();
  const walletState = useAppSelector((state: RootState) => state.wallet);
  
  // Find selected wallet
  const selectedWallet = useMemo(
    () => walletState.wallets.find((w) => w.id === walletState.selectedWalletId) || null,
    [walletState.wallets, walletState.selectedWalletId]
  );

  // Business logic - add wallet
  const addWallet = useCallback(
    (wallet: Wallet) => {
      dispatch(addWalletAction(wallet));
    },
    [dispatch]
  );

  // Business logic - switch wallet
  const switchWallet = useCallback(
    (walletId: string) => {
      dispatch(selectWalletAction(walletId));
    },
    [dispatch]
  );

  // Business logic - remove wallet
  const removeWallet = useCallback(
    (walletId: string) => {
      dispatch(removeWalletAction(walletId));
    },
    [dispatch]
  );

  // Business logic - update all balances for a wallet
  const updateBalances = useCallback(
    (walletId: string, balances: Balance[]) => {
      dispatch(setBalances({ walletId, balances }));
    },
    [dispatch]
  );

  // Business logic - update single balance
  const updateBalance = useCallback(
    (walletId: string, balance: Balance) => {
      dispatch(updateBalanceAction({ walletId, balance }));
    },
    [dispatch]
  );

  // Business logic - set loading state
  const setIsLoading = useCallback(
    (loading: boolean) => {
      dispatch(setLoading(loading));
    },
    [dispatch]
  );

  // Business logic - set error state
  const setErrorMessage = useCallback(
    (error: string | null) => {
      dispatch(setError(error));
    },
    [dispatch]
  );

  // Business logic - clear all wallets
  const clearWallets = useCallback(
    () => {
      dispatch(setWallets([]));
    },
    [dispatch]
  );

  return useMemo(
    () => ({
      // State
      wallets: walletState.wallets,
      selectedWalletId: walletState.selectedWalletId,
      selectedWallet,
      balances: walletState.balances,
      loading: walletState.loading,
      error: walletState.error,
      
      // Logic
      addWallet,
      switchWallet,
      removeWallet,
      updateBalances,
      updateBalance,
      setIsLoading,
      setErrorMessage,
      clearWallets,
    }),
    [
      walletState.wallets,
      walletState.selectedWalletId,
      selectedWallet,
      walletState.balances,
      walletState.loading,
      walletState.error,
      addWallet,
      switchWallet,
      removeWallet,
      updateBalances,
      updateBalance,
      setIsLoading,
      setErrorMessage,
      clearWallets,
    ]
  );
}
