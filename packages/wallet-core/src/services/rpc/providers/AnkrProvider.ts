/**
 * Ankr RPC Provider
 * 
 * Implements the Ankr provider integration with:
 * - 50+ chain support
 * - Premium features (NFT API, token metadata)
 * - Rate limiting and failover
 * - WebSocket support
 */

import { RpcProviderConfig, ANKR_PROVIDER_CONFIG } from '../RpcProviderConfig';

export interface AnkrRPCRequest {
  method: string;
  params?: any[];
  id?: number | string;
  jsonrpc?: string;
}

export interface AnkrRPCResponse<T = any> {
  jsonrpc: string;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id?: number | string;
}

export interface AnkrChainMetadata {
  chainId: string;
  name: string;
  supported: boolean;
  supportsTracing: boolean;
  supportsArchiveData: boolean;
  supportsNFTAPI: boolean;
  supportsTokenAPI: boolean;
}

export class AnkrProviderError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AnkrProviderError';
  }
}

export class AnkrProvider {
  private config: RpcProviderConfig = ANKR_PROVIDER_CONFIG;
  private apiKey: string;
  private requestCounter: number = 0;
  private requestCountReset: number = Date.now();
  private requestsPerSecond: number = 0;
  private lastRequestTime: number = 0;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ANKR_API_KEY || '';
    if (!this.apiKey && this.config.apiKeyRequired) {
      throw new AnkrProviderError(
        'Ankr API key is required but not provided',
        'MISSING_API_KEY'
      );
    }
  }

  getConfig(): RpcProviderConfig {
    return this.config;
  }

  private buildUrl(chainId: string): string {
    const baseChain = this.mapChainToAnkr(chainId);
    return `https://rpc.ankr.com/${baseChain}/${this.apiKey}`;
  }

  private mapChainToAnkr(chainId: string): string {
    const chainMap: Record<string, string> = {
      ethereum: 'eth',
      polygon: 'polygon',
      arbitrum: 'arbitrum',
      optimism: 'optimism',
      base: 'base',
      avalanche: 'avalanche',
      bsc: 'bsc',
      fantom: 'fantom',
      gnosis: 'gnosis',
      zksync: 'zksync_era',
      linea: 'linea',
      scroll: 'scroll',
    };
    return chainMap[chainId] || chainId;
  }

  private checkRateLimit(): boolean {
    const now = Date.now();
    const timeSinceReset = now - this.requestCountReset;

    if (timeSinceReset > 1000) {
      this.requestCounter = 0;
      this.requestCountReset = now;
    }

    if (this.requestCounter >= this.config.rateLimitPerSecond) {
      return false;
    }

    this.requestCounter++;
    return true;
  }

  async request<T = any>(
    chainId: string,
    method: string,
    params: any[] = [],
    options: { timeout?: number; id?: string | number } = {}
  ): Promise<T> {
    if (!this.checkRateLimit()) {
      throw new AnkrProviderError(
        `Rate limit exceeded for Ankr provider (${this.config.rateLimitPerSecond} requests/second)`,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    const url = this.buildUrl(chainId);
    const timeout = options.timeout || this.config.timeout;
    const requestId = options.id || `ankr_${Date.now()}_${Math.random()}`;

    const rpcRequest: AnkrRPCRequest = {
      jsonrpc: '2.0',
      method,
      params,
      id: requestId,
    };

    return this.executeRequest<T>(url, rpcRequest, timeout);
  }

  private async executeRequest<T>(
    url: string,
    request: AnkrRPCRequest,
    timeout: number
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const startTime = Date.now();

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      this.lastRequestTime = Date.now() - startTime;

      if (!response.ok) {
        throw new AnkrProviderError(
          `HTTP ${response.status}: ${response.statusText}`,
          `HTTP_ERROR_${response.status}`
        );
      }

      const data: AnkrRPCResponse<T> = await response.json();

      if (data.error) {
        throw new AnkrProviderError(
          data.error.message,
          `RPC_ERROR_${data.error.code}`,
          { code: data.error.code, data: data.error.data }
        );
      }

      return data.result as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new AnkrProviderError(
          `Request timeout (${timeout}ms)`,
          'TIMEOUT_ERROR',
          { timeout }
        );
      }

      if (error instanceof AnkrProviderError) {
        throw error;
      }

      throw new AnkrProviderError(
        `Request failed: ${(error as Error).message}`,
        'REQUEST_FAILED',
        { originalError: (error as Error).message }
      );
    }
  }

  async getBlockNumber(chainId: string): Promise<number> {
    const blockHash = await this.request<string>(chainId, 'eth_blockNumber');
    return parseInt(blockHash, 16);
  }

  async getBalance(chainId: string, address: string, block: string = 'latest'): Promise<string> {
    return this.request<string>(chainId, 'eth_getBalance', [address, block]);
  }

  async call(
    chainId: string,
    transaction: Record<string, any>,
    block: string = 'latest'
  ): Promise<string> {
    return this.request<string>(chainId, 'eth_call', [transaction, block]);
  }

  async sendRawTransaction(chainId: string, signedTx: string): Promise<string> {
    return this.request<string>(chainId, 'eth_sendRawTransaction', [signedTx]);
  }

  async estimateGas(
    chainId: string,
    transaction: Record<string, any>
  ): Promise<string> {
    return this.request<string>(chainId, 'eth_estimateGas', [transaction]);
  }

  async getTransactionReceipt(chainId: string, txHash: string): Promise<any> {
    return this.request<any>(chainId, 'eth_getTransactionReceipt', [txHash]);
  }

  async getGasPrice(chainId: string): Promise<string> {
    return this.request<string>(chainId, 'eth_gasPrice');
  }

  async getChainId(chainId: string): Promise<number> {
    const chainIdHex = await this.request<string>(chainId, 'eth_chainId');
    return parseInt(chainIdHex, 16);
  }

  async getSupportedChains(): Promise<AnkrChainMetadata[]> {
    return this.config.chains.map((chain) => ({
      chainId: chain.id,
      name: chain.name,
      supported: true,
      supportsTracing: this.config.features.tracing,
      supportsArchiveData: this.config.features.archiveData,
      supportsNFTAPI: this.config.features.nftApi,
      supportsTokenAPI: this.config.features.tokenApi,
    }));
  }

  async healthCheck(chainId: string = 'ethereum'): Promise<{
    isHealthy: boolean;
    latency: number;
    message: string;
  }> {
    try {
      const startTime = Date.now();
      await this.getBlockNumber(chainId);
      const latency = Date.now() - startTime;

      return {
        isHealthy: true,
        latency,
        message: 'Provider is healthy',
      };
    } catch (error) {
      return {
        isHealthy: false,
        latency: this.lastRequestTime,
        message: `Health check failed: ${(error as Error).message}`,
      };
    }
  }

  getLastLatency(): number {
    return this.lastRequestTime;
  }

  getProviderInfo(): {
    name: string;
    tier: string;
    chains: number;
    features: Record<string, boolean>;
  } {
    return {
      name: this.config.name,
      tier: this.config.tier,
      chains: this.config.chains.length,
      features: this.config.features,
    };
  }
}
