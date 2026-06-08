import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  OneInchQuoteParams,
  OneInchQuoteResponse,
  OneInchSwapParams,
  OneInchSwapResponse,
  OneInchTokensResponse,
  OneInchProtocolsResponse,
  OneInchLiquiditySourcesResponse,
  OneInchApproveCallDataParams,
  OneInchApproveCallDataResponse,
  OneInchApproveSpenderResponse,
  OneInchAdapterConfig,
  OneInchChainId,
} from './OneInchTypes';
import { ONEINCH_SUPPORTED_CHAINS } from './OneInchTypes';

export class OneInchClient {
  private client: AxiosInstance;
  private config: Required<OneInchAdapterConfig>;
  private chainId: OneInchChainId;

  constructor(chainId: OneInchChainId, config: OneInchAdapterConfig = {}) {
    if (!ONEINCH_SUPPORTED_CHAINS[chainId]) {
      throw new Error(`Chain ${chainId} not supported by 1inch`);
    }

    this.chainId = chainId;
    this.config = {
      apiKey: config.apiKey || '',
      baseURL: config.baseURL || 'https://api.1inch.dev',
      timeout: config.timeout || 30000,
      referrerAddress: config.referrerAddress || '',
      fee: config.fee || 0,
      enableGasEstimation: config.enableGasEstimation ?? true,
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[1inch] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.data) {
          const apiError = error.response.data as any;
          throw new Error(
            `1inch API Error [${apiError.statusCode}]: ${apiError.description || apiError.error}`
          );
        }
        throw error;
      }
    );
  }

  async getQuote(params: OneInchQuoteParams): Promise<OneInchQuoteResponse> {
    const response = await this.client.get(`/swap/v6.0/${this.chainId}/quote`, { params });
    return response.data;
  }

  async getSwap(params: OneInchSwapParams): Promise<OneInchSwapResponse> {
    const response = await this.client.get(`/swap/v6.0/${this.chainId}/swap`, { params });
    return response.data;
  }

  async getTokens(): Promise<OneInchTokensResponse> {
    const response = await this.client.get(`/swap/v6.0/${this.chainId}/tokens`);
    return response.data;
  }

  async getLiquiditySources(): Promise<OneInchLiquiditySourcesResponse> {
    const response = await this.client.get(`/swap/v6.0/${this.chainId}/liquidity-sources`);
    return response.data;
  }

  async getProtocols(): Promise<OneInchProtocolsResponse> {
    const response = await this.client.get(`/swap/v6.0/${this.chainId}/protocols`);
    return response.data;
  }

  async getApproveSpender(): Promise<OneInchApproveSpenderResponse> {
    const response = await this.client.get(`/swap/v6.0/${this.chainId}/approve/spender`);
    return response.data;
  }

  async getApproveCallData(
    params: OneInchApproveCallDataParams
  ): Promise<OneInchApproveCallDataResponse> {
    const response = await this.client.get(`/swap/v6.0/${this.chainId}/approve/transaction`, {
      params,
    });
    return response.data;
  }

  async checkAllowance(
    tokenAddress: string,
    walletAddress: string
  ): Promise<string> {
    const response = await this.client.get(
      `/swap/v6.0/${this.chainId}/approve/allowance`,
      {
        params: {
          tokenAddress,
          walletAddress,
        },
      }
    );
    return response.data.allowance;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get(`/swap/v6.0/${this.chainId}/healthcheck`);
      return true;
    } catch {
      return false;
    }
  }
}
