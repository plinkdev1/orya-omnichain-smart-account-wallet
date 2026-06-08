/**
 * Redux Store Configuration Tests
 * Verify store creation, state management, and type safety
 */

import {
    addWallet,
    logout,
    selectWallet,
    setError,
    setLoading,
    setUser,
    setWalletError,
    setWalletLoading,
    setWallets
} from './index';
import { AppDispatch, createAppStore, RootState, store } from './store';

describe('Redux Store Foundation', () => {
  describe('Store Creation', () => {
    it('should create a Redux store with auth and wallet slices', () => {
      const testStore = createAppStore();
      expect(testStore).toBeDefined();
      expect(testStore.getState()).toBeDefined();
    });

    it('should have auth and wallet state in store', () => {
      const state = store.getState();
      expect(state.auth).toBeDefined();
      expect(state.wallet).toBeDefined();
    });

    it('should initialize auth state correctly', () => {
      const state = store.getState();
      expect(state.auth.user).toBeNull();
      expect(state.auth.session).toBeNull();
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.loading).toBe(false);
      expect(state.auth.error).toBeNull();
    });

    it('should initialize wallet state correctly', () => {
      const state = store.getState();
      expect(state.wallet.wallets).toEqual([]);
      expect(state.wallet.selectedWalletId).toBeNull();
      expect(state.wallet.balances).toEqual({});
      expect(state.wallet.loading).toBe(false);
      expect(state.wallet.error).toBeNull();
    });
  });

  describe('Auth Slice Actions', () => {
    beforeEach(() => {
      // Reset store state by creating fresh store
      // Note: This is a simplified approach; in real tests use preloadedState
    });

    it('should dispatch setUser action', () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        emailVerified: true,
        kycStatus: 'VERIFIED' as const,
        authProviders: [] as any[],
        walletAddresses: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      store.dispatch(setUser(mockUser));
      const state = store.getState();
      
      expect(state.auth.user).toEqual(mockUser);
      expect(state.auth.isAuthenticated).toBe(true);
    });

    it('should dispatch logout action', () => {
      store.dispatch(logout());
      const state = store.getState();
      
      expect(state.auth.user).toBeNull();
      expect(state.auth.session).toBeNull();
      expect(state.auth.isAuthenticated).toBe(false);
    });

    it('should dispatch setLoading action', () => {
      store.dispatch(setLoading(true));
      expect(store.getState().auth.loading).toBe(true);
      
      store.dispatch(setLoading(false));
      expect(store.getState().auth.loading).toBe(false);
    });

    it('should dispatch setError action', () => {
      store.dispatch(setError('Test error'));
      expect(store.getState().auth.error).toBe('Test error');
      
      store.dispatch(setError(null));
      expect(store.getState().auth.error).toBeNull();
    });
  });

  describe('Wallet Slice Actions', () => {
    it('should dispatch setWallets action', () => {
      const mockWallets = [
        {
          id: 'wallet-1',
          userId: 'user-1',
          address: '0x123...',
          type: 'owned' as const,
          chainType: 'SUI' as any,
          name: 'My Wallet',
          isDefault: true,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];

      store.dispatch(setWallets(mockWallets));
      const state = store.getState();
      
      expect(state.wallet.wallets).toEqual(mockWallets);
    });

    it('should dispatch addWallet action', () => {
      const mockWallet = {
        id: 'wallet-2',
        userId: 'user-1',
        address: '0x456...',
        type: 'connected' as const,
        chainType: 'ETH' as any,
        name: 'Connected Wallet',
        isDefault: false,
        isActive: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      store.dispatch(addWallet(mockWallet));
      const state = store.getState();
      
      expect(state.wallet.wallets).toContainEqual(mockWallet);
    });

    it('should dispatch selectWallet action', () => {
      store.dispatch(selectWallet('wallet-1'));
      expect(store.getState().wallet.selectedWalletId).toBe('wallet-1');
    });

    it('should dispatch setWalletLoading action', () => {
      store.dispatch(setWalletLoading(true));
      expect(store.getState().wallet.loading).toBe(true);
    });

    it('should dispatch setWalletError action', () => {
      store.dispatch(setWalletError('Wallet error'));
      expect(store.getState().wallet.error).toBe('Wallet error');
    });
  });

  describe('Type Safety', () => {
    it('should have properly typed RootState', () => {
      const state: RootState = store.getState();
      
      // TypeScript should not complain about these
      expect(state.auth.user).toEqual(state.auth.user);
      expect(state.wallet.wallets).toEqual(state.wallet.wallets);
    });

    it('should have properly typed AppDispatch', () => {
      const dispatch: AppDispatch = store.dispatch;
      
      // Dispatch is properly typed
      expect(typeof dispatch).toBe('function');
    });
  });
});
