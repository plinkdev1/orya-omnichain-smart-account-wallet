/**
 * Chainstack RPC Provider
 * 
 * Implements the Chainstack provider integration with:
 * - 30+ chain support
 * - Dedicated node infrastructure
 * - Archive data access
 * - Advanced querying capabilities
 */

import { RpcProviderConfig, CHAINSTACK_PROVIDER_CONFIG } from '../RpcProviderConfig';

export interface ChainstackRPCRequest {
  method: string;
  params?: any[];
  id?: number | string;
  jsonrpc?: string;
}

export interface ChainstackRPCResponse<T = any> {
  jsonrpc: string;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id?: number | string;
}

export interface ChainstackNodeMetadata {
  chainId: string;
  name: string;
  nodeType: string;
  available: boolean;
  latency?: number;
}

export class ChainstackProviderError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ChainstackProviderError';
  }
}

export class ChainstackProvider {
  private config: RpcProviderConfig = CHAINSTACK_PROVIDER_CONFIG;
  private apiKey: string;
  private projectId: string;
  private requestCounter: number = 0;
  private requestCountReset: number = Date.now();
  private lastRequestTime: number = 0;
  private nodeCache: Map<string, string> = new Map();

  constructor(apiKey?: string, projectId?: string) {
    this.apiKey = apiKey || process.env.CHAINSTACK_API_KEY || '';
    this.projectId = projectId || process.env.CHAINSTACK_PROJECT_ID || '';

    if (!this.apiKey && this.config.apiKeyRequired) {
      throw new ChainstackProviderError(
        'Chainstack API key is required but not provided',
        'MISSING_API_KEY'
      );
    }
  }

  getConfig(): RpcProviderConfig {
    return this.config;
  }

  private buildUrl(chainId: string): string {
    const cachedUrl = this.nodeCache.get(chainId);
    if (cachedUrl) {
      return cachedUrl;
    }

    const chainPath = this.mapChainToChainstack(chainId);
    const url = `https://nd.chainstack.com/${chainPath}/${this.apiKey}`;
    this.nodeCache.set(chainId, url);
    return url;
  }

  private mapChainToChainstack(chainId: string): string {
    const chainMap: Record<string, string> = {
      ethereum: 'ethereum/mainnet',
      'ethereum-sepolia': 'ethereum/sepolia',
      polygon: 'polygon/mainnet',
      'polygon-mumbai': 'polygon/mumbai',
      arbitrum: 'arbitrum-one/mainnet',
      'arbitrum-goerli': 'arbitrum-one/goerli',
      optimism: 'optimism/mainnet',
      'optimism-goerli': 'optimism/goerli',
      base: 'base/mainnet',
      'base-sepolia': 'base/sepolia',
      avalanche: 'avalanche/mainnet',
      'avalanche-fuji': 'avalanche/fuji',
      bsc: 'bsc/mainnet',
      'bsc-testnet': 'bsc/testnet',
      solana: 'solana/mainnet',
      'solana-devnet': 'solana/devnet',
      gnosis: 'gnosis/mainnet',
      linea: 'linea/mainnet',
      zksync: 'zksync-era/mainnet',
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
      throw new ChainstackProviderError(
        `Rate limit exceeded for Chainstack provider (${this.config.rateLimitPerSecond} requests/second)`,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    const url = this.buildUrl(chainId);
    const timeout = options.timeout || this.config.timeout;
    const requestId = options.id || `chainstack_${Date.now()}_${Math.random()}`;

    const rpcRequest: ChainstackRPCRequest = {
      jsonrpc: '2.0',
      method,
      params,
      id: requestId,
    };

    return this.executeRequest<T>(url, rpcRequest, timeout);
  }

  private async executeRequest<T>(
    url: string,
    request: ChainstackRPCRequest,
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
          'User-Agent': 'Chainstack-Provider/1.0',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      this.lastRequestTime = Date.now() - startTime;

      if (!response.ok) {
        throw new ChainstackProviderError(
          `HTTP ${response.status}: ${response.statusText}`,
          `HTTP_ERROR_${response.status}`
        );
      }

      const data: ChainstackRPCResponse<T> = await response.json();

      if (data.error) {
        throw new ChainstackProviderError(
          data.error.message,
          `RPC_ERROR_${data.error.code}`,
          { code: data.error.code, data: data.error.data }
        );
      }

      return data.result as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ChainstackProviderError(
          `Request timeout (${timeout}ms)`,
          'TIMEOUT_ERROR',
          { timeout }
        );
      }

      if (error instanceof ChainstackProviderError) {
        throw error;
      }

      throw new ChainstackProviderError(
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

  async getCode(chainId: string, address: string, block: string = 'latest'): Promise<string> {
    return this.request<string>(chainId, 'eth_getCode', [address, block]);
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

  async getLogs(
    chainId: string,
    filter: Record<string, any>
  ): Promise<any[]> {
    return this.request<any[]>(chainId, 'eth_getLogs', [filter]);
  }

  async getBlockByNumber(chainId: string, blockNumber: string, fullTx: boolean = false): Promise<any> {
    return this.request<any>(chainId, 'eth_getBlockByNumber', [blockNumber, fullTx]);
  }

  async getSupportedChains(): Promise<ChainstackNodeMetadata[]> {
    return this.config.chains.map((chain) => ({
      chainId: chain.id,
      name: chain.name,
      nodeType: 'Dedicated',
      available: true,
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

  clearNodeCache(): void {
    this.nodeCache.clear();
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
