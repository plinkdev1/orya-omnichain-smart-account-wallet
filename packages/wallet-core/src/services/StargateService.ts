/**
 * Stargate Finance Cross-Chain Bridge Service
 * Provides cross-chain token transfer quotes and routing
 * Uses FREE REST API: https://stargate.finance/api/v1
 * No API key required
 */

import axios, { AxiosInstance } from 'axios';

export interface StargateChain {
  id: number;
  name: string;
  layerZeroId: number;
}

export interface StargatePool {
  id: number;
  chainId: number;
  name: string;
  symbol: string;
  address: string;
  decimals: number;
}

export interface TransferQuote {
  amountIn: string;
  amountOut: string;
  fee: string;
  feePercent: number;
  srcChain: string;
  dstChain: string;
  srcPoolId: number;
  dstPoolId: number;
  slippage: number;
  timeEstimate: number; // seconds
  bridgeId: number;
}

export interface PoolInfo {
  id: number;
  poolName: string;
  chainId: number;
  symbol: string;
  decimals: number;
  address: string;
  totalLiquidity: string;
}

// Supported Stargate Chains
const CHAINS: Record<string, StargateChain> = {
  ethereum: { id: 1, name: 'Ethereum', layerZeroId: 101 },
  arbitrum: { id: 42161, name: 'Arbitrum', layerZeroId: 110 },
  optimism: { id: 10, name: 'Optimism', layerZeroId: 111 },
  avalanche: { id: 43114, name: 'Avalanche', layerZeroId: 106 },
  polygon: { id: 137, name: 'Polygon', layerZeroId: 109 },
  bsc: { id: 56, name: 'BNB Chain', layerZeroId: 102 },
};

// Pool IDs for common tokens (Stargate V2)
const POOLS: Record<string, Record<string, number>> = {
  USDC: {
    ethereum: 1,
    arbitrum: 1,
    optimism: 1,
    avalanche: 1,
    polygon: 1,
    bsc: 1,
  },
  USDT: {
    ethereum: 2,
    arbitrum: 2,
    optimism: 2,
    avalanche: 2,
    polygon: 2,
    bsc: 2,
  },
};

export class StargateService {
  private client: AxiosInstance;
  private endpoint: string;
  private cache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();

  constructor(endpoint: string = 'https://stargate.finance/api/v1') {
    this.endpoint = endpoint;
    this.client = axios.create({
      baseURL: endpoint,
      timeout: 10000,
    });
  }

  /**
   * Get transfer quote for cross-chain token swap
   * No API key needed - uses FREE Stargate V2 REST API
   */
  async getTransferQuote(
    srcChain: string,
    dstChain: string,
    tokenSymbol: string,
    amountIn: string,
    slippagePercent: number = 0.1
  ): Promise<TransferQuote | null> {
    try {
      const srcChainId = CHAINS[srcChain]?.layerZeroId;
      const dstChainId = CHAINS[dstChain]?.layerZeroId;
      const poolId = POOLS[tokenSymbol]?.[srcChain];

      if (!srcChainId || !dstChainId || poolId === undefined) {
        console.warn(
          `Invalid parameters: ${srcChain}->${dstChain}, ${tokenSymbol}`
        );
        return null;
      }

      // Check cache
      const cacheKey = `quote_${srcChain}_${dstChain}_${tokenSymbol}_${amountIn}`;
      const cached = this.getCached(cacheKey);
      if (cached) {
        return cached;
      }

      // Fetch quote from Stargate API
      const response = await this.client.get('/router/quote', {
        params: {
          srcChainId,
          dstChainId,
          srcPoolId: poolId,
          dstPoolId: POOLS[tokenSymbol]?.[dstChain] || poolId,
          amount: amountIn,
          slippage: (slippagePercent * 100).toString(), // Convert to basis points
        },
      });

      const quote = this.parseQuoteResponse(
        response.data,
        srcChain,
        dstChain,
        tokenSymbol
      );

      if (quote) {
        this.setCached(cacheKey, quote, 30000); // 30 second cache
      }

      return quote;
    } catch (error) {
      console.error('Failed to get transfer quote:', error);
      return null;
    }
  }

  /**
   * Get multiple transfer quotes
   */
  async getMultipleQuotes(
    srcChain: string,
    dstChain: string,
    tokens: Array<{ symbol: string; amount: string }>
  ): Promise<TransferQuote[]> {
    const quotes = await Promise.all(
      tokens.map((token) =>
        this.getTransferQuote(srcChain, dstChain, token.symbol, token.amount)
      )
    );

    return quotes.filter((q) => q !== null) as TransferQuote[];
  }

  /**
   * Get available pools for a chain
   */
  async getPoolsForChain(chainName: string): Promise<PoolInfo[]> {
    try {
      const chainId = CHAINS[chainName]?.id;
      if (!chainId) {
        console.warn(`Unknown chain: ${chainName}`);
        return [];
      }

      const cacheKey = `pools_${chainName}`;
      const cached = this.getCached(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await this.client.get(`/pools`, {
        params: { chainId },
      });

      const pools = response.data.pools.map((p: any) => ({
        id: p.id,
        poolName: p.poolName,
        chainId: p.chainId,
        symbol: p.symbol,
        decimals: p.decimals,
        address: p.address,
        totalLiquidity: p.totalLiquidity,
      }));

      this.setCached(cacheKey, pools, 300000); // 5 minute cache

      return pools;
    } catch (error) {
      console.error('Failed to get pools:', error);
      return [];
    }
  }

  /**
   * Calculate minimum amount received (after slippage)
   */
  calculateMinAmount(amountOut: string, slippagePercent: number): string {
    try {
      const amount = BigInt(amountOut);
      const slippage = BigInt(Math.floor(slippagePercent * 100));
      const deduction = (amount * slippage) / BigInt(10000);
      return (amount - deduction).toString();
    } catch (error) {
      console.error('Failed to calculate min amount:', error);
      return amountOut;
    }
  }

  /**
   * Estimate gas fee for cross-chain transfer
   */
  async estimateGasFee(
    srcChain: string,
    dstChain: string,
    amountIn: string
  ): Promise<{ nativeGasFee: string; usdValue: string } | null> {
    try {
      const srcChainId = CHAINS[srcChain]?.layerZeroId;
      const dstChainId = CHAINS[dstChain]?.layerZeroId;

      if (!srcChainId || !dstChainId) {
        return null;
      }

      const response = await this.client.get('/router/gasPrice', {
        params: {
          srcChainId,
          dstChainId,
        },
      });

      return {
        nativeGasFee: response.data.gasFee,
        usdValue: response.data.gasFeeUsd,
      };
    } catch (error) {
      console.error('Failed to estimate gas fee:', error);
      return null;
    }
  }

  /**
   * Parse quote response from API
   */
  private parseQuoteResponse(
    data: any,
    srcChain: string,
    dstChain: string,
    token: string
  ): TransferQuote | null {
    try {
      const quote: TransferQuote = {
        amountIn: data.amountIn,
        amountOut: data.amountOut,
        fee: data.fee,
        feePercent: data.feePercent || 0,
        srcChain,
        dstChain,
        srcPoolId: data.srcPoolId,
        dstPoolId: data.dstPoolId,
        slippage: data.slippage || 0.1,
        timeEstimate: data.timeEstimate || 300, // Default 5 minutes
        bridgeId: 1,
      };

      return quote;
    } catch (error) {
      console.error('Failed to parse quote response:', error);
      return null;
    }
  }

  /**
   * Get supported chains
   */
  getSupportedChains(): string[] {
    return Object.keys(CHAINS);
  }

  /**
   * Get supported tokens
   */
  getSupportedTokens(): string[] {
    return Object.keys(POOLS);
  }

  /**
   * Check if pair is supported
   */
  isPairSupported(srcChain: string, dstChain: string, token: string): boolean {
    return (
      srcChain in CHAINS &&
      dstChain in CHAINS &&
      POOLS[token]?.[srcChain] !== undefined &&
      POOLS[token]?.[dstChain] !== undefined
    );
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('Stargate health check failed:', error);
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
}

// Singleton instance
let stargateService: StargateService | null = null;

/**
 * Get or create Stargate Service
 */
export function getStargateService(endpoint?: string): StargateService {
  if (!stargateService) {
    stargateService = new StargateService(endpoint);
  }
  return stargateService;
}