/**
 * ORŸA Chain Configuration
 * Shared type definitions for all supported blockchains
 */

export type ChainId =
  | 'sui:mainnet'
  | 'sui:testnet'
  | 'sui:devnet'
  | 'ethereum:mainnet'
  | 'ethereum:sepolia'
  | 'solana:mainnet'
  | 'solana:devnet'
  | 'bitcoin:mainnet'
  | 'bitcoin:testnet'
  | 'polygon:mainnet'
  | 'arbitrum:mainnet'
  | 'arbitrum:nova'
  | 'base:mainnet'
  | 'optimism:mainnet'
  | 'zksync:mainnet'
  | 'linea:mainnet'
  | 'scroll:mainnet'
  | 'blast:mainnet'
  | 'manta:mainnet'
  | 'mantle:mainnet'
  | 'monad:mainnet'
  | 'hyperevm:mainnet'
  | 'cosmos:mainnet'
  | 'cosmos:testnet';

export type ChainType = 'evm' | 'solana' | 'sui' | 'bitcoin' | 'cosmos' | 'ton' | 'near' | 'tron' | 'cardano' | 'substrate' | 'aptos' | 'movement' | 'other';

export interface GasConfig {
  type?: 'legacy' | 'eip1559' | 'eip2930' | 'arbitrum' | 'zksync' | 'solana' | 'move' | 'cosmos' | 'bitcoin' | 'tron';
  gasPrice?: number;
  maxFeePerGas?: number;
  maxPriorityFeePerGas?: number;
  baseFee?: number;
  lamportsPerSignature?: number;
  gasUnitPrice?: number;
  feePerByte?: number;
  feeLimit?: number;
  energyPrice?: number;
  minFeeA?: number;
  minFeeB?: number;
  storageFeePerYear?: number;
  ergsPrice?: number;
  weightPerGas?: number;
  existentialDeposit?: number;
  [key: string]: any;
}

export interface ChainFeatures {
  sponsoredTransactions?: boolean;
  programmableTransactions?: boolean;
  objectModel?: boolean;
  eip1559?: boolean;
  flashbots?: boolean;
  arbitrumNitro?: boolean;
  dac?: boolean;
  zk?: boolean;
  hyperscaling?: boolean;
  spl?: boolean;
  tokenExtensions?: boolean;
  gaming?: boolean;
  modular?: boolean;
  amm?: boolean;
  cosmwasmEnabled?: boolean;
  ibc?: boolean;
  dex?: boolean;
  nft?: boolean;
  perpetuals?: boolean;
  smartContracts?: boolean;
  jetton?: boolean;
  sharding?: boolean;
  crossContract?: boolean;
  fungibleToken?: boolean;
  trc20?: boolean;
  trc721?: boolean;
  utxo?: boolean;
  plutus?: boolean;
  parachains?: boolean;
  xcmp?: boolean;
  governance?: boolean;
  wasmSmartContracts?: boolean;
  evmCompatible?: boolean;
  lending?: boolean;
  parallelExecution?: boolean;
  moveCompatibility?: boolean;
  cosmosInterop?: boolean;
  segwit?: boolean;
  taproot?: boolean;
  ordinals?: boolean;
  blastPoints?: boolean;
  [key: string]: any;
}

export interface Chain {
  id: ChainId;
  name: string;
  symbol: string;
  type: ChainType;
  icon: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  isTestnet: boolean;
  isEnabled: boolean;
  priority: number;
  status: 'healthy' | 'degraded' | 'offline';
  latency?: number;
  chainId?: number;
  gasConfig?: GasConfig;
  features?: ChainFeatures;
}

export const CHAIN_CONFIG: Record<ChainId, Chain> = {
  // SUI Chains (Primary)
  'sui:mainnet': {
    id: 'sui:mainnet',
    name: 'SUI Mainnet',
    symbol: 'SUI',
    type: 'sui',
    icon: '/icons/chains/sui.svg',
    rpcUrl: 'https://fullnode.mainnet.sui.io',
    explorerUrl: 'https://explorer.sui.io',
    nativeCurrency: {
      name: 'SUI',
      symbol: 'SUI',
      decimals: 9,
    },
    isTestnet: false,
    isEnabled: true,
    priority: 1,
    status: 'healthy',
    gasConfig: {
      type: 'move',
      gasPrice: 1,
      gasBudget: 5000000,
      maxGasPrice: 100,
    },
    features: {
      sponsoredTransactions: true,
      programmableTransactions: true,
      objectModel: true,
    },
  },
  'sui:testnet': {
    id: 'sui:testnet',
    name: 'SUI Testnet',
    symbol: 'SUI',
    type: 'sui',
    icon: '/icons/chains/sui.svg',
    rpcUrl: 'https://fullnode.testnet.sui.io',
    explorerUrl: 'https://explorer.testnet.sui.io',
    nativeCurrency: {
      name: 'SUI',
      symbol: 'SUI',
      decimals: 9,
    },
    isTestnet: true,
    isEnabled: true,
    priority: 2,
    status: 'healthy',
  },
  'sui:devnet': {
    id: 'sui:devnet',
    name: 'SUI Devnet',
    symbol: 'SUI',
    type: 'sui',
    icon: '/icons/chains/sui.svg',
    rpcUrl: 'https://fullnode.devnet.sui.io',
    explorerUrl: 'https://explorer.devnet.sui.io',
    nativeCurrency: {
      name: 'SUI',
      symbol: 'SUI',
      decimals: 9,
    },
    isTestnet: true,
    isEnabled: true,
    priority: 3,
    status: 'healthy',
  },

  // Ethereum & EVM Chains
  'ethereum:mainnet': {
    id: 'ethereum:mainnet',
    name: 'Ethereum',
    symbol: 'ETH',
    type: 'evm',
    icon: '/icons/chains/ethereum.svg',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/',
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: false,
    isEnabled: true,
    priority: 4,
    status: 'healthy',
  },
  'ethereum:sepolia': {
    id: 'ethereum:sepolia',
    name: 'Ethereum Sepolia',
    symbol: 'ETH',
    type: 'evm',
    icon: '/icons/chains/ethereum.svg',
    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/',
    explorerUrl: 'https://sepolia.etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: true,
    isEnabled: true,
    priority: 5,
    status: 'healthy',
  },

  // Solana Chains
  'solana:mainnet': {
    id: 'solana:mainnet',
    name: 'Solana',
    symbol: 'SOL',
    type: 'solana',
    icon: '/icons/chains/solana.svg',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://solscan.io',
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9,
    },
    isTestnet: false,
    isEnabled: true,
    priority: 6,
    status: 'healthy',
  },
  'solana:devnet': {
    id: 'solana:devnet',
    name: 'Solana Devnet',
    symbol: 'SOL',
    type: 'solana',
    icon: '/icons/chains/solana.svg',
    rpcUrl: 'https://api.devnet.solana.com',
    explorerUrl: 'https://explorer.solana.com',
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9,
    },
    isTestnet: true,
    isEnabled: true,
    priority: 7,
    status: 'healthy',
  },

  // Bitcoin
  'bitcoin:mainnet': {
    id: 'bitcoin:mainnet',
    name: 'Bitcoin',
    symbol: 'BTC',
    type: 'bitcoin',
    icon: '/icons/chains/bitcoin.svg',
    rpcUrl: 'https://btc.example.com/rpc',
    explorerUrl: 'https://blockstream.info',
    nativeCurrency: {
      name: 'Bitcoin',
      symbol: 'BTC',
      decimals: 8,
    },
    isTestnet: false,
    isEnabled: true,
    priority: 8,
    status: 'healthy',
  },
  'bitcoin:testnet': {
    id: 'bitcoin:testnet',
    name: 'Bitcoin Testnet',
    symbol: 'BTC',
    type: 'bitcoin',
    icon: '/icons/chains/bitcoin.svg',
    rpcUrl: 'https://btc-testnet.example.com/rpc',
    explorerUrl: 'https://testnet.blockstream.info',
    nativeCurrency: {
      name: 'Bitcoin',
      symbol: 'BTC',
      decimals: 8,
    },
    isTestnet: true,
    isEnabled: true,
    priority: 9,
    status: 'healthy',
  },

  // Layer 2s & Alt-L1s
  'polygon:mainnet': {
    id: 'polygon:mainnet',
    name: 'Polygon',
    symbol: 'MATIC',
    type: 'evm',
    icon: '/icons/chains/polygon.svg',
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'Matic',
      symbol: 'MATIC',
      decimals: 18,
    },
    isTestnet: false,
    isEnabled: true,
    priority: 10,
    status: 'healthy',
  },
  'arbitrum:mainnet': {
    id: 'arbitrum:mainnet',
    name: 'Arbitrum One',
    symbol: 'ETH',
    type: 'evm',
    icon: '/icons/chains/arbitrum.svg',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: false,
    isEnabled: true,
    priority: 11,
    status: 'healthy',
  },
  'base:mainnet': {
    id: 'base:mainnet',
    name: 'Base',
    symbol: 'ETH',
    type: 'evm',
    icon: '/icons/chains/base.svg',
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: false,
    isEnabled: true,
    priority: 12,
    status: 'healthy',
  },
  'optimism:mainnet': {
    id: 'optimism:mainnet',
    name: 'Optimism',
    symbol: 'ETH',
    type: 'evm',
    icon: '/icons/chains/optimism.svg',
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: false,
    isEnabled: true,
    priority: 13,
    status: 'healthy',
  },
  'arbitrum:nova': {
    id: 'arbitrum:nova',
    name: 'Arbitrum Nova',
    symbol: 'ETH',
    type: 'evm',
    icon: '/icons/chains/arbitrum.svg',
    rpcUrl: 'https://nova.arbitrum.io/rpc',
    explorerUrl: 'https://nova.arbiscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: false,
    isEnabled: true,
    priority: 14,
    status: 'healthy',
  },
  'zksync:mainnet': {
    id: 'zksync:mainnet',
    name: 'zkSync Era',
    symbol: 'ETH',
    type: 'evm',
    icon: '/icons/chains/zksync.svg',
    rpcUrl: 'https://mainnet.era.zksync.io',
    explorerUrl: 'https://explorer.zksync.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: false,
    isEnabled: true,
    priority: 15,
    status: 'healthy',
  },
  'linea:mainnet': {
    id: 'linea:mainnet',
    name: 'Linea',
    symbol: 'ETH',
    type: 'evm',
    icon: '/icons/chains/linea.svg',
    rpcUrl: 'https://rpc.linea.build',
    explorerUrl: 'https://lineascan.build',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: false,
    isEnabled: true,
    priority: 16,
    status: 'healthy',
  },
  'scroll:mainnet': {
    id: 'scroll:mainnet',
    name: 'Scroll',
    symbol: 'ETH',
    type: 'evm',
    icon: '/icons/chains/scroll.svg',
    rpcUrl: 'https://rpc.scroll.io',
    explorerUrl: 'https://scrollscan.com',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: false,
    isEnabled: true,
    priority: 17,
    status: 'healthy',
  },
  'blast:mainnet': {
    id: 'blast:mainnet',
    name: 'Blast',
    symbol: 'ETH',
    type: 'evm',
    icon: '/icons/chains/blast.svg',
    rpcUrl: 'https://rpc.blast.io',
    explorerUrl: 'https://blastscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: false,
    isEnabled: true,
    priority: 18,
    status: 'healthy',
  },
  'manta:mainnet': {
    id: 'manta:mainnet',
    name: 'Manta Pacific',
    symbol: 'ETH',
    type: 'evm',
    icon: '/icons/chains/manta.svg',
    rpcUrl: 'https://pacific-rpc.manta.network/http',
    explorerUrl: 'https://pacific-explorer.manta.network',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: false,
    isEnabled: true,
    priority: 19,
    status: 'healthy',
  },
  'mantle:mainnet': {
    id: 'mantle:mainnet',
    name: 'Mantle',
    symbol: 'MNT',
    type: 'evm',
    icon: '/icons/chains/mantle.svg',
    rpcUrl: 'https://rpc.mantle.xyz',
    explorerUrl: 'https://explorer.mantle.xyz',
    nativeCurrency: {
      name: 'Mantle',
      symbol: 'MNT',
      decimals: 18,
    },
    isTestnet: false,
    isEnabled: true,
    priority: 20,
    status: 'healthy',
  },
  'monad:mainnet': {
    id: 'monad:mainnet',
    name: 'Monad',
    symbol: 'MON',
    type: 'evm',
    icon: '/icons/chains/monad.svg',
    rpcUrl: 'https://mainnet-rpc.monad.xyz',
    explorerUrl: 'https://monad.xyz/explorer',
    nativeCurrency: {
      name: 'Monad',
      symbol: 'MON',
      decimals: 18,
    },
    isTestnet: false,
    isEnabled: true,
    priority: 21,
    status: 'healthy',
  },
  'hyperevm:mainnet': {
    id: 'hyperevm:mainnet',
    name: 'HyperEVM',
    symbol: 'HYPER',
    type: 'evm',
    icon: '/icons/chains/hyperevm.svg',
    rpcUrl: 'https://rpc.hyperevm.io',
    explorerUrl: 'https://explorer.hyperevm.io',
    nativeCurrency: {
      name: 'HyperEVM',
      symbol: 'HYPER',
      decimals: 18,
    },
    isTestnet: false,
    isEnabled: true,
    priority: 22,
    status: 'healthy',
  },

  'cosmos:mainnet': {
    id: 'cosmos:mainnet',
    name: 'Cosmos Hub',
    symbol: 'ATOM',
    type: 'cosmos',
    icon: '/icons/chains/cosmos.svg',
    rpcUrl: 'https://rpc.cosmos.directory/cosmoshub',
    explorerUrl: 'https://www.mintscan.io/cosmos',
    nativeCurrency: {
      name: 'Atom',
      symbol: 'ATOM',
      decimals: 6,
    },
    isTestnet: false,
    isEnabled: true,
    priority: 23,
    status: 'healthy',
  },
  'cosmos:testnet': {
    id: 'cosmos:testnet',
    name: 'Cosmos Testnet',
    symbol: 'ATOM',
    type: 'cosmos',
    icon: '/icons/chains/cosmos.svg',
    rpcUrl: 'https://rpc.sentry-01.theta-testnet.polkachu.com',
    explorerUrl: 'https://testnet.mintscan.io/cosmos-testnet',
    nativeCurrency: {
      name: 'Atom',
      symbol: 'ATOM',
      decimals: 6,
    },
    isTestnet: true,
    isEnabled: true,
    priority: 24,
    status: 'healthy',
  },
};

/**
 * Get chains sorted by priority (lower number = higher priority)
 */
export function getEnabledChains(): Chain[] {
  return Object.values(CHAIN_CONFIG)
    .filter((chain) => chain.isEnabled)
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Get mainnet chains only
 */
export function getMainnetChains(): Chain[] {
  return getEnabledChains().filter((chain) => !chain.isTestnet);
}

/**
 * Get testnet chains only
 */
export function getTestnetChains(): Chain[] {
  return getEnabledChains().filter((chain) => chain.isTestnet);
}

/**
 * Get chains by type
 */
export function getChainsByType(type: ChainType): Chain[] {
  return getEnabledChains().filter((chain) => chain.type === type);
}

/**
 * Get a specific chain
 */
export function getChain(chainId: ChainId): Chain | undefined {
  return CHAIN_CONFIG[chainId];
}