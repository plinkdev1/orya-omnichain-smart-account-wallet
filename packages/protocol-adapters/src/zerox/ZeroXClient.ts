import axios, { AxiosInstance } from 'axios';
import type {
  ZeroXSwapQuoteParams,
  ZeroXSwapQuote,
  ZeroXPriceParams,
  ZeroXPriceResponse,
  ZeroXChain,
} from './ZeroXTypes';
import { ZEROX_SUPPORTED_CHAINS } from './ZeroXTypes';

export class ZeroXClient {
  private client: AxiosInstance;
  private apiKey: string;
  private chainId: ZeroXChain;

  constructor(chainId: ZeroXChain, apiKey: string) {
    this.chainId = chainId;
    this.apiKey = apiKey;

    const baseURL = ZEROX_SUPPORTED_CHAINS[chainId];
    if (!baseURL) {
      throw new Error(`Chain ${chainId} not supported by 0x Protocol`);
    }

    this.client = axios.create({
      baseURL,
      headers: {
        '0x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async getSwapQuote(params: ZeroXSwapQuoteParams): Promise<ZeroXSwapQuote> {
    try {
      const response = await this.client.get('/swap/v1/quote', {
        params: this.formatParams(params as unknown as Record<string, unknown>),
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('[ZeroXClient] Swap quote error:', error.response?.data);
        throw new Error(
          `0x API error: ${error.response?.data?.reason || error.message}`
        );
      }
      throw error;
    }
  }

  async getPrice(params: ZeroXPriceParams): Promise<ZeroXPriceResponse> {
    try {
      const response = await this.client.get('/swap/v1/price', {
        params: this.formatParams(params as unknown as Record<string, unknown>),
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('[ZeroXClient] Price error:', error.response?.data);
        throw new Error(
          `0x API error: ${error.response?.data?.reason || error.message}`
        );
      }
      throw error;
    }
  }

  async getSupportedTokens(): Promise<any[]> {
    try {
      const response = await this.client.get('/swap/v1/tokens');
      return response.data.records || [];
    } catch (error) {
      console.error('[ZeroXClient] Failed to fetch tokens:', error);
      return [];
    }
  }

  private formatParams(params: Record<string, unknown>): Record<string, string> {
    const formatted: Record<string, string> = {};

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formatted[key] = String(value);
      }
    });

    return formatted;
  }

  static isChainSupported(chainId: string): chainId is ZeroXChain {
    return chainId in ZEROX_SUPPORTED_CHAINS;
  }
}
