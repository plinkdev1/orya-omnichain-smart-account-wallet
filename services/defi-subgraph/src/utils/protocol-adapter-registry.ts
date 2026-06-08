import type { ProtocolAdapter, StakingOpportunity, LendingMarket, RewardCalculation, ProtocolHealth } from '../types';
import { logger } from './logger';

export class ProtocolAdapterRegistry {
  private adapters: Map<string, ProtocolAdapter> = new Map();

  register(key: string, adapter: ProtocolAdapter): void {
    this.adapters.set(key, adapter);
    logger.info({ key }, 'Protocol adapter registered');
  }

  get(key: string): ProtocolAdapter {
    const adapter = this.adapters.get(key);
    if (!adapter) {
      throw new Error(`Protocol adapter not found: ${key}`);
    }
    return adapter;
  }

  getByChainAndProtocol(chainId: string, protocol: string): ProtocolAdapter {
    const key = `${chainId}:${protocol}`;
    return this.get(key);
  }

  has(key: string): boolean {
    return this.adapters.has(key);
  }

  async getStakingOpportunities(
    chainId: string,
    protocol?: string
  ): Promise<StakingOpportunity[]> {
    if (protocol) {
      const adapter = this.getByChainAndProtocol(chainId, protocol);
      return adapter.getStakingOpportunities();
    }

    const allOpportunities: StakingOpportunity[] = [];
    for (const [key] of this.adapters) {
      if (key.startsWith(`${chainId}:`)) {
        try {
          const adapter = this.get(key);
          const opportunities = await adapter.getStakingOpportunities();
          allOpportunities.push(...opportunities);
        } catch (error) {
          logger.error({ key, error }, 'Error fetching staking opportunities');
        }
      }
    }
    return allOpportunities;
  }

  async getLendingMarkets(
    chainId: string,
    protocol?: string
  ): Promise<LendingMarket[]> {
    if (protocol) {
      const adapter = this.getByChainAndProtocol(chainId, protocol);
      return adapter.getLendingMarkets();
    }

    const allMarkets: LendingMarket[] = [];
    for (const [key] of this.adapters) {
      if (key.startsWith(`${chainId}:`)) {
        try {
          const adapter = this.get(key);
          const markets = await adapter.getLendingMarkets();
          allMarkets.push(...markets);
        } catch (error) {
          logger.error({ key, error }, 'Error fetching lending markets');
        }
      }
    }
    return allMarkets;
  }

  async checkProtocolHealth(
    chainId: string,
    protocol: string
  ): Promise<ProtocolHealth> {
    const adapter = this.getByChainAndProtocol(chainId, protocol);
    return adapter.checkHealth();
  }

  getAllAdapters(): Map<string, ProtocolAdapter> {
    return new Map(this.adapters);
  }
}

export const protocolAdapterRegistry = new ProtocolAdapterRegistry();
