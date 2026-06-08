import type { ISwapProtocol, SwapQuoteParams, SwapQuote, SwapExecutionParams, SwapResult } from '@orya/protocol-core';
import type { LiFiAdapter } from '@orya/protocol-adapters';
import type { ZeroXAdapter } from '@orya/protocol-adapters';
import type { OneInchAdapter } from '@orya/protocol-adapters';
import type { SymbiosisAdapter } from '@orya/protocol-adapters';

export interface AggregatorMetrics {
  aggregator: string;
  successCount: number;
  failureCount: number;
  averageLatency: number;
  lastUpdated: Date;
  isHealthy: boolean;
}

export interface SwapAggregatorConfig {
  enableLiFi?: boolean;
  enableZeroX?: boolean;
  enable1Inch?: boolean;
  enableSymbiosis?: boolean;
  timeout?: number;
  maxRetries?: number;
}

export class SwapAggregatorManager {
  private adapters: Map<string, ISwapProtocol> = new Map();
  private metrics: Map<string, AggregatorMetrics> = new Map();
  private primaryOrder: string[] = [];
  private config: Required<SwapAggregatorConfig>;

  constructor(config: SwapAggregatorConfig = {}) {
    this.config = {
      enableLiFi: config.enableLiFi ?? true,
      enableZeroX: config.enableZeroX ?? true,
      enable1Inch: config.enable1Inch ?? true,
      enableSymbiosis: config.enableSymbiosis ?? true,
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 2,
    };

    this.initializeMetrics();
    this.setPrimaryOrder();
  }

  registerAdapter(name: string, adapter: ISwapProtocol): void {
    this.adapters.set(name, adapter);
    this.metrics.set(name, {
      aggregator: name,
      successCount: 0,
      failureCount: 0,
      averageLatency: 0,
      lastUpdated: new Date(),
      isHealthy: true,
    });
    console.log(`[SwapAggregatorManager] Registered adapter: ${name}`);
  }

  async getBestQuote(params: SwapQuoteParams): Promise<{ quote: SwapQuote; aggregator: string }> {
    const results: Array<{
      aggregator: string;
      quote: SwapQuote | null;
      error: Error | null;
      latency: number;
    }> = [];

    const promises = this.primaryOrder
      .filter(name => this.adapters.has(name) && this.isAdapterEnabled(name))
      .map(async (name) => {
        const adapter = this.adapters.get(name)!;
        const startTime = Date.now();

        try {
          const quote = await this.withTimeout(adapter.getQuote(params), this.config.timeout);
          const latency = Date.now() - startTime;
          this.updateMetrics(name, true, latency);

          results.push({
            aggregator: name,
            quote,
            error: null,
            latency,
          });

          return { aggregator: name, quote, latency };
        } catch (error) {
          const latency = Date.now() - startTime;
          this.updateMetrics(name, false, latency);

          results.push({
            aggregator: name,
            quote: null,
            error: error as Error,
            latency,
          });

          console.warn(`[SwapAggregatorManager] ${name} failed:`, (error as Error).message);
          return null;
        }
      });

    const allResults = await Promise.all(promises);
    const validResults = allResults.filter(r => r !== null);

    if (validResults.length === 0) {
      throw new Error('All aggregators failed to provide quotes');
    }

    const bestResult = this.selectBestQuote(validResults);
    console.log(`[SwapAggregatorManager] Selected best quote from ${bestResult.aggregator}`);

    return {
      quote: bestResult.quote,
      aggregator: bestResult.aggregator,
    };
  }

  async executeSwap(
    params: SwapExecutionParams,
    preferredAggregator?: string
  ): Promise<SwapResult> {
    const adapter = preferredAggregator
      ? this.adapters.get(preferredAggregator)
      : this.adapters.get(this.primaryOrder[0])!;

    if (!adapter) {
      throw new Error(`Adapter not found: ${preferredAggregator}`);
    }

    const startTime = Date.now();

    try {
      const result = await this.withTimeout(
        adapter.executeSwap(params),
        this.config.timeout
      );
      const latency = Date.now() - startTime;

      this.updateMetrics(preferredAggregator || this.primaryOrder[0], true, latency);
      return result;
    } catch (error) {
      const latency = Date.now() - startTime;
      this.updateMetrics(preferredAggregator || this.primaryOrder[0], false, latency);
      throw error;
    }
  }

  async initializeAdapters(): Promise<void> {
    const initPromises: Promise<void>[] = [];

    for (const [name, adapter] of this.adapters) {
      if (this.isAdapterEnabled(name)) {
        initPromises.push(
          adapter.initialize().catch((error) => {
            console.warn(`[SwapAggregatorManager] Failed to initialize ${name}:`, error.message);
          })
        );
      }
    }

    await Promise.all(initPromises);
    console.log('[SwapAggregatorManager] All available adapters initialized');
  }

  getMetrics(): AggregatorMetrics[] {
    return Array.from(this.metrics.values());
  }

  getMetricsForAggregator(name: string): AggregatorMetrics | undefined {
    return this.metrics.get(name);
  }

  async getAggregatorHealth(): Promise<Map<string, boolean>> {
    const healthMap = new Map<string, boolean>();

    const promises = Array.from(this.adapters.entries()).map(async ([name, adapter]) => {
      try {
        const isAvailable = await this.withTimeout(adapter.isAvailable(), 5000);
        healthMap.set(name, isAvailable);
      } catch {
        healthMap.set(name, false);
      }
    });

    await Promise.all(promises);
    return healthMap;
  }

  private initializeMetrics(): void {
    const aggregators = ['LiFi', '0x', '1inch', 'Symbiosis'];
    aggregators.forEach(name => {
      this.metrics.set(name, {
        aggregator: name,
        successCount: 0,
        failureCount: 0,
        averageLatency: 0,
        lastUpdated: new Date(),
        isHealthy: true,
      });
    });
  }

  private setPrimaryOrder(): void {
    this.primaryOrder = [];

    if (this.config.enableLiFi) this.primaryOrder.push('LiFi');
    if (this.config.enableZeroX) this.primaryOrder.push('0x');
    if (this.config.enable1Inch) this.primaryOrder.push('1inch');
    if (this.config.enableSymbiosis) this.primaryOrder.push('Symbiosis');
  }

  private isAdapterEnabled(name: string): boolean {
    switch (name) {
      case 'LiFi':
        return this.config.enableLiFi;
      case '0x':
        return this.config.enableZeroX;
      case '1inch':
        return this.config.enable1Inch;
      case 'Symbiosis':
        return this.config.enableSymbiosis;
      default:
        return true;
    }
  }

  private updateMetrics(aggregator: string, success: boolean, latency: number): void {
    const metrics = this.metrics.get(aggregator);
    if (!metrics) return;

    if (success) {
      metrics.successCount++;
      metrics.averageLatency =
        (metrics.averageLatency * (metrics.successCount - 1) + latency) / metrics.successCount;
    } else {
      metrics.failureCount++;
    }

    const successRate = metrics.successCount / (metrics.successCount + metrics.failureCount);
    metrics.isHealthy = successRate > 0.5;
    metrics.lastUpdated = new Date();
  }

  private selectBestQuote(
    results: Array<{ aggregator: string; quote: SwapQuote; latency: number }>
  ): { aggregator: string; quote: SwapQuote; latency: number } {
    if (results.length === 0) {
      throw new Error('No valid quotes available');
    }

    return results.reduce((best, current) => {
      const currentToAmount = BigInt(current.quote.toAmount || '0');
      const bestToAmount = BigInt(best.quote.toAmount || '0');

      if (currentToAmount > bestToAmount) {
        return current;
      }

      if (currentToAmount === bestToAmount) {
        return current.latency < best.latency ? current : best;
      }

      return best;
    });
  }

  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }
}

let aggregatorManager: SwapAggregatorManager | null = null;

export function getSwapAggregatorManager(
  config?: SwapAggregatorConfig
): SwapAggregatorManager {
  if (!aggregatorManager) {
    aggregatorManager = new SwapAggregatorManager(config);
  }
  return aggregatorManager;
}

export function resetSwapAggregatorManager(): void {
  aggregatorManager = null;
}
