/**
 * Redux Wallet Profile Slice
 * Manages wallet profile state: user segment, wallet type, capabilities, custody model
 */

import { createSlice, PayloadAction, Slice } from "@reduxjs/toolkit";

export enum UserSegment {
  NORMIE = 'normie',
  CRYPTO_NATIVE = 'crypto_native',
  INSTITUTIONAL = 'institutional',
  EXTERNAL = 'external',
}

export enum WalletTypeEnum {
  CUSTODIAL = 'custodial',
  MPC = 'mpc',
  EXTERNAL = 'external',
  MULTI_SIG = 'multi_sig',
}

export enum CustodyModel {
  CUSTODIAL = 'custodial',
  SELF_CUSTODY = 'self_custody',
  EXTERNAL = 'external',
  MULTI_SIG = 'multi_sig',
}

export interface Capability {
  name: string;
  enabled: boolean;
  tier?: 'basic' | 'intermediate' | 'advanced';
}

export interface WalletInProfile {
  id: string;
  type: WalletTypeEnum;
  blockchain: string;
  address: string;
  isActive: boolean;
  label?: string;
}

export interface WalletProfileState {
  initialized: boolean;
  userId: string | null;
  userSegment: UserSegment | null;
  walletType: WalletTypeEnum | null;
  custodyModel: CustodyModel | null;
  
  primaryBlockchain: string;
  supportedBlockchains: string[];
  
  capabilities: Record<string, Capability>;
  
  wallets: WalletInProfile[];
  activeWalletId: string | null;
  
  loading: boolean;
  error: string | null;
}

const initialState: WalletProfileState = {
  initialized: false,
  userId: null,
  userSegment: null,
  walletType: null,
  custodyModel: null,
  primaryBlockchain: 'sui',
  supportedBlockchains: ['sui'],
  capabilities: {},
  wallets: [],
  activeWalletId: null,
  loading: false,
  error: null,
};

const walletProfileSlice: Slice<WalletProfileState> = createSlice({
  name: 'walletProfile',
  initialState,
  reducers: {
    initializeProfile: (
      state,
      action: PayloadAction<{
        userId: string;
        userSegment: UserSegment;
        walletType: WalletTypeEnum;
      }>
    ) => {
      state.userId = action.payload.userId;
      state.userSegment = action.payload.userSegment;
      state.walletType = action.payload.walletType;
      state.initialized = true;
    },

    updateCapabilities: (state, action: PayloadAction<Record<string, Capability>>) => {
      state.capabilities = action.payload;
    },

    upgradeProfileToWeb3: (state) => {
      if (state.userSegment === UserSegment.NORMIE) {
        state.userSegment = UserSegment.CRYPTO_NATIVE;
        state.walletType = WalletTypeEnum.MPC;
        state.custodyModel = CustodyModel.SELF_CUSTODY;
      }
    },

    updateCustodyModel: (state, action: PayloadAction<CustodyModel>) => {
      state.custodyModel = action.payload;
    },

    addSupportedChain: (state, action: PayloadAction<string>) => {
      if (!state.supportedBlockchains.includes(action.payload)) {
        state.supportedBlockchains.push(action.payload);
      }
    },

    removeSupportedChain: (state, action: PayloadAction<string>) => {
      state.supportedBlockchains = state.supportedBlockchains.filter(
        (chain) => chain !== action.payload
      );
    },

    addWallet: (state, action: PayloadAction<WalletInProfile>) => {
      state.wallets.push(action.payload);
    },

    removeWallet: (state, action: PayloadAction<string>) => {
      state.wallets = state.wallets.filter((w) => w.id !== action.payload);
    },

    setActiveWallet: (state, action: PayloadAction<string>) => {
      state.wallets.forEach((w) => (w.isActive = w.id === action.payload));
      state.activeWalletId = action.payload;
    },

    setProfileLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setProfileError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },

    clearProfileError: (state) => {
      state.error = null;
    },

    resetProfile: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  initializeProfile,
  updateCapabilities,
  upgradeProfileToWeb3,
  updateCustodyModel,
  addSupportedChain,
  removeSupportedChain,
  addWallet,
  removeWallet,
  setActiveWallet,
  setProfileLoading,
  setProfileError,
  clearProfileError,
  resetProfile,
} = walletProfileSlice.actions;

// Selectors
export const selectProfile = (state: any) => state.walletProfile;
export const selectUserSegment = (state: any) => state.walletProfile.userSegment;
export const selectWalletType = (state: any) => state.walletProfile.walletType;
export const selectCapabilities = (state: any) => state.walletProfile.capabilities;
export const selectCustodyModel = (state: any) => state.walletProfile.custodyModel;
export const selectWallets = (state: any) => state.walletProfile.wallets;
export const selectActiveWallet = (state: any) =>
  state.walletProfile.wallets.find((w: WalletInProfile) => w.isActive) || null;
export const selectProfileLoading = (state: any) => state.walletProfile.loading;
export const selectProfileError = (state: any) => state.walletProfile.error;
export const selectProfileInitialized = (state: any) => state.walletProfile.initialized;

export { walletProfileSlice };
export default walletProfileSlice.reducer;
