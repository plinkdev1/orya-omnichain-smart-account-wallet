/**
 * Blockchain Configuration and Hierarchy
 * Defines chain support, adapters, and feature availability by user tier
 */

import { ChainType } from './chain.types';
import { UserSegment, WalletTypeEnum } from './wallet-profile.types';

export type BlockchainAdapter = 'native' | 'privy' | 'safe' | 'custom';
export type BlockchainFeature = 'swap' | 'stake' | 'bridge' | 'defi' | 'nft';

export interface BlockchainConfig {
  chain: ChainType;
  priority: number;
  adapter: BlockchainAdapter;
  features: BlockchainFeature[];
  minUserSegment: UserSegment;
  enabled: boolean;
  rpcUrl?: string;
  blockExplorer?: string;
}

export const BLOCKCHAIN_HIERARCHY: Record<ChainType, BlockchainConfig> = {
  [ChainType.SUI]: {
    chain: ChainType.SUI,
    priority: 1,
    adapter: 'native',
    features: ['swap', 'stake', 'bridge', 'defi', 'nft'],
    minUserSegment: UserSegment.CRYPTO_NATIVE,
    enabled: true,
  },
  [ChainType.ETHEREUM]: {
    chain: ChainType.ETHEREUM,
    priority: 2,
    adapter: 'privy',
    features: ['swap', 'stake', 'defi', 'nft'],
    minUserSegment: UserSegment.NORMIE,
    enabled: true,
  },
  [ChainType.POLYGON]: {
    chain: ChainType.POLYGON,
    priority: 2,
    adapter: 'privy',
    features: ['swap', 'stake', 'defi', 'nft'],
    minUserSegment: UserSegment.NORMIE,
    enabled: true,
  },
  [ChainType.ARBITRUM]: {
    chain: ChainType.ARBITRUM,
    priority: 2,
    adapter: 'privy',
    features: ['swap', 'stake', 'defi', 'nft'],
    minUserSegment: UserSegment.NORMIE,
    enabled: true,
  },
  [ChainType.OPTIMISM]: {
    chain: ChainType.OPTIMISM,
    priority: 2,
    adapter: 'privy',
    features: ['swap', 'stake', 'defi', 'nft'],
    minUserSegment: UserSegment.NORMIE,
    enabled: true,
  },
  [ChainType.BASE]: {
    chain: ChainType.BASE,
    priority: 2,
    adapter: 'privy',
    features: ['swap', 'stake', 'defi', 'nft'],
    minUserSegment: UserSegment.NORMIE,
    enabled: true,
  },
  [ChainType.ZKSYNC]: {
    chain: ChainType.ZKSYNC,
    priority: 2,
    adapter: 'privy',
    features: ['swap', 'stake', 'defi', 'nft'],
    minUserSegment: UserSegment.NORMIE,
    enabled: true,
  },
  [ChainType.ABSTRACT]: {
    chain: ChainType.ABSTRACT,
    priority: 3,
    adapter: 'privy',
    features: ['swap', 'defi'],
    minUserSegment: UserSegment.NORMIE,
    enabled: true,
  },
  [ChainType.MONAD]: {
    chain: ChainType.MONAD,
    priority: 3,
    adapter: 'privy',
    features: ['swap', 'stake', 'defi'],
    minUserSegment: UserSegment.NORMIE,
    enabled: true,
  },
  [ChainType.HYPEREVM]: {
    chain: ChainType.HYPEREVM,
    priority: 3,
    adapter: 'privy',
    features: ['swap', 'defi'],
    minUserSegment: UserSegment.NORMIE,
    enabled: true,
  },
  [ChainType.BSC]: {
    chain: ChainType.BSC,
    priority: 2,
    adapter: 'privy',
    features: ['swap', 'stake', 'defi', 'nft'],
    minUserSegment: UserSegment.NORMIE,
    enabled: true,
  },
  [ChainType.AVALANCHE]: {
    chain: ChainType.AVALANCHE,
    priority: 2,
    adapter: 'privy',
    features: ['swap', 'stake', 'defi', 'nft'],
    minUserSegment: UserSegment.NORMIE,
    enabled: true,
  },
  [ChainType.FANTOM]: {
    chain: ChainType.FANTOM,
    priority: 3,
    adapter: 'privy',
    features: ['swap', 'stake', 'defi', 'nft'],
    minUserSegment: UserSegment.NORMIE,
    enabled: true,
  },
  [ChainType.SOLANA]: {
    chain: ChainType.SOLANA,
    priority: 1,
    adapter: 'custom',
    features: ['swap', 'stake', 'defi', 'nft'],
    minUserSegment: UserSegment.CRYPTO_NATIVE,
    enabled: true,
  },
  [ChainType.GNOSIS]: {
    chain: ChainType.GNOSIS,
    priority: 3,
    adapter: 'safe',
    features: ['defi'],
    minUserSegment: UserSegment.INSTITUTIONAL,
    enabled: true,
  },
  [ChainType.BTCFI]: {
    chain: ChainType.BTCFI,
    priority: 3,
    adapter: 'custom',
    features: ['stake', 'defi'],
    minUserSegment: UserSegment.CRYPTO_NATIVE,
    enabled: true,
  },

  [ChainType.APTOS]: {
    chain: ChainType.APTOS,
    priority: 4,
    adapter: 'custom',
    features: ['swap', 'defi'],
    minUserSegment: UserSegment.CRYPTO_NATIVE,
    enabled: false,
  },
  [ChainType.PLASMA]: {
    chain: ChainType.PLASMA,
    priority: 4,
    adapter: 'custom',
    features: ['swap', 'defi'],
    minUserSegment: UserSegment.CRYPTO_NATIVE,
    enabled: false,
  },
  [ChainType.HUMAN]: {
    chain: ChainType.HUMAN,
    priority: 4,
    adapter: 'custom',
    features: ['defi'],
    minUserSegment: UserSegment.NORMIE,
    enabled: false,
  },
  [ChainType.BITLAYER]: {
    chain: ChainType.BITLAYER,
    priority: 4,
    adapter: 'custom',
    features: ['swap', 'defi'],
    minUserSegment: UserSegment.CRYPTO_NATIVE,
    enabled: false,
  },
  [ChainType.EVM]: {
    chain: ChainType.EVM,
    priority: 4,
    adapter: 'custom',
    features: [],
    minUserSegment: UserSegment.CRYPTO_NATIVE,
    enabled: false,
  },
  [ChainType.MOVEMENT]: {
    chain: ChainType.MOVEMENT,
    priority: 4,
    adapter: 'custom',
    features: ['swap', 'defi'],
    minUserSegment: UserSegment.CRYPTO_NATIVE,
    enabled: false,
  },
  [ChainType.COSMOS]: {
    chain: ChainType.COSMOS,
    priority: 4,
    adapter: 'custom',
    features: ['swap', 'stake'],
    minUserSegment: UserSegment.CRYPTO_NATIVE,
    enabled: false,
  },
  [ChainType.TON]: {
    chain: ChainType.TON,
    priority: 4,
    adapter: 'custom',
    features: ['swap'],
    minUserSegment: UserSegment.CRYPTO_NATIVE,
    enabled: false,
  },
  [ChainType.NEAR]: {
    chain: ChainType.NEAR,
    priority: 4,
    adapter: 'custom',
    features: ['swap', 'defi'],
    minUserSegment: UserSegment.CRYPTO_NATIVE,
    enabled: false,
  },
  [ChainType.TRON]: {
    chain: ChainType.TRON,
    priority: 4,
    adapter: 'custom',
    features: ['swap', 'defi'],
    minUserSegment: UserSegment.CRYPTO_NATIVE,
    enabled: false,
  },
  [ChainType.CARDANO]: {
    chain: ChainType.CARDANO,
    priority: 4,
    adapter: 'custom',
    features: ['swap'],
    minUserSegment: UserSegment.CRYPTO_NATIVE,
    enabled: false,
  },
  [ChainType.SUBSTRATE]: {
    chain: ChainType.SUBSTRATE,
    priority: 4,
    adapter: 'custom',
    features: ['swap', 'stake'],
    minUserSegment: UserSegment.CRYPTO_NATIVE,
    enabled: false,
  },
  [ChainType.BITCOIN]: {
    chain: ChainType.BITCOIN,
    priority: 4,
    adapter: 'custom',
    features: [],
    minUserSegment: UserSegment.CRYPTO_NATIVE,
    enabled: false,
  },
};

export function isChainSupportedForUserSegment(
  chain: ChainType,
  userSegment: UserSegment
): boolean {
  const config = BLOCKCHAIN_HIERARCHY[chain];
  if (!config || !config.enabled) {
    return false;
  }
  
  const segmentHierarchy = {
    [UserSegment.NORMIE]: 0,
    [UserSegment.CRYPTO_NATIVE]: 1,
    [UserSegment.INSTITUTIONAL]: 2,
  };
  
  return segmentHierarchy[userSegment] >= segmentHierarchy[config.minUserSegment];
}

export function getSupportedChains(userSegment: UserSegment): ChainType[] {
  return Object.values(ChainType).filter((chain) =>
    isChainSupportedForUserSegment(chain, userSegment)
  );
}

export function getChainConfig(chain: ChainType): BlockchainConfig | undefined {
  return BLOCKCHAIN_HIERARCHY[chain];
}
