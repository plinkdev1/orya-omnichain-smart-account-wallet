/**
 * Wormhole Bridge Service
 * Cross-chain messaging protocol for token transfers across multiple blockchains
 * Enables trustless, automated cross-chain transfers
 * Uses Wormhole Network infrastructure
 * REST API: https://api.wormholescan.io
 * No API key required for public endpoints
 */

import axios, { AxiosInstance } from 'axios';

export interface WormholeChain {
  chainId: number;
  name: string;
  key: string;
  rpc?: string;
  explorer?: string;
}

export interface WrappedToken {
  address: string;
  chainId: number;
  nativeChainId: number;
  nativeAddress: string;
  symbol: string;
  decimals: number;
  coingeckoId?: string;
}

export interface BridgeTransfer {
  id: string;
  sourceChain: number;
  targetChain: number;
  sourceAddress: string;
  targetAddress: string;
  tokenAddress: string;
  amount: string;
  nonce: number;
  emitterAddress: string;
  sequence: string;
  status: 'pending' | 'confirmed' | 'completed' | 'failed';
  vaaHash?: string;
}

export interface WormholeTransferQuote {
  sourceChain: number;
  targetChain: number;
  tokenAddress: string;
  amount: string;
  estimatedDeliveryTime: number;
  relayerFee?: string;
  gasCost?: string;
  swapPath?: string[];
}

export interface AttestedToken {
  address: string;
  chainId: number;
  nativeChain: number;
  symbol: string;
  decimals: number;
  logoUrl?: string;
}

export interface ChainInfo {
  chainId: number;
  name: string;
  key: string;
  rpc: string;
  explorer: string;
  nativeTokenSymbol: string;
  nativeTokenDecimals: number;
}

const WORMHOLE_API = 'https://api.wormholescan.io';
const WORMHOLE_RPC = 'https://wormhole-v2-mainnet-api.herokuapp.com';

// Wormhole chain IDs
const WORMHOLE_CHAINS: Record<number | string, WormholeChain> = {
  1: { chainId: 1, name: 'Solana', key: 'solana', rpc: 'https://api.mainnet-beta.solana.com' },
  2: { chainId: 2, name: 'Ethereum', key: 'ethereum', rpc: 'https://eth.publicnode.com' },
  3: { chainId: 3, name: 'Terra', key: 'terra', rpc: 'https://columbus-lcd.allthatnode.com' },
  4: { chainId: 4, name: 'BSC', key: 'bsc', rpc: 'https://bsc-dataseed1.binance.org' },
  5: { chainId: 5, name: 'Polygon', key: 'polygon', rpc: 'https://polygon-rpc.com' },
  6: { chainId: 6, name: 'Avalanche', key: 'avalanche', rpc: 'https://api.avax.network/ext/bc/C/rpc' },
  7: { chainId: 7, name: 'Oasis', key: 'oasis', rpc: 'https://emerald.oasis.dev' },
  8: { chainId: 8, name: 'Algorand', key: 'algorand', rpc: 'https://mainnet-api.algonode.cloud' },
  9: { chainId: 9, name: 'Aurora', key: 'aurora', rpc: 'https://mainnet.aurora.dev' },
  10: { chainId: 10, name: 'Fantom', key: 'fantom', rpc: 'https://rpc.ftm.tools' },
  11: { chainId: 11, name: 'Karura', key: 'karura', rpc: 'https://eth-rpc-karura.aca-api.network' },
  12: { chainId: 12, name: 'Acala', key: 'acala', rpc: 'https://eth-rpc-acala.aca-api.network' },
  13: { chainId: 13, name: 'Klaytn', key: 'klaytn', rpc: 'https://public-node-api.klaytnapi.com/v1/cypress' },
  14: { chainId: 14, name: 'Celo', key: 'celo', rpc: 'https://forno.celo.org' },
  15: { chainId: 15, name: 'Near', key: 'near', rpc: 'https://rpc.mainnet.near.org' },
  16: { chainId: 16, name: 'Moonbeam', key: 'moonbeam', rpc: 'https://rpc.api.moonbeam.network' },
  17: { chainId: 17, name: 'Neon', key: 'neon', rpc: 'https://neon-proxy-mainnet.solflare.com/solana' },
  18: { chainId: 18, name: 'Terra2', key: 'terra2', rpc: 'https://lcd.terra.dev' },
  19: { chainId: 19, name: 'Arbitrum', key: 'arbitrum', rpc: 'https://arb1.arbitrum.io/rpc' },
  20: { chainId: 20, name: 'Optimism', key: 'optimism', rpc: 'https://mainnet.optimism.io' },
  21: { chainId: 21, name: 'Gnosis', key: 'gnosis', rpc: 'https://rpc.gnosischain.com' },
  22: { chainId: 22, name: 'Sui', key: 'sui', rpc: 'https://rpc.mainnet.sui.io' },
};

export class WormholeBridgeService {
  private client: AxiosInstance;
  private endpoint: string;
  private cache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private transfers: Map<string, BridgeTransfer> = new Map();

  constructor(endpoint: string = WORMHOLE_API) {
    this.endpoint = endpoint;
    this.client = axios.create({
      baseURL: endpoint,
      timeout: 15000,
    });
  }

  /**
   * Get supported Wormhole chains
   */
  async getSupportedChains(): Promise<WormholeChain[]> {
    try {
      const cacheKey = 'wormhole_chains';
      const cached = this.getCached(cacheKey);
      if (cached) {
        return cached;
      }

      const chains = Object.values(WORMHOLE_CHAINS).filter(
        (c): c is WormholeChain => typeof c === 'object' && 'chainId' in c
      );

      this.setCached(cacheKey, chains, 3600000); // 1 hour cache

      return chains;
    } catch (error) {
      console.error('Failed to get supported chains:', error);
      return [];
    }
  }

  /**
   * Get chain information
   */
  async getChainInfo(chainId: number): Promise<WormholeChain | null> {
    try {
      const chain = WORMHOLE_CHAINS[chainId];
      if (chain && typeof chain === 'object' && 'chainId' in chain) {
        return chain as WormholeChain;
      }
      return null;
    } catch (error) {
      console.error(`Failed to get chain info for ${chainId}:`, error);
      return null;
    }
  }

  /**
   * Get wrapped token information
   */
  async getWrappedToken(
    tokenAddress: string,
    chainId: number
  ): Promise<WrappedToken | null> {
    try {
      const cacheKey = `wrapped_token_${chainId}_${tokenAddress}`;
      const cached = this.getCached(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await this.client.get(`/api/v1/wrapped-tokens`, {
        params: {
          chainId,
          tokenAddress,
        },
      });

      const token = response.data.wrappedTokens?.[0] || null;

      if (token) {
        this.setCached(cacheKey, token, 3600000); // 1 hour cache
      }

      return token;
    } catch (error) {
      console.error('Failed to get wrapped token:', error);
      return null;
    }
  }

  /**
   * Get all wrapped versions of a token
   */
  async getTokenWrappedVersions(
    nativeTokenAddress: string,
    nativeChainId: number
  ): Promise<WrappedToken[]> {
    try {
      const cacheKey = `wrapped_versions_${nativeChainId}_${nativeTokenAddress}`;
      const cached = this.getCached(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await this.client.get(`/api/v1/wrapped-tokens`, {
        params: {
          nativeTokenAddress,
          nativeChainId,
        },
      });

      const tokens = response.data.wrappedTokens || [];

      this.setCached(cacheKey, tokens, 3600000); // 1 hour cache

      return tokens;
    } catch (error) {
      console.error('Failed to get wrapped versions:', error);
      return [];
    }
  }

  /**
   * Get attest token (wrap native token on another chain)
   */
  async attestToken(
    tokenAddress: string,
    sourceChainId: number,
    targetChainId: number
  ): Promise<{ wrappedAddress: string; chainId: number } | null> {
    try {
      const response = await this.client.post(`/api/v1/attest`, {
        tokenAddress,
        sourceChainId,
        targetChainId,
      });

      return response.data || null;
    } catch (error) {
      console.error('Failed to attest token:', error);
      return null;
    }
  }

  /**
   * Initiate a bridge transfer
   */
  async initiateBridgeTransfer(
    sourceChainId: number,
    targetChainId: number,
    tokenAddress: string,
    amount: string,
    recipientAddress: string,
    senderAddress: string,
    nonce?: number
  ): Promise<BridgeTransfer | null> {
    try {
      const response = await this.client.post(`/api/v1/transfer`, {
        sourceChainId,
        targetChainId,
        tokenAddress,
        amount,
        recipient: recipientAddress,
        sender: senderAddress,
        nonce: nonce || Math.floor(Math.random() * 1000000),
      });

      const transfer: BridgeTransfer = {
        id: response.data.transferId || '',
        sourceChain: sourceChainId,
        targetChain: targetChainId,
        sourceAddress: senderAddress,
        targetAddress: recipientAddress,
        tokenAddress,
        amount,
        nonce: nonce || 0,
        emitterAddress: response.data.emitterAddress || '',
        sequence: response.data.sequence || '',
        status: 'pending',
        vaaHash: response.data.vaaHash,
      };

      this.transfers.set(transfer.id, transfer);

      return transfer;
    } catch (error) {
      console.error('Failed to initiate bridge transfer:', error);
      return null;
    }
  }

  /**
   * Get transfer status
   */
  async getTransferStatus(transferId: string): Promise<BridgeTransfer | null> {
    let cached = this.transfers.get(transferId);
    try {
      if (cached) {
        return cached;
      }

      const response = await this.client.get(`/api/v1/transfer/${transferId}`);

      const transfer: BridgeTransfer = {
        id: transferId,
        sourceChain: response.data.sourceChain,
        targetChain: response.data.targetChain,
        sourceAddress: response.data.sourceAddress,
        targetAddress: response.data.targetAddress,
        tokenAddress: response.data.tokenAddress,
        amount: response.data.amount,
        nonce: response.data.nonce,
        emitterAddress: response.data.emitterAddress,
        sequence: response.data.sequence,
        status: response.data.status || 'pending',
        vaaHash: response.data.vaaHash,
      };

      this.transfers.set(transferId, transfer);

      return transfer;
    } catch (error) {
      console.error('Failed to get transfer status:', error);
      return cached || null;
    }
  }

  /**
   * Get transfer quote
   */
  async getTransferQuote(
    sourceChainId: number,
    targetChainId: number,
    tokenAddress: string,
    amount: string
  ): Promise<WormholeTransferQuote | null> {
    try {
      const cacheKey = `quote_${sourceChainId}_${targetChainId}_${tokenAddress}_${amount}`;
      const cached = this.getCached(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await this.client.get(`/api/v1/quote`, {
        params: {
          sourceChainId,
          targetChainId,
          tokenAddress,
          amount,
        },
      });

      const quote: WormholeTransferQuote = {
        sourceChain: sourceChainId,
        targetChain: targetChainId,
        tokenAddress,
        amount,
        estimatedDeliveryTime: response.data.estimatedTime || 300,
        relayerFee: response.data.relayerFee,
        gasCost: response.data.gasCost,
      };

      this.setCached(cacheKey, quote, 60000); // 60 second cache

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
    sourceChainId: number,
    targetChainId: number,
    transfers: Array<{ tokenAddress: string; amount: string }>
  ): Promise<WormholeTransferQuote[]> {
    const quotes = await Promise.all(
      transfers.map((t) =>
        this.getTransferQuote(sourceChainId, targetChainId, t.tokenAddress, t.amount)
      )
    );

    return quotes.filter((q) => q !== null) as WormholeTransferQuote[];
  }

  /**
   * Check if route is supported
   */
  async isRoutesSupported(sourceChainId: number, targetChainId: number): Promise<boolean> {
    try {
      const chains = await this.getSupportedChains();
      return (
        chains.some((c) => c.chainId === sourceChainId) &&
        chains.some((c) => c.chainId === targetChainId)
      );
    } catch (error) {
      console.error('Failed to check route support:', error);
      return false;
    }
  }

  /**
   * Get VAA (Verified Action Approval) for a transfer
   */
  async getVAA(emitterAddress: string, sequence: string): Promise<string | null> {
    try {
      const cacheKey = `vaa_${emitterAddress}_${sequence}`;
      const cached = this.getCached(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await this.client.get(`/api/v1/vaa/${emitterAddress}/${sequence}`);

      const vaa = response.data.vaa || null;

      if (vaa) {
        this.setCached(cacheKey, vaa, 3600000); // 1 hour cache
      }

      return vaa;
    } catch (error) {
      console.error('Failed to get VAA:', error);
      return null;
    }
  }

  /**
   * Redeem transfer on target chain
   */
  async redeemTransfer(
    vaa: string,
    targetChainId: number,
    recipientAddress: string
  ): Promise<{ txHash: string; chainId: number } | null> {
    try {
      const response = await this.client.post(`/api/v1/redeem`, {
        vaa,
        targetChainId,
        recipient: recipientAddress,
      });

      return {
        txHash: response.data.txHash || '',
        chainId: targetChainId,
      };
    } catch (error) {
      console.error('Failed to redeem transfer:', error);
      return null;
    }
  }

  /**
   * Get pending transfers
   */
  getPendingTransfers(): BridgeTransfer[] {
    return Array.from(this.transfers.values()).filter((t) => t.status === 'pending');
  }

  /**
   * Get completed transfers
   */
  getCompletedTransfers(): BridgeTransfer[] {
    return Array.from(this.transfers.values()).filter((t) => t.status === 'completed');
  }

  /**
   * Calculate bridge fees
   */
  calculateBridgeFees(
    amount: string,
    sourceChainId: number,
    targetChainId: number
  ): { relayerFee: string; estimatedTotal: string } | null {
    try {
      // Simple fee calculation based on amount (typically 0.1-0.5%)
      const amountNum = BigInt(amount);
      const relayerFee = (amountNum * BigInt(5)) / BigInt(10000); // 0.05%

      return {
        relayerFee: relayerFee.toString(),
        estimatedTotal: (amountNum + relayerFee).toString(),
      };
    } catch (error) {
      console.error('Failed to calculate bridge fees:', error);
      return null;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/v1/health');
      return response.status === 200;
    } catch (error) {
      console.error('Wormhole health check failed:', error);
      return false;
    }
  }

  /**
   * Get current exchange rate between chains
   */
  async getExchangeRate(
    sourceChainId: number,
    targetChainId: number,
    tokenAddress: string
  ): Promise<number | null> {
    try {
      const cacheKey = `exchange_rate_${sourceChainId}_${targetChainId}_${tokenAddress}`;
      const cached = this.getCached(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await this.client.get(`/api/v1/exchange-rate`, {
        params: {
          sourceChainId,
          targetChainId,
          tokenAddress,
        },
      });

      const rate = response.data.rate || 1;

      this.setCached(cacheKey, rate, 300000); // 5 minute cache

      return rate;
    } catch (error) {
      console.error('Failed to get exchange rate:', error);
      return null;
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
    this.transfers.clear();
  }
}

let wormholeBridgeService: WormholeBridgeService | null = null;

/**
 * Get or create Wormhole Bridge Service instance
 */
export function getWormholeBridgeService(endpoint?: string): WormholeBridgeService {
  if (!wormholeBridgeService) {
    wormholeBridgeService = new WormholeBridgeService(endpoint);
  }
  return wormholeBridgeService;
}
