/**
 * Redux Transaction Slice
 * Manages transaction history, balances, and portfolio data
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Balance {
  coin: string; // e.g., "0x2::sui::SUI"
  amount: string; // in smallest unit (mist for SUI)
  decimals: number;
  symbol: string;
  displayAmount: string; // human-readable format
}

export type TransactionStatus =
  | "pending"
  | "confirmed"
  | "failed"
  | "cancelled";
export type TransactionType =
  | "transfer"
  | "swap"
  | "stake"
  | "unstake"
  | "receive"
  | "contract_interaction";

export interface Transaction {
  id: string;
  type: TransactionType;
  from: string;
  to: string;
  amount: string; // in smallest unit
  symbol: string;
  status: TransactionStatus;
  timestamp: number;
  gasUsed?: string;
  gasFee?: string;
  description: string;
  details?: Record<string, any>;
  explorerUrl?: string;
}

export interface TransactionState {
  // Balances
  balances: Balance[];
  totalValueUSD: number;

  // Transaction history
  transactions: Transaction[];
  selectedTransactionId: string | null;

  // Portfolio data
  portfolioLoading: boolean;
  portfolioError: string | null;
  lastBalanceUpdate: number | null;

  // Filtering
  transactionFilter: {
    type?: TransactionType;
    status?: TransactionStatus;
    startDate?: number;
    endDate?: number;
  };

  // Pagination
  transactionPage: number;
  transactionsPerPage: number;

  // Loading state
  loading: boolean;
  error: string | null;
}

const initialState: TransactionState = {
  balances: [],
  totalValueUSD: 0,
  transactions: [],
  selectedTransactionId: null,
  portfolioLoading: false,
  portfolioError: null,
  lastBalanceUpdate: null,
  transactionFilter: {},
  transactionPage: 0,
  transactionsPerPage: 20,
  loading: false,
  error: null,
};

const transactionSlice: any = createSlice({
  name: "transactions",
  initialState,
  reducers: {
    // Balance management
    setBalances: (state, action: PayloadAction<Balance[]>) => {
      state.balances = action.payload;
      state.lastBalanceUpdate = Date.now();
      state.error = null;
    },
    updateBalance: (
      state,
      action: PayloadAction<{
        coin: string;
        amount: string;
        displayAmount: string;
      }>
    ) => {
      const existing = state.balances.find((b) => b.coin === action.payload.coin);
      if (existing) {
        existing.amount = action.payload.amount;
        existing.displayAmount = action.payload.displayAmount;
      } else {
        state.balances.push({
          coin: action.payload.coin,
          amount: action.payload.amount,
          displayAmount: action.payload.displayAmount,
          decimals: 9, // Default for SUI
          symbol: "SUI",
        });
      }
      state.lastBalanceUpdate = Date.now();
    },
    setTotalValueUSD: (state, action: PayloadAction<number>) => {
      state.totalValueUSD = action.payload;
    },

    // Transaction history
    setTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.transactions = action.payload;
      state.loading = false;
      state.error = null;
    },
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      // Check if transaction already exists
      const exists = state.transactions.find((t) => t.id === action.payload.id);
      if (!exists) {
        state.transactions.unshift(action.payload);
      }
    },
    updateTransaction: (
      state,
      action: PayloadAction<{
        id: string;
        updates: Partial<Transaction>;
      }>
    ) => {
      const transaction = state.transactions.find((t) => t.id === action.payload.id);
      if (transaction) {
        Object.assign(transaction, action.payload.updates);
      }
    },
    removeTransaction: (state, action: PayloadAction<string>) => {
      state.transactions = state.transactions.filter((t) => t.id !== action.payload);
    },

    // Transaction selection
    selectTransaction: (state, action: PayloadAction<string | null>) => {
      state.selectedTransactionId = action.payload;
    },

    // Portfolio refresh
    portfolioRefreshStart: (state) => {
      state.portfolioLoading = true;
      state.portfolioError = null;
    },
    portfolioRefreshSuccess: (state) => {
      state.portfolioLoading = false;
      state.portfolioError = null;
    },
    portfolioRefreshFailure: (state, action: PayloadAction<string>) => {
      state.portfolioLoading = false;
      state.portfolioError = action.payload;
    },

    // Filtering
    setTransactionFilter: (
      state,
      action: PayloadAction<Partial<TransactionState["transactionFilter"]>>
    ) => {
      state.transactionFilter = { ...state.transactionFilter, ...action.payload };
      state.transactionPage = 0; // Reset pagination
    },
    clearTransactionFilter: (state) => {
      state.transactionFilter = {};
    },

    // Pagination
    setTransactionPage: (state, action: PayloadAction<number>) => {
      state.transactionPage = action.payload;
    },
    setTransactionsPerPage: (state, action: PayloadAction<number>) => {
      state.transactionsPerPage = action.payload;
    },

    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },

    // Reset
    resetTransactions: (state) => {
      Object.assign(state, initialState);
    },

    // Restore state
    restoreTransactionState: (
      state,
      action: PayloadAction<Partial<TransactionState>>
    ) => {
      Object.assign(state, action.payload);
    },
  },
});

export const {
  setBalances,
  updateBalance,
  setTotalValueUSD,
  setTransactions,
  addTransaction,
  updateTransaction,
  removeTransaction,
  selectTransaction,
  portfolioRefreshStart,
  portfolioRefreshSuccess,
  portfolioRefreshFailure,
  setTransactionFilter,
  clearTransactionFilter,
  setTransactionPage,
  setTransactionsPerPage,
  setError,
  clearError,
  resetTransactions,
  restoreTransactionState,
} = transactionSlice.actions;

// Aliases for compatibility
export const clearTransactions = resetTransactions;

export { transactionSlice };
export default transactionSlice.reducer;