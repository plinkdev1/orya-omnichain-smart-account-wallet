import { useState, useCallback, useEffect } from 'react';
import { TatumService, TatumWalletResult, TatumTransaction, TatumEstimateFeeResponse, TatumBroadcastResponse } from '../services/tatum';

export interface UseTatumOptions {
  autoInitialize?: boolean;
}

export function useTatum(tatumService: TatumService, options: UseTatumOptions = {}) {
  const { autoInitialize = true } = options;

  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (autoInitialize) {
      initializeService();
    }
  }, []);

  const initializeService = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await tatumService.initialize();
      setIsInitialized(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      setIsInitialized(false);
    } finally {
      setIsLoading(false);
    }
  }, [tatumService]);

  const createWallet = useCallback(
    async (chainId: string): Promise<TatumWalletResult | null> => {
      if (!isInitialized) {
        setError('Tatum service not initialized');
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);
        const wallet = await tatumService.createWallet(chainId);
        return wallet;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isInitialized, tatumService]
  );

  const getBalance = useCallback(
    async (chainId: string, address: string): Promise<string | null> => {
      if (!isInitialized) {
        setError('Tatum service not initialized');
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);
        const balance = await tatumService.getBalance(chainId, address);
        return balance;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isInitialized, tatumService]
  );

  const getTransaction = useCallback(
    async (chainId: string, hash: string): Promise<TatumTransaction | null> => {
      if (!isInitialized) {
        setError('Tatum service not initialized');
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);
        const tx = await tatumService.getTransaction(chainId, hash);
        return tx;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isInitialized, tatumService]
  );

  const estimateFee = useCallback(
    async (chainId: string, from: string, to: string, amount: string): Promise<TatumEstimateFeeResponse | null> => {
      if (!isInitialized) {
        setError('Tatum service not initialized');
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);
        const fees = await tatumService.estimateFee(chainId, from, to, amount);
        return fees;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isInitialized, tatumService]
  );

  const getNonce = useCallback(
    async (chainId: string, address: string): Promise<number | null> => {
      if (!isInitialized) {
        setError('Tatum service not initialized');
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);
        const nonce = await tatumService.getNonce(chainId, address);
        return nonce;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isInitialized, tatumService]
  );

  const broadcastTransaction = useCallback(
    async (chainId: string, txData: string): Promise<TatumBroadcastResponse | null> => {
      if (!isInitialized) {
        setError('Tatum service not initialized');
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await tatumService.broadcastTransaction({ chainId, txData });
        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isInitialized, tatumService]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isInitialized,
    isLoading,
    error,
    clearError,
    createWallet,
    getBalance,
    getTransaction,
    estimateFee,
    getNonce,
    broadcastTransaction,
    initialize: initializeService,
  };
}
