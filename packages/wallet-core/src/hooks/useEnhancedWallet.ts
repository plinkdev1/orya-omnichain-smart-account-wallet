/**
 * useEnhancedWallet - React Hook for Zero-Trust Enhanced Wallets
 * Manages Privy + IKA integrated wallet lifecycle
 * Provides hooks for creating, signing with, and managing enhanced wallets
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  EnhancedWalletResult,
  EnhancedSigningResult,
  EnhancedSigningRequest,
  HealthCheckResult,
} from '../services/privy-ika-bridge';

export interface UseEnhancedWalletState {
  wallet: EnhancedWalletResult | null;
  loading: boolean;
  error: Error | null;
  isHealthy: boolean;
  signingInProgress: boolean;
}

export interface UseEnhancedWalletActions {
  createWallet: (userId: string) => Promise<EnhancedWalletResult | null>;
  signTransaction: (request: EnhancedSigningRequest) => Promise<EnhancedSigningResult | null>;
  signMessage: (message: string) => Promise<EnhancedSigningResult | null>;
  verifyOwnership: (challenge: string) => Promise<boolean>;
  checkHealth: () => Promise<HealthCheckResult | null>;
  rotateKeys: () => Promise<EnhancedWalletResult | null>;
  recoverWallet: (recoveryCode: string) => Promise<EnhancedWalletResult | null>;
  clearError: () => void;
  reset: () => void;
}

/**
 * Enhanced Wallet Hook - Full lifecycle management
 */
export function useEnhancedWallet(): UseEnhancedWalletState & UseEnhancedWalletActions {
  const [state, setState] = useState<UseEnhancedWalletState>({
    wallet: null,
    loading: false,
    error: null,
    isHealthy: false,
    signingInProgress: false,
  });

  const walletRef = useRef<EnhancedWalletResult | null>(null);
  const bridgeRef = useRef<any>(null);
  const userId = useRef<string>('');

  const setError = useCallback((error: Error | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const reset = useCallback(() => {
    setState({
      wallet: null,
      loading: false,
      error: null,
      isHealthy: false,
      signingInProgress: false,
    });
    walletRef.current = null;
    userId.current = '';
  }, []);

  const createWallet = useCallback(
    async (newUserId: string): Promise<EnhancedWalletResult | null> => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      try {
        userId.current = newUserId;

        if (!bridgeRef.current) {
          throw new Error('Enhanced wallet service not available');
        }

        const wallet = await bridgeRef.current.createEnhancedWallet(newUserId, 'sui');

        walletRef.current = wallet;
        setState(prev => ({
          ...prev,
          wallet,
          loading: false,
          isHealthy: true,
        }));

        return wallet;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setError(err);
        setState(prev => ({ ...prev, loading: false }));
        return null;
      }
    },
    [setError]
  );

  const signTransaction = useCallback(
    async (request: EnhancedSigningRequest): Promise<EnhancedSigningResult | null> => {
      if (!walletRef.current) {
        setError(new Error('No wallet selected'));
        return null;
      }

      setState(prev => ({ ...prev, signingInProgress: true, error: null }));

      try {
        if (!bridgeRef.current) {
          throw new Error('Enhanced wallet service not available');
        }

        const result = await bridgeRef.current.signTransactionEnhanced(request);

        setState(prev => ({ ...prev, signingInProgress: false }));
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setError(err);
        setState(prev => ({ ...prev, signingInProgress: false }));
        return null;
      }
    },
    [setError]
  );

  const signMessage = useCallback(
    async (message: string): Promise<EnhancedSigningResult | null> => {
      if (!walletRef.current) {
        setError(new Error('No wallet selected'));
        return null;
      }

      setState(prev => ({ ...prev, signingInProgress: true, error: null }));

      try {
        if (!bridgeRef.current) {
          throw new Error('Enhanced wallet service not available');
        }

        const result = await bridgeRef.current.signMessageEnhanced(
          walletRef.current.privyWalletId,
          walletRef.current.ikaShareId,
          message
        );

        setState(prev => ({ ...prev, signingInProgress: false }));
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setError(err);
        setState(prev => ({ ...prev, signingInProgress: false }));
        return null;
      }
    },
    [setError]
  );

  const verifyOwnership = useCallback(
    async (challenge: string): Promise<boolean> => {
      if (!walletRef.current) {
        setError(new Error('No wallet selected'));
        return false;
      }

      try {
        if (!bridgeRef.current) {
          throw new Error('Enhanced wallet service not available');
        }

        const valid = await bridgeRef.current.verifyWalletOwnership(
          walletRef.current.privyWalletId,
          walletRef.current.ikaShareId,
          challenge
        );

        return valid;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setError(err);
        return false;
      }
    },
    [setError]
  );

  const checkHealth = useCallback(
    async (): Promise<HealthCheckResult | null> => {
      if (!walletRef.current) {
        setError(new Error('No wallet selected'));
        return null;
      }

      try {
        if (!bridgeRef.current) {
          throw new Error('Enhanced wallet service not available');
        }

        const health = await bridgeRef.current.getWalletHealth(
          walletRef.current.privyWalletId,
          walletRef.current.ikaShareId
        );

        const isHealthy = health.overallStatus === 'healthy';
        setState(prev => ({ ...prev, isHealthy }));

        return health;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setError(err);
        setState(prev => ({ ...prev, isHealthy: false }));
        return null;
      }
    },
    [setError]
  );

  const rotateKeys = useCallback(
    async (): Promise<EnhancedWalletResult | null> => {
      if (!walletRef.current) {
        setError(new Error('No wallet selected'));
        return null;
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        if (!bridgeRef.current) {
          throw new Error('Enhanced wallet service not available');
        }

        const newWallet = await bridgeRef.current.rotateKeyShares(
          userId.current,
          walletRef.current.privyWalletId,
          walletRef.current.ikaShareId
        );

        walletRef.current = newWallet;
        setState(prev => ({ ...prev, wallet: newWallet, loading: false }));

        return newWallet;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setError(err);
        setState(prev => ({ ...prev, loading: false }));
        return null;
      }
    },
    [setError]
  );

  const recoverWallet = useCallback(
    async (recoveryCode: string): Promise<EnhancedWalletResult | null> => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        if (!bridgeRef.current) {
          throw new Error('Enhanced wallet service not available');
        }

        const wallet = await bridgeRef.current.recoverEnhancedWallet(userId.current, recoveryCode);

        walletRef.current = wallet;
        setState(prev => ({ ...prev, wallet, loading: false, isHealthy: true }));

        return wallet;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setError(err);
        setState(prev => ({ ...prev, loading: false }));
        return null;
      }
    },
    [setError]
  );

  useEffect(() => {
    const initializeBridge = async () => {
      try {
        const { getPrivyService } = await import('../services/privy');
        const { getIKAMPCService } = await import('../services/ika-mpc');
        const { createPrivyIKABridge } = await import('../services/privy-ika-bridge');

        const privyService = getPrivyService();
        const ikaMPCService = getIKAMPCService();

        if (!privyService || !ikaMPCService) {
          console.warn('Privy or IKA MPC service not initialized');
          return;
        }

        bridgeRef.current = createPrivyIKABridge({
          privyService,
          ikaMPCService,
          autoSync: true,
          auditLogging: true,
        });
      } catch (error) {
        console.error('Failed to initialize Enhanced Wallet bridge:', error);
      }
    };

    initializeBridge();
  }, []);

  return {
    ...state,
    createWallet,
    signTransaction,
    signMessage,
    verifyOwnership,
    checkHealth,
    rotateKeys,
    recoverWallet,
    clearError,
    reset,
  };
}

/**
 * useEnhancedWalletTransaction - Hook for handling transaction signing
 */
export function useEnhancedWalletTransaction() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<EnhancedSigningResult | null>(null);

  const sign = useCallback(
    async (
      signFn: (request: EnhancedSigningRequest) => Promise<EnhancedSigningResult | null>,
      request: EnhancedSigningRequest
    ): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const signingResult = await signFn(request);

        if (signingResult) {
          setResult(signingResult);
          return true;
        } else {
          setError(new Error('Signing returned null result'));
          return false;
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setResult(null);
  }, []);

  return { isLoading, error, result, sign, reset };
}

/**
 * useEnhancedWalletHealth - Hook for monitoring wallet health
 */
export function useEnhancedWalletHealth() {
  const [health, setHealth] = useState<HealthCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startMonitoring = useCallback(
    (checkFn: () => Promise<HealthCheckResult | null>, intervalMs: number = 30000) => {
      const checkHealth = async () => {
        setIsChecking(true);
        try {
          const result = await checkFn();
          if (result) {
            setHealth(result);
          }
        } catch (error) {
          console.error('Health check failed:', error);
        } finally {
          setIsChecking(false);
        }
      };

      checkHealth();
      intervalRef.current = setInterval(checkHealth, intervalMs);
    },
    []
  );

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopMonitoring();
  }, [stopMonitoring]);

  return { health, isChecking, startMonitoring, stopMonitoring };
}
