/**
 * Redux Wallet Slice
 * Manages wallet state: active address, network status, connected wallets
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type NetworkStatus = "connected" | "disconnected" | "connecting" | "error";
export type Network = "mainnet" | "testnet" | "devnet";

export interface ConnectedWallet {
  name: string;
  address: string;
  type: "self-custody" | "external" | "privy";
  publicKey: string;
  isActive: boolean;
  connectedAt: number;
}

export interface WalletState {
  // Active wallet
  activeAddress: string | null;
  activeWalletType: "self-custody" | "external" | "privy" | null;

  // Connected wallets
  connectedWallets: ConnectedWallet[];

  // Network state
  network: Network;
  networkStatus: NetworkStatus;
  rpcEndpoint: string;

  // Wallet info
  walletName: string | null;
  isImported: boolean;

  // Loading state
  loading: boolean;
  error: string | null;

  // Backup state
  isBackedUp: boolean;
  lastBackupAt: number | null;

  // Transaction queue
  pendingTransactions: string[]; // transaction IDs

  // Primary chain (Sui-first) - NEW
  primaryChain: string; // e.g., 'sui:mainnet'
  secondaryChains: string[]; // e.g., ['ethereum:mainnet', 'solana:mainnet']
}

const initialState: WalletState = {
  activeAddress: null,
  activeWalletType: null,
  connectedWallets: [],
  network: "mainnet",
  networkStatus: "disconnected",
  rpcEndpoint: "https://fullnode.mainnet.sui.io:443",
  walletName: null,
  isImported: false,
  loading: false,
  error: null,
  isBackedUp: false,
  lastBackupAt: null,
  pendingTransactions: [],
  primaryChain: "sui:mainnet",
  secondaryChains: [],
};

const walletSlice: any = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    // Wallet connection
    connectWalletStart: (state) => {
      state.loading = true;
      state.error = null;
      state.networkStatus = "connecting";
    },
    connectWalletSuccess: (
      state,
      action: PayloadAction<{
        address: string;
        walletType: "self-custody" | "external" | "privy";
        name: string;
        publicKey: string;
      }>
    ) => {
      const wallet: ConnectedWallet = {
        name: action.payload.name,
        address: action.payload.address,
        type: action.payload.walletType,
        publicKey: action.payload.publicKey,
        isActive: true,
        connectedAt: Date.now(),
      };

      // Deactivate other wallets
      state.connectedWallets.forEach((w) => (w.isActive = false));

      // Add/update wallet
      const existingIndex = state.connectedWallets.findIndex(
        (w) => w.address === action.payload.address
      );
      if (existingIndex >= 0) {
        state.connectedWallets[existingIndex] = wallet;
      } else {
        state.connectedWallets.push(wallet);
      }

      state.activeAddress = action.payload.address;
      state.activeWalletType = action.payload.walletType;
      state.walletName = action.payload.name;
      state.networkStatus = "connected";
      state.loading = false;
      state.error = null;
    },
    connectWalletFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
      state.networkStatus = "error";
    },

    // Disconnect wallet
    disconnectWallet: (state, action: PayloadAction<string>) => {
      state.connectedWallets = state.connectedWallets.filter(
        (w) => w.address !== action.payload
      );

      if (state.activeAddress === action.payload) {
        state.activeAddress = state.connectedWallets[0]?.address || null;
        state.activeWalletType = state.connectedWallets[0]?.type || null;
      }

      if (state.connectedWallets.length === 0) {
        state.networkStatus = "disconnected";
      }
    },

    // Switch active wallet
    switchActiveWallet: (state, action: PayloadAction<string>) => {
      const targetWallet = state.connectedWallets.find(
        (w) => w.address === action.payload
      );

      if (targetWallet) {
        state.connectedWallets.forEach((w) => (w.isActive = false));
        targetWallet.isActive = true;
        state.activeAddress = action.payload;
        state.activeWalletType = targetWallet.type;
      }
    },

    // Network management
    setNetwork: (state, action: PayloadAction<Network>) => {
      state.network = action.payload;
      state.networkStatus = "connecting";

      // Update RPC endpoint based on network
      const rpcEndpoints = {
        mainnet: "https://fullnode.mainnet.sui.io:443",
        testnet: "https://fullnode.testnet.sui.io:443",
        devnet: "https://fullnode.devnet.sui.io:443",
      };
      state.rpcEndpoint = rpcEndpoints[action.payload];
    },
    setNetworkStatus: (state, action: PayloadAction<NetworkStatus>) => {
      state.networkStatus = action.payload;
    },
    setRpcEndpoint: (state, action: PayloadAction<string>) => {
      state.rpcEndpoint = action.payload;
    },

    // Backup management
    markAsBackedUp: (state) => {
      state.isBackedUp = true;
      state.lastBackupAt = Date.now();
    },
    markAsNotBackedUp: (state) => {
      state.isBackedUp = false;
    },

    // Wallet import
    setWalletImported: (state, action: PayloadAction<boolean>) => {
      state.isImported = action.payload;
    },

    // Transaction queue
    addPendingTransaction: (state, action: PayloadAction<string>) => {
      if (!state.pendingTransactions.includes(action.payload)) {
        state.pendingTransactions.push(action.payload);
      }
    },
    removePendingTransaction: (state, action: PayloadAction<string>) => {
      state.pendingTransactions = state.pendingTransactions.filter(
        (tx) => tx !== action.payload
      );
    },

    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },

    // Reset wallet
    resetWallet: (state) => {
      Object.assign(state, initialState);
    },

    // Restore wallet state
    restoreWalletState: (state, action: PayloadAction<Partial<WalletState>>) => {
      Object.assign(state, action.payload);
    },

    // Set primary chain (Sui-first)
    setPrimaryChain: (state, action: PayloadAction<string>) => {
      state.primaryChain = action.payload;
    },

    // Add secondary chain
    addSecondaryChain: (state, action: PayloadAction<string>) => {
      if (!state.secondaryChains.includes(action.payload)) {
        state.secondaryChains.push(action.payload);
      }
    },

    // Remove secondary chain
    removeSecondaryChain: (state, action: PayloadAction<string>) => {
      state.secondaryChains = state.secondaryChains.filter(
        (chain) => chain !== action.payload
      );
    },

    // Set secondary chains list
    setSecondaryChains: (state, action: PayloadAction<string[]>) => {
      state.secondaryChains = action.payload;
    },
  },
});

export const {
  connectWalletStart,
  connectWalletSuccess,
  connectWalletFailure,
  disconnectWallet,
  switchActiveWallet,
  setNetwork,
  setNetworkStatus,
  setRpcEndpoint,
  markAsBackedUp,
  markAsNotBackedUp,
  setWalletImported,
  addPendingTransaction,
  removePendingTransaction,
  setError,
  clearError,
  resetWallet,
  restoreWalletState,
  setPrimaryChain,
  addSecondaryChain,
  removeSecondaryChain,
  setSecondaryChains,
} = walletSlice.actions;

// Aliases for compatibility with expected API
export const addWallet = connectWalletSuccess;
export const clearWallets = resetWallet;
export const removeWallet = disconnectWallet;
export const selectWallet = switchActiveWallet;
export const setWallets = connectWalletSuccess;
export const updateBalance = addPendingTransaction; // Placeholder - to be used for balance updates
export const setBalances = setRpcEndpoint; // Placeholder - to be remapped from transactionSlice
export const setLoading = connectWalletStart;

export { walletSlice };
export default walletSlice.reducer;