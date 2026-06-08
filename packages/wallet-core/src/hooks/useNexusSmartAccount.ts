/**
 * useNexusSmartAccount Hook
 * Manages NEXUS smart account lifecycle
 */

import { useEffect, useState, useCallback } from 'react';
import type { Address } from '@orya/shared-types';
// TODO: @orya/aa-provider-biconomy is not available
// import type { BiconomyService, NexusSmartAccount } from '@orya/aa-provider-biconomy';

type BiconomyService = any;
type NexusSmartAccount = any;

export interface UseNexusSmartAccountReturn {
  account: NexusSmartAccount | null;
  isCreating: boolean;
  error: Error | null;
  create: (ownerAddress: Address, factoryAddress?: Address) => Promise<NexusSmartAccount>;
  getAccount: (ownerAddress: Address) => Promise<NexusSmartAccount | null>;
  isDeployed: (accountAddress: Address) => Promise<boolean>;
}

/**
 * Hook for managing NEXUS smart accounts
 */
export function useNexusSmartAccount(service: BiconomyService | null): UseNexusSmartAccountReturn {
  const [account, setAccount] = useState<NexusSmartAccount | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = useCallback(
    async (ownerAddress: Address, factoryAddress?: Address): Promise<NexusSmartAccount> => {
      if (!service || !service.isReady()) {
        throw new Error('Biconomy service not initialized');
      }

      setIsCreating(true);
      setError(null);

      try {
        const newAccount = await service.createSmartAccount(ownerAddress, factoryAddress);
        setAccount(newAccount);
        return newAccount;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    [service]
  );

  const getAccount = useCallback(
    async (ownerAddress: Address): Promise<NexusSmartAccount | null> => {
      if (!service || !service.isReady()) {
        return null;
      }

      try {
        return await service.createSmartAccount(ownerAddress);
      } catch (err) {
        console.error('Failed to get account:', err);
        return null;
      }
    },
    [service]
  );

  const isDeployed = useCallback(
    async (accountAddress: Address): Promise<boolean> => {
      if (!service || !service.isReady()) {
        return false;
      }

      try {
        const accountManager = service.getAccountManager();
        return await accountManager.isAccountDeployed(accountAddress);
      } catch (err) {
        console.error('Failed to check deployment:', err);
        return false;
      }
    },
    [service]
  );

  return {
    account,
    isCreating,
    error,
    create,
    getAccount,
    isDeployed,
  };
}

export default useNexusSmartAccount;
