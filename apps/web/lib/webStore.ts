'use client';

/**
 * Zustand Global App State Store - Web Platform
 * Lightweight client-side state with localStorage persistence
 *
 * Manages:
 * - userId: Current authenticated user ID
 * - isAuthReady: Authentication initialization status
 * - walletAddress: Current wallet address (multi-chain support)
 * - onboardingComplete: User onboarding status
 * - authError: Authentication error messages
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface WebWalletState {
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

/**
 * Zustand Store with localStorage Persistence
 * Web-specific implementation using localStorage instead of AsyncStorage
 */
export const useWebStore = create<WebWalletState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUserId: (userId: string | null) => {
        set({ userId });
        if (typeof window !== 'undefined') {
          console.log('[WebStore] userId updated:', userId);
        }
      },

      setAuthReady: (ready: boolean) => {
        set({ isAuthReady: ready });
        if (typeof window !== 'undefined') {
          console.log('[WebStore] isAuthReady updated:', ready);
        }
      },

      setWalletAddress: (address: string | null) => {
        set({ walletAddress: address });
        if (typeof window !== 'undefined') {
          console.log('[WebStore] walletAddress updated:', address);
        }
      },

      setOnboardingComplete: (complete: boolean) => {
        set({ onboardingComplete: complete });
        if (typeof window !== 'undefined') {
          console.log('[WebStore] onboardingComplete updated:', complete);
        }
      },

      setAuthError: (error: string | null) => {
        set({ authError: error });
        if (error && typeof window !== 'undefined') {
          console.warn('[WebStore] authError:', error);
        }
      },

      reset: () => {
        set(initialState);
        if (typeof window !== 'undefined') {
          console.log('[WebStore] ✅ State reset to initial');
        }
      },
    }),
    {
      name: '@orya/web-store',
      storage: createJSONStorage(() => {
        // Use localStorage only in browser environment
        if (typeof window === 'undefined') {
          // Server-side: return a no-op storage
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      partialize: (state) => ({
        userId: state.userId,
        walletAddress: state.walletAddress,
        onboardingComplete: state.onboardingComplete,
      }),
    }
  )
);

/**
 * Middleware hook for debugging store changes (development only)
 */
export const useWebStoreDebug = () => {
  const store = useWebStore();

  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    console.log('[WebStore] Current state:', {
      userId: store.userId,
      isAuthReady: store.isAuthReady,
      walletAddress: store.walletAddress,
      onboardingComplete: store.onboardingComplete,
      authError: store.authError,
    });
  }

  return store;
};