import type { Chain, ChainId, ChainType } from './chains';
import { CHAIN_CONFIG as DEFAULT_CHAINS } from './chains';

export interface ChainRegistryConfig {
  environment?: 'development' | 'staging' | 'production';
  externalRegistryUrl?: string;
  cacheEnabled?: boolean;
  cacheDurationMs?: number;
  validateRPCOnLoad?: boolean;
}

export interface ChainValidationError {
  chainId: string;
  field: string;
  error: string;
}

class ChainRegistry {
  private chains: Map<ChainId, Chain> = new Map();
  private chainsByType: Map<ChainType, Chain[]> = new Map();
  private chainsByVMFamily: Map<string, Chain[]> = new Map();
  private config: Required<ChainRegistryConfig>;
  private isInitialized = false;
  private lastCacheUpdate = 0;
  private externalChains: Chain[] = [];
  private validationErrors: ChainValidationError[] = [];

  constructor(config: ChainRegistryConfig = {}) {
    this.config = {
      environment: config.environment || 'production',
      externalRegistryUrl: config.externalRegistryUrl || 'https://registry.orya.io/chains',
      cacheEnabled: config.cacheEnabled !== false,
      cacheDurationMs: config.cacheDurationMs || 5 * 60 * 1000,
      validateRPCOnLoad: config.validateRPCOnLoad || false,
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.loadChains();
      this.indexChains();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize ChainRegistry:', error);
      await this.loadFallback();
      this.isInitialized = true;
    }
  }

  private async loadChains(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        await this.loadChainsFromJSON();
      } else {
        this.loadDefaultChains();
      }
    } catch (error) {
      console.warn('Failed to load chains from JSON, falling back to defaults:', error);
      this.loadDefaultChains();
    }

    if (this.config.environment !== 'development') {
      await this.loadExternalChains();
    }
  }

  private loadDefaultChains(): void {
    Object.entries(DEFAULT_CHAINS).forEach(([, chain]) => {
      this.chains.set(chain.id, chain);
    });
  }

  private async loadChainsFromJSON(): Promise<void> {
    try {
      const imports = await Promise.all([
        import('./chains/sui.json'),
        import('./chains/evm.json'),
        import('./chains/solana.json'),
        import('./chains/cosmos.json'),
        import('./chains/ton.json'),
        import('./chains/near.json'),
        import('./chains/tron.json'),
        import('./chains/cardano.json'),
        import('./chains/substrate.json'),
        import('./chains/bitcoin.json'),
        import('./chains/aptos.json'),
        import('./chains/movement.json'),
      ]);

      imports.forEach((module) => {
        const config = module.default;
        if (config.chains && Array.isArray(config.chains)) {
          config.chains.forEach((chain: Chain) => {
            if (this.validateChain(chain)) {
              this.chains.set(chain.id, chain);
            }
          });
        }
      });
    } catch (error) {
      throw new Error(`Failed to load chain JSON files: ${error}`);
    }
  }

  private async loadExternalChains(): Promise<void> {
    try {
      const response = await fetch(this.config.externalRegistryUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      } as any);

      if (!response.ok) {
        throw new Error(`External registry returned ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data.chains)) {
        data.chains.forEach((chain: Chain) => {
          if (this.validateChain(chain)) {
            this.externalChains.push(chain);
            this.chains.set(chain.id, chain);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load chains from external registry:', error);
    }
  }

  private async loadFallback(): Promise<void> {
    console.warn('Loading fallback chain configuration');
    this.loadDefaultChains();
  }

  private validateChain(chain: Chain): boolean {
    const errors: string[] = [];

    if (!chain.id) errors.push('Missing chain.id');
    if (!chain.name) errors.push('Missing chain.name');
    if (!chain.symbol) errors.push('Missing chain.symbol');
    if (!chain.type) errors.push('Missing chain.type');
    if (!chain.rpcUrl) errors.push('Missing chain.rpcUrl');
    if (!chain.explorerUrl) errors.push('Missing chain.explorerUrl');
    if (!chain.nativeCurrency) errors.push('Missing chain.nativeCurrency');
    if (chain.nativeCurrency) {
      if (!chain.nativeCurrency.name) errors.push('Missing nativeCurrency.name');
      if (!chain.nativeCurrency.symbol) errors.push('Missing nativeCurrency.symbol');
      if (chain.nativeCurrency.decimals === undefined) errors.push('Missing nativeCurrency.decimals');
    }

    if (errors.length > 0) {
      this.validationErrors.push({
        chainId: chain.id || 'unknown',
        field: 'root',
        error: errors.join('; '),
      });
      return false;
    }

    return true;
  }

  private indexChains(): void {
    this.chainsByType.clear();
    this.chainsByVMFamily.clear();

    this.chains.forEach((chain) => {
      if (!this.chainsByType.has(chain.type)) {
        this.chainsByType.set(chain.type, []);
      }
      this.chainsByType.get(chain.type)!.push(chain);

      const vmFamily = this.getVMFamily(chain.type);
      if (!this.chainsByVMFamily.has(vmFamily)) {
        this.chainsByVMFamily.set(vmFamily, []);
      }
      this.chainsByVMFamily.get(vmFamily)!.push(chain);
    });
  }

  private getVMFamily(chainType: ChainType): string {
    const families: Record<ChainType, string> = {
      sui: 'MoveVM',
      evm: 'EVM',
      solana: 'SVM',
      bitcoin: 'Bitcoin',
      cosmos: 'Cosmos',
      other: 'Other',
    };
    return families[chainType] || 'Other';
  }

  getChain(chainId: ChainId): Chain | undefined {
    return this.chains.get(chainId);
  }

  getAllChains(): Chain[] {
    return Array.from(this.chains.values());
  }

  getEnabledChains(): Chain[] {
    return Array.from(this.chains.values())
      .filter((chain) => chain.isEnabled)
      .sort((a, b) => a.priority - b.priority);
  }

  getMainnetChains(): Chain[] {
    return this.getEnabledChains().filter((chain) => !chain.isTestnet);
  }

  getTestnetChains(): Chain[] {
    return this.getEnabledChains().filter((chain) => chain.isTestnet);
  }

  getChainsByType(type: ChainType): Chain[] {
    return this.chainsByType.get(type) || [];
  }

  getChainsByVMFamily(vmFamily: string): Chain[] {
    return this.chainsByVMFamily.get(vmFamily) || [];
  }

  getChainsBySymbol(symbol: string): Chain[] {
    return Array.from(this.chains.values()).filter(
      (chain) => chain.symbol.toLowerCase() === symbol.toLowerCase()
    );
  }

  searchChains(query: string): Chain[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.chains.values()).filter(
      (chain) =>
        chain.id.toLowerCase().includes(lowerQuery) ||
        chain.name.toLowerCase().includes(lowerQuery) ||
        chain.symbol.toLowerCase().includes(lowerQuery)
    );
  }

  getValidationErrors(): ChainValidationError[] {
    return this.validationErrors;
  }

  hasValidationErrors(): boolean {
    return this.validationErrors.length > 0;
  }

  addChain(chain: Chain): boolean {
    if (this.validateChain(chain)) {
      this.chains.set(chain.id, chain);
      this.indexChains();
      return true;
    }
    return false;
  }

  removeChain(chainId: ChainId): boolean {
    const removed = this.chains.delete(chainId);
    if (removed) {
      this.indexChains();
    }
    return removed;
  }

  updateChain(chainId: ChainId, updates: Partial<Chain>): boolean {
    const chain = this.chains.get(chainId);
    if (!chain) return false;

    const updated: Chain = { ...chain, ...updates, id: chainId };
    if (this.validateChain(updated)) {
      this.chains.set(chainId, updated);
      this.indexChains();
      return true;
    }
    return false;
  }

  exportChains(): Record<string, any> {
    return {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: this.config.environment,
      totalChains: this.chains.size,
      chains: Array.from(this.chains.values()),
      vmFamilies: Array.from(this.chainsByVMFamily.entries()).map(([family, chains]) => ({
        name: family,
        chainCount: chains.length,
        chains: chains.map((c) => c.id),
      })),
    };
  }

  getStatistics() {
    const allChains = Array.from(this.chains.values());
    return {
      totalChains: allChains.length,
      enabledChains: allChains.filter((c) => c.isEnabled).length,
      disabledChains: allChains.filter((c) => !c.isEnabled).length,
      mainnetChains: allChains.filter((c) => !c.isTestnet).length,
      testnetChains: allChains.filter((c) => c.isTestnet).length,
      byType: Object.fromEntries(
        Array.from(this.chainsByType.entries()).map(([type, chains]) => [
          type,
          chains.length,
        ])
      ),
      byVMFamily: Object.fromEntries(
        Array.from(this.chainsByVMFamily.entries()).map(([family, chains]) => [
          family,
          chains.length,
        ])
      ),
    };
  }
}

let registryInstance: ChainRegistry | null = null;

export function initializeChainRegistry(config?: ChainRegistryConfig): ChainRegistry {
  if (!registryInstance) {
    registryInstance = new ChainRegistry(config);
  }
  return registryInstance;
}

export function getChainRegistry(): ChainRegistry {
  if (!registryInstance) {
    registryInstance = initializeChainRegistry();
  }
  return registryInstance;
}

export async function loadChainRegistry(config?: ChainRegistryConfig): Promise<ChainRegistry> {
  const registry = initializeChainRegistry(config);
  await registry.initialize();
  return registry;
}

export { ChainRegistry };
