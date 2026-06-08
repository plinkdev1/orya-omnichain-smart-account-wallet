import type { Transaction, TransactionFilter } from '@orya/shared-types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Transactions State Slice
 * Manages transaction history, pending transactions, and filtering
 */

export interface TransactionsState {
  transactions: Transaction[];
  pendingTransactions: Transaction[];
  selectedTransaction: Transaction | null;
  filter: TransactionFilter;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  hasMore: boolean;
  pageIndex: number;
  pageSize: number;
  lastUpdated: number | null;
}

const initialState: TransactionsState = {
  transactions: [],
  pendingTransactions: [],
  selectedTransaction: null,
  filter: {
    walletId: undefined,
    chainType: undefined,
    type: undefined,
    status: undefined,
    startDate: undefined,
    endDate: undefined,
  },
  isLoading: false,
  isFetching: false,
  error: null,
  hasMore: true,
  pageIndex: 0,
  pageSize: 20,
  lastUpdated: null,
};

export const transactionsSlice: any = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    // Load transactions
    setTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.transactions = action.payload;
      state.lastUpdated = Date.now();
    },
    prependTransaction: (state, action: PayloadAction<Transaction>) => {
      state.transactions.unshift(action.payload);
    },
    appendTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.transactions.push(...action.payload);
    },
    updateTransaction: (state, action: PayloadAction<Transaction>) => {
      const index = state.transactions.findIndex((t) => t.hash === action.payload.hash);
      if (index >= 0) {
        state.transactions[index] = action.payload;
      }
    },

    // Pending transactions
    addPendingTransaction: (state, action: PayloadAction<Transaction>) => {
      state.pendingTransactions.push(action.payload);
    },
    removePendingTransaction: (state, action: PayloadAction<string>) => {
      state.pendingTransactions = state.pendingTransactions.filter((t) => t.hash !== action.payload);
    },
    updatePendingTransaction: (state, action: PayloadAction<Transaction>) => {
      const index = state.pendingTransactions.findIndex((t) => t.hash === action.payload.hash);
      if (index >= 0) {
        state.pendingTransactions[index] = action.payload;
      }
    },
    clearPendingTransactions: (state) => {
      state.pendingTransactions = [];
    },

    // Selection
    selectTransaction: (state, action: PayloadAction<Transaction>) => {
      state.selectedTransaction = action.payload;
    },
    deselectTransaction: (state) => {
      state.selectedTransaction = null;
    },

    // Filtering
    setFilter: (state, action: PayloadAction<Partial<TransactionFilter>>) => {
      state.filter = { ...state.filter, ...action.payload };
      state.pageIndex = 0; // Reset pagination
    },
    clearFilter: (state) => {
      state.filter = initialState.filter;
      state.pageIndex = 0;
    },

    // Pagination
    setPageIndex: (state, action: PayloadAction<number>) => {
      state.pageIndex = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
      state.pageIndex = 0;
    },
    setHasMore: (state, action: PayloadAction<boolean>) => {
      state.hasMore = action.payload;
    },

    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setFetching: (state, action: PayloadAction<boolean>) => {
      state.isFetching = action.payload;
    },

    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Clear all
    clearTransactions: (state) => {
      state.transactions = [];
      state.pendingTransactions = [];
      state.selectedTransaction = null;
      state.pageIndex = 0;
    },

    // Update timestamp
    setLastUpdated: (state) => {
      state.lastUpdated = Date.now();
    },
  },
});

export const {
  setTransactions,
  prependTransaction,
  appendTransactions,
  updateTransaction,
  addPendingTransaction,
  removePendingTransaction,
  updatePendingTransaction,
  clearPendingTransactions,
  selectTransaction,
  deselectTransaction,
  setFilter,
  clearFilter,
  setPageIndex,
  setPageSize,
  setHasMore,
  setLoading,
  setFetching,
  setError,
  clearTransactions,
  setLastUpdated,
} = transactionsSlice.actions;

export default transactionsSlice.reducer;
