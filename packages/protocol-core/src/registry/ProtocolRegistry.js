export class ProtocolRegistry {
    constructor() {
        this.adapters = new Map();
        this.metadata = new Map();
    }
    static getInstance() {
        if (!ProtocolRegistry.instance) {
            ProtocolRegistry.instance = new ProtocolRegistry();
        }
        return ProtocolRegistry.instance;
    }
    async register(metadata, adapter) {
        const id = metadata.id;
        this.validateAdapter(adapter, metadata.type);
        try {
            await adapter.initialize?.();
        }
        catch (error) {
            console.error(`[ProtocolRegistry] Failed to initialize ${id}:`, error);
            throw error;
        }
        this.metadata.set(id, { ...metadata });
        this.adapters.set(id, adapter);
        console.log(`[ProtocolRegistry] Registered: ${id}`);
    }
    async unregister(id) {
        const adapter = this.adapters.get(id);
        if (adapter) {
            try {
                await adapter.destroy?.();
            }
            catch (error) {
                console.error(`[ProtocolRegistry] Error destroying ${id}:`, error);
            }
            this.adapters.delete(id);
            this.metadata.delete(id);
            console.log(`[ProtocolRegistry] Unregistered: ${id}`);
        }
    }
    getAdapter(id) {
        return this.adapters.get(id);
    }
    getProtocols(chainId, type) {
        return Array.from(this.metadata.values()).filter((meta) => meta.chainId === chainId && meta.type === type && meta.isActive);
    }
    getMetadata(id) {
        return this.metadata.get(id);
    }
    getAllProtocols() {
        return Array.from(this.metadata.values());
    }
    isRegistered(id) {
        return this.adapters.has(id);
    }
    validateAdapter(adapter, type) {
        const requiredMethods = {
            swap: ['getQuote', 'executeSwap', 'getSupportedTokens'],
            stake: ['stake', 'unstake', 'getStakingPositions', 'getCurrentAPY'],
            lend: ['supply', 'borrow', 'getPosition'],
            bridge: ['getBridgeQuote', 'executeBridge'],
            aggregator: ['getQuote', 'executeSwap', 'getSupportedProtocols'],
        };
        const required = requiredMethods[type] || [];
        for (const method of required) {
            if (typeof adapter[method] !== 'function') {
                throw new Error(`Protocol adapter missing required method: ${method} for type: ${type}`);
            }
        }
    }
}
export const protocolRegistry = ProtocolRegistry.getInstance();
//# sourceMappingURL=ProtocolRegistry.js.map