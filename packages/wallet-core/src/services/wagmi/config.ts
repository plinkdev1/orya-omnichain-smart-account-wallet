import { http, createConfig, fallback } from 'wagmi';
import {
  mainnet,
  sepolia,
  polygon,
  arbitrum,
  base,
  optimism,
} from 'viem/chains';
import { defineChain } from 'viem';
import type { Chain as ViemChain } from 'viem/chains';
import type { Chain } from '@orya/shared-types';

export type WagmiChain = ViemChain;

const arbitrumNova = defineChain({
  id: 42170,
  name: 'Arbitrum Nova',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://nova.arbitrum.io/rpc'] },
  },
  blockExplorers: {
    default: { name: 'Arbitrum Nova Explorer', url: 'https://nova.arbiscan.io' },
  },
  testnet: false,
});

const zkSync = defineChain({
  id: 324,
  name: 'zkSync Era',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://mainnet.era.zksync.io'] },
  },
  blockExplorers: {
    default: { name: 'zkSync Explorer', url: 'https://explorer.zksync.io' },
  },
  testnet: false,
});

const linea = defineChain({
  id: 59144,
  name: 'Linea',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.linea.build'] },
  },
  blockExplorers: {
    default: { name: 'Linea Explorer', url: 'https://lineascan.build' },
  },
  testnet: false,
});

const scroll = defineChain({
  id: 534352,
  name: 'Scroll',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.scroll.io'] },
  },
  blockExplorers: {
    default: { name: 'Scroll Explorer', url: 'https://scrollscan.com' },
  },
  testnet: false,
});

const blast = defineChain({
  id: 81457,
  name: 'Blast',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.blast.io'] },
  },
  blockExplorers: {
    default: { name: 'Blast Explorer', url: 'https://blastscan.io' },
  },
  testnet: false,
});

const mantaPacific = defineChain({
  id: 169,
  name: 'Manta Pacific',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://pacific-rpc.manta.network/http'] },
  },
  blockExplorers: {
    default: { name: 'Manta Explorer', url: 'https://pacific-explorer.manta.network' },
  },
  testnet: false,
});

const mantle = defineChain({
  id: 5000,
  name: 'Mantle',
  nativeCurrency: { name: 'Mantle', symbol: 'MNT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.mantle.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Mantle Explorer', url: 'https://explorer.mantle.xyz' },
  },
  testnet: false,
});

const monad = defineChain({
  id: 10143,
  name: 'Monad',
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://mainnet-rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://monad.xyz/explorer' },
  },
  testnet: false,
});

const hyperEVM = defineChain({
  id: 17864,
  name: 'HyperEVM',
  nativeCurrency: { name: 'HyperEVM', symbol: 'HYPER', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.hyperevm.io'] },
  },
  blockExplorers: {
    default: { name: 'HyperEVM Explorer', url: 'https://explorer.hyperevm.io' },
  },
  testnet: false,
});

const VIEM_CHAINS: Record<number, ViemChain> = {
  1: mainnet,
  11155111: sepolia,
  137: polygon,
  42161: arbitrum,
  42170: arbitrumNova,
  8453: base,
  10: optimism,
  324: zkSync,
  59144: linea,
  534352: scroll,
  81457: blast,
  169: mantaPacific,
  5000: mantle,
  10143: monad,
  17864: hyperEVM,
};

function convertChainToViemChain(chain: Chain): ViemChain {
  const chainId = parseInt(chain.chainId) || 1;
  if (VIEM_CHAINS[chainId]) {
    return VIEM_CHAINS[chainId];
  }

  return defineChain({
    id: chainId,
    name: chain.name,
    nativeCurrency: {
      name: chain.nativeCoin.symbol,
      symbol: chain.nativeCoin.symbol,
      decimals: chain.nativeCoin.decimals,
    },
    rpcUrls: {
      default: { http: [chain.rpcUrl] },
    },
    blockExplorers: {
      default: { name: `${chain.name} Explorer`, url: chain.blockExplorer },
    },
    testnet: chain.network === 'testnet',
  });
}

let cachedWagmiConfig: any = null;

async function createWagmiConfig() {
  return createConfig({
    chains: [mainnet, arbitrum, base, optimism, polygon, sepolia, zkSync],
    transports: {
      [mainnet.id]: http(),
      [arbitrum.id]: http(),
      [base.id]: http(),
      [optimism.id]: http(),
      [polygon.id]: http(),
      [sepolia.id]: http(),
      [zkSync.id]: http(),
    },
    ssr: true,
  });
}

export async function getWagmiConfig() {
  if (!cachedWagmiConfig) {
    cachedWagmiConfig = await createWagmiConfig();
  }
  return cachedWagmiConfig;
}

export function resetWagmiConfig() {
  cachedWagmiConfig = null;
}

export const DEFAULT_CHAINS = [mainnet, arbitrum, base, optimism, polygon, zkSync] as const;
export const DEFAULT_CHAIN_IDS = DEFAULT_CHAINS.map(c => c.id);

export { DEFAULT_CHAINS as chains };
export type { ViemChain };
