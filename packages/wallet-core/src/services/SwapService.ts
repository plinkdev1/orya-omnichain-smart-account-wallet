/**
 * LI.FI Swap Service
 * DEX aggregator for optimal swap routing across multiple protocols
 * Provides quotes and swap execution for both single-chain and cross-chain swaps
 * Uses FREE LI.FI API: https://li.fi/
 * No API key required
 */

import axios, { AxiosInstance } from 'axios';

export interface Token {
  address: string;
  symbol: string;
  decimals: number;
  chainId: number;
  name?: string;
  logoURI?: string;
  priceUSD?: string;
}

export interface SwapChain {
  id: number;
  name: string;
  key: string;
  nativeAssetId: string;
  logoURI?: string;
}

export interface LifiSwapQuote {
  id: string;
  type: 'swap' | 'cross-chain';
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
  toAmountMin: string;
  priceImpact: number;
  slippage: number;
  estimatedTime: number;
  feeCosts: FeeCost[];
  gasCosts: GasCost[];
  route: Route[];
  containsProtocol?: string[];
}

export interface FeeCost {
  name: string;
  description?: string;
  percentage: string;
  amount: string;
  token: Token;
  included: boolean;
}

export interface GasCost {
  type: string;
  price?: string;
  estimate?: string;
  limit?: string;
  amount?: string;
  amountUSD?: string;
}

export interface Route {
  id: string;
  fromChainId: number;
  toChainId: number;
  fromTokenAddress: string;
  toTokenAddress: string;
  fromAmount: string;
  toAmount: string;
  type: string;
}

export interface SwapTransaction {
  from: string;
  to: string;
  data: string;
  value: string;
  chainId: number;
  gasLimit?: string;
  gasPrice?: string;
}

export interface SwapData {
  id: string;
  type: string;
  from: string;
  to: string;
  data: string;
  value: string;
  chainId: number;
  gasLimit?: string;
  gasPrice?: string;
}

const LIFI_API_URL = 'https://api.li.fi/v1';

const CHAIN_MAPPING: Record<string, number> = {
  ethereum: 1,
  'ethereum-mainnet': 1,
  arbitrum: 42161,
  'arbitrum-one': 42161,
  optimism: 10,
  'optimism-mainnet': 10,
  polygon: 137,
  'polygon-mainnet': 137,
  avalanche: 43114,
  'avalanche-c': 43114,
  bsc: 56,
  'binance': 56,
  sui: 999,
  solana: 1000,
};

export class SwapService {
  private client: AxiosInstance;
  private endpoint: string;
  private cache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private supportedChains: Map<number, SwapChain> = new Map();

  constructor(endpoint: string = LIFI_API_URL) {
    this.endpoint = endpoint;
    this.client = axios.create({
      baseURL: endpoint,
      timeout: 15000,
    });
  }

  /**
   * Initialize supported chains
   */
  async initializeChains(): Promise<void> {
    try {
      const chains = await this.getChains();
      chains.forEach((chain) => {
        this.supportedChains.set(chain.id, chain);
      });
    } catch (error) {
      console.error('Failed to initialize chains:', error);
    }
  }

  /**
   * Get supported chains
   */
  async getChains(): Promise<SwapChain[]> {
    try {
      const cacheKey = 'chains_list';
      const cached = this.getCached(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await this.client.get('/chains');
      const chains = response.data.chains || [];

      this.setCached(cacheKey, chains, 3600000); // 1 hour cache

      return chains;
    } catch (error) {
      console.error('Failed to get chains:', error);
      return [];
    }
  }

  /**
   * Get supported tokens for a chain
   */
  async getTokens(chainId: number): Promise<Token[]> {
    try {
      const cacheKey = `tokens_${chainId}`;
      const cached = this.getCached(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await this.client.get(`/tokens`, {
        params: { chainId },
      });

      const tokens = response.data.tokens || [];

      this.setCached(cacheKey, tokens, 1800000); // 30 minute cache

      return tokens;
    } catch (error) {
      console.error(`Failed to get tokens for chain ${chainId}:`, error);
      return [];
    }
  }

  /**
   * Get a single chain's information
   */
  async getChain(chainId: number): Promise<SwapChain | null> {
    try {
      const cacheKey = `chain_${chainId}`;
      const cached = this.getCached(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await this.client.get(`/chain`, {
        params: { chainId },
      });

      const chain = response.data.chain || null;

      if (chain) {
        this.setCached(cacheKey, chain, 3600000); // 1 hour cache
      }

      return chain;
    } catch (error) {
      console.error(`Failed to get chain info for ${chainId}:`, error);
      return null;
    }
  }

  /**
   * Get swap quote for a single-chain swap
   */
  async getSwapQuote(
    fromChainId: number,
    fromTokenAddress: string,
    toTokenAddress: string,
    fromAmount: string,
    slippagePercent: number = 0.5,
    userAddress?: string
  ): Promise<LifiSwapQuote | null> {
    try {
      const cacheKey = `quote_${fromChainId}_${fromTokenAddress}_${toTokenAddress}_${fromAmount}_${slippagePercent}`;
      const cached = this.getCached(cacheKey);
      if (cached) {
        return cached;
      }

      const params: Record<string, any> = {
        fromChain: fromChainId,
        fromToken: fromTokenAddress,
        toChain: fromChainId,
        toToken: toTokenAddress,
        fromAmount,
        slippage: slippagePercent,
      };

      if (userAddress) {
        params.userAddress = userAddress;
      }

      const response = await this.client.get('/quote', { params });

      const quote = response.data.quote || null;

      if (quote) {
        this.setCached(cacheKey, quote, 30000); // 30 second cache
      }

      return quote;
    } catch (error) {
      console.error('Failed to get swap quote:', error);
      return null;
    }
  }

  /**
   * Get cross-chain swap quote
   */
  async getCrossChainQuote(
    fromChainId: number,
    toChainId: number,
    fromTokenAddress: string,
    toTokenAddress: string,
    fromAmount: string,
    slippagePercent: number = 1.0,
    userAddress?: string
  ): Promise<LifiSwapQuote | null> {
    try {
      const cacheKey = `cross_quote_${fromChainId}_${toChainId}_${fromTokenAddress}_${toTokenAddress}_${fromAmount}`;
      const cached = this.getCached(cacheKey);
      if (cached) {
        return cached;
      }

      const params: Record<string, any> = {
        fromChain: fromChainId,
        fromToken: fromTokenAddress,
        toChain: toChainId,
        toToken: toTokenAddress,
        fromAmount,
        slippage: slippagePercent,
      };

      if (userAddress) {
        params.userAddress = userAddress;
      }

      const response = await this.client.get('/quote', { params });

      const quote = response.data.quote || null;

      if (quote) {
        this.setCached(cacheKey, quote, 60000); // 60 second cache (longer for cross-chain)
      }

      return quote;
    } catch (error) {
      console.error('Failed to get cross-chain quote:', error);
      return null;
    }
  }

  /**
   * Execute a swap transaction
   */
  async executeSwap(
    quoteId: string,
    userAddress: string,
    slippagePercent?: number
  ): Promise<SwapTransaction | null> {
    try {
      const params: Record<string, any> = {
        quoteId,
        userAddress,
      };

      if (slippagePercent !== undefined) {
        params.slippage = slippagePercent;
      }

      const response = await this.client.post('/swap', params);

      return response.data.swap || null;
    } catch (error) {
      console.error('Failed to execute swap:', error);
      return null;
    }
  }

  /**
   * Get swap status
   */
  async getSwapStatus(
    txHash: string,
    chainId: number
  ): Promise<{ status: string; fromAmount: string; toAmount: string } | null> {
    try {
      const response = await this.client.get('/status', {
        params: {
          txHash,
          chainId,
        },
      });

      return response.data || null;
    } catch (error) {
      console.error('Failed to get swap status:', error);
      return null;
    }
  }

  /**
   * Get routes for a swap
   */
  async getRoutes(
    fromChainId: number,
    toChainId: number,
    fromTokenAddress: string,
    toTokenAddress: string,
    fromAmount: string
  ): Promise<Route[] | null> {
    try {
      const cacheKey = `routes_${fromChainId}_${toChainId}_${fromTokenAddress}_${toTokenAddress}_${fromAmount}`;
      const cached = this.getCached(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await this.client.get('/routes', {
        params: {
          fromChain: fromChainId,
          toChain: toChainId,
          fromToken: fromTokenAddress,
          toToken: toTokenAddress,
          fromAmount,
        },
      });

      const routes = response.data.routes || [];

      this.setCached(cacheKey, routes, 30000); // 30 second cache

      return routes;
    } catch (error) {
      console.error('Failed to get routes:', error);
      return null;
    }
  }

  /**
   * Get best route for swap
   */
  async getBestRoute(
    fromChainId: number,
    toChainId: number,
    fromTokenAddress: string,
    toTokenAddress: string,
    fromAmount: string
  ): Promise<Route | null> {
    const routes = await this.getRoutes(
      fromChainId,
      toChainId,
      fromTokenAddress,
      toTokenAddress,
      fromAmount
    );

    if (!routes || routes.length === 0) {
      return null;
    }

    return routes[0]; // First route is typically best
  }

  /**
   * Calculate price impact
   */
  calculatePriceImpact(inputAmount: string, outputAmount: string): number {
    try {
      const input = BigInt(inputAmount);
      const output = BigInt(outputAmount);

      if (input === BigInt(0)) {
        return 0;
      }

      const impact = 100 - (Number(output * BigInt(10000)) / Number(input)) / 100;
      return Math.max(0, impact);
    } catch (error) {
      console.error('Failed to calculate price impact:', error);
      return 0;
    }
  }

  /**
   * Get available protocols
   */
  async getAvailableProtocols(): Promise<string[]> {
    try {
      const cacheKey = 'protocols_list';
      const cached = this.getCached(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await this.client.get('/protocols');
      const protocols = response.data.protocols || [];

      this.setCached(cacheKey, protocols, 3600000); // 1 hour cache

      return protocols;
    } catch (error) {
      console.error('Failed to get available protocols:', error);
      return [];
    }
  }

  /**
   * Parse chain identifier to numeric ID
   */
  parseChainId(chainIdentifier: string | number): number | null {
    if (typeof chainIdentifier === 'number') {
      return chainIdentifier;
    }

    const chainId = CHAIN_MAPPING[chainIdentifier.toLowerCase()];
    return chainId || null;
  }

  /**
   * Check if bridge is available between chains
   */
  async isBridgeAvailable(
    fromChainId: number,
    toChainId: number,
    tokenAddress: string
  ): Promise<boolean> {
    try {
      const routes = await this.getRoutes(
        fromChainId,
        toChainId,
        tokenAddress,
        tokenAddress,
        '1000000000000000000'
      );

      return routes !== null && routes.length > 0;
    } catch (error) {
      console.error('Failed to check bridge availability:', error);
      return false;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/chains');
      return response.status === 200 && (response.data.chains?.length ?? 0) > 0;
    } catch (error) {
      console.error('LI.FI health check failed:', error);
      return false;
    }
  }

  /**
   * Cache helpers
   */
  private setCached(key: string, value: any, ttl: number): void {
    this.cache.set(key, value);
    this.cacheExpiry.set(key, Date.now() + ttl);
  }

  private getCached(key: string): any | null {
    const expiry = this.cacheExpiry.get(key);
    if (expiry && Date.now() < expiry) {
      return this.cache.get(key);
    }
    this.cache.delete(key);
    this.cacheExpiry.delete(key);
    return null;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Disconnect service
   */
  disconnect(): void {
    this.clearCache();
    this.supportedChains.clear();
  }
}

let swapService: SwapService | null = null;

/**
 * Get or create Swap Service instance
 */
export function getSwapService(endpoint?: string): SwapService {
  if (!swapService) {
    swapService = new SwapService(endpoint);
  }
  return swapService;
}
