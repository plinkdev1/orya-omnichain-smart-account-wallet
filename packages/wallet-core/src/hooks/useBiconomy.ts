/**
 * useBiconomy Hook
 * Main hook for Biconomy integration in React applications
 */

import { useEffect, useState, useCallback } from 'react';
import type { Address } from '@orya/shared-types';
// TODO: @orya/aa-provider-biconomy is not available
// import { BiconomyService, type BiconomyServiceConfig } from '@orya/aa-provider-biconomy';

type BiconomyServiceConfig = any;

class BiconomyService {
  async initialize(config: BiconomyServiceConfig): Promise<void> {}
  async createSmartAccount(ownerAddress: Address, factoryAddress?: Address): Promise<any> { return null; }
  async executeSupertransaction(params: any, options?: any): Promise<any> { return null; }
}

export interface BiconomyHookOptions {
  autoInitialize?: boolean;
  onError?: (error: Error) => void;
}

export interface UseBiconomyReturn {
  service: BiconomyService | null;
  isReady: boolean;
  isLoading: boolean;
  error: Error | null;
  initialize: (config: BiconomyServiceConfig) => Promise<void>;
  createSmartAccount: (ownerAddress: Address, factoryAddress?: Address) => Promise<any>;
  executeSupertransaction: (params: any, options?: any) => Promise<any>;
}

/**
 * Hook for using Biconomy service
 */
export function useBiconomy(options?: BiconomyHookOptions): UseBiconomyReturn {
  const [service, setService] = useState<BiconomyService | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const initialize = useCallback(async (config: BiconomyServiceConfig) => {
    setIsLoading(true);
    setError(null);

    try {
      const biconomyService = new BiconomyService();
      await biconomyService.initialize(config);
      setService(biconomyService);
      setIsReady(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      options?.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  const createSmartAccount = useCallback(
    async (ownerAddress: Address, factoryAddress?: Address) => {
      if (!service) throw new Error('Biconomy service not initialized');
      return service.createSmartAccount(ownerAddress, factoryAddress);
    },
    [service]
  );

  const executeSupertransaction = useCallback(
    async (params: any, options?: any) => {
      if (!service) throw new Error('Biconomy service not initialized');
      return service.executeSupertransaction(params, options);
    },
    [service]
  );

  return {
    service,
    isReady,
    isLoading,
    error,
    initialize,
    createSmartAccount,
    executeSupertransaction,
  };
}

export default useBiconomy;
