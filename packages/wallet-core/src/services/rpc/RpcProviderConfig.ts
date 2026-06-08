/**
 * RPC Provider Configuration System
 * 
 * Defines configuration for all RPC providers with support for:
 * - Multiple tiers (Tier 1, 2, 3)
 * - Multi-chain support
 * - Rate limiting and feature detection
 * - Dynamic provider registration
 */

export type ProviderTier = 'tier1' | 'tier2' | 'tier3';

export interface ChainConfig {
  id: string;
  name: string;
  rpcUrl: string;
  archived?: boolean;
  blockTime?: number;
}

export interface ProviderFeatures extends Record<string, boolean> {
  tracing: boolean;
  archiveData: boolean;
  nftApi: boolean;
  tokenApi: boolean;
  gasPriceApi: boolean;
  websocket: boolean;
  eventLogs: boolean;
  advancedQuerying: boolean;
}

export interface RpcProviderConfig {
  id: string;
  name: string;
  tier: ProviderTier;
  chains: ChainConfig[];
  apiKeyRequired: boolean;
  apiKeyEnvVar?: string;
  priority: number;
  rateLimitPerSecond: number;
  rateLimitPerDay: number;
  weight: number;
  timeout: number;
  features: ProviderFeatures;
  baseUrl?: string;
  description?: string;
  documentation?: string;
}

export interface ProviderRegistry {
  [providerId: string]: RpcProviderConfig;
}

/**
 * Ankr Provider Configuration
 * - 50+ chains supported
 * - Premium features for NFT and token metadata
 * - Enterprise-grade reliability
 */
export const ANKR_PROVIDER_CONFIG: RpcProviderConfig = {
  id: 'ankr',
  name: 'Ankr',
  tier: 'tier1',
  baseUrl: 'https://rpc.ankr.com',
  priority: 1,
  weight: 3,
  timeout: 10000,
  rateLimitPerSecond: 500,
  rateLimitPerDay: 500000,
  apiKeyRequired: true,
  apiKeyEnvVar: 'ANKR_API_KEY',
  description: 'Ankr - Multi-chain RPC provider with 50+ chains',
  documentation: 'https://www.ankr.com/docs/',
  chains: [
    { id: 'ethereum', name: 'Ethereum', rpcUrl: 'https://rpc.ankr.com/eth' },
    { id: 'polygon', name: 'Polygon', rpcUrl: 'https://rpc.ankr.com/polygon' },
    { id: 'arbitrum', name: 'Arbitrum', rpcUrl: 'https://rpc.ankr.com/arbitrum' },
    { id: 'optimism', name: 'Optimism', rpcUrl: 'https://rpc.ankr.com/optimism' },
    { id: 'base', name: 'Base', rpcUrl: 'https://rpc.ankr.com/base' },
    { id: 'avalanche', name: 'Avalanche', rpcUrl: 'https://rpc.ankr.com/avalanche' },
    { id: 'bsc', name: 'BSC', rpcUrl: 'https://rpc.ankr.com/bsc' },
    { id: 'fantom', name: 'Fantom', rpcUrl: 'https://rpc.ankr.com/fantom' },
    { id: 'gnosis', name: 'Gnosis', rpcUrl: 'https://rpc.ankr.com/gnosis' },
    { id: 'zkSync', name: 'zkSync Era', rpcUrl: 'https://rpc.ankr.com/zksync_era' },
    { id: 'linea', name: 'Linea', rpcUrl: 'https://rpc.ankr.com/linea' },
    { id: 'scroll', name: 'Scroll', rpcUrl: 'https://rpc.ankr.com/scroll' },
  ],
  features: {
    tracing: true,
    archiveData: true,
    nftApi: true,
    tokenApi: true,
    gasPriceApi: true,
    websocket: true,
    eventLogs: true,
    advancedQuerying: true,
  },
};

/**
 * Chainstack Provider Configuration
 * - 30+ chains with dedicated node infrastructure
 * - Archive data support
 * - Advanced querying capabilities
 */
export const CHAINSTACK_PROVIDER_CONFIG: RpcProviderConfig = {
  id: 'chainstack',
  name: 'Chainstack',
  tier: 'tier2',
  baseUrl: 'https://nd.chainstack.com',
  priority: 2,
  weight: 2,
  timeout: 15000,
  rateLimitPerSecond: 100,
  rateLimitPerDay: 100000,
  apiKeyRequired: true,
  apiKeyEnvVar: 'CHAINSTACK_API_KEY',
  description: 'Chainstack - Dedicated node infrastructure for 30+ chains',
  documentation: 'https://chainstack.com/build-better-with-chainstack/',
  chains: [
    { id: 'ethereum', name: 'Ethereum', rpcUrl: 'https://nd.chainstack.com/ethereum/mainnet' },
    { id: 'polygon', name: 'Polygon', rpcUrl: 'https://nd.chainstack.com/polygon/mainnet' },
    { id: 'arbitrum', name: 'Arbitrum', rpcUrl: 'https://nd.chainstack.com/arbitrum-one/mainnet' },
    { id: 'optimism', name: 'Optimism', rpcUrl: 'https://nd.chainstack.com/optimism/mainnet' },
    { id: 'base', name: 'Base', rpcUrl: 'https://nd.chainstack.com/base/mainnet' },
    { id: 'avalanche', name: 'Avalanche', rpcUrl: 'https://nd.chainstack.com/avalanche/mainnet' },
    { id: 'bsc', name: 'BSC', rpcUrl: 'https://nd.chainstack.com/bsc/mainnet' },
    { id: 'solana', name: 'Solana', rpcUrl: 'https://nd.chainstack.com/solana/mainnet' },
  ],
  features: {
    tracing: true,
    archiveData: true,
    nftApi: false,
    tokenApi: false,
    gasPriceApi: true,
    websocket: true,
    eventLogs: true,
    advancedQuerying: true,
  },
};

/**
 * QuickNode Provider Configuration (Tier 1)
 * - 30+ chains with ultra-low latency
 * - Premium features support
 */
export const QUICKNODE_PROVIDER_CONFIG: RpcProviderConfig = {
  id: 'quicknode',
  name: 'QuickNode',
  tier: 'tier1',
  priority: 1,
  weight: 3,
  timeout: 10000,
  rateLimitPerSecond: 100,
  rateLimitPerDay: 100000,
  apiKeyRequired: true,
  apiKeyEnvVar: 'QUICKNODE_API_KEY',
  description: 'QuickNode - Ultra-fast RPC endpoints for 30+ chains',
  documentation: 'https://www.quicknode.com/',
  chains: [
    { id: 'ethereum', name: 'Ethereum', rpcUrl: 'https://mainnet.quicknode.pro' },
    { id: 'polygon', name: 'Polygon', rpcUrl: 'https://polygon-mainnet.quicknode.pro' },
    { id: 'arbitrum', name: 'Arbitrum', rpcUrl: 'https://arbitrum-mainnet.quicknode.pro' },
    { id: 'optimism', name: 'Optimism', rpcUrl: 'https://optimism-mainnet.quicknode.pro' },
    { id: 'base', name: 'Base', rpcUrl: 'https://base-mainnet.quicknode.pro' },
    { id: 'avalanche', name: 'Avalanche', rpcUrl: 'https://avalanche-mainnet.quicknode.pro' },
    { id: 'solana', name: 'Solana', rpcUrl: 'https://solana-mainnet.quicknode.pro' },
  ],
  features: {
    tracing: true,
    archiveData: true,
    nftApi: true,
    tokenApi: true,
    gasPriceApi: true,
    websocket: true,
    eventLogs: true,
    advancedQuerying: true,
  },
};

/**
 * Alchemy Provider Configuration (Tier 1)
 * - 20+ chains with best-in-class APIs
 * - Enhanced APIs (Gas, NFT, Notify)
 */
export const ALCHEMY_PROVIDER_CONFIG: RpcProviderConfig = {
  id: 'alchemy',
  name: 'Alchemy',
  tier: 'tier1',
  priority: 1,
  weight: 3,
  timeout: 10000,
  rateLimitPerSecond: 100,
  rateLimitPerDay: 100000,
  apiKeyRequired: true,
  apiKeyEnvVar: 'ALCHEMY_API_KEY',
  description: 'Alchemy - Enterprise-grade blockchain APIs',
  documentation: 'https://docs.alchemy.com/',
  chains: [
    { id: 'ethereum', name: 'Ethereum', rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2' },
    { id: 'polygon', name: 'Polygon', rpcUrl: 'https://polygon-mainnet.g.alchemy.com/v2' },
    { id: 'arbitrum', name: 'Arbitrum', rpcUrl: 'https://arb-mainnet.g.alchemy.com/v2' },
    { id: 'optimism', name: 'Optimism', rpcUrl: 'https://opt-mainnet.g.alchemy.com/v2' },
    { id: 'base', name: 'Base', rpcUrl: 'https://base-mainnet.g.alchemy.com/v2' },
  ],
  features: {
    tracing: true,
    archiveData: true,
    nftApi: true,
    tokenApi: true,
    gasPriceApi: true,
    websocket: true,
    eventLogs: true,
    advancedQuerying: true,
  },
};

/**
 * ZAN Provider Configuration (Tier 2)
 * - 20+ chains support
 * - Backup provider for failover
 */
export const ZAN_PROVIDER_CONFIG: RpcProviderConfig = {
  id: 'zan',
  name: 'ZAN',
  tier: 'tier2',
  baseUrl: 'https://api.zan.top/node/v1',
  priority: 3,
  weight: 2,
  timeout: 15000,
  rateLimitPerSecond: 50,
  rateLimitPerDay: 50000,
  apiKeyRequired: true,
  apiKeyEnvVar: 'ZAN_API_KEY',
  description: 'ZAN - Reliable fallback RPC provider',
  documentation: 'https://zan.top/',
  chains: [
    { id: 'ethereum', name: 'Ethereum', rpcUrl: 'https://api.zan.top/node/v1/eth/mainnet' },
    { id: 'polygon', name: 'Polygon', rpcUrl: 'https://api.zan.top/node/v1/polygon/mainnet' },
    { id: 'arbitrum', name: 'Arbitrum', rpcUrl: 'https://api.zan.top/node/v1/arb/one/mainnet' },
  ],
  features: {
    tracing: true,
    archiveData: false,
    nftApi: false,
    tokenApi: false,
    gasPriceApi: true,
    websocket: false,
    eventLogs: true,
    advancedQuerying: false,
  },
};

/**
 * Infura Provider Configuration (Tier 2)
 * - 15+ chains support
 * - Ethereum ecosystem focus
 */
export const INFURA_PROVIDER_CONFIG: RpcProviderConfig = {
  id: 'infura',
  name: 'Infura',
  tier: 'tier2',
  baseUrl: 'https://mainnet.infura.io/v3',
  priority: 4,
  weight: 2,
  timeout: 15000,
  rateLimitPerSecond: 50,
  rateLimitPerDay: 50000,
  apiKeyRequired: true,
  apiKeyEnvVar: 'INFURA_API_KEY',
  description: 'Infura - Scalable blockchain infrastructure',
  documentation: 'https://docs.infura.io/',
  chains: [
    { id: 'ethereum', name: 'Ethereum', rpcUrl: 'https://mainnet.infura.io/v3' },
    { id: 'polygon', name: 'Polygon', rpcUrl: 'https://polygon-mainnet.infura.io/v3' },
    { id: 'arbitrum', name: 'Arbitrum', rpcUrl: 'https://arbitrum-mainnet.infura.io/v3' },
  ],
  features: {
    tracing: true,
    archiveData: true,
    nftApi: false,
    tokenApi: false,
    gasPriceApi: true,
    websocket: true,
    eventLogs: true,
    advancedQuerying: false,
  },
};

export const PROVIDER_REGISTRY: ProviderRegistry = {
  ankr: ANKR_PROVIDER_CONFIG,
  chainstack: CHAINSTACK_PROVIDER_CONFIG,
  quicknode: QUICKNODE_PROVIDER_CONFIG,
  alchemy: ALCHEMY_PROVIDER_CONFIG,
  zan: ZAN_PROVIDER_CONFIG,
  infura: INFURA_PROVIDER_CONFIG,
};

export const DEFAULT_PROVIDER_TIERS: Record<ProviderTier, string[]> = {
  tier1: ['ankr', 'quicknode', 'alchemy'],
  tier2: ['chainstack', 'zan', 'infura'],
  tier3: [],
};
