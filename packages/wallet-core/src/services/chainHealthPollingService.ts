import { useChainHealthStore } from '../store/chainHealthStore';

export interface ChainHealthConfig {
  chainId: string;
  rpcUrl: string;
  chainName: string;
}

export interface RpcHealthResponse {
  latency: number;
  blockNumber?: number;
  status: 'healthy' | 'degraded' | 'unhealthy';
  error?: string;
}

class ChainHealthPollingService {
  private pollers: Map<string, any> = new Map();
  private configs: Map<string, ChainHealthConfig> = new Map();
  private isRunning = false;
  private defaultInterval = 30000;

  registerChain(config: ChainHealthConfig): void {
    this.configs.set(config.chainId, config);
  }

  registerChains(configs: ChainHealthConfig[]): void {
    configs.forEach((config) => this.registerChain(config));
  }

  async checkHealth(config: ChainHealthConfig): Promise<RpcHealthResponse> {
    const startTime = Date.now();
    const store = useChainHealthStore();

    try {
      if (config.chainId.startsWith('solana')) {
        return await this.checkSolanaHealth(config, startTime);
      } else if (config.chainId.startsWith('sui')) {
        return await this.checkSuiHealth(config, startTime);
      } else if (config.chainId.startsWith('eth') || config.chainId.includes('mainnet') || config.chainId.includes('polygon') || config.chainId.includes('arbitrum') || config.chainId.includes('optimism') || config.chainId.includes('base')) {
        return await this.checkEvmHealth(config, startTime);
      }
      return { latency: 0, status: 'healthy' as const, error: 'Unknown chain type' };
    } catch (error) {
      const latency = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      store.setChainHealth(config.chainId, {
        status: latency > 10000 ? 'unhealthy' : 'degraded',
        latency,
        errorMessage,
      });

      return {
        latency,
        status: latency > 10000 ? 'unhealthy' : 'degraded' as const,
        error: errorMessage,
      };
    }
  }

  private async checkEvmHealth(config: ChainHealthConfig, startTime: number): Promise<RpcHealthResponse> {
    const response = await fetch(config.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      }),
    });

    const data = await response.json();
    const latency = Date.now() - startTime;
    const store = useChainHealthStore();

    if (data.error) {
      store.setChainHealth(config.chainId, {
        status: latency > 5000 ? 'unhealthy' : 'degraded',
        latency,
        errorMessage: data.error.message,
      });
      return { latency, status: latency > 5000 ? 'unhealthy' : 'degraded', error: data.error.message };
    }

    const status: 'healthy' | 'degraded' | 'unhealthy' = latency > 5000 ? 'degraded' : 'healthy';
    store.setChainHealth(config.chainId, { status, latency });

    return { latency, status };
  }

  private async checkSolanaHealth(config: ChainHealthConfig, startTime: number): Promise<RpcHealthResponse> {
    const response = await fetch(config.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'getSlot',
        params: [],
        id: 1,
      }),
    });

    const data = await response.json();
    const latency = Date.now() - startTime;
    const store = useChainHealthStore();

    if (data.error) {
      store.setChainHealth(config.chainId, {
        status: latency > 5000 ? 'unhealthy' : 'degraded',
        latency,
        errorMessage: data.error.message,
      });
      return { latency, status: latency > 5000 ? 'unhealthy' : 'degraded', error: data.error.message };
    }

    const status: 'healthy' | 'degraded' | 'unhealthy' = latency > 5000 ? 'degraded' : 'healthy';
    store.setChainHealth(config.chainId, { status, latency });

    return { latency, status };
  }

  private async checkSuiHealth(config: ChainHealthConfig, startTime: number): Promise<RpcHealthResponse> {
    const response = await fetch(config.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'sui_getCheckpoint',
        params: ['latest'],
        id: 1,
      }),
    });

    const data = await response.json();
    const latency = Date.now() - startTime;
    const store = useChainHealthStore();

    if (data.error) {
      store.setChainHealth(config.chainId, {
        status: latency > 5000 ? 'unhealthy' : 'degraded',
        latency,
        errorMessage: data.error.message,
      });
      return { latency, status: latency > 5000 ? 'unhealthy' : 'degraded', error: data.error.message };
    }

    const status: 'healthy' | 'degraded' | 'unhealthy' = latency > 3000 ? 'degraded' : 'healthy';
    store.setChainHealth(config.chainId, {
      status,
      latency,
    });

    return { latency, status };
  }

  start(interval?: number): void {
    if (this.isRunning) return;

    this.isRunning = true;
    const pollInterval = interval || this.defaultInterval;

    this.configs.forEach((config, chainId) => {
      this.poll(config, pollInterval);
    });
  }

  private poll(config: ChainHealthConfig, interval: number): void {
    if (this.pollers.has(config.chainId)) {
      clearInterval(this.pollers.get(config.chainId)!);
    }

    this.checkHealth(config);

    const timer = setInterval(() => {
      if (this.isRunning) {
        this.checkHealth(config);
      }
    }, interval);

    this.pollers.set(config.chainId, timer);
  }

  stop(): void {
    this.isRunning = false;
    this.pollers.forEach((timer) => clearInterval(timer));
    this.pollers.clear();
  }

  stopChain(chainId: string): void {
    const timer = this.pollers.get(chainId);
    if (timer) {
      clearInterval(timer);
      this.pollers.delete(chainId);
    }
  }

  addChain(config: ChainHealthConfig): void {
    this.registerChain(config);
    if (this.isRunning) {
      this.poll(config, useChainHealthStore().pollingInterval);
    }
  }

  removeChain(chainId: string): void {
    this.configs.delete(chainId);
    this.stopChain(chainId);
    useChainHealthStore().clearChainHealth(chainId);
  }

  getStatus(chainId: string): string {
    const health = useChainHealthStore().getChainHealth(chainId);
    return health?.status || 'unknown';
  }

  setInterval(interval: number): void {
    this.defaultInterval = interval;
    useChainHealthStore().setPollingInterval(interval);
    if (this.isRunning) {
      this.stop();
      this.start(interval);
    }
  }
}

export const chainHealthPollingService = new ChainHealthPollingService();
