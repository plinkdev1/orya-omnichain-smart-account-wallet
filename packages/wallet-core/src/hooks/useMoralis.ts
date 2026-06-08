import { useState, useCallback, useEffect } from 'react';
import { MoralisService, Portfolio, Transaction, PortfolioToken, ChainBalance, MultiChainBalance } from '../services/moralis';

export interface UseMoralisOptions {
  autoInitialize?: boolean;
}

export function useMoralis(moralisService: MoralisService, options: UseMoralisOptions = {}) {
  const { autoInitialize = true } = options;

  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<ChainBalance | null>(null);
  const [multiChainBalance, setMultiChainBalance] = useState<MultiChainBalance | null>(null);
  const [tokens, setTokens] = useState<PortfolioToken[]>([]);

  useEffect(() => {
    if (autoInitialize) {
      initializeService();
    }
  }, []);

  const initializeService = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await moralisService.initialize();
      setIsInitialized(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      setIsInitialized(false);
    } finally {
      setIsLoading(false);
    }
  }, [moralisService]);

  const getPortfolio = useCallback(
    async (address: string, chain: string) => {
      if (!isInitialized && !moralisService.isReady()) {
        setError('Moralis service not initialized');
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await moralisService.getPortfolio(address, chain);
        setPortfolio(data);
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isInitialized, moralisService]
  );

  const getTransactions = useCallback(
    async (address: string, chain: string, limit: number = 25) => {
      if (!isInitialized && !moralisService.isReady()) {
        setError('Moralis service not initialized');
        return [];
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await moralisService.getTransactionHistory(address, chain, limit);
        setTransactions(data);
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [isInitialized, moralisService]
  );

  const getNativeBalance = useCallback(
    async (address: string, chain: string) => {
      if (!isInitialized && !moralisService.isReady()) {
        setError('Moralis service not initialized');
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await moralisService.getNativeBalance(address, chain);
        setBalance(data);
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isInitialized, moralisService]
  );

  const getTokenBalances = useCallback(
    async (address: string, chain: string) => {
      if (!isInitialized && !moralisService.isReady()) {
        setError('Moralis service not initialized');
        return [];
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await moralisService.getTokenBalances(address, chain);
        setTokens(data);
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [isInitialized, moralisService]
  );

  const getMultiChainBalance = useCallback(
    async (address: string, chains: string[]) => {
      if (!isInitialized && !moralisService.isReady()) {
        setError('Moralis service not initialized');
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await moralisService.getMultiChainBalance(address, chains);
        setMultiChainBalance(data);
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isInitialized, moralisService]
  );

  const getTokenPrice = useCallback(
    async (tokenAddress: string, chain: string) => {
      if (!isInitialized && !moralisService.isReady()) {
        setError('Moralis service not initialized');
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await moralisService.getTokenPrice(tokenAddress, chain);
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isInitialized, moralisService]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isInitialized,
    isLoading,
    error,
    clearError,
    portfolio,
    transactions,
    balance,
    multiChainBalance,
    tokens,
    getPortfolio,
    getTransactions,
    getNativeBalance,
    getTokenBalances,
    getMultiChainBalance,
    getTokenPrice,
    initialize: initializeService,
  };
}
