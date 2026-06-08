export interface TronNetworkConfig {
  name: 'mainnet' | 'shasta' | 'nile';
  fullNode: string;
  solidityNode: string;
  eventServer: string;
  chainId: number;
  explorerUrl: string;
}

export const TRON_NETWORKS: Record<string, TronNetworkConfig> = {
  mainnet: {
    name: 'mainnet',
    fullNode: 'https://api.trongrid.io',
    solidityNode: 'https://api.trongrid.io',
    eventServer: 'https://api.trongrid.io',
    chainId: 1,
    explorerUrl: 'https://tronscan.org',
  },
  shasta: {
    name: 'shasta',
    fullNode: 'https://api.shasta.trongrid.io',
    solidityNode: 'https://api.shasta.trongrid.io',
    eventServer: 'https://api.shasta.trongrid.io',
    chainId: 2,
    explorerUrl: 'https://shasta.tronscan.org',
  },
  nile: {
    name: 'nile',
    fullNode: 'https://api.nileex.cn',
    solidityNode: 'https://api.nileex.cn',
    eventServer: 'https://api.nileex.cn',
    chainId: 3,
    explorerUrl: 'https://nile.tronscan.org',
  },
};

export interface Config {
  network: 'mainnet' | 'shasta' | 'nile';
  rpcUrl: string;
  chainId: number;
  fullNode: string;
  solidityNode: string;
  eventServer: string;
  explorerUrl: string;
}

export function loadConfig(): Config {
  const networkName = (process.env.NETWORK || 'mainnet') as 'mainnet' | 'shasta' | 'nile';
  const networkConfig = TRON_NETWORKS[networkName] || TRON_NETWORKS.mainnet;

  return {
    network: networkName,
    rpcUrl: process.env.RPC_URL || networkConfig.fullNode,
    chainId: parseInt(process.env.CHAIN_ID || String(networkConfig.chainId)),
    fullNode: process.env.FULL_NODE || networkConfig.fullNode,
    solidityNode: process.env.SOLIDITY_NODE || networkConfig.solidityNode,
    eventServer: process.env.EVENT_SERVER || networkConfig.eventServer,
    explorerUrl: process.env.EXPLORER_URL || networkConfig.explorerUrl,
  };
}
