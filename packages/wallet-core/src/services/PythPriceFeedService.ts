/**
 * Pyth Network Price Feed Service
 * Provides real-time price data for multiple blockchains
 * Uses FREE Hermes endpoint: https://hermes.pyth.network
 * Supports: HTTP polling + Server-Sent Events (SSE) streaming
 */

import axios, { AxiosInstance } from 'axios';

export interface PriceData {
  symbol: string;
  price: number;
  confidence: number;
  exponential: number;
  timestamp: number;
  priceId: string;
}

export interface PriceUpdate {
  symbol: string;
  price: number;
  previousPrice: number;
  change: number;
  percentChange: number;
  timestamp: number;
}

// Symbol to Price ID mappings (Pyth Network Feed IDs)
const PRICE_IDS: Record<string, string> = {
  // Crypto
  'BTC/USD': 'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  'ETH/USD': 'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  'SOL/USD': 'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  'SUI/USD': '9b9391217e3b7b635b2c0e06b6bb9e0b02adc1b8917e2e27464fe91abb3f96e1',
  'APT/USD': '15add95022ae13563fcff0dbc5b8221e59c5119ac905e10028f4e6490e4a929d',
  'AVAX/USD': '93da3352f6ba4a8d475c1e26b3cf48f5c1f1e3ef48ac37cb217767193cca7f0b',
  'MATIC/USD': 'd2c2aabeb42897e4b83e94335e6ab2a51070ac2c35f3882b5f4ae433e4f50e4e',
  
  // Stablecoins
  'USDC/USD': 'eaa020c61cc479712813461ce153894a96a6c00b21ed0fa9a6ea85c8077e4efb',
  'USDT/USD': '2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688d2d1da',
  'DAI/USD': 'b0d2e4c01e7492f0d8ecc38e8467d9b2701d9ac6eae6ae52e3a330dc3674d565',
};

export class PythPriceFeedService {
  private client: AxiosInstance;
  private endpoint: string;
  private cache: Map<string, PriceData> = new Map();
  private listeners: Map<string, Set<(update: PriceUpdate) => void>> = new Map();
  private eventSource: EventSource | null = null;

  constructor(endpoint: string = 'https://hermes.pyth.network') {
    this.endpoint = endpoint;
    this.client = axios.create({
      baseURL: endpoint,
      timeout: 10000,
    });
  }

  /**
   * Get latest price for a symbol (HTTP polling)
   * No API key required - uses FREE Hermes endpoint
   */
  async getPrice(symbol: string): Promise<PriceData | null> {
    try {
      const priceId = PRICE_IDS[symbol];
      if (!priceId) {
        console.warn(`Unknown symbol: ${symbol}`);
        return null;
      }

      // Check cache first (5 second TTL)
      const cached = this.cache.get(symbol);
      if (cached && Date.now() - cached.timestamp < 5000) {
        return cached;
      }

      // Fetch from Hermes endpoint
      const response = await this.client.get(`/api/v1/latest`, {
        params: {
          ids: priceId,
          binary: false,
        },
      });

      const priceData = this.parsePriceResponse(response.data, symbol, priceId);
      if (priceData) {
        this.cache.set(symbol, priceData);
      }

      return priceData;
    } catch (error) {
      console.error(`Failed to fetch price for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get multiple prices at once
   */
  async getPrices(symbols: string[]): Promise<Record<string, PriceData>> {
    const results: Record<string, PriceData> = {};

    const priceIds = symbols
      .filter((s) => PRICE_IDS[s])
      .map((s) => PRICE_IDS[s])
      .join(',');

    if (!priceIds) {
      return results;
    }

    try {
      const response = await this.client.get(`/api/v1/latest`, {
        params: {
          ids: priceIds,
          binary: false,
        },
      });

      symbols.forEach((symbol) => {
        const priceData = this.parsePriceResponse(
          response.data,
          symbol,
          PRICE_IDS[symbol]
        );
        if (priceData) {
          results[symbol] = priceData;
          this.cache.set(symbol, priceData);
        }
      });

      return results;
    } catch (error) {
      console.error('Failed to fetch multiple prices:', error);
      return results;
    }
  }

  /**
   * Subscribe to real-time price updates via SSE streaming
   */
  subscribeToPrice(
    symbols: string[],
    onUpdate: (update: PriceUpdate) => void
  ): () => void {
    const priceIds = symbols
      .filter((s) => PRICE_IDS[s])
      .map((s) => PRICE_IDS[s])
      .join(',');

    if (!priceIds) {
      console.warn('No valid symbols to subscribe to');
      return () => {};
    }

    // Register listener
    symbols.forEach((symbol) => {
      if (!this.listeners.has(symbol)) {
        this.listeners.set(symbol, new Set());
      }
      this.listeners.get(symbol)!.add(onUpdate);
    });

    // Connect to SSE stream
    const url = `${this.endpoint}/api/v1/stream?ids=${priceIds}&binary=false`;
    
    try {
      if (this.eventSource) {
        this.eventSource.close();
      }

      this.eventSource = new EventSource(url);

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handlePriceUpdate(data, symbols);
        } catch (error) {
          console.error('Failed to parse SSE message:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        this.eventSource?.close();
      };
    } catch (error) {
      console.error('Failed to subscribe to price stream:', error);
    }

    // Return unsubscribe function
    return () => {
      symbols.forEach((symbol) => {
        const listeners = this.listeners.get(symbol);
        if (listeners) {
          listeners.delete(onUpdate);
        }
      });

      if (this.listeners.size === 0 && this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
    };
  }

  /**
   * Handle incoming price update from SSE stream
   */
  private handlePriceUpdate(data: any, symbols: string[]): void {
    symbols.forEach((symbol) => {
      const cached = this.cache.get(symbol);
      const newPrice = this.parsePriceResponse(data, symbol, PRICE_IDS[symbol]);

      if (newPrice) {
        const previousPrice = cached?.price || newPrice.price;
        const change = newPrice.price - previousPrice;
        const percentChange = (change / previousPrice) * 100;

        const update: PriceUpdate = {
          symbol,
          price: newPrice.price,
          previousPrice,
          change,
          percentChange,
          timestamp: newPrice.timestamp,
        };

        // Notify listeners
        const listeners = this.listeners.get(symbol);
        if (listeners) {
          listeners.forEach((callback) => callback(update));
        }

        this.cache.set(symbol, newPrice);
      }
    });
  }

  /**
   * Parse price data from Hermes API response
   */
  private parsePriceResponse(
    data: any,
    symbol: string,
    priceId: string
  ): PriceData | null {
    try {
      const priceEntry = data.result?.price?.prices?.find(
        (p: any) => p.identifier === priceId
      );

      if (!priceEntry) {
        return null;
      }

      const { price, conf, expo, publish_time } = priceEntry;

      return {
        symbol,
        price: parseFloat(price),
        confidence: parseFloat(conf),
        exponential: parseInt(expo),
        timestamp: parseInt(publish_time) * 1000,
        priceId,
      };
    } catch (error) {
      console.error('Failed to parse price response:', error);
      return null;
    }
  }

  /**
   * Get historical price volatility
   */
  async getVolatility(symbol: string, days: number = 7): Promise<number | null> {
    try {
      const priceId = PRICE_IDS[symbol];
      if (!priceId) return null;

      // Note: Hermes doesn't provide historical data
      // For volatility, use external source or calculate from local cache
      console.warn('Volatility calculation not available from Hermes');
      return null;
    } catch (error) {
      console.error('Failed to get volatility:', error);
      return null;
    }
  }

  /**
   * Check health of Pyth service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('Pyth health check failed:', error);
      return false;
    }
  }

  /**
   * Add custom price ID mapping
   */
  addPriceId(symbol: string, priceId: string): void {
    PRICE_IDS[symbol] = priceId;
  }

  /**
   * Get all supported symbols
   */
  getSupportedSymbols(): string[] {
    return Object.keys(PRICE_IDS);
  }

  /**
   * Disconnect all subscriptions
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.listeners.clear();
    this.cache.clear();
  }
}

// Singleton instance
let pythService: PythPriceFeedService | null = null;

/**
 * Get or create Pyth Price Feed Service
 */
export function getPythService(
  endpoint?: string
): PythPriceFeedService {
  if (!pythService) {
    pythService = new PythPriceFeedService(endpoint);
  }
  return pythService;
}