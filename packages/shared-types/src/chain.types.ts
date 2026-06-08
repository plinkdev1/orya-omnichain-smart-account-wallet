/**
 * Blockchain chain types
 */

export enum ChainType {
  // Tier-1: Primary chains
  SUI = 'sui',
  ETHEREUM = 'ethereum',
  SOLANA = 'solana',
  APTOS = 'aptos',
  
  // Tier-2: Layer-2 & Alt-L1s
  POLYGON = 'polygon',
  BASE = 'base',
  ARBITRUM = 'arbitrum',
  OPTIMISM = 'optimism',
  ZKSYNC = 'zksync',
  
  // Tier-3: Emerging & Experimental
  ABSTRACT = 'abstract',
  MONAD = 'monad',
  PLASMA = 'plasma',
  HUMAN = 'human',
  BITLAYER = 'bitlayer',
  HYPEREVM = 'hyperevm',
  BSC = 'bsc',
  AVALANCHE = 'avalanche',
  FANTOM = 'fantom',
  
  // Specialized
  GNOSIS = 'gnosis',
  BTCFI = 'btcfi',
  
  // VM-based chains (for compatibility layer)
  EVM = 'evm',
  MOVEMENT = 'movement',
  COSMOS = 'cosmos',
  TON = 'ton',
  NEAR = 'near',
  TRON = 'tron',
  CARDANO = 'cardano',
  SUBSTRATE = 'substrate',
  BITCOIN = 'bitcoin',
}

export type ChainId = ChainType | string;

export enum NetworkType {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
  DEVNET = 'devnet',
}

export interface Chain {
  id: string;
  type: ChainType;
  name: string;
  network: NetworkType;
  rpcUrl: string;
  wsUrl?: string;
  blockExplorer: string;
  nativeCoin: {
    symbol: string;
    decimals: number;
    icon?: string;
  };
  chainId: string;
  isActive: boolean;
  priority: number;
}

export interface ChainConnection {
  chainType: ChainType;
  walletAddress: string;
  isConnected: boolean;
  connectedAt?: string;
}

export interface RpcConfig {
  chainType: ChainType;
  url: string;
  wsUrl?: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

const chainMetadata: Record<string, any> = {
  [ChainType.SUI]: { isTestnet: false },
  [ChainType.ETHEREUM]: { isTestnet: false },
  [ChainType.SOLANA]: { isTestnet: false },
  [ChainType.APTOS]: { isTestnet: false },
  [ChainType.POLYGON]: { isTestnet: false },
  [ChainType.BASE]: { isTestnet: false },
  [ChainType.ARBITRUM]: { isTestnet: false },
  [ChainType.OPTIMISM]: { isTestnet: false },
  [ChainType.ZKSYNC]: { isTestnet: false },
  [ChainType.ABSTRACT]: { isTestnet: false },
  [ChainType.MONAD]: { isTestnet: false },
  [ChainType.PLASMA]: { isTestnet: false },
  [ChainType.HUMAN]: { isTestnet: false },
  [ChainType.BITLAYER]: { isTestnet: false },
  [ChainType.HYPEREVM]: { isTestnet: false },
  [ChainType.BSC]: { isTestnet: false },
  [ChainType.AVALANCHE]: { isTestnet: false },
  [ChainType.FANTOM]: { isTestnet: false },
  [ChainType.GNOSIS]: { isTestnet: false },
  [ChainType.BTCFI]: { isTestnet: false },
  [ChainType.EVM]: { isTestnet: false },
  [ChainType.MOVEMENT]: { isTestnet: false },
  [ChainType.COSMOS]: { isTestnet: false },
  [ChainType.TON]: { isTestnet: false },
  [ChainType.NEAR]: { isTestnet: false },
  [ChainType.TRON]: { isTestnet: false },
  [ChainType.CARDANO]: { isTestnet: false },
  [ChainType.SUBSTRATE]: { isTestnet: false },
  [ChainType.BITCOIN]: { isTestnet: false },
};

export function getChain(chainId: ChainId): any {
  return chainMetadata[chainId] || null;
}