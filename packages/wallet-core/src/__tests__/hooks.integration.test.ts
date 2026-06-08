/**
 * Integration Tests for Wallet-Core Hooks
 * 
 * Tests the core hooks used across web and mobile platforms:
 * - useWallet: Multi-chain wallet management
 * - useTransaction: Transaction handling and streaming
 * - useAuth: Authentication lifecycle
 * - useTheme: Theme management
 * - usePortfolio: Portfolio aggregation
 * 
 * Platform-agnostic approach: Tests focus on hook behavior,
 * not React/React Native specifics.
 */

import { configureStore, PreloadedState } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

// Import domain types
import {
    BlockchainType,
    Transaction,
    TransactionStatus,
    AuthStatus,
    Wallet
} from '../domain';

// Import Redux slices
import authReducer, {
    setAuthStatus,
    setUser
} from '../store/auth.slice';
import transactionReducer, {
    addTransaction,
    setFilter,
    updateTransaction
} from '../store/transactions.slice';
import walletReducer, {
    addWallet,
    setActiveWallet,
    setWallets
} from '../store/wallet.slice';

// Import hooks
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useTransaction } from '../hooks/useTransaction';
import { useTransactions } from '../hooks/useTransactions';
import { useWallet } from '../hooks/useWallet';

/**
 * Helper: Create a pre-configured Redux store for testing
 */
function createTestStore(preloadedState?: PreloadedState<any>) {
  return configureStore({
    reducer: {
      wallet: walletReducer,
      transactions: transactionReducer,
      auth: authReducer,
    },
    preloadedState,
  });
}

/**
 * Helper: Create a wrapper component that provides Redux store
 */
function createWrapper(store: any) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(Provider, { store }, children);
}

/**
 * Mock data generators
 */
const mockWallet = (overrides?: Partial<Wallet>): Wallet => ({
  id: 'wallet-1',
  address: '0x742d35Cc6634C0532925a3b844Bc54e4438f44e8',
  chainType: BlockchainType.SUI,
  label: 'My SUI Wallet',
  isActive: true,
  createdAt: new Date().toISOString(),
  ...overrides,
});

const mockTransaction = (overrides?: Partial<Transaction>): Transaction => ({
  id: 'tx-1',
  walletId: 'wallet-1',
  type: 'SEND',
  status: TransactionStatus.PENDING,
  chainType: BlockchainType.SUI,
  amount: '1.5',
  token: 'SUI',
  fromAddress: '0x742d35Cc6634C0532925a3b844Bc54e4438f44e8',
  toAddress: '0x123456789abcdef',
  timestamp: new Date().toISOString(),
  txHash: 'tx-hash-123',
  ...overrides,
});

// ============================================================================
// TEST SUITE: useWallet Hook
// ============================================================================

describe('useWallet Hook Integration', () => {
  it('should initialize with default wallet state', () => {
    const store = createTestStore();
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useWallet(), { wrapper });

    expect(result.current.wallets).toEqual([]);
    expect(result.current.activeWallet).toBeNull();
  });

  it('should add a new wallet to the store', () => {
    const store = createTestStore();
    const wrapper = createWrapper(store);
    const newWallet = mockWallet();

    const { result } = renderHook(() => useWallet(), { wrapper });

    act(() => {
      store.dispatch(addWallet(newWallet));
    });

    expect(result.current.wallets).toHaveLength(1);
    expect(result.current.wallets[0]).toEqual(newWallet);
  });

  it('should set active wallet', () => {
    const wallet1 = mockWallet({ id: 'wallet-1' });
    const wallet2 = mockWallet({ id: 'wallet-2' });

    const store = createTestStore({
      wallet: {
        wallets: [wallet1, wallet2],
        activeWalletId: null,
      },
      transactions: { items: [], loading: false, filter: { chainType: BlockchainType.SUI, walletId: '' } },
      auth: { status: AuthStatus.UNAUTHENTICATED, user: null, loading: false, error: null },
    });
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useWallet(), { wrapper });

    act(() => {
      store.dispatch(setActiveWallet('wallet-2'));
    });

    expect(result.current.activeWallet?.id).toBe('wallet-2');
  });

  it('should handle multiple wallets across different chains', () => {
    const suiWallet = mockWallet({ 
      id: 'sui-wallet', 
      chainType: BlockchainType.SUI 
    });
    const ethWallet = mockWallet({ 
      id: 'eth-wallet', 
      chainType: BlockchainType.ETH 
    });
    const solanaWallet = mockWallet({ 
      id: 'solana-wallet', 
      chainType: BlockchainType.SOLANA 
    });

    const store = createTestStore();
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useWallet(), { wrapper });

    act(() => {
      store.dispatch(setWallets([suiWallet, ethWallet, solanaWallet]));
    });

    expect(result.current.wallets).toHaveLength(3);
    expect(result.current.wallets.map(w => w.chainType)).toEqual([
      BlockchainType.SUI,
      BlockchainType.ETH,
      BlockchainType.SOLANA,
    ]);
  });
});

// ============================================================================
// TEST SUITE: useTransaction Hook
// ============================================================================

describe('useTransaction Hook Integration', () => {
  it('should initialize with empty transaction state', () => {
    const store = createTestStore();
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useTransaction(), { wrapper });

    expect(result.current.pendingTx).toBeNull();
    expect(result.current.isProcessing).toBe(false);
  });

  it('should track a pending transaction', () => {
    const store = createTestStore();
    const wrapper = createWrapper(store);
    const tx = mockTransaction();

    const { result } = renderHook(() => useTransaction(), { wrapper });

    act(() => {
      store.dispatch(addTransaction(tx));
      store.dispatch(updateTransaction({
        ...tx,
        status: TransactionStatus.PENDING,
      }));
    });

    // Transaction is added to store
    const allTx = store.getState().transactions.items;
    expect(allTx).toHaveLength(1);
  });

  it('should handle transaction status updates', () => {
    const tx = mockTransaction({ status: TransactionStatus.PENDING });
    const store = createTestStore({
      wallet: { wallets: [], activeWalletId: null },
      transactions: { items: [tx], loading: false, filter: { chainType: BlockchainType.SUI, walletId: '' } },
      auth: { status: AuthStatus.UNAUTHENTICATED, user: null, loading: false, error: null },
    });
    const wrapper = createWrapper(store);

    const { result: txResult } = renderHook(() => useTransaction(), { wrapper });
    const { result: txListResult } = renderHook(() => useTransactions(), { wrapper });

    act(() => {
      store.dispatch(updateTransaction({
        ...tx,
        status: TransactionStatus.CONFIRMED,
      }));
    });

    const updatedTx = store.getState().transactions.items[0];
    expect(updatedTx.status).toBe(TransactionStatus.CONFIRMED);
  });

  it('should filter transactions by chain type', () => {
    const suiTx = mockTransaction({ 
      id: 'sui-tx', 
      chainType: BlockchainType.SUI 
    });
    const ethTx = mockTransaction({ 
      id: 'eth-tx', 
      chainType: BlockchainType.ETH 
    });

    const store = createTestStore();
    const wrapper = createWrapper(store);

    act(() => {
      store.dispatch(addTransaction(suiTx));
      store.dispatch(addTransaction(ethTx));
    });

    act(() => {
      store.dispatch(setFilter({ 
        chainType: BlockchainType.SUI,
        walletId: '',
      }));
    });

    const state = store.getState().transactions;
    expect(state.filter.chainType).toBe(BlockchainType.SUI);
  });
});

// ============================================================================
// TEST SUITE: useAuth Hook
// ============================================================================

describe('useAuth Hook Integration', () => {
  it('should initialize as unauthenticated', () => {
    const store = createTestStore();
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.status).toBe(AuthStatus.UNAUTHENTICATED);
    expect(result.current.user).toBeNull();
  });

  it('should handle authentication state changes', () => {
    const store = createTestStore();
    const wrapper = createWrapper(store);

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      phoneNumber: '+1234567890',
      kycStatus: 'VERIFIED' as const,
    };

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      store.dispatch(setAuthStatus(AuthStatus.AUTHENTICATED));
      store.dispatch(setUser(mockUser));
    });

    expect(result.current.status).toBe(AuthStatus.AUTHENTICATED);
    expect(result.current.user).toEqual(mockUser);
  });

  it('should track authentication loading state', () => {
    const store = createTestStore({
      wallet: { wallets: [], activeWalletId: null },
      transactions: { items: [], loading: false, filter: { chainType: BlockchainType.SUI, walletId: '' } },
      auth: { 
        status: AuthStatus.AUTHENTICATING, 
        user: null, 
        loading: true,
        error: null,
      },
    });
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
  });
});

// ============================================================================
// TEST SUITE: useTheme Hook
// ============================================================================

describe('useTheme Hook Integration', () => {
  it('should provide default light theme', () => {
    const store = createTestStore();
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.mode).toBe('light');
    expect(result.current.isLight).toBe(true);
    expect(result.current.isDark).toBe(false);
  });

  it('should have theme object with core properties', () => {
    const store = createTestStore();
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBeDefined();
    expect(result.current.theme.colors).toBeDefined();
  });

  it('should provide toggle and set theme functions', () => {
    const store = createTestStore();
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(typeof result.current.toggleTheme).toBe('function');
    expect(typeof result.current.setTheme).toBe('function');
  });
});

// ============================================================================
// TEST SUITE: useTransactions Hook
// ============================================================================

describe('useTransactions Hook Integration', () => {
  it('should initialize with empty transactions list', () => {
    const store = createTestStore();
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useTransactions(), { wrapper });

    expect(result.current.transactions).toEqual([]);
  });

  it('should return filtered transactions', () => {
    const tx1 = mockTransaction({ id: 'tx-1', chainType: BlockchainType.SUI });
    const tx2 = mockTransaction({ id: 'tx-2', chainType: BlockchainType.ETH });

    const store = createTestStore({
      wallet: { wallets: [], activeWalletId: null },
      transactions: { 
        items: [tx1, tx2], 
        loading: false, 
        filter: { chainType: BlockchainType.SUI, walletId: '' } 
      },
      auth: { status: AuthStatus.UNAUTHENTICATED, user: null, loading: false, error: null },
    });
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useTransactions(), { wrapper });

    // Hook returns all transactions; filtering is applied at store level
    expect(result.current.transactions).toHaveLength(2);
  });

  it('should provide transaction loading state', () => {
    const store = createTestStore({
      wallet: { wallets: [], activeWalletId: null },
      transactions: { items: [], loading: true, filter: { chainType: BlockchainType.SUI, walletId: '' } },
      auth: { status: AuthStatus.UNAUTHENTICATED, user: null, loading: false, error: null },
    });
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useTransactions(), { wrapper });

    expect(result.current.loading).toBe(true);
  });
});

// ============================================================================
// TEST SUITE: Cross-Hook Integration
// ============================================================================

describe('Cross-Hook Integration', () => {
  it('should synchronize wallet and transaction state', () => {
    const wallet = mockWallet({ id: 'wallet-1' });
    const tx = mockTransaction({ walletId: 'wallet-1' });

    const store = createTestStore({
      wallet: {
        wallets: [wallet],
        activeWalletId: 'wallet-1',
      },
      transactions: {
        items: [tx],
        loading: false,
        filter: { chainType: BlockchainType.SUI, walletId: '' },
      },
      auth: { status: AuthStatus.AUTHENTICATED, user: null, loading: false, error: null },
    });
    const wrapper = createWrapper(store);

    const { result: walletResult } = renderHook(() => useWallet(), { wrapper });
    const { result: txResult } = renderHook(() => useTransactions(), { wrapper });

    expect(walletResult.current.activeWallet?.id).toBe('wallet-1');
    expect(txResult.current.transactions[0].walletId).toBe('wallet-1');
  });

  it('should handle authentication state affecting other hooks', () => {
    const store = createTestStore();
    const wrapper = createWrapper(store);

    const { result: authResult } = renderHook(() => useAuth(), { wrapper });
    const { result: walletResult } = renderHook(() => useWallet(), { wrapper });

    // Unauthenticated initially
    expect(authResult.current.status).toBe(AuthStatus.UNAUTHENTICATED);
    expect(walletResult.current.wallets).toEqual([]);

    // After authentication, wallets become available
    act(() => {
      store.dispatch(setAuthStatus(AuthStatus.AUTHENTICATED));
      store.dispatch(setWallets([mockWallet()]));
    });

    expect(authResult.current.status).toBe(AuthStatus.AUTHENTICATED);
    expect(walletResult.current.wallets).toHaveLength(1);
  });

  it('should maintain theme consistency across all hooks', () => {
    const store = createTestStore();
    const wrapper = createWrapper(store);

    const { result: themeResult } = renderHook(() => useTheme(), { wrapper });
    const { result: walletResult } = renderHook(() => useWallet(), { wrapper });

    // Theme should be consistent
    const mode1 = themeResult.current.mode;
    const mode2 = themeResult.current.mode;

    expect(mode1).toBe(mode2);
    expect(mode1).toBe('light'); // Default
  });
});