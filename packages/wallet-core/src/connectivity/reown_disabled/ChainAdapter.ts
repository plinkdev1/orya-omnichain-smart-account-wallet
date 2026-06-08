import { AppKitNetwork } from '@reown/appkit';

export type ChainNamespace = 'eip155' | 'solana' | 'cosmos' | 'sui' | 'other';

export interface ChainInfo {
  id: string;
  namespace: ChainNamespace;
  name: string;
  rpcUrl: string;
  explorerUrl?: string;
  nativeCurrency?: {
    name: string;
    symbol: string;
    decimals: number;
  };
  isTestnet: boolean;
}

export interface SigningParams {
  method: string;
  params: any[];
  chainId: string;
}

export interface SigningResult {
  signature: string;
  hash?: string;
  rawData?: any;
}

export class ChainAdapter {
  private chainMap: Map<string, ChainInfo> = new Map();
  private namespaceMap: Map<ChainNamespace, string[]> = new Map();
  private static instance: ChainAdapter;

  private constructor() {
    this.initializeNamespaces();
  }

  static getInstance(): ChainAdapter {
    if (!ChainAdapter.instance) {
      ChainAdapter.instance = new ChainAdapter();
    }
    return ChainAdapter.instance;
  }

  static initialize(): ChainAdapter {
    ChainAdapter.instance = new ChainAdapter();
    return ChainAdapter.instance;
  }

  private initializeNamespaces(): void {
    const namespaces: ChainNamespace[] = ['eip155', 'solana', 'cosmos', 'sui', 'other'];
    namespaces.forEach(ns => {
      this.namespaceMap.set(ns, []);
    });
  }

  registerChain(chainId: string, chainInfo: ChainInfo): void {
    this.chainMap.set(chainId, chainInfo);
    
    const chainIds = this.namespaceMap.get(chainInfo.namespace) || [];
    if (!chainIds.includes(chainId)) {
      chainIds.push(chainId);
      this.namespaceMap.set(chainInfo.namespace, chainIds);
    }
  }

  registerFromAppKitNetwork(network: AppKitNetwork): void {
    const namespace = this.getNamespaceFromNetwork(network);
    const chainInfo: ChainInfo = {
      id: network.id.toString(),
      namespace,
      name: network.name,
      rpcUrl: network.rpcUrl,
      explorerUrl: network.explorerUrl,
      nativeCurrency: network.nativeCurrency as any,
      isTestnet: network.testnet || false,
    };
    this.registerChain(network.id.toString(), chainInfo);
  }

  getChain(chainId: string): ChainInfo | undefined {
    return this.chainMap.get(chainId);
  }

  getChainsByNamespace(namespace: ChainNamespace): ChainInfo[] {
    const chainIds = this.namespaceMap.get(namespace) || [];
    return chainIds
      .map(id => this.chainMap.get(id))
      .filter((chain): chain is ChainInfo => chain !== undefined);
  }

  getAllChains(): ChainInfo[] {
    return Array.from(this.chainMap.values());
  }

  canSignRequest(chainId: string, method: string): boolean {
    const chain = this.getChain(chainId);
    if (!chain) return false;

    const supportedMethods = this.getSupportedMethods(chain.namespace);
    return supportedMethods.includes(method);
  }

  getSupportedMethods(namespace: ChainNamespace): string[] {
    switch (namespace) {
      case 'eip155':
        return [
          'personal_sign',
          'eth_sign',
          'eth_signTransaction',
          'eth_signTypedData',
          'eth_sendTransaction',
        ];
      case 'solana':
        return [
          'signMessage',
          'signTransaction',
          'signAllTransactions',
        ];
      case 'cosmos':
        return [
          'cosmos_signDirect',
          'cosmos_signAmino',
        ];
      case 'sui':
        return [
          'sui_signMessage',
          'sui_signTransaction',
        ];
      default:
        return [];
    }
  }

  validateSigningParams(chainId: string, params: SigningParams): boolean {
    const chain = this.getChain(chainId);
    if (!chain) {
      console.error(`Chain ${chainId} not found`);
      return false;
    }

    if (!this.canSignRequest(chainId, params.method)) {
      console.error(`Method ${params.method} not supported for chain ${chainId}`);
      return false;
    }

    if (!params.params || params.params.length === 0) {
      console.error('Signing params cannot be empty');
      return false;
    }

    return true;
  }

  normalizeChainId(chainId: string | number): string {
    return typeof chainId === 'number' ? chainId.toString() : chainId;
  }

  private getNamespaceFromNetwork(network: AppKitNetwork): ChainNamespace {
    const chainId = network.id.toString();
    
    if (chainId.startsWith('eip155')) return 'eip155';
    if (chainId.startsWith('solana')) return 'solana';
    if (chainId.startsWith('cosmos')) return 'cosmos';
    if (chainId.startsWith('sui')) return 'sui';
    
    if (network.name?.toLowerCase().includes('sui')) return 'sui';
    if (network.name?.toLowerCase().includes('solana')) return 'solana';
    
    return 'other';
  }

  getChainNamespace(chainId: string): ChainNamespace | undefined {
    const chain = this.getChain(chainId);
    return chain?.namespace;
  }

  supportsMultichain(namespace: ChainNamespace): boolean {
    return namespace === 'eip155' || namespace === 'solana';
  }

  getTestnetChains(namespace?: ChainNamespace): ChainInfo[] {
    let chains: ChainInfo[] = [];
    
    if (namespace) {
      chains = this.getChainsByNamespace(namespace);
    } else {
      chains = this.getAllChains();
    }

    return chains.filter(c => c.isTestnet);
  }

  getMainnetChains(namespace?: ChainNamespace): ChainInfo[] {
    let chains: ChainInfo[] = [];
    
    if (namespace) {
      chains = this.getChainsByNamespace(namespace);
    } else {
      chains = this.getAllChains();
    }

    return chains.filter(c => !c.isTestnet);
  }

  clear(): void {
    this.chainMap.clear();
    this.initializeNamespaces();
  }
}
