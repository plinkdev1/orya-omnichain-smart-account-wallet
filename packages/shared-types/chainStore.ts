/**
 * ORŸA Chain Store
 * Zustand store for managing active chain selection
 * Shared between mobile and web apps
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Chain, ChainId } from './chains';
import { getChain, getEnabledChains } from './chains';

export interface ChainStore {
  // State
  currentChainId: ChainId;
  chainHealth: Record<ChainId, { status: 'healthy' | 'degraded' | 'offline'; latency?: number }>;
  isLoadingChains: boolean;
  lastHealthCheck?: number;

  // Actions
  setCurrentChain: (chainId: ChainId) => void;
  getCurrentChain: () => Chain | undefined;
  updateChainHealth: (chainId: ChainId, status: 'healthy' | 'degraded' | 'offline', latency?: number) => void;
  checkChainHealth: (chainId: ChainId) => Promise<boolean>;
  checkAllChainsHealth: () => Promise<void>;
  getAvailableChains: () => Chain[];
  reset: () => void;
}

/**
 * Create the chain store with persistence
 * Defaults to SUI mainnet
 */
export const useChainStore = create<ChainStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentChainId: 'sui:mainnet',
      chainHealth: {},
      isLoadingChains: false,
      lastHealthCheck: undefined,

      // Set current chain
      setCurrentChain: (chainId: ChainId) => {
        const chain = getChain(chainId);
        if (chain && chain.isEnabled) {
          set({ currentChainId: chainId });
        }
      },

      // Get current chain
      getCurrentChain: () => {
        const state = get();
        return getChain(state.currentChainId);
      },

      // Update chain health status
      updateChainHealth: (chainId, status, latency) => {
        set((state) => ({
          chainHealth: {
            ...state.chainHealth,
            [chainId]: { status, latency },
          },
        }));
      },

      // Check single chain health by pinging its RPC
      checkChainHealth: async (chainId) => {
        try {
          const chain = getChain(chainId);
          if (!chain) return false;

          const startTime = Date.now();

          // Simple JSON-RPC health check
          const rpcUrl = chain.rpcUrl;
          if (!rpcUrl) {
            get().updateChainHealth(chainId, 'offline');
            return false;
          }

          const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'eth_blockNumber',
            }),
          });

          const latency = Date.now() - startTime;

          if (response.ok) {
            const status = latency > 500 ? 'degraded' : 'healthy';
            get().updateChainHealth(chainId, status, latency);
            return status === 'healthy';
          } else {
            get().updateChainHealth(chainId, 'offline');
            return false;
          }
        } catch (error) {
          console.error(`Health check failed for chain ${chainId}:`, error);
          get().updateChainHealth(chainId, 'offline');
          return false;
        }
      },

      // Check health of all enabled chains
      checkAllChainsHealth: async () => {
        set({ isLoadingChains: true });
        const chains = getEnabledChains();
        const promises = chains.map((chain) => get().checkChainHealth(chain.id));
        await Promise.all(promises);
        set({ isLoadingChains: false, lastHealthCheck: Date.now() });
      },

      // Get available chains
      getAvailableChains: () => {
        return getEnabledChains();
      },

      // Reset to default state
      reset: () => {
        set({
          currentChainId: 'sui:mainnet',
          chainHealth: {},
          isLoadingChains: false,
        });
      },
    }),
    {
      name: 'orya-chain-store',
      partialize: (state) => ({
        currentChainId: state.currentChainId,
        // Don't persist health status as it changes frequently
      }),
      version: 1,
    }
  )
);

/**
 * Hook to get current chain
 */
export const useCurrentChain = () => {
  const chain = useChainStore((state) => state.getCurrentChain());
  return chain;
};

/**
 * Hook to get available chains
 */
export const useAvailableChains = () => {
  const chains = useChainStore((state) => state.getAvailableChains());
  return chains;
};

/**
 * Hook to switch chains
 */
export const useSwitchChain = () => {
  const setCurrentChain = useChainStore((state) => state.setCurrentChain);
  return setCurrentChain;
};