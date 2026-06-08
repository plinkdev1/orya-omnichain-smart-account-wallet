import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChainHealth {
  chainId: string;
  chainName: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  latency: number | null;
  blockTime: number | null;
  lastCheck: number;
  errorMessage?: string;
}

export interface ChainHealthState {
  chains: Map<string, ChainHealth>;
  isMonitoring: boolean;
  pollingInterval: number;
  setChainHealth: (chainId: string, health: Partial<ChainHealth>) => void;
  getChainHealth: (chainId: string) => ChainHealth | undefined;
  getAllChains: () => ChainHealth[];
  startMonitoring: (interval?: number) => void;
  stopMonitoring: () => void;
  setPollingInterval: (interval: number) => void;
  clearChainHealth: (chainId: string) => void;
  clearAll: () => void;
}

const DEFAULT_CHAINS = [
  { chainId: 'sui-mainnet', chainName: 'SUI Mainnet' },
  { chainId: 'eth-mainnet', chainName: 'Ethereum Mainnet' },
  { chainId: 'eth-sepolia', chainName: 'Ethereum Sepolia' },
  { chainId: 'polygon-mainnet', chainName: 'Polygon Mainnet' },
  { chainId: 'arbitrum-mainnet', chainName: 'Arbitrum Mainnet' },
  { chainId: 'optimism-mainnet', chainName: 'Optimism Mainnet' },
  { chainId: 'solana-mainnet', chainName: 'Solana Mainnet' },
  { chainId: 'solana-devnet', chainName: 'Solana Devnet' },
  { chainId: 'base-mainnet', chainName: 'Base Mainnet' },
];

export const useChainHealthStore = create<ChainHealthState>()(
  persist(
    (set, get) => {
      const initialChains = new Map<string, ChainHealth>();
      DEFAULT_CHAINS.forEach(({ chainId, chainName }) => {
        initialChains.set(chainId, {
          chainId,
          chainName,
          status: 'unknown',
          latency: null,
          blockTime: null,
          lastCheck: 0,
        });
      });

      return {
        chains: initialChains,
        isMonitoring: false,
        pollingInterval: 30000,

        setChainHealth: (chainId: string, health: Partial<ChainHealth>) => {
          set((state) => {
            const updated = new Map(state.chains);
            const existing = updated.get(chainId);
            if (existing) {
              updated.set(chainId, {
                ...existing,
                ...health,
                lastCheck: health.lastCheck ?? Date.now(),
              });
            } else {
              updated.set(chainId, {
                chainId,
                chainName: health.chainName || chainId,
                status: health.status || 'unknown',
                latency: health.latency ?? null,
                blockTime: health.blockTime ?? null,
                lastCheck: Date.now(),
                ...health,
              });
            }
            return { chains: updated };
          });
        },

        getChainHealth: (chainId: string) => {
          const state = get();
          return state.chains.get(chainId);
        },

        getAllChains: () => {
          const state = get();
          return Array.from(state.chains.values());
        },

        startMonitoring: (interval?: number) => {
          set((state) => ({
            isMonitoring: true,
            pollingInterval: interval ?? state.pollingInterval,
          }));
        },

        stopMonitoring: () => {
          set({ isMonitoring: false });
        },

        setPollingInterval: (interval: number) => {
          set({ pollingInterval: interval });
        },

        clearChainHealth: (chainId: string) => {
          set((state) => {
            const updated = new Map(state.chains);
            updated.delete(chainId);
            return { chains: updated };
          });
        },

        clearAll: () => {
          set({ chains: new Map(), isMonitoring: false });
        },
      };
    },
    {
      name: 'chain-health-store',
      partialize: (state) => ({
        chains: Array.from(state.chains.entries()),
        pollingInterval: state.pollingInterval,
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        chains: new Map(persistedState.chains || []),
      }),
    }
  )
);
