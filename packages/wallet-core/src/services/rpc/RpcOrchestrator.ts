/**
 * RPC Provider Orchestrator
 * 
 * Intelligent provider selection and failover orchestration with:
 * - Primary → Fallback logic (Tier 1 → Tier 2 → Tier 3)
 * - Health monitoring and dynamic failover
 * - Metrics tracking and analytics
 * - Smart provider selection based on features and availability
 */

import { RpcProviderConfig, ProviderRegistry, DEFAULT_PROVIDER_TIERS, PROVIDER_REGISTRY } from './RpcProviderConfig';
import { AnkrProvider } from './providers/AnkrProvider';
import { ChainstackProvider } from './providers/ChainstackProvider';

export interface ProviderMetrics {
  providerId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalLatency: number;
  averageLatency: number;
  successRate: number;
  isHealthy: boolean;
  lastChecked: Date;
  consecutiveFailures: number;
}

export interface ProviderHealth {
  providerId: string;
  isHealthy: boolean;
  latency: number;
  lastChecked: Date;
  consecutiveFailures: number;
  errorMessage?: string;
}

export interface OrchestratorOptions {
  timeout?: number;
  maxConsecutiveFailures?: number;
  healthCheckInterval?: number;
  preferredProviders?: string[];
}

export class RpcOrchestratorError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'RpcOrchestratorError';
  }
}

export class RpcOrchestrator {
  private static instance: RpcOrchestrator;
  private providerRegistry: ProviderRegistry = PROVIDER_REGISTRY;
  private ankrProvider?: AnkrProvider;
  private chainstackProvider?: ChainstackProvider;
  private metrics: Map<string, ProviderMetrics> = new Map();
  private healthStatus: Map<string, ProviderHealth> = new Map();
  private options: Required<OrchestratorOptions>;
  private healthCheckTimer?: ReturnType<typeof setInterval>;
  private logger = console;

  private constructor(options: OrchestratorOptions = {}) {
    this.options = {
      timeout: options.timeout || 30000,
      maxConsecutiveFailures: options.maxConsecutiveFailures || 3,
      healthCheckInterval: options.healthCheckInterval || 60000,
      preferredProviders: options.preferredProviders || [],
    };
    this.logger = console;
    this.initializeProviders();
    this.startHealthChecks();
  }

  static getInstance(options?: OrchestratorOptions): RpcOrchestrator {
    if (!RpcOrchestrator.instance) {
      RpcOrchestrator.instance = new RpcOrchestrator(options);
    }
    return RpcOrchestrator.instance;
  }

  private initializeProviders(): void {
    try {
      this.ankrProvider = new AnkrProvider();
    } catch (error) {
      this.logger.warn(`[RpcOrchestrator] Failed to initialize Ankr provider:`, error);
    }

    try {
      this.chainstackProvider = new ChainstackProvider();
    } catch (error) {
      this.logger.warn(`[RpcOrchestrator] Failed to initialize Chainstack provider:`, error);
    }

    for (const providerId of Object.keys(this.providerRegistry)) {
      const config = this.providerRegistry[providerId];
      this.metrics.set(providerId, {
        providerId,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalLatency: 0,
        averageLatency: 0,
        successRate: 0,
        isHealthy: true,
        lastChecked: new Date(),
        consecutiveFailures: 0,
      });

      this.healthStatus.set(providerId, {
        providerId,
        isHealthy: true,
        latency: 0,
        lastChecked: new Date(),
        consecutiveFailures: 0,
      });
    }
  }

  async selectBestProvider(
    chain: string,
    feature?: string
  ): Promise<{ provider: any; config: RpcProviderConfig }> {
    const healthyProviders = this.getHealthyProviders(chain, feature);

    if (healthyProviders.length === 0) {
      throw new RpcOrchestratorError(
        `No healthy RPC providers available for chain ${chain}`,
        'NO_HEALTHY_PROVIDERS'
      );
    }

    const sortedProviders = this.sortProvidersByPerformance(healthyProviders);
    const selectedProviderId = sortedProviders[0];
    const config = this.providerRegistry[selectedProviderId];

    const provider = this.getProviderInstance(selectedProviderId);
    return { provider, config };
  }

  async executeWithFallback<T>(
    chain: string,
    method: string,
    params: any[] = [],
    feature?: string
  ): Promise<T> {
    const providersList = this.getProvidersByTier(chain, feature);

    if (providersList.length === 0) {
      throw new RpcOrchestratorError(
        `No RPC providers available for chain ${chain}`,
        'NO_PROVIDERS'
      );
    }

    let lastError: Error | null = null;

    for (const tierProviders of providersList) {
      for (const providerId of tierProviders) {
        const health = this.healthStatus.get(providerId);
        if (!health || !health.isHealthy) {
          continue;
        }

        try {
          const provider = this.getProviderInstance(providerId);
          const startTime = Date.now();

          let result: T;
          if (providerId === 'ankr' && this.ankrProvider) {
            result = await this.ankrProvider.request<T>(chain, method, params, {
              timeout: this.options.timeout,
            });
          } else if (providerId === 'chainstack' && this.chainstackProvider) {
            result = await this.chainstackProvider.request<T>(chain, method, params, {
              timeout: this.options.timeout,
            });
          } else {
            throw new RpcOrchestratorError(
              `Provider ${providerId} not available`,
              'PROVIDER_NOT_AVAILABLE'
            );
          }

          const latency = Date.now() - startTime;
          this.recordSuccess(providerId, latency);

          return result;
        } catch (error) {
          lastError = error as Error;
          this.recordFailure(providerId);
          this.logger.warn(
            `[RpcOrchestrator] Request failed for ${providerId}:`,
            (error as Error).message
          );
          continue;
        }
      }
    }

    throw new RpcOrchestratorError(
      `All RPC providers failed. Last error: ${lastError?.message}`,
      'ALL_PROVIDERS_FAILED',
      { lastError: lastError?.message }
    );
  }

  private getProvidersByTier(chain: string, feature?: string): string[][] {
    const allProviders = Object.keys(this.providerRegistry);
    const filteredProviders = allProviders.filter((providerId) => {
      const config = this.providerRegistry[providerId];
      const hasChain = config.chains.some((c) => c.id === chain);

      if (!hasChain) return false;

      if (feature) {
        return (config.features as Record<string, boolean>)[feature] === true;
      }

      return true;
    });

    const tierGroups: string[][] = [];
    for (const tier of ['tier1', 'tier2', 'tier3'] as const) {
      const tierProviders = DEFAULT_PROVIDER_TIERS[tier]
        .filter((p) => filteredProviders.includes(p))
        .sort((a, b) => {
          const configA = this.providerRegistry[a];
          const configB = this.providerRegistry[b];
          return configB.weight - configA.weight;
        });

      if (tierProviders.length > 0) {
        tierGroups.push(tierProviders);
      }
    }

    return tierGroups;
  }

  private getHealthyProviders(chain: string, feature?: string): string[] {
    const allProviders = Object.keys(this.providerRegistry);
    return allProviders.filter((providerId) => {
      const config = this.providerRegistry[providerId];
      const health = this.healthStatus.get(providerId);

      const hasChain = config.chains.some((c) => c.id === chain);
      if (!hasChain) return false;

      if (!health || !health.isHealthy) return false;

      if (feature) {
        return (config.features as Record<string, boolean>)[feature] === true;
      }

      return true;
    });
  }

  private sortProvidersByPerformance(providerIds: string[]): string[] {
    return providerIds.sort((a, b) => {
      const metricsA = this.metrics.get(a);
      const metricsB = this.metrics.get(b);

      if (!metricsA || !metricsB) return 0;

      if (metricsA.successRate !== metricsB.successRate) {
        return metricsB.successRate - metricsA.successRate;
      }

      return metricsA.averageLatency - metricsB.averageLatency;
    });
  }

  private recordSuccess(providerId: string, latency: number): void {
    const metrics = this.metrics.get(providerId);
    if (metrics) {
      metrics.totalRequests++;
      metrics.successfulRequests++;
      metrics.totalLatency += latency;
      metrics.averageLatency = metrics.totalLatency / metrics.successfulRequests;
      metrics.successRate = metrics.successfulRequests / metrics.totalRequests;
      metrics.lastChecked = new Date();
    }

    const health = this.healthStatus.get(providerId);
    if (health) {
      health.consecutiveFailures = 0;
      health.isHealthy = true;
      health.latency = latency;
      health.lastChecked = new Date();
    }
  }

  private recordFailure(providerId: string): void {
    const metrics = this.metrics.get(providerId);
    if (metrics) {
      metrics.totalRequests++;
      metrics.failedRequests++;
      metrics.successRate = metrics.successfulRequests / metrics.totalRequests;
      metrics.lastChecked = new Date();
    }

    const health = this.healthStatus.get(providerId);
    if (health) {
      health.consecutiveFailures++;
      health.lastChecked = new Date();

      if (health.consecutiveFailures >= this.options.maxConsecutiveFailures) {
        health.isHealthy = false;
        this.logger.error(
          `[RpcOrchestrator] Provider ${providerId} marked as unhealthy after ${health.consecutiveFailures} failures`
        );
      }
    }
  }

  async monitorProviderHealth(): Promise<void> {
    const checkPromises: Promise<void>[] = [];

    for (const [providerId, config] of Object.entries(this.providerRegistry)) {
      const promise = (async () => {
        try {
          const testChain = config.chains[0]?.id || 'ethereum';
          const provider = this.getProviderInstance(providerId);

          if (providerId === 'ankr' && this.ankrProvider) {
            const health = await this.ankrProvider.healthCheck(testChain);
            this.updateHealthStatus(providerId, health.isHealthy, health.latency);
          } else if (providerId === 'chainstack' && this.chainstackProvider) {
            const health = await this.chainstackProvider.healthCheck(testChain);
            this.updateHealthStatus(providerId, health.isHealthy, health.latency);
          }
        } catch (error) {
          this.updateHealthStatus(providerId, false, 0, (error as Error).message);
        }
      })();

      checkPromises.push(promise);
    }

    await Promise.all(checkPromises);
  }

  private updateHealthStatus(
    providerId: string,
    isHealthy: boolean,
    latency: number,
    errorMessage?: string
  ): void {
    const health = this.healthStatus.get(providerId);
    if (health) {
      if (isHealthy) {
        health.isHealthy = true;
        health.consecutiveFailures = 0;
      } else {
        health.consecutiveFailures++;
        if (health.consecutiveFailures >= this.options.maxConsecutiveFailures) {
          health.isHealthy = false;
        }
      }
      health.latency = latency;
      health.lastChecked = new Date();
      health.errorMessage = errorMessage;
    }
  }

  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(() => {
      this.monitorProviderHealth().catch((error) => {
        this.logger.error('[RpcOrchestrator] Health check failed:', error);
      });
    }, this.options.healthCheckInterval);
  }

  private getProviderInstance(providerId: string): any {
    if (providerId === 'ankr') return this.ankrProvider;
    if (providerId === 'chainstack') return this.chainstackProvider;
    throw new RpcOrchestratorError(
      `Provider ${providerId} not available`,
      'PROVIDER_NOT_AVAILABLE'
    );
  }

  getMetrics(providerId?: string): ProviderMetrics | ProviderMetrics[] {
    if (providerId) {
      return this.metrics.get(providerId) || ({} as ProviderMetrics);
    }
    return Array.from(this.metrics.values());
  }

  getHealthStatus(providerId?: string): ProviderHealth | ProviderHealth[] {
    if (providerId) {
      return this.healthStatus.get(providerId) || ({} as ProviderHealth);
    }
    return Array.from(this.healthStatus.values());
  }

  markProviderUnhealthy(providerId: string, error?: Error): void {
    const health = this.healthStatus.get(providerId);
    if (health) {
      health.isHealthy = false;
      health.errorMessage = error?.message;
      health.lastChecked = new Date();
      this.logger.warn(`[RpcOrchestrator] Provider ${providerId} marked as unhealthy`);
    }
  }

  markProviderHealthy(providerId: string): void {
    const health = this.healthStatus.get(providerId);
    if (health) {
      health.isHealthy = true;
      health.consecutiveFailures = 0;
      health.lastChecked = new Date();
      this.logger.info(`[RpcOrchestrator] Provider ${providerId} marked as healthy`);
    }
  }

  resetMetrics(providerId?: string): void {
    if (providerId) {
      const metrics = this.metrics.get(providerId);
      if (metrics) {
        metrics.totalRequests = 0;
        metrics.successfulRequests = 0;
        metrics.failedRequests = 0;
        metrics.totalLatency = 0;
        metrics.averageLatency = 0;
        metrics.successRate = 0;
      }
    } else {
      this.metrics.forEach((m) => {
        m.totalRequests = 0;
        m.successfulRequests = 0;
        m.failedRequests = 0;
        m.totalLatency = 0;
        m.averageLatency = 0;
        m.successRate = 0;
      });
    }
  }

  getSupportedChains(): string[] {
    const chains = new Set<string>();
    Object.values(this.providerRegistry).forEach((config) => {
      config.chains.forEach((chain) => {
        chains.add(chain.id);
      });
    });
    return Array.from(chains);
  }

  getSupportedProviders(): string[] {
    return Object.keys(this.providerRegistry);
  }

  shutdown(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
  }
}
