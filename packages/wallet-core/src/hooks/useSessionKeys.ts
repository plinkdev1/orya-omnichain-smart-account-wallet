/**
 * useSessionKeys Hook
 * React hook for managing session keys
 */

import { useCallback, useState } from 'react';
import { SessionKeyService } from '../services/session-keys';
import type {
  SessionKey,
  SessionKeyPermission,
  AuthorizationPolicy,
  Address,
} from '@orya/shared-types';

export interface UseSessionKeysState {
  loading: boolean;
  error: string | null;
  sessionKeys: SessionKey[];
  activeSessionKeys: SessionKey[];
}

export interface UseSessionKeysActions {
  createSessionKey: (
    walletAddress: Address,
    permissions: SessionKeyPermission[],
    durationSeconds: number,
    policies?: AuthorizationPolicy[]
  ) => Promise<SessionKey>;
  getSessionKey: (sessionKeyId: string) => SessionKey | undefined;
  getSessionKeysForWallet: (walletAddress: Address) => SessionKey[];
  getActiveSessionKeys: (walletAddress: Address) => SessionKey[];
  validateSessionKey: (
    sessionKey: SessionKey,
    permission: SessionKeyPermission,
    operationData?: Record<string, any>
  ) => Promise<{ valid: boolean; reason?: string }>;
  revokeSessionKey: (sessionKeyId: string) => boolean;
  revokeAllSessionKeys: (walletAddress: Address) => number;
  suspendSessionKey: (sessionKeyId: string) => boolean;
  resumeSessionKey: (sessionKeyId: string) => boolean;
  updatePolicies: (
    sessionKeyId: string,
    policies: AuthorizationPolicy[]
  ) => boolean;
  clear: () => void;
}

/**
 * React hook for session keys management
 */
export function useSessionKeys(
  service: SessionKeyService
): UseSessionKeysState & UseSessionKeysActions {
  const [state, setState] = useState<UseSessionKeysState>({
    loading: false,
    error: null,
    sessionKeys: [],
    activeSessionKeys: [],
  });

  const createSessionKey = useCallback(
    async (
      walletAddress: Address,
      permissions: SessionKeyPermission[],
      durationSeconds: number,
      policies?: AuthorizationPolicy[]
    ) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const sessionKey = await service.createSessionKey({
          walletAddress,
          permissions,
          durationSeconds,
          authorizationPolicies: policies,
        });
        setState((prev) => ({
          ...prev,
          sessionKeys: [...prev.sessionKeys, sessionKey],
          activeSessionKeys: [...prev.activeSessionKeys, sessionKey],
          loading: false,
        }));
        return sessionKey;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
        throw error;
      }
    },
    [service]
  );

  const getSessionKey = useCallback(
    (sessionKeyId: string) => {
      return service.getSessionKey(sessionKeyId);
    },
    [service]
  );

  const getSessionKeysForWallet = useCallback(
    (walletAddress: Address) => {
      try {
        const keys = service.getSessionKeysForWallet(walletAddress);
        setState((prev) => ({
          ...prev,
          sessionKeys: keys,
          error: null,
        }));
        return keys;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    [service]
  );

  const getActiveSessionKeys = useCallback(
    (walletAddress: Address) => {
      try {
        const keys = service.getActiveSessionKeysForWallet(walletAddress);
        setState((prev) => ({
          ...prev,
          activeSessionKeys: keys,
          error: null,
        }));
        return keys;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    [service]
  );

  const validateSessionKey = useCallback(
    async (
      sessionKey: SessionKey,
      permission: SessionKeyPermission,
      operationData?: Record<string, any>
    ) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const result = await service.validateSessionKey({
          sessionKey,
          permission,
          operationData,
        });
        setState((prev) => ({
          ...prev,
          error: null,
          loading: false,
        }));
        return {
          valid: result.valid,
          reason: result.reason,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
        throw error;
      }
    },
    [service]
  );

  const revokeSessionKey = useCallback(
    (sessionKeyId: string) => {
      try {
        const success = service.revokeSessionKey(sessionKeyId);
        setState((prev) => ({
          ...prev,
          sessionKeys: prev.sessionKeys.filter((sk) => sk.id !== sessionKeyId),
          activeSessionKeys: prev.activeSessionKeys.filter(
            (sk) => sk.id !== sessionKeyId
          ),
          error: null,
        }));
        return success;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    [service]
  );

  const revokeAllSessionKeys = useCallback(
    (walletAddress: Address) => {
      try {
        const count = service.revokeAllSessionKeysForWallet(walletAddress);
        setState((prev) => ({
          ...prev,
          sessionKeys: [],
          activeSessionKeys: [],
          error: null,
        }));
        return count;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    [service]
  );

  const suspendSessionKey = useCallback(
    (sessionKeyId: string) => {
      try {
        const success = service.suspendSessionKey(sessionKeyId);
        setState((prev) => ({
          ...prev,
          activeSessionKeys: prev.activeSessionKeys.filter(
            (sk) => sk.id !== sessionKeyId
          ),
          error: null,
        }));
        return success;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    [service]
  );

  const resumeSessionKey = useCallback(
    (sessionKeyId: string) => {
      try {
        const success = service.resumeSessionKey(sessionKeyId);
        if (success) {
          const key = service.getSessionKey(sessionKeyId);
          if (key) {
            setState((prev) => ({
              ...prev,
              activeSessionKeys: [...prev.activeSessionKeys, key],
              error: null,
            }));
          }
        }
        return success;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    [service]
  );

  const updatePolicies = useCallback(
    (sessionKeyId: string, policies: AuthorizationPolicy[]) => {
      try {
        const success = service.updateAuthorizationPolicies(sessionKeyId, policies);
        setState((prev) => ({
          ...prev,
          error: null,
        }));
        return success;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    [service]
  );

  const clear = useCallback(() => {
    setState({
      loading: false,
      error: null,
      sessionKeys: [],
      activeSessionKeys: [],
    });
  }, []);

  return {
    ...state,
    createSessionKey,
    getSessionKey,
    getSessionKeysForWallet,
    getActiveSessionKeys,
    validateSessionKey,
    revokeSessionKey,
    revokeAllSessionKeys,
    suspendSessionKey,
    resumeSessionKey,
    updatePolicies,
    clear,
  };
}

export default useSessionKeys;
