import type { ProtocolAdapter, ProtocolAdapterInstance, ProtocolMetadata, ProtocolType } from './ProtocolAdapter';

interface RegistryEntry {
  metadata: ProtocolMetadata;
  adapter: ProtocolAdapterInstance;
}

export class ProtocolRegistry {
  private static instance: ProtocolRegistry;
  private adapters: Map<string, ProtocolAdapterInstance> = new Map();
  private metadata: Map<string, ProtocolMetadata> = new Map();

  private constructor() {}

  static getInstance(): ProtocolRegistry {
    if (!ProtocolRegistry.instance) {
      ProtocolRegistry.instance = new ProtocolRegistry();
    }
    return ProtocolRegistry.instance;
  }

  async register(
    metadata: ProtocolMetadata,
    adapter: ProtocolAdapterInstance
  ): Promise<void> {
    const id = metadata.id;

    this.validateAdapter(adapter, metadata.type);

    try {
      await (adapter as any).initialize?.();
    } catch (error) {
      console.error(`[ProtocolRegistry] Failed to initialize ${id}:`, error);
      throw error;
    }

    this.metadata.set(id, { ...metadata });
    this.adapters.set(id, adapter);

    console.log(`[ProtocolRegistry] Registered: ${id}`);
  }

  async unregister(id: string): Promise<void> {
    const adapter = this.adapters.get(id);
    if (adapter) {
      try {
        await (adapter as any).destroy?.();
      } catch (error) {
        console.error(`[ProtocolRegistry] Error destroying ${id}:`, error);
      }
      this.adapters.delete(id);
      this.metadata.delete(id);
      console.log(`[ProtocolRegistry] Unregistered: ${id}`);
    }
  }

  getAdapter<T extends ProtocolAdapterInstance = ProtocolAdapterInstance>(
    id: string
  ): T | undefined {
    return this.adapters.get(id) as T | undefined;
  }

  getProtocols(chainId: string, type: ProtocolType): ProtocolMetadata[] {
    return Array.from(this.metadata.values()).filter(
      (meta) => meta.chainId === chainId && meta.type === type && meta.isActive
    );
  }

  getMetadata(id: string): ProtocolMetadata | undefined {
    return this.metadata.get(id);
  }

  getAllProtocols(): ProtocolMetadata[] {
    return Array.from(this.metadata.values());
  }

  isRegistered(id: string): boolean {
    return this.adapters.has(id);
  }

  private validateAdapter(adapter: ProtocolAdapterInstance, type: ProtocolType): void {
    const requiredMethods: Record<ProtocolType, string[]> = {
      swap: ['getQuote', 'executeSwap', 'getSupportedTokens'],
      stake: ['stake', 'unstake', 'getStakingPositions', 'getCurrentAPY'],
      lend: ['supply', 'borrow', 'getPosition'],
      bridge: ['getBridgeQuote', 'executeBridge'],
      aggregator: ['getQuote', 'executeSwap', 'getSupportedProtocols'],
    };

    const required = requiredMethods[type] || [];

    for (const method of required) {
      if (typeof (adapter as any)[method] !== 'function') {
        throw new Error(
          `Protocol adapter missing required method: ${method} for type: ${type}`
        );
      }
    }
  }
}

export const protocolRegistry = ProtocolRegistry.getInstance();
