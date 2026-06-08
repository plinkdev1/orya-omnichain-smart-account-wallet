/**
 * Redux Hooks
 * Typed hooks for accessing store and dispatching actions
 */

import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';

/**
 * Basic typed hooks for Redux
 * Use throughout your app instead of `useDispatch` and `useSelector`
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * Auth-specific hooks
 */
export const useAuth = () => useAppSelector((state) => state.auth);
export const useIsAuthenticated = () => useAppSelector((state) => state.auth.isAuthenticated);
export const useAuthUser = () => useAppSelector((state) => state.auth.user);
export const useAuthSession = () => useAppSelector((state) => state.auth.session);
export const useAuthLoading = () => useAppSelector((state) => state.auth.loading);
export const useAuthError = () => useAppSelector((state) => state.auth.error);

/**
 * Wallet-specific hooks
 */
export const useWallet = () => useAppSelector((state) => state.wallet);
export const useWallets = () => useAppSelector((state) => state.wallet.wallets);
export const useSelectedWalletId = () => useAppSelector((state) => state.wallet.selectedWalletId);
export const useSelectedWallet = () => {
  const wallets = useWallets();
  const selectedId = useSelectedWalletId();
  return wallets.find((w) => w.id === selectedId) || null;
};
export const useWalletBalances = () => useAppSelector((state) => state.wallet.balances);
export const useWalletLoading = () => useAppSelector((state) => state.wallet.loading);
export const useWalletError = () => useAppSelector((state) => state.wallet.error);

/**
 * Compatibility aliases for index.ts exports
 * These map to the actual Redux store selectors
 */
export const useActiveWallet = useSelectedWallet;
export const useConnectedWallets = useWallets;
export const useBalances = useWalletBalances;
export const useIsLoggedIn = useIsAuthenticated;
export const useUserId = () => useAppSelector((state) => state.auth.user?.id);
export const useCurrentTheme = () => useAppSelector((state) => (state as any).theme?.currentTheme ?? 'light');
export const useNetworkStatus = () => useAppSelector((state) => (state as any).network?.status ?? 'online');
export const useRecentTransactions = () => useAppSelector((state) => (state as any).transactions?.recent ?? []);
export const useTransactions = () => useAppSelector((state) => (state as any).transactions?.all ?? []);
export const useTotalValueUSD = () => {
  const balances = useWalletBalances();
  return Object.values(balances).reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0);
};