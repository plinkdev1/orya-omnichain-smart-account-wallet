import axios, { AxiosInstance } from 'axios';
import type {
  LiFiQuoteParams,
  LiFiRoute,
  LiFiStatus,
  ChainInfo,
  TokenInfo,
} from './LiFiTypes';
import { LIFI_API_URL } from './LiFiTypes';

export class LiFiClient {
  private client: AxiosInstance;
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;

    this.client = axios.create({
      baseURL: LIFI_API_URL,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'x-lifi-api-key': apiKey }),
      },
      timeout: 60000,
    });
  }

  async getRoutes(params: LiFiQuoteParams): Promise<LiFiRoute[]> {
    try {
      const response = await this.client.post('/advanced/routes', {
        fromChainId: params.fromChain,
        toChainId: params.toChain,
        fromTokenAddress: params.fromToken,
        toTokenAddress: params.toToken,
        fromAmount: params.fromAmount,
        fromAddress: params.fromAddress,
        options: {
          slippage: params.slippage || 0.005,
          order: params.order || 'RECOMMENDED',
          allowBridges: params.allowBridges,
          denyBridges: params.denyBridges,
          allowExchanges: params.allowExchanges,
          denyExchanges: params.denyExchanges,
        },
      });

      return response.data.routes || [];
    } catch (error) {
      console.error('[LiFiClient] getRoutes error:', error);
      throw this.handleError(error);
    }
  }

  async getBestRoute(params: LiFiQuoteParams): Promise<LiFiRoute> {
    const routes = await this.getRoutes(params);

    if (routes.length === 0) {
      throw new Error('No routes available for this swap');
    }

    return routes[0];
  }

  async getStatus(
    txHash: string,
    fromChain: string,
    toChain: string
  ): Promise<LiFiStatus> {
    try {
      const response = await this.client.get('/status', {
        params: {
          txHash,
          fromChain,
          toChain,
        },
      });

      return response.data;
    } catch (error) {
      console.error('[LiFiClient] getStatus error:', error);
      throw this.handleError(error);
    }
  }

  async getChains(): Promise<ChainInfo[]> {
    try {
      const response = await this.client.get('/chains');
      return response.data.chains || [];
    } catch (error) {
      console.error('[LiFiClient] getChains error:', error);
      return [];
    }
  }

  async getTokens(chainId: string): Promise<TokenInfo[]> {
    try {
      const response = await this.client.get('/tokens', {
        params: { chains: chainId },
      });
      return response.data.tokens[chainId] || [];
    } catch (error) {
      console.error('[LiFiClient] getTokens error:', error);
      return [];
    }
  }

  async getBridges(): Promise<any[]> {
    try {
      const response = await this.client.get('/bridges');
      return response.data.bridges || [];
    } catch (error) {
      console.error('[LiFiClient] getBridges error:', error);
      return [];
    }
  }

  async getExchanges(): Promise<any[]> {
    try {
      const response = await this.client.get('/exchanges');
      return response.data.exchanges || [];
    } catch (error) {
      console.error('[LiFiClient] getExchanges error:', error);
      return [];
    }
  }

  async getStepTransaction(step: any): Promise<any> {
    try {
      const response = await this.client.post('/advanced/stepTransaction', step);
      return response.data;
    } catch (error) {
      console.error('[LiFiClient] getStepTransaction error:', error);
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      return new Error(`LI.FI API error: ${message}`);
    }
    return error;
  }
}
