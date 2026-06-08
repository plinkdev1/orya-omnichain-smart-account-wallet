import { useEffect, useState, useCallback } from 'react';
// TODO: chainRegistry submodule from @orya/shared-types is not available
// import { getChainRegistry, loadChainRegistry, ChainRegistry, ChainRegistryConfig } from '@orya/shared-types/chainRegistry';
import type { Chain, ChainId, ChainType } from '@orya/shared-types';

type ChainRegistry = any;
type ChainRegistryConfig = any;

interface UseChainRegistryState {
  registry: ChainRegistry | null;
  isLoading: boolean;
  error: Error | null;
  isInitialized: boolean;
}

export function useChainRegistry(config?: ChainRegistryConfig) {
  const [state, setState] = useState<UseChainRegistryState>({
    registry: null,
    isLoading: true,
    error: null,
    isInitialized: false,
  });

  useEffect(() => {
    let mounted = true;

    const initRegistry = async () => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        // TODO: chainRegistry loading is not implemented - awaiting @orya/shared-types/chainRegistry
        // const registry = await loadChainRegistry(config);
        
        if (mounted) {
          setState({
            registry: null,
            isLoading: false,
            error: new Error('chainRegistry not available'),
            isInitialized: false,
          });
        }
      } catch (error) {
        if (mounted) {
          const err = error instanceof Error ? error : new Error(String(error));
          setState({
            registry: null,
            isLoading: false,
            error: err,
            isInitialized: false,
          });
        }
      }
    };

    initRegistry();

    return () => {
      mounted = false;
    };
  }, [config]);

  const getChain = useCallback((chainId: ChainId): Chain | undefined => {
    return state.registry?.getChain(chainId);
  }, [state.registry]);

  const getAllChains = useCallback((): Chain[] => {
    return state.registry?.getAllChains() || [];
  }, [state.registry]);

  const getEnabledChains = useCallback((): Chain[] => {
    return state.registry?.getEnabledChains() || [];
  }, [state.registry]);

  const getMainnetChains = useCallback((): Chain[] => {
    return state.registry?.getMainnetChains() || [];
  }, [state.registry]);

  const getTestnetChains = useCallback((): Chain[] => {
    return state.registry?.getTestnetChains() || [];
  }, [state.registry]);

  const getChainsByType = useCallback((type: ChainType): Chain[] => {
    return state.registry?.getChainsByType(type) || [];
  }, [state.registry]);

  const getChainsByVMFamily = useCallback((vmFamily: string): Chain[] => {
    return state.registry?.getChainsByVMFamily(vmFamily) || [];
  }, [state.registry]);

  const getChainsBySymbol = useCallback((symbol: string): Chain[] => {
    return state.registry?.getChainsBySymbol(symbol) || [];
  }, [state.registry]);

  const searchChains = useCallback((query: string): Chain[] => {
    return state.registry?.searchChains(query) || [];
  }, [state.registry]);

  const getStatistics = useCallback(() => {
    return state.registry?.getStatistics();
  }, [state.registry]);

  return {
    ...state,
    getChain,
    getAllChains,
    getEnabledChains,
    getMainnetChains,
    getTestnetChains,
    getChainsByType,
    getChainsByVMFamily,
    getChainsBySymbol,
    searchChains,
    getStatistics,
  };
}
