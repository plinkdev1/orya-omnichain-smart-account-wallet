import type {
  SwapQuoteParams,
  SwapQuote,
} from '../interfaces/ISwapProtocol';
import type { IAggregatorProtocol } from '../interfaces/IAggregatorProtocol';
import { ProtocolRegistry } from '../registry/ProtocolRegistry';
import { PreferencesStore } from '../preferences/PreferencesStore';

interface PerformanceMetrics {
  successCount: number;
  totalAttempts: number;
  avgActualSlippage: number;
  lastUpdated: Date;
}

export interface RouteScore {
  protocol: string;
  score: number;
  reasons: string[];
  quote: SwapQuote;
  estimatedCost: {
    gasCostUSD: number;
    totalCostUSD: number;
  };
  probability: number;
}

export interface BestRouteResult {
  selectedProtocol: string;
  quote: SwapQuote;
  alternatives: RouteScore[];
  reasoning: string[];
  savingsVsWorst: {
    amount: string;
    percentage: number;
  };
}

export interface RouterConfig {
  maxParallelQuotes: number;
  quoteTimeout: number;
  minScoreDifference: number;
  weightFactors: {
    outputAmount: number;
    priceImpact: number;
    gasCost: number;
    historicalSuccess: number;
    userPreference: number;
  };
  gasTokenPrices: Map<string, number>;
}

const DEFAULT_CONFIG: RouterConfig = {
  maxParallelQuotes: 4,
  quoteTimeout: 10000,
  minScoreDifference: 1,
  weightFactors: {
    outputAmount: 0.4,
    priceImpact: 0.2,
    gasCost: 0.15,
    historicalSuccess: 0.15,
    userPreference: 0.1,
  },
  gasTokenPrices: new Map([
    ['ETH', 2500],
    ['BNB', 400],
    ['MATIC', 0.8],
    ['AVAX', 30],
    ['SUI', 0.5],
  ]),
};

export class AggregatorRouter {
  private static instance: AggregatorRouter;
  private config: RouterConfig;
  private registry: ProtocolRegistry;
  private preferences: PreferencesStore;
  private performanceHistory: Map<string, PerformanceMetrics> = new Map();

  private constructor(config: Partial<RouterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.registry = ProtocolRegistry.getInstance();
    this.preferences = PreferencesStore.getInstance();
    this.loadPerformanceHistory();
  }

  static getInstance(config?: Partial<RouterConfig>): AggregatorRouter {
    if (!AggregatorRouter.instance) {
      AggregatorRouter.instance = new AggregatorRouter(config);
    }
    return AggregatorRouter.instance;
  }

  async findBestRoute(params: SwapQuoteParams): Promise<BestRouteResult> {
    const aggregators = this.getAvailableAggregators(params.chainId);

    if (aggregators.length === 0) {
      throw new Error(
        `No aggregators available for chain: ${params.chainId}`
      );
    }

    const quotes = await this.getParallelQuotes(aggregators, params);

    if (quotes.length === 0) {
      throw new Error('All aggregators failed to provide quotes');
    }

    const scores = await Promise.all(
      quotes.map((q) => this.scoreRoute(q, params))
    );

    scores.sort((a, b) => b.score - a.score);

    const best = scores[0];
    const worst = scores[scores.length - 1];

    const bestAmount = BigInt(best.quote.toAmount);
    const worstAmount = BigInt(worst.quote.toAmount);
    const savings = bestAmount - worstAmount;
    const savingsPercent =
      worstAmount > 0n
        ? Number((savings * 10000n) / worstAmount) / 100
        : 0;

    return {
      selectedProtocol: best.protocol,
      quote: best.quote,
      alternatives: scores.slice(1),
      reasoning: this.generateReasoning(best, scores),
      savingsVsWorst: {
        amount: savings.toString(),
        percentage: savingsPercent,
      },
    };
  }

  private getAvailableAggregators(chainId: string): IAggregatorProtocol[] {
    const metadata = this.registry.getProtocols(chainId, 'aggregator');

    return metadata
      .map((meta) => this.registry.getAdapter(meta.id))
      .filter((adapter): adapter is IAggregatorProtocol => {
        return adapter !== undefined && this.isAggregatorProtocol(adapter);
      });
  }

  private isAggregatorProtocol(
    adapter: any
  ): adapter is IAggregatorProtocol {
    return (
      adapter &&
      typeof adapter.getQuote === 'function' &&
      typeof adapter.executeSwap === 'function'
    );
  }

  private async getParallelQuotes(
    aggregators: IAggregatorProtocol[],
    params: SwapQuoteParams
  ): Promise<Array<{ protocol: IAggregatorProtocol; quote: SwapQuote }>> {
    const quotePromises = aggregators.map(async (protocol) => {
      try {
        const quote = await Promise.race([
          protocol.getQuote(params),
          this.timeout(this.config.quoteTimeout),
        ]);

        return { protocol, quote: quote as SwapQuote };
      } catch (error) {
        console.warn(
          `[AggregatorRouter] ${protocol.name} quote failed:`,
          error instanceof Error ? error.message : error
        );
        return null;
      }
    });

    const results = await Promise.all(quotePromises);
    return results.filter(
      (r): r is { protocol: IAggregatorProtocol; quote: SwapQuote } =>
        r !== null
    );
  }

  private async scoreRoute(
    result: { protocol: IAggregatorProtocol; quote: SwapQuote },
    params: SwapQuoteParams
  ): Promise<RouteScore> {
    const { protocol, quote } = result;
    const weights = this.config.weightFactors;

    const outputScore = 1;
    const priceImpactScore = Math.max(0, 1 - quote.priceImpact / 10);
    const gasCostUSD = quote.estimatedGasUSD || 0;
    const gasCostScore = Math.max(0, 1 - gasCostUSD / 100);
    const historyScore = this.getHistoricalScore(protocol.name, params.chainId);
    const preferenceScore = this.getUserPreferenceScore(
      protocol.name,
      params.chainId
    );

    const score =
      outputScore * weights.outputAmount +
      priceImpactScore * weights.priceImpact +
      gasCostScore * weights.gasCost +
      historyScore * weights.historicalSuccess +
      preferenceScore * weights.userPreference;

    const probability = this.getExecutionProbability(
      protocol.name,
      params.chainId
    );

    return {
      protocol: protocol.name,
      score,
      reasons: this.generateScoreReasons(
        outputScore,
        priceImpactScore,
        gasCostScore,
        historyScore,
        preferenceScore
      ),
      quote,
      estimatedCost: {
        gasCostUSD,
        totalCostUSD: gasCostUSD,
      },
      probability,
    };
  }

  private normalizeAndRecalculateScores(scores: RouteScore[]): RouteScore[] {
    const maxOutput = scores.reduce((max, s) => {
      const amount = BigInt(s.quote.toAmount);
      return amount > max ? amount : max;
    }, 0n);

    return scores.map((score) => {
      const amount = BigInt(score.quote.toAmount);
      const normalizedOutput =
        maxOutput > 0n
          ? Number((amount * 10000n) / maxOutput) / 10000
          : 0;

      const weights = this.config.weightFactors;
      const newScore =
        normalizedOutput * weights.outputAmount +
        score.score * (1 - weights.outputAmount);

      return { ...score, score: newScore };
    });
  }

  private getHistoricalScore(protocolName: string, chainId: string): number {
    const key = `${protocolName}-${chainId}`;
    const metrics = this.performanceHistory.get(key);

    if (!metrics) {
      return 0.7;
    }

    const successRate = metrics.successCount / metrics.totalAttempts;
    const avgSlippage = metrics.avgActualSlippage;

    return successRate * 0.6 + Math.max(0, 1 - avgSlippage / 5) * 0.4;
  }

  private getUserPreferenceScore(
    protocolName: string,
    chainId: string
  ): number {
    const preference = this.preferences.getProtocolPreference(
      chainId,
      'aggregator'
    );

    if (preference === protocolName) {
      return 1;
    }

    const fallbacks = this.preferences.getFallbackProtocols(
      chainId,
      'aggregator'
    );

    const index = fallbacks.indexOf(protocolName);
    if (index !== -1) {
      return Math.max(0, 1 - index * 0.2);
    }

    return 0.5;
  }

  private getExecutionProbability(
    protocolName: string,
    chainId: string
  ): number {
    const key = `${protocolName}-${chainId}`;
    const metrics = this.performanceHistory.get(key);

    if (!metrics || metrics.totalAttempts < 5) {
      return 0.8;
    }

    return metrics.successCount / metrics.totalAttempts;
  }

  private generateReasoning(best: RouteScore, all: RouteScore[]): string[] {
    const reasons: string[] = [];

    reasons.push(`${best.protocol} provides competitive output`);

    if (best.quote.priceImpact < 1) {
      reasons.push('Low price impact (<1%)');
    } else if (best.quote.priceImpact > 3) {
      reasons.push('⚠️ High price impact (>3%)');
    }

    if (best.estimatedCost.gasCostUSD < 5) {
      reasons.push('Low gas cost (<$5)');
    } else if (best.estimatedCost.gasCostUSD > 20) {
      reasons.push('⚠️ High gas cost (>$20)');
    }

    if (best.probability > 0.9) {
      reasons.push('Excellent execution probability (>90%)');
    } else if (best.probability < 0.7) {
      reasons.push('⚠️ Lower execution probability (<70%)');
    }

    if (all.length > 1) {
      const difference = all[0].score - all[1].score;
      if (difference > 0.1) {
        reasons.push(`Significantly better than alternatives (+${(difference * 100).toFixed(1)}%)`);
      } else if (difference < 0.01) {
        reasons.push('Comparable to other options');
      }
    }

    return reasons;
  }

  private generateScoreReasons(
    outputScore: number,
    priceImpactScore: number,
    gasCostScore: number,
    historyScore: number,
    preferenceScore: number
  ): string[] {
    const reasons: string[] = [];

    if (outputScore > 0.8) reasons.push('Strong output amount');
    if (priceImpactScore > 0.7) reasons.push('Low slippage impact');
    if (gasCostScore > 0.8) reasons.push('Efficient gas usage');
    if (historyScore > 0.75) reasons.push('Strong historical performance');
    if (preferenceScore > 0.8) reasons.push('Matches your preferences');

    return reasons.length > 0
      ? reasons
      : ['Solid overall score across metrics'];
  }

  recordSwapExecution(
    protocolName: string,
    chainId: string,
    success: boolean,
    actualSlippage: number
  ): void {
    const key = `${protocolName}-${chainId}`;
    let metrics = this.performanceHistory.get(key);

    if (!metrics) {
      metrics = {
        successCount: 0,
        totalAttempts: 0,
        avgActualSlippage: 0,
        lastUpdated: new Date(),
      };
    }

    metrics.totalAttempts += 1;
    if (success) {
      metrics.successCount += 1;
    }

    metrics.avgActualSlippage =
      (metrics.avgActualSlippage * (metrics.totalAttempts - 1) +
        actualSlippage) /
      metrics.totalAttempts;

    metrics.lastUpdated = new Date();

    this.performanceHistory.set(key, metrics);
    this.savePerformanceHistory();
  }

  private loadPerformanceHistory(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(
          'orya_aggregator_performance'
        );
        if (stored) {
          const data = JSON.parse(stored) as Record<string, any>;
          for (const [key, value] of Object.entries(data)) {
            this.performanceHistory.set(key, {
              ...value,
              lastUpdated: new Date(value.lastUpdated),
            });
          }
        }
      }
    } catch (error) {
      console.warn('[AggregatorRouter] Failed to load performance history:', error);
    }
  }

  private savePerformanceHistory(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const data: Record<string, any> = {};
        for (const [key, value] of this.performanceHistory.entries()) {
          data[key] = {
            ...value,
            lastUpdated: value.lastUpdated.toISOString(),
          };
        }
        window.localStorage.setItem(
          'orya_aggregator_performance',
          JSON.stringify(data)
        );
      }
    } catch (error) {
      console.warn('[AggregatorRouter] Failed to save performance history:', error);
    }
  }

  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Quote timeout after ${ms}ms`)),
        ms
      )
    );
  }

  clearPerformanceHistory(): void {
    this.performanceHistory.clear();
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('orya_aggregator_performance');
      }
    } catch (error) {
      console.warn('[AggregatorRouter] Failed to clear performance history:', error);
    }
  }

  getPerformanceMetrics(
    protocolName: string,
    chainId: string
  ): PerformanceMetrics | undefined {
    const key = `${protocolName}-${chainId}`;
    return this.performanceHistory.get(key);
  }

  getAllPerformanceMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.performanceHistory);
  }
}

export const aggregatorRouter = AggregatorRouter.getInstance();
