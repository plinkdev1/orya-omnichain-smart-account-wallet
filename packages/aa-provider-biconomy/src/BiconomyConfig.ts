/**
 * Biconomy Configuration Management
 * Centralized configuration for Biconomy integration
 */

export interface BiconomyNetworkConfig {
  chainId: number;
  chainName: string;
  bundlerUrl: string;
  entryPointAddress: string;
  nftIndexerUrl?: string;
  name: string;
}

export const BICONOMY_NETWORKS: Record<number, BiconomyNetworkConfig> = {
  1: {
    chainId: 1,
    chainName: 'ethereum',
    bundlerUrl: 'https://bundler.biconomy.io/api/v2/1/rpc',
    entryPointAddress: '0x5fbdb2315678afccb333f5dfa1846a3bfc48e5ec',
    nftIndexerUrl: 'https://nft-indexer.biconomy.io',
    name: 'Ethereum',
  },
  137: {
    chainId: 137,
    chainName: 'polygon',
    bundlerUrl: 'https://bundler.biconomy.io/api/v2/137/rpc',
    entryPointAddress: '0x5fbdb2315678afccb333f5dfa1846a3bfc48e5ec',
    nftIndexerUrl: 'https://nft-indexer.biconomy.io',
    name: 'Polygon',
  },
  42161: {
    chainId: 42161,
    chainName: 'arbitrum',
    bundlerUrl: 'https://bundler.biconomy.io/api/v2/42161/rpc',
    entryPointAddress: '0x5fbdb2315678afccb333f5dfa1846a3bfc48e5ec',
    nftIndexerUrl: 'https://nft-indexer.biconomy.io',
    name: 'Arbitrum',
  },
  10: {
    chainId: 10,
    chainName: 'optimism',
    bundlerUrl: 'https://bundler.biconomy.io/api/v2/10/rpc',
    entryPointAddress: '0x5fbdb2315678afccb333f5dfa1846a3bfc48e5ec',
    nftIndexerUrl: 'https://nft-indexer.biconomy.io',
    name: 'Optimism',
  },
  8453: {
    chainId: 8453,
    chainName: 'base',
    bundlerUrl: 'https://bundler.biconomy.io/api/v2/8453/rpc',
    entryPointAddress: '0x5fbdb2315678afccb333f5dfa1846a3bfc48e5ec',
    nftIndexerUrl: 'https://nft-indexer.biconomy.io',
    name: 'Base',
  },
  43114: {
    chainId: 43114,
    chainName: 'avalanche',
    bundlerUrl: 'https://bundler.biconomy.io/api/v2/43114/rpc',
    entryPointAddress: '0x5fbdb2315678afccb333f5dfa1846a3bfc48e5ec',
    nftIndexerUrl: 'https://nft-indexer.biconomy.io',
    name: 'Avalanche',
  },
};

export interface BiconomyConfigOptions {
  apiKey: string;
  apiId?: string;
  bundlerId?: string;
  rpcUrl: string;
  chainId: number;
  paymasterUrl?: string;
  relayerUrl?: string;
  strictMode?: boolean;
}

export class BiconomyConfig {
  public readonly apiKey: string;
  public readonly apiId?: string;
  public readonly bundlerId?: string;
  public readonly rpcUrl: string;
  public readonly chainId: number;
  public readonly paymasterUrl: string;
  public readonly relayerUrl: string;
  public readonly strictMode: boolean;
  public readonly networkConfig: BiconomyNetworkConfig;

  constructor(options: BiconomyConfigOptions) {
    this.apiKey = options.apiKey;
    this.apiId = options.apiId;
    this.bundlerId = options.bundlerId;
    this.rpcUrl = options.rpcUrl;
    this.chainId = options.chainId;
    this.strictMode = options.strictMode ?? false;

    const networkConfig = BICONOMY_NETWORKS[options.chainId];
    if (!networkConfig) {
      throw new Error(`Unsupported chain ID: ${options.chainId}`);
    }
    this.networkConfig = networkConfig;

    this.paymasterUrl = options.paymasterUrl || 'https://paymaster.biconomy.io/api/v2';
    this.relayerUrl = options.relayerUrl || 'https://relayer.biconomy.io';
  }

  getEntryPointAddress(): string {
    return this.networkConfig.entryPointAddress;
  }

  getBundlerUrl(): string {
    return this.networkConfig.bundlerUrl;
  }

  getChainName(): string {
    return this.networkConfig.chainName;
  }

  toJSON(): Record<string, any> {
    return {
      apiKey: this.apiKey,
      apiId: this.apiId,
      bundlerId: this.bundlerId,
      rpcUrl: this.rpcUrl,
      chainId: this.chainId,
      paymasterUrl: this.paymasterUrl,
      relayerUrl: this.relayerUrl,
      strictMode: this.strictMode,
    };
  }
}

export default BiconomyConfig;
