/**
 * React Hook: Price Feeds
 * Manages Pyth price data fetching and real-time updates
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getPythService, PriceData, PriceUpdate, PythPriceFeedService } from '../services/PythPriceFeedService';

export interface UsePriceFeedsReturn {
  prices: Record<string, PriceData>;
  isLoading: boolean;
  error: string | null;
  getPriceFor: (symbol: string) => PriceData | null;
  subscribe: (symbols: string[]) => void;
  unsubscribe: (symbols: string[]) => void;
  refresh: (symbols: string[]) => Promise<void>;
  supportedSymbols: string[];
}

export function usePriceFeeds(): UsePriceFeedsReturn {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pythService, setPythService] = useState<PythPriceFeedService | null>(
    null
  );
  const unsubscribersRef = useRef<(() => void)[]>([]);

  // Initialize Pyth service
  useEffect(() => {
    try {
      const service = getPythService();
      setPythService(service);

      return () => {
        // Cleanup on unmount
        unsubscribersRef.current.forEach((unsub) => unsub());
        service.disconnect();
      };
    } catch (err: any) {
      setError(err.message || 'Failed to initialize price service');
    }
  }, []);

  const getPriceFor = useCallback(
    (symbol: string) => {
      return prices[symbol] || null;
    },
    [prices]
  );

  const refresh = useCallback(
    async (symbols: string[]) => {
      if (!pythService) {
        setError('Price service not initialized');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const newPrices = await pythService.getPrices(symbols);

        setPrices((prev) => ({
          ...prev,
          ...newPrices,
        }));
      } catch (err: any) {
        setError(err.message || 'Failed to fetch prices');
      } finally {
        setIsLoading(false);
      }
    },
    [pythService]
  );

  const subscribe = useCallback(
    (symbols: string[]) => {
      if (!pythService) {
        setError('Price service not initialized');
        return;
      }

      try {
        setError(null);

        const unsubscribe = pythService.subscribeToPrice(
          symbols,
          (update: PriceUpdate) => {
            setPrices((prev) => ({
              ...prev,
              [update.symbol]: {
                symbol: update.symbol,
                price: update.price,
                confidence: 0,
                exponential: -6,
                timestamp: update.timestamp,
                priceId: '',
              },
            }));
          }
        );

        unsubscribersRef.current.push(unsubscribe);
      } catch (err: any) {
        setError(err.message || 'Failed to subscribe to prices');
      }
    },
    [pythService]
  );

  const unsubscribe = useCallback((symbols: string[]) => {
    // Unsubscribe logic - call stored unsubscribers
    unsubscribersRef.current = unsubscribersRef.current.filter((unsub) => {
      unsub();
      return false;
    });
  }, []);

  return {
    prices,
    isLoading,
    error,
    getPriceFor,
    subscribe,
    unsubscribe,
    refresh,
    supportedSymbols: pythService?.getSupportedSymbols() || [],
  };
}