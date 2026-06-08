import type { ProtocolAdapterInstance, ProtocolMetadata, ProtocolType } from './ProtocolAdapter';
export declare class ProtocolRegistry {
    private static instance;
    private adapters;
    private metadata;
    private constructor();
    static getInstance(): ProtocolRegistry;
    register(metadata: ProtocolMetadata, adapter: ProtocolAdapterInstance): Promise<void>;
    unregister(id: string): Promise<void>;
    getAdapter<T extends ProtocolAdapterInstance = ProtocolAdapterInstance>(id: string): T | undefined;
    getProtocols(chainId: string, type: ProtocolType): ProtocolMetadata[];
    getMetadata(id: string): ProtocolMetadata | undefined;
    getAllProtocols(): ProtocolMetadata[];
    isRegistered(id: string): boolean;
    private validateAdapter;
}
export declare const protocolRegistry: ProtocolRegistry;
//# sourceMappingURL=ProtocolRegistry.d.ts.map