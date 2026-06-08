/**
 * Zustand Global App State Store
 * Lightweight alternative to Redux for app-level state
 * Uses @orya/wallet-core storage abstraction for consistent behavior
 *
 * Manages:
 * - userId: Current authenticated user ID
 * - isAuthReady: Authentication initialization status
 * - walletAddress: Current wallet address (multi-chain support)
 * - onboardingComplete: User onboarding status
 * - authError: Authentication error messages
 */

import { StorageFactory } from '@orya/wallet-core/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface WalletState {
  // Primary auth state
  userId: string | null;
  isAuthReady: boolean;
  walletAddress: string | null;
  onboardingComplete: boolean;
  authError: string | null;

  // Actions
  setUserId: (userId: string | null) => void;
  setAuthReady: (ready: boolean) => void;
  setWalletAddress: (address: string | null) => void;
  setOnboardingComplete: (complete: boolean) => void;
  setAuthError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  userId: null,
  isAuthReady: false,
  walletAddress: null,
  onboardingComplete: false,
  authError: null,
};

// Create storage adapter using wallet-core factory
const storageAdapter = StorageFactory.create('mobile', AsyncStorage);

// Convert IStorage interface to Zustand storage format
const zustandStorage = {
  getItem: (name: string) => storageAdapter.getItem(name),
  setItem: (name: string, value: string) => storageAdapter.setItem(name, value),
  removeItem: (name: string) => storageAdapter.removeItem(name),
};

/**
 * Zustand Store with Persistence
 * Persists state to AsyncStorage via @orya/wallet-core storage abstraction
 */
export const useAppStore = create<WalletState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUserId: (userId: string | null) => {
        set({ userId });
        console.log('[AppStore] userId updated:', userId);
      },

      setAuthReady: (ready: boolean) => {
        set({ isAuthReady: ready });
        console.log('[AppStore] isAuthReady updated:', ready);
      },

      setWalletAddress: (address: string | null) => {
        set({ walletAddress: address });
        console.log('[AppStore] walletAddress updated:', address);
      },

      setOnboardingComplete: (complete: boolean) => {
        set({ onboardingComplete: complete });
        console.log('[AppStore] onboardingComplete updated:', complete);
      },

      setAuthError: (error: string | null) => {
        set({ authError: error });
        if (error) {
          console.warn('[AppStore] authError:', error);
        }
      },

      reset: () => {
        set(initialState);
        console.log('[AppStore] ✅ State reset to initial');
      },
    }),
    {
      name: '@orya/app-store',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        userId: state.userId,
        walletAddress: state.walletAddress,
        onboardingComplete: state.onboardingComplete,
      }),
    }
  )
);

/**
 * Middleware hook for debugging store changes
 */
export const useAppStoreDebug = () => {
  const store = useAppStore();

  if (process.env.NODE_ENV === 'development') {
    console.log('[AppStore] Current state:', {
      userId: store.userId,
      isAuthReady: store.isAuthReady,
      walletAddress: store.walletAddress,
      onboardingComplete: store.onboardingComplete,
      authError: store.authError,
    });
  }

  return store;
};