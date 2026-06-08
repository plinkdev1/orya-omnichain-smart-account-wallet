import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  SymbiosisSwapRequest,
  SymbiosisSwapResponse,
  SymbiosisTokensResponse,
  SymbiosisChainsResponse,
  SymbiosisLimitsRequest,
  SymbiosisLimitsResponse,
  SymbiosisTransactionRequest,
  SymbiosisTransactionStatus,
  SymbiosisAdapterConfig,
} from './SymbiosisTypes';

export class SymbiosisClient {
  private client: AxiosInstance;
  private config: Required<SymbiosisAdapterConfig>;

  constructor(config: SymbiosisAdapterConfig = {}) {
    this.config = {
      apiUrl: config.apiUrl || 'https://api-v2.symbiosis.finance',
      timeout: config.timeout || 30000,
      affiliateFee: config.affiliateFee || { address: '', bps: 0 },
      defaultSlippage: config.defaultSlippage || 100,
      enableGasEstimation: config.enableGasEstimation ?? true,
    };

    this.client = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[Symbiosis] ${config.method?.toUpperCase()} ${config.url}`);
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
            `Symbiosis API Error [${apiError.code}]: ${apiError.message}`
          );
        }
        throw error;
      }
    );
  }

  async getSwap(params: SymbiosisSwapRequest): Promise<SymbiosisSwapResponse> {
    const response = await this.client.post('/swap', params);
    return response.data;
  }

  async getTokens(): Promise<SymbiosisTokensResponse> {
    const response = await this.client.get('/tokens');
    return response.data;
  }

  async getChains(): Promise<SymbiosisChainsResponse> {
    const response = await this.client.get('/chains');
    return response.data;
  }

  async getLimits(params: SymbiosisLimitsRequest): Promise<SymbiosisLimitsResponse> {
    const response = await this.client.post('/limits', params);
    return response.data;
  }

  async getTransactionStatus(
    params: SymbiosisTransactionRequest
  ): Promise<SymbiosisTransactionStatus> {
    const response = await this.client.get('/transaction', {
      params: {
        transactionHash: params.transactionHash,
        chainId: params.chainId,
      },
    });
    return response.data;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/chains');
      return true;
    } catch {
      return false;
    }
  }
}
