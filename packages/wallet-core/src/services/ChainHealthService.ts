/**
 * Chain Health Monitoring Service
 * Tracks RPC latency, block time, and network status
 * Supports multi-chain health monitoring with real-time updates
 */

import type { ChainId } from "@orya/shared-types";
import { getChain } from "@orya/shared-types";

export type HealthStatus = 'healthy' | 'degraded' | 'offline' | 'devnet';

export interface HealthMetrics {
  chain: ChainId;
  endpoint: string;
  status: HealthStatus;
  response_time_ms: number;
  success_rate: number;
  block_lag: number;
  last_checked: number;
}

export interface HealthCheckResult {
  chainId: ChainId;
  status: HealthStatus;
  latency: number;
  blockLag: number;
  successRate: number;
  timestamp: number;
}

interface PingResult {
  latency: number;
  blockLag: number;
  success: boolean;
  timestamp: number;
}

export class ChainHealthService {
  private static instance: ChainHealthService;
  private metricsCache: Map<ChainId, HealthMetrics> = new Map();
  private pingHistory: Map<ChainId, PingResult[]> = new Map();
  private pollingIntervals: Map<ChainId, NodeJS.Timeout> = new Map();
  private listeners: Set<(metrics: HealthMetrics) => void> = new Set();
  private lastBlockNumbers: Map<ChainId, number> = new Map();
  private readonly POLLING_INTERVAL_MS = 20000; // 20 seconds
  private readonly HISTORY_LIMIT = 10;
  private readonly LATENCY_THRESHOLDS = { degraded: 500, offline: 1500 };
  private readonly SUCCESS_RATE_THRESHOLDS = { degraded: 85, offline: 85 };
  private readonly BLOCK_LAG_THRESHOLDS = { degraded: 2, offline: 5 };

  private constructor() {}

  static getInstance(): ChainHealthService {
    if (!ChainHealthService.instance) {
      ChainHealthService.instance = new ChainHealthService();
    }
    return ChainHealthService.instance;
  }

  /**
   * Subscribe to health metrics updates
   */
  subscribe(listener: (metrics: HealthMetrics) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Emit health metrics to all subscribers
   */
  private emit(metrics: HealthMetrics) {
    this.metricsCache.set(metrics.chain, metrics);
    this.listeners.forEach((listener) => listener(metrics));
  }

  /**
   * Check if endpoint is devnet/testnet
   */
  private isDevnetOrTestnet(endpoint: string, chainId: ChainId): boolean {
    const chain = getChain(chainId);
    if (!chain) return false;
    
    const devnetKeywords = ['devnet', 'testnet', 'sandbox', 'staging', 'sepolia', 'rinkeby', 'goerli'];
    const url = endpoint.toLowerCase();
    const isTestChain = chain.isTestnet;
    
    return isTestChain || devnetKeywords.some(keyword => url.includes(keyword));
  }

  /**
   * Perform health check for a specific chain
   */
  async checkChainHealth(chainId: ChainId): Promise<HealthCheckResult> {
    const chain = getChain(chainId);
    if (!chain) {
      throw new Error(`Chain ${chainId} not found`);
    }

    try {
      const startTime = Date.now();
      const result = await this.performHealthProbe(chainId, chain.rpcUrl, chain.type as any);
      const latency = Date.now() - startTime;

      // Store in history
      const history = this.pingHistory.get(chainId) || [];
      history.push({
        latency,
        blockLag: result.blockLag,
        success: result.success,
        timestamp: Date.now(),
      });

      // Keep only last 10 results
      if (history.length > this.HISTORY_LIMIT) {
        history.shift();
      }
      this.pingHistory.set(chainId, history);

      // Calculate metrics
      const successRate = this.calculateSuccessRate(history);
      const status = this.determineStatus(latency, successRate, result.blockLag, chainId, chain.rpcUrl);

      // Store block number for lag calculation
      this.lastBlockNumbers.set(chainId, result.currentBlock);

      const metrics: HealthMetrics = {
        chain: chainId,
        endpoint: chain.rpcUrl,
        status,
        response_time_ms: latency,
        success_rate: successRate,
        block_lag: result.blockLag,
        last_checked: Date.now(),
      };

      this.emit(metrics);

      return {
        chainId,
        status,
        latency,
        blockLag: result.blockLag,
        successRate,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(`Health check failed for chain ${chainId}:`, error);

      const metrics: HealthMetrics = {
        chain: chainId,
        endpoint: chain.rpcUrl,
        status: 'offline',
        response_time_ms: 0,
        success_rate: 0,
        block_lag: 0,
        last_checked: Date.now(),
      };

      this.emit(metrics);

      return {
        chainId,
        status: 'offline',
        latency: 0,
        blockLag: 0,
        successRate: 0,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Perform the actual health probe based on chain type
   */
  private async performHealthProbe(
    chainId: ChainId,
    endpoint: string,
    chainType: string
  ): Promise<{ success: boolean; blockLag: number; currentBlock: number }> {
    try {
      if (chainType === 'solana') {
        return await this.probeSolana(endpoint);
      } else if (chainType === 'sui') {
        return await this.probeSui(endpoint);
      } else {
        // EVM (Ethereum, Polygon, Arbitrum, etc.)
        return await this.probeEVM(endpoint);
      }
    } catch (error) {
      return { success: false, blockLag: 999, currentBlock: 0 };
    }
  }

  /**
   * Probe EVM chain (Ethereum, Polygon, Arbitrum, etc.)
   */
  private async probeEVM(endpoint: string): Promise<{ success: boolean; blockLag: number; currentBlock: number }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_blockNumber',
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message);
      }

      const blockNumber = parseInt(data.result, 16);
      const blockLag = 0; // Would compare with explorer block, but keeping simple for now

      return { success: true, blockLag, currentBlock: blockNumber };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Probe Solana chain
   */
  private async probeSolana(endpoint: string): Promise<{ success: boolean; blockLag: number; currentBlock: number }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getSlot',
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message);
      }

      const slot = data.result;
      const blockLag = 0; // Simplified

      return { success: true, blockLag, currentBlock: slot };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Probe SUI chain
   */
  private async probeSui(endpoint: string): Promise<{ success: boolean; blockLag: number; currentBlock: number }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'sui_getLatestCheckpointSequenceNumber',
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message);
      }

      const checkpoint = parseInt(data.result);
      const blockLag = 0;

      return { success: true, blockLag, currentBlock: checkpoint };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calculate success rate from history
   */
  private calculateSuccessRate(history: PingResult[]): number {
    if (history.length === 0) return 0;
    const successCount = history.filter((r) => r.success).length;
    return Math.round((successCount / history.length) * 100);
  }

  /**
   * Determine overall status based on metrics
   * Returns: 'devnet' | 'healthy' | 'degraded' | 'offline'
   */
  private determineStatus(
    latency: number,
    successRate: number,
    blockLag: number,
    chainId: ChainId,
    endpoint: string
  ): HealthStatus {
    // Check for devnet/testnet first
    if (this.isDevnetOrTestnet(endpoint, chainId)) {
      return 'devnet';
    }

    // Check offline conditions
    if (latency > this.LATENCY_THRESHOLDS.offline || successRate < this.SUCCESS_RATE_THRESHOLDS.offline || blockLag > this.BLOCK_LAG_THRESHOLDS.offline) {
      return 'offline';
    }

    // Check degraded conditions
    if (
      (latency >= this.LATENCY_THRESHOLDS.degraded && latency <= this.LATENCY_THRESHOLDS.offline) ||
      (successRate >= this.SUCCESS_RATE_THRESHOLDS.degraded && successRate < 95) ||
      (blockLag >= this.BLOCK_LAG_THRESHOLDS.degraded && blockLag <= this.BLOCK_LAG_THRESHOLDS.offline)
    ) {
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * Start continuous polling for a chain
   */
  startPolling(chainId: ChainId, intervalMs?: number): void {
    // Clear existing interval if any
    this.stopPolling(chainId);

    const interval = intervalMs || this.POLLING_INTERVAL_MS;

    // Check immediately
    this.checkChainHealth(chainId).catch((error) => {
      console.error(`Initial health check failed for ${chainId}:`, error);
    });

    // Set up periodic checks
    const timeoutId = setInterval(() => {
      this.checkChainHealth(chainId).catch((error) => {
        console.error(`Periodic health check failed for ${chainId}:`, error);
      });
    }, interval);

    this.pollingIntervals.set(chainId, timeoutId);
  }

  /**
   * Stop polling for a chain
   */
  stopPolling(chainId: ChainId): void {
    const timeoutId = this.pollingIntervals.get(chainId);
    if (timeoutId) {
      clearInterval(timeoutId);
      this.pollingIntervals.delete(chainId);
    }
  }

  /**
   * Start polling for all enabled chains
   */
  startPollingAllChains(intervalMs?: number): void {
    const chains = this.getAllEnabledChains();
    chains.forEach((chainId) => {
      this.startPolling(chainId, intervalMs);
    });
  }

  /**
   * Stop polling for all chains
   */
  stopPollingAllChains(): void {
    this.pollingIntervals.forEach((timeoutId) => {
      clearInterval(timeoutId);
    });
    this.pollingIntervals.clear();
  }

  /**
   * Get all enabled chains
   * SUI chains prioritized first as per chain alignment strategy
   */
  private getAllEnabledChains(): ChainId[] {
    // Prioritize SUI chains first, then EVM, then other chains
    const suiChains: ChainId[] = [
      'sui:mainnet',
      'sui:testnet',
      'sui:devnet',
    ];
    const evmChains: ChainId[] = [
      'ethereum:mainnet',
      'ethereum:sepolia',
      'polygon:mainnet',
      'arbitrum:mainnet',
      'base:mainnet',
      'optimism:mainnet',
    ];
    const otherChains: ChainId[] = [
      'solana:mainnet',
      'solana:devnet',
      'bitcoin:mainnet',
      'bitcoin:testnet',
    ];
    const allChains = [...suiChains, ...evmChains, ...otherChains];
    return allChains.filter((chainId) => {
      const chain = getChain(chainId);
      return chain?.isEnabled;
    });
  }

  /**
   * Get current health metrics for a chain
   */
  getMetrics(chainId: ChainId): HealthMetrics | undefined {
    return this.metricsCache.get(chainId);
  }

  /**
   * Get health metrics for all chains
   */
  getAllMetrics(): HealthMetrics[] {
    return Array.from(this.metricsCache.values());
  }

  /**
   * Get ping history for a chain
   */
  getPingHistory(chainId: ChainId): PingResult[] {
    return this.pingHistory.get(chainId) || [];
  }

  /**
   * Clear all data and stop polling
   */
  destroy(): void {
    this.stopPollingAllChains();
    this.metricsCache.clear();
    this.pingHistory.clear();
    this.lastBlockNumbers.clear();
    this.listeners.clear();
  }
}

export const chainHealthService = ChainHealthService.getInstance();
