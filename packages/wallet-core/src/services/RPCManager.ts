/**
 * RPC Manager - Multi-provider failover and health monitoring
 * 
 * Supports:
 * - Tier 1: Ankr, QuickNode, Alchemy
 * - Tier 2: Chainstack, ZAN, Infura
 * - Tier 3: Public RPCs
 * 
 * Integrated with RpcOrchestrator for advanced provider orchestration
 */

import { RpcOrchestrator } from './rpc/RpcOrchestrator';
import type { ProviderMetrics, ProviderHealth } from './rpc/RpcOrchestrator';

export interface RPCProviderConfig {
  name: string;
  url: string;
  priority: number;
  tier: 1 | 2 | 3;
  rateLimit?: number;
  timeout?: number;
  weight?: number;
}

export interface RPCHealthCheck {
  providerId: string;
  isHealthy: boolean;
  latency: number;
  lastChecked: Date;
  consecutiveFailures: number;
  errorMessage?: string;
}

export interface RPCRequest {
  method: string;
  params?: any[];
  id?: number | string;
}

export interface RPCResponse<T = any> {
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id?: number | string;
}

export class RPCError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'RPCError';
  }
}

export class RPCManager {
  private static instance: RPCManager;
  private providers: Map<string, RPCProviderConfig[]> = new Map();
  private healthStatus: Map<string, RPCHealthCheck> = new Map();
  private requestCounts: Map<string, number> = new Map();
  private lastRequestTime: Map<string, Date> = new Map();
  private rateLimitReset: Map<string, number> = new Map();
  private orchestrator: RpcOrchestrator;
  
  private readonly maxConsecutiveFailures = 3;
  private readonly healthCheckInterval = 60000;
  private readonly defaultTimeout = 30000;
  private healthCheckTimer?: NodeJS.Timer;
  private readonly logger: Console;

  private constructor() {
    this.logger = console;
    this.orchestrator = RpcOrchestrator.getInstance({
      timeout: this.defaultTimeout,
      maxConsecutiveFailures: this.maxConsecutiveFailures,
      healthCheckInterval: this.healthCheckInterval,
    });
    this.initializeProviders();
    this.startHealthChecks();
  }

  static getInstance(): RPCManager {
    if (!RPCManager.instance) {
      RPCManager.instance = new RPCManager();
    }
    return RPCManager.instance;
  }

  /**
   * Initialize RPC providers for each chain
   */
  private initializeProviders(): void {
    this.providers.set('ethereum', [
      {
        name: 'Alchemy',
        url: process.env.ALCHEMY_ETH_URL || '',
        priority: 1,
        tier: 1,
        rateLimit: 100,
        timeout: 10000,
        weight: 3,
      },
      {
        name: 'QuickNode',
        url: process.env.QUICKNODE_ETH_URL || '',
        priority: 2,
        tier: 1,
        rateLimit: 100,
        timeout: 10000,
        weight: 3,
      },
      {
        name: 'ZAN',
        url: process.env.ZAN_ETH_URL || 'https://api.zan.top/node/v1/eth/mainnet/${ZAN_API_KEY}',
        priority: 3,
        tier: 2,
        rateLimit: 50,
        timeout: 15000,
        weight: 2,
      },
      {
        name: 'Infura',
        url: process.env.INFURA_ETH_URL || '',
        priority: 4,
        tier: 2,
        rateLimit: 50,
        timeout: 15000,
        weight: 2,
      },
      {
        name: 'Ethereum Public RPC',
        url: 'https://eth.llamarpc.com',
        priority: 5,
        tier: 3,
        rateLimit: 10,
        timeout: 20000,
        weight: 1,
      },
    ]);

    this.providers.set('polygon', [
      {
        name: 'Alchemy',
        url: process.env.ALCHEMY_POLYGON_URL || '',
        priority: 1,
        tier: 1,
        rateLimit: 100,
        weight: 3,
      },
      {
        name: 'ZAN',
        url: process.env.ZAN_POLYGON_URL || 'https://api.zan.top/node/v1/polygon/mainnet/${ZAN_API_KEY}',
        priority: 2,
        tier: 2,
        rateLimit: 50,
        weight: 2,
      },
      {
        name: 'Polygon Public RPC',
        url: 'https://polygon-rpc.com',
        priority: 3,
        tier: 3,
        rateLimit: 10,
        weight: 1,
      },
    ]);

    this.providers.set('arbitrum', [
      {
        name: 'Alchemy',
        url: process.env.ALCHEMY_ARBITRUM_URL || '',
        priority: 1,
        tier: 1,
        rateLimit: 100,
        weight: 3,
      },
      {
        name: 'ZAN',
        url: process.env.ZAN_ARBITRUM_URL || 'https://api.zan.top/node/v1/arb/one/mainnet/${ZAN_API_KEY}',
        priority: 2,
        tier: 2,
        rateLimit: 50,
        weight: 2,
      },
    ]);

    this.providers.set('optimism', [
      {
        name: 'Alchemy',
        url: process.env.ALCHEMY_OPTIMISM_URL || '',
        priority: 1,
        tier: 1,
        rateLimit: 100,
        weight: 3,
      },
      {
        name: 'ZAN',
        url: process.env.ZAN_OPTIMISM_URL || 'https://api.zan.top/node/v1/opt/mainnet/${ZAN_API_KEY}',
        priority: 2,
        tier: 2,
        rateLimit: 50,
        weight: 2,
      },
    ]);

    this.providers.set('base', [
      {
        name: 'Alchemy',
        url: process.env.ALCHEMY_BASE_URL || '',
        priority: 1,
        tier: 1,
        rateLimit: 100,
        weight: 3,
      },
    ]);

    this.providers.set('bsc', [
      {
        name: 'ZAN',
        url: process.env.ZAN_BSC_URL || 'https://api.zan.top/node/v1/bsc/mainnet/${ZAN_API_KEY}',
        priority: 1,
        tier: 2,
        rateLimit: 50,
        weight: 2,
      },
      {
        name: 'BSC Public RPC',
        url: 'https://bsc-dataseed.binance.org',
        priority: 2,
        tier: 3,
        rateLimit: 10,
        weight: 1,
      },
    ]);

    this.providers.set('solana', [
      {
        name: 'Helius',
        url: process.env.HELIUS_SOLANA_URL || '',
        priority: 1,
        tier: 1,
        rateLimit: 100,
        weight: 3,
      },
      {
        name: 'Alchemy',
        url: process.env.ALCHEMY_SOLANA_URL || '',
        priority: 2,
        tier: 1,
        rateLimit: 100,
        weight: 3,
      },
      {
        name: 'Solana Public RPC',
        url: 'https://api.mainnet-beta.solana.com',
        priority: 3,
        tier: 3,
        rateLimit: 10,
        weight: 1,
      },
    ]);

    this.providers.set('sui', [
      {
        name: 'SUI Foundation',
        url: 'https://fullnode.mainnet.sui.io:443',
        priority: 1,
        tier: 1,
        rateLimit: 50,
        weight: 3,
      },
      {
        name: 'SUI NodeInfra',
        url: 'https://sui-mainnet.nodeinfra.com',
        priority: 2,
        tier: 2,
        rateLimit: 30,
        weight: 2,
      },
    ]);

    this.providers.forEach((chainProviders, chainId) => {
      chainProviders.forEach((provider) => {
        const id = this.getProviderId(chainId, provider.name);
        this.healthStatus.set(id, {
          providerId: id,
          isHealthy: true,
          latency: 0,
          lastChecked: new Date(),
          consecutiveFailures: 0,
        });
        this.requestCounts.set(id, 0);
        this.lastRequestTime.set(id, new Date(0));
        this.rateLimitReset.set(id, Date.now());
      });
    });
  }

  /**
   * Execute RPC request with automatic failover
   */
  async request<T = any>(
    chainId: string,
    request: RPCRequest,
    options: {
      timeout?: number;
      preferredProvider?: string;
      skipProviders?: string[];
    } = {}
  ): Promise<T> {
    const providers = this.getHealthyProviders(chainId, options.skipProviders);
    
    if (providers.length === 0) {
      throw new RPCError('No healthy RPC providers available', 'NO_PROVIDERS');
    }

    const sortedProviders = this.sortProviders(providers, options.preferredProvider);
    let lastError: Error | null = null;

    for (const provider of sortedProviders) {
      try {
        const providerId = this.getProviderId(chainId, provider.name);

        if (!this.canMakeRequest(providerId, provider.rateLimit)) {
          this.logger.warn(`[RPCManager] Rate limit hit for ${providerId}`);
          continue;
        }

        const result = await this.executeRequest<T>(
          provider,
          request,
          options.timeout || provider.timeout || this.defaultTimeout
        );

        this.recordSuccess(providerId);
        this.recordRequest(providerId);

        return result;
      } catch (error) {
        lastError = error as Error;
        const providerId = this.getProviderId(chainId, provider.name);
        this.logger.error(`[RPCManager] Request failed for ${providerId}:`, error);
        this.recordFailure(providerId);
        continue;
      }
    }

    throw new RPCError(
      `All RPC providers failed. Last error: ${lastError?.message}`,
      'ALL_PROVIDERS_FAILED',
      lastError || undefined
    );
  }

  /**
   * Execute single RPC request
   */
  private async executeRequest<T>(
    provider: RPCProviderConfig,
    request: RPCRequest,
    timeout: number
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout) as NodeJS.Timeout;

    try {
      const startTime = Date.now();

      const response = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          ...request,
          id: request.id || Date.now(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: RPCResponse<T> = await response.json();

      const latency = Date.now() - startTime;
      const providerId = this.getProviderId('', provider.name);
      const health = this.healthStatus.get(providerId);
      if (health) {
        health.latency = latency;
      }

      if (data.error) {
        throw new RPCError(
          data.error.message,
          `RPC_ERROR_${data.error.code}`,
          undefined,
          { code: data.error.code, data: data.error.data }
        );
      }

      return data.result as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new RPCError('Request timeout', 'TIMEOUT_ERROR');
      }

      throw error;
    }
  }

  /**
   * Get healthy providers sorted by priority and load balancing
   */
  private getHealthyProviders(
    chainId: string,
    skipProviders?: string[]
  ): RPCProviderConfig[] {
    const chainProviders = this.providers.get(chainId) || [];
    const skip = new Set(skipProviders || []);

    return chainProviders
      .filter((provider) => {
        const providerId = this.getProviderId(chainId, provider.name);
        const health = this.healthStatus.get(providerId);
        return health?.isHealthy && !skip.has(provider.name);
      })
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Sort providers by priority and load balancing weight
   */
  private sortProviders(
    providers: RPCProviderConfig[],
    preferredProvider?: string
  ): RPCProviderConfig[] {
    if (preferredProvider) {
      const preferred = providers.find((p) => p.name === preferredProvider);
      if (preferred) {
        return [preferred, ...providers.filter((p) => p.name !== preferredProvider)];
      }
    }

    return providers.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return (b.weight || 1) - (a.weight || 1);
    });
  }

  /**
   * Check if a request can be made within rate limits
   */
  private canMakeRequest(providerId: string, rateLimit?: number): boolean {
    if (!rateLimit) return true;

    const now = Date.now();
    const lastReset = this.rateLimitReset.get(providerId) || now;
    const timeSinceReset = now - lastReset;
    const windowSize = 1000;

    if (timeSinceReset > windowSize) {
      this.requestCounts.set(providerId, 0);
      this.rateLimitReset.set(providerId, now);
      return true;
    }

    const requestCount = this.requestCounts.get(providerId) || 0;
    return requestCount < rateLimit;
  }

  /**
   * Record successful request
   */
  private recordSuccess(providerId: string): void {
    const health = this.healthStatus.get(providerId);
    if (health) {
      health.consecutiveFailures = 0;
      health.isHealthy = true;
      health.lastChecked = new Date();
    }
  }

  /**
   * Record failed request
   */
  private recordFailure(providerId: string): void {
    const health = this.healthStatus.get(providerId);
    if (health) {
      health.consecutiveFailures++;
      health.lastChecked = new Date();

      if (health.consecutiveFailures >= this.maxConsecutiveFailures) {
        health.isHealthy = false;
        this.logger.error(
          `[RPCManager] Provider ${providerId} marked as unhealthy after ${health.consecutiveFailures} failures`
        );
      }
    }
  }

  /**
   * Record request count for rate limiting
   */
  private recordRequest(providerId: string): void {
    const count = this.requestCounts.get(providerId) || 0;
    this.requestCounts.set(providerId, count + 1);
    this.lastRequestTime.set(providerId, new Date());
  }

  /**
   * Start health check monitoring
   */
  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks();
    }, this.healthCheckInterval) as NodeJS.Timeout;
  }

  /**
   * Perform health checks for all providers
   */
  private async performHealthChecks(): Promise<void> {
    const chains = Array.from(this.providers.keys());

    for (const chainId of chains) {
      const providers = this.providers.get(chainId) || [];

      for (const provider of providers) {
        try {
          await this.healthCheckProvider(chainId, provider);
        } catch (error) {
          this.logger.error(`Health check failed for ${provider.name}:`, error);
        }
      }
    }
  }

  /**
   * Health check for a single provider
   */
  private async healthCheckProvider(
    chainId: string,
    provider: RPCProviderConfig
  ): Promise<void> {
    const providerId = this.getProviderId(chainId, provider.name);
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000) as NodeJS.Timeout;

      const response = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: this.getHealthCheckMethod(chainId),
          params: [],
          id: 1,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const latency = Date.now() - startTime;
      const health = this.healthStatus.get(providerId);

      if (response.ok && health) {
        health.isHealthy = true;
        health.latency = latency;
        health.consecutiveFailures = 0;
        health.lastChecked = new Date();
      }
    } catch (error) {
      const health = this.healthStatus.get(providerId);
      if (health) {
        health.isHealthy = false;
        health.errorMessage = (error as Error).message;
        health.lastChecked = new Date();
      }
    }
  }

  /**
   * Get appropriate health check method for chain
   */
  private getHealthCheckMethod(chainId: string): string {
    const healthCheckMethods: Record<string, string> = {
      ethereum: 'eth_blockNumber',
      polygon: 'eth_blockNumber',
      arbitrum: 'eth_blockNumber',
      optimism: 'eth_blockNumber',
      base: 'eth_blockNumber',
      bsc: 'eth_blockNumber',
      solana: 'getBlockHeight',
      sui: 'sui_getLatestCheckpointSequenceNumber',
    };

    return healthCheckMethods[chainId] || 'eth_blockNumber';
  }

  /**
   * Get provider ID
   */
  private getProviderId(chainId: string, providerName: string): string {
    return `${chainId}:${providerName}`;
  }

  /**
   * Get health status for a provider
   */
  getHealthStatus(chainId: string, providerName?: string): RPCHealthCheck | null {
    if (providerName) {
      const providerId = this.getProviderId(chainId, providerName);
      return this.healthStatus.get(providerId) || null;
    }

    const chainProviders = this.providers.get(chainId) || [];
    const statuses = chainProviders
      .map((p) => this.healthStatus.get(this.getProviderId(chainId, p.name)))
      .filter(Boolean) as RPCHealthCheck[];

    return statuses.length > 0 ? statuses[0] : null;
  }

  /**
   * Get all health statuses for a chain
   */
  getAllHealthStatus(chainId: string): RPCHealthCheck[] {
    const chainProviders = this.providers.get(chainId) || [];
    return chainProviders
      .map((p) => this.healthStatus.get(this.getProviderId(chainId, p.name)))
      .filter((h): h is RPCHealthCheck => h !== undefined);
  }

  /**
   * Add a custom provider
   */
  addProvider(chainId: string, config: RPCProviderConfig): void {
    const providers = this.providers.get(chainId) || [];
    providers.push(config);
    this.providers.set(chainId, providers);

    const providerId = this.getProviderId(chainId, config.name);
    this.healthStatus.set(providerId, {
      providerId,
      isHealthy: true,
      latency: 0,
      lastChecked: new Date(),
      consecutiveFailures: 0,
    });

    this.requestCounts.set(providerId, 0);
    this.lastRequestTime.set(providerId, new Date(0));
    this.rateLimitReset.set(providerId, Date.now());
  }

  /**
   * Remove a provider
   */
  removeProvider(chainId: string, providerName: string): void {
    const providers = this.providers.get(chainId) || [];
    this.providers.set(
      chainId,
      providers.filter((p) => p.name !== providerName)
    );

    const providerId = this.getProviderId(chainId, providerName);
    this.healthStatus.delete(providerId);
    this.requestCounts.delete(providerId);
    this.lastRequestTime.delete(providerId);
    this.rateLimitReset.delete(providerId);
  }

  /**
   * Get provider statistics
   */
  getProviderStats(chainId: string, providerName: string): {
    requestCount: number;
    lastRequestTime: Date;
    health: RPCHealthCheck | undefined;
  } {
    const providerId = this.getProviderId(chainId, providerName);
    return {
      requestCount: this.requestCounts.get(providerId) || 0,
      lastRequestTime: this.lastRequestTime.get(providerId) || new Date(0),
      health: this.healthStatus.get(providerId),
    };
  }

  /**
   * Reset rate limit for a provider
   */
  resetRateLimit(chainId: string, providerName: string): void {
    const providerId = this.getProviderId(chainId, providerName);
    this.requestCounts.set(providerId, 0);
    this.rateLimitReset.set(providerId, Date.now());
  }

  /**
   * Reset all rate limits
   */
  resetAllRateLimits(): void {
    const now = Date.now();
    this.requestCounts.forEach((_, key) => {
      this.requestCounts.set(key, 0);
    });
    this.rateLimitReset.forEach((_, key) => {
      this.rateLimitReset.set(key, now);
    });
  }

  /**
   * Execute request using orchestrator with intelligent provider selection
   */
  async requestWithOrchestrator<T = any>(
    chainId: string,
    method: string,
    params: any[] = [],
    feature?: string
  ): Promise<T> {
    return this.orchestrator.executeWithFallback<T>(chainId, method, params, feature);
  }

  /**
   * Select best provider using orchestrator
   */
  async selectBestProviderWithOrchestrator(
    chainId: string,
    feature?: string
  ): Promise<{ provider: any; config: any }> {
    return this.orchestrator.selectBestProvider(chainId, feature);
  }

  /**
   * Get orchestrator metrics
   */
  getOrchestratorMetrics(providerId?: string): ProviderMetrics | ProviderMetrics[] {
    return this.orchestrator.getMetrics(providerId);
  }

  /**
   * Get orchestrator health status
   */
  getOrchestratorHealthStatus(providerId?: string): ProviderHealth | ProviderHealth[] {
    return this.orchestrator.getHealthStatus(providerId);
  }

  /**
   * Mark provider unhealthy via orchestrator
   */
  markProviderUnhealthy(providerId: string, error?: Error): void {
    this.orchestrator.markProviderUnhealthy(providerId, error);
  }

  /**
   * Mark provider healthy via orchestrator
   */
  markProviderHealthy(providerId: string): void {
    this.orchestrator.markProviderHealthy(providerId);
  }

  /**
   * Get supported chains from orchestrator
   */
  getSupportedChainsFromOrchestrator(): string[] {
    return this.orchestrator.getSupportedChains();
  }

  /**
   * Get supported providers from orchestrator
   */
  getSupportedProvidersFromOrchestrator(): string[] {
    return this.orchestrator.getSupportedProviders();
  }

  /**
   * Monitor provider health using orchestrator
   */
  async monitorProviderHealthViaOrchestrator(): Promise<void> {
    return this.orchestrator.monitorProviderHealth();
  }

  /**
   * Reset orchestrator metrics
   */
  resetOrchestratorMetrics(providerId?: string): void {
    this.orchestrator.resetMetrics(providerId);
  }

  /**
   * Shutdown the RPC Manager
   */
  shutdown(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer as unknown as NodeJS.Timeout);
    }
    this.orchestrator.shutdown();
  }

  /**
   * Get supported chains
   */
  getSupportedChains(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get providers for a chain
   */
  getProviders(chainId: string): RPCProviderConfig[] {
    return this.providers.get(chainId) || [];
  }
}
