import type { Asset, Portfolio, PortfolioMetrics } from '@orya/shared-types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Portfolio State Slice
 * Manages user portfolio aggregation, assets, and metrics
 */

export interface PortfolioState {
  portfolio: Portfolio | null;
  assets: Asset[];
  metrics: PortfolioMetrics | null;
  totalValue: string; // in USD
  dayChangePercent: number;
  dayChangeValue: string;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: number | null;
}

const initialState: PortfolioState = {
  portfolio: null,
  assets: [],
  metrics: null,
  totalValue: '0',
  dayChangePercent: 0,
  dayChangeValue: '0',
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastUpdated: null,
};

export const portfolioSlice: any = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    // Portfolio loading
    setPortfolio: (state, action: PayloadAction<Portfolio>) => {
      state.portfolio = action.payload;
      state.lastUpdated = Date.now();
    },

    // Assets management
    setAssets: (state, action: PayloadAction<Asset[]>) => {
      state.assets = action.payload;
    },
    addAsset: (state, action: PayloadAction<Asset>) => {
      const exists = state.assets.some((a) => a.tokenAddress === action.payload.tokenAddress);
      if (!exists) {
        state.assets.push(action.payload);
      }
    },
    removeAsset: (state, action: PayloadAction<string>) => {
      state.assets = state.assets.filter((a) => a.tokenAddress !== action.payload);
    },
    updateAsset: (state, action: PayloadAction<Asset>) => {
      const index = state.assets.findIndex((a) => a.tokenAddress === action.payload.tokenAddress);
      if (index >= 0) {
        state.assets[index] = action.payload;
      }
    },

    // Metrics
    setMetrics: (state, action: PayloadAction<PortfolioMetrics>) => {
      state.metrics = action.payload;
    },
    setTotalValue: (state, action: PayloadAction<string>) => {
      state.totalValue = action.payload;
    },
    setDayChange: (state, action: PayloadAction<{ percent: number; value: string }>) => {
      state.dayChangePercent = action.payload.percent;
      state.dayChangeValue = action.payload.value;
    },

    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setRefreshing: (state, action: PayloadAction<boolean>) => {
      state.isRefreshing = action.payload;
    },

    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Clear portfolio
    clearPortfolio: (state) => {
      state.portfolio = null;
      state.assets = [];
      state.metrics = null;
      state.totalValue = '0';
      state.dayChangePercent = 0;
      state.dayChangeValue = '0';
      state.lastUpdated = null;
    },

    // Update timestamp
    setLastUpdated: (state) => {
      state.lastUpdated = Date.now();
    },
  },
});

export const {
  setPortfolio,
  setAssets,
  addAsset,
  removeAsset,
  updateAsset,
  setMetrics,
  setTotalValue,
  setDayChange,
  setLoading,
  setRefreshing,
  setError,
  clearPortfolio,
  setLastUpdated,
} = portfolioSlice.actions;

export default portfolioSlice.reducer;
