import type { Balance, Wallet } from '@orya/shared-types/wallet';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Wallet State Slice
 * Manages wallet connections, addresses, balances, and chains
 */

export interface WalletState {
  wallets: Wallet[];
  selectedWalletId: string | null;
  balances: Record<string, Balance[]>; // walletId -> balances[]
  loading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  wallets: [],
  selectedWalletId: null,
  balances: {},
  loading: false,
  error: null,
};

export const walletSlice: any = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    // Wallet management
    setWallets: (state, action: PayloadAction<Wallet[]>) => {
      state.wallets = action.payload;
    },
    addWallet: (state, action: PayloadAction<Wallet>) => {
      const exists = state.wallets.some((w) => w.id === action.payload.id);
      if (!exists) {
        state.wallets.push(action.payload);
      }
    },
    removeWallet: (state, action: PayloadAction<string>) => {
      state.wallets = state.wallets.filter((w) => w.id !== action.payload);
      if (state.selectedWalletId === action.payload) {
        state.selectedWalletId = state.wallets[0]?.id || null;
      }
    },
    selectWallet: (state, action: PayloadAction<string>) => {
      if (state.wallets.some((w) => w.id === action.payload)) {
        state.selectedWalletId = action.payload;
      }
    },

    // Balance management
    setBalances: (state, action: PayloadAction<{ walletId: string; balances: Balance[] }>) => {
      state.balances[action.payload.walletId] = action.payload.balances;
    },
    updateBalance: (state, action: PayloadAction<{ walletId: string; balance: Balance }>) => {
      if (!state.balances[action.payload.walletId]) {
        state.balances[action.payload.walletId] = [];
      }
      const index = state.balances[action.payload.walletId].findIndex(
        (b) => b.tokenAddress === action.payload.balance.tokenAddress,
      );
      if (index >= 0) {
        state.balances[action.payload.walletId][index] = action.payload.balance;
      } else {
        state.balances[action.payload.walletId].push(action.payload.balance);
      }
    },

    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Clear all wallets
    clearWallets: (state) => {
      state.wallets = [];
      state.selectedWalletId = null;
      state.balances = {};
    },
  },
});

export const {
  setWallets,
  addWallet,
  removeWallet,
  selectWallet,
  setBalances,
  updateBalance,
  setLoading,
  setError,
  clearWallets,
} = walletSlice.actions;

export default walletSlice.reducer;
