import { useEffect, useState } from 'react';
import { useChainHealthStore } from '../store/chainHealthStore';
import { chainHealthPollingService, ChainHealthConfig } from '../services/chainHealthPollingService';
import type { ChainHealth } from '../store/chainHealthStore';

export interface UseChainHealthOptions {
  autoStart?: boolean;
  pollingInterval?: number;
  chains?: ChainHealthConfig[];
}

export function useChainHealth(options: UseChainHealthOptions = {}) {
  const {
    autoStart = true,
    pollingInterval = 30000,
    chains = [],
  } = options;

  const store = useChainHealthStore();
  const [isHealthy, setIsHealthy] = useState(true);

  useEffect(() => {
    if (chains.length > 0) {
      chainHealthPollingService.registerChains(chains);
    }

    if (autoStart) {
      chainHealthPollingService.start(pollingInterval);
      store.startMonitoring(pollingInterval);
    }

    return () => {
      if (autoStart) {
        chainHealthPollingService.stop();
        store.stopMonitoring();
      }
    };
  }, [autoStart, pollingInterval, chains.length]);

  useEffect(() => {
    const allChains = store.getAllChains();
    const healthyCount = allChains.filter((c) => c.status === 'healthy').length;
    setIsHealthy(healthyCount > 0);
  }, [store.getAllChains]);

  const getChainStatus = (chainId: string): ChainHealth | undefined => {
    return store.getChainHealth(chainId);
  };

  const getChainStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy':
        return '#10b981';
      case 'degraded':
        return '#f59e0b';
      case 'unhealthy':
        return '#ef4444';
      default:
        return '#9ca3af';
    }
  };

  const getHealthPercentage = (): number => {
    const allChains = store.getAllChains();
    if (allChains.length === 0) return 0;

    const healthyCount = allChains.filter((c) => c.status === 'healthy').length;
    return Math.round((healthyCount / allChains.length) * 100);
  };

  const addChain = (config: ChainHealthConfig): void => {
    chainHealthPollingService.addChain(config);
  };

  const removeChain = (chainId: string): void => {
    chainHealthPollingService.removeChain(chainId);
  };

  const setPollingInterval = (interval: number): void => {
    chainHealthPollingService.setInterval(interval);
  };

  return {
    chains: store.getAllChains(),
    getChainStatus,
    getChainStatusColor,
    getHealthPercentage,
    isHealthy,
    addChain,
    removeChain,
    setPollingInterval,
    isMonitoring: store.isMonitoring,
    start: () => chainHealthPollingService.start(pollingInterval),
    stop: () => chainHealthPollingService.stop(),
  };
}
