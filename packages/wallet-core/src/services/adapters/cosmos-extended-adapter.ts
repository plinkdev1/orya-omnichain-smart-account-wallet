import type { Chain } from '@orya/shared-types';
import { StargateClient, SigningStargateClient } from '@cosmjs/stargate';

export interface CosmosChainConfig {
  chainId: string;
  chainName: string;
  rpc: string;
  rest: string;
  coinType: number;
  prefix: string;
  bip44?: {
    coinType: number;
  };
  denomSymbol: string;
  decimals: number;
}

export interface CosmosWalletAccount {
  address: string;
  publicKey?: string;
  chainId?: string;
  label?: string;
}

export const COSMOS_CHAINS: Record<string, CosmosChainConfig> = {
  'cosmoshub-4': {
    chainId: 'cosmoshub-4',
    chainName: 'Cosmos Hub',
    rpc: 'https://rpc.cosmos.directory/cosmoshub',
    rest: 'https://lcd.cosmos.directory/cosmoshub',
    coinType: 118,
    prefix: 'cosmos',
    denomSymbol: 'ATOM',
    decimals: 6,
  },
  'osmosis-1': {
    chainId: 'osmosis-1',
    chainName: 'Osmosis',
    rpc: 'https://rpc.cosmos.directory/osmosis',
    rest: 'https://lcd.cosmos.directory/osmosis',
    coinType: 118,
    prefix: 'osmo',
    denomSymbol: 'OSMO',
    decimals: 6,
  },
  'celestia': {
    chainId: 'celestia',
    chainName: 'Celestia',
    rpc: 'https://rpc.cosmos.directory/celestia',
    rest: 'https://lcd.cosmos.directory/celestia',
    coinType: 118,
    prefix: 'celestia',
    denomSymbol: 'TIA',
    decimals: 6,
  },
  'injective-1': {
    chainId: 'injective-1',
    chainName: 'Injective',
    rpc: 'https://rpc.cosmos.directory/injective',
    rest: 'https://lcd.cosmos.directory/injective',
    coinType: 60,
    prefix: 'inj',
    denomSymbol: 'INJ',
    decimals: 18,
  },
  'axelar': {
    chainId: 'axelar',
    chainName: 'Axelar',
    rpc: 'https://rpc.cosmos.directory/axelar',
    rest: 'https://lcd.cosmos.directory/axelar',
    coinType: 118,
    prefix: 'axelar',
    denomSymbol: 'AXL',
    decimals: 6,
  },
  'stride-1': {
    chainId: 'stride-1',
    chainName: 'Stride',
    rpc: 'https://rpc.cosmos.directory/stride',
    rest: 'https://lcd.cosmos.directory/stride',
    coinType: 118,
    prefix: 'stride',
    denomSymbol: 'STRD',
    decimals: 6,
  },
  'dydx-mainnet-1': {
    chainId: 'dydx-mainnet-1',
    chainName: 'dYdX',
    rpc: 'https://rpc.cosmos.directory/dydx',
    rest: 'https://lcd.cosmos.directory/dydx',
    coinType: 118,
    prefix: 'dydx',
    denomSymbol: 'DYDX',
    decimals: 18,
  },
  'juno-1': {
    chainId: 'juno-1',
    chainName: 'Juno',
    rpc: 'https://rpc.cosmos.directory/juno',
    rest: 'https://lcd.cosmos.directory/juno',
    coinType: 118,
    prefix: 'juno',
    denomSymbol: 'JUNO',
    decimals: 6,
  },
  'stargaze-1': {
    chainId: 'stargaze-1',
    chainName: 'Stargaze',
    rpc: 'https://rpc.cosmos.directory/stargaze',
    rest: 'https://lcd.cosmos.directory/stargaze',
    coinType: 118,
    prefix: 'stars',
    denomSymbol: 'STARS',
    decimals: 6,
  },
  'secret-4': {
    chainId: 'secret-4',
    chainName: 'Secret Network',
    rpc: 'https://rpc.cosmos.directory/secretnetwork',
    rest: 'https://lcd.cosmos.directory/secretnetwork',
    coinType: 529,
    prefix: 'secret',
    denomSymbol: 'SCRT',
    decimals: 6,
  },
  'evmos_9001-2': {
    chainId: 'evmos_9001-2',
    chainName: 'Evmos',
    rpc: 'https://rpc.cosmos.directory/evmos',
    rest: 'https://lcd.cosmos.directory/evmos',
    coinType: 60,
    prefix: 'evmos',
    denomSymbol: 'EVMOS',
    decimals: 18,
  },
  'canto_7160-1': {
    chainId: 'canto_7160-1',
    chainName: 'Canto',
    rpc: 'https://rpc.cosmos.directory/canto',
    rest: 'https://lcd.cosmos.directory/canto',
    coinType: 60,
    prefix: 'canto',
    denomSymbol: 'CANTO',
    decimals: 18,
  },
  'kava_2222-10': {
    chainId: 'kava_2222-10',
    chainName: 'Kava',
    rpc: 'https://rpc.cosmos.directory/kava',
    rest: 'https://lcd.cosmos.directory/kava',
    coinType: 118,
    prefix: 'kava',
    denomSymbol: 'KAVA',
    decimals: 6,
  },
  'migaloo-1': {
    chainId: 'migaloo-1',
    chainName: 'Migaloo',
    rpc: 'https://rpc.cosmos.directory/migaloo',
    rest: 'https://lcd.cosmos.directory/migaloo',
    coinType: 118,
    prefix: 'migaloo',
    denomSymbol: 'WHALE',
    decimals: 6,
  },
  'sei-1': {
    chainId: 'sei-1',
    chainName: 'Sei',
    rpc: 'https://rpc.cosmos.directory/sei',
    rest: 'https://lcd.cosmos.directory/sei',
    coinType: 118,
    prefix: 'sei',
    denomSymbol: 'SEI',
    decimals: 6,
  },
};

export class CosmosExtendedAdapter {
  private client: StargateClient | null = null;
  private chain: CosmosChainConfig;
  private account: CosmosWalletAccount | null = null;

  constructor(chainId: string = 'cosmoshub-4') {
    const config = COSMOS_CHAINS[chainId];
    if (!config) {
      throw new Error(`Unsupported Cosmos chain: ${chainId}`);
    }
    this.chain = config;
  }

  async ensureClient(): Promise<StargateClient> {
    if (!this.client) {
      this.client = await StargateClient.connect(this.chain.rpc);
    }
    return this.client;
  }

  async getBalance(address: string, denom: string = 'uatom'): Promise<number> {
    try {
      const client = await this.ensureClient();
      const balance = await client.getBalance(address, denom);
      return parseFloat(balance.amount) / Math.pow(10, this.chain.decimals);
    } catch (error) {
      console.error('Failed to get Cosmos balance:', error);
      return 0;
    }
  }

  async getAllBalances(address: string): Promise<Array<{ denom: string; amount: string }>> {
    try {
      const client = await this.ensureClient();
      const balances = await client.getAllBalances(address);
      return balances.map(coin => ({ denom: coin.denom, amount: coin.amount }));
    } catch (error) {
      console.error('Failed to get all balances:', error);
      return [];
    }
  }

  async getSequence(address: string): Promise<number> {
    try {
      const client = await this.ensureClient();
      const account = await client.getAccount(address);
      return account?.sequence || 0;
    } catch (error) {
      console.error('Failed to get sequence:', error);
      return 0;
    }
  }

  async getAccountNumber(address: string): Promise<number> {
    try {
      const client = await this.ensureClient();
      const account = await client.getAccount(address);
      return account?.accountNumber || 0;
    } catch (error) {
      console.error('Failed to get account number:', error);
      return 0;
    }
  }

  async getTx(txHash: string): Promise<any> {
    try {
      const client = await this.ensureClient();
      return await client.getTx(txHash);
    } catch (error) {
      console.error('Failed to get transaction:', error);
      return null;
    }
  }

  async searchTx(query: string): Promise<any[]> {
    try {
      const client = await this.ensureClient();
      return await client.searchTx(query);
    } catch (error) {
      console.error('Failed to search transactions:', error);
      return [];
    }
  }

  setWalletAccount(account: CosmosWalletAccount): void {
    this.account = account;
  }

  getWalletAccount(): CosmosWalletAccount | null {
    return this.account;
  }

  getChain(): CosmosChainConfig {
    return this.chain;
  }

  switchChain(chainId: string): void {
    const config = COSMOS_CHAINS[chainId];
    if (!config) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }
    this.chain = config;
    this.client = null;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
    }
    this.account = null;
  }

  static getAvailableChains(): string[] {
    return Object.keys(COSMOS_CHAINS);
  }

  static getChainConfig(chainId: string): CosmosChainConfig | null {
    return COSMOS_CHAINS[chainId] || null;
  }
}

const cosmosAdapterCache = new Map<string, CosmosExtendedAdapter>();

export function getCosmosAdapter(chainId: string = 'cosmoshub-4'): CosmosExtendedAdapter {
  if (!cosmosAdapterCache.has(chainId)) {
    cosmosAdapterCache.set(chainId, new CosmosExtendedAdapter(chainId));
  }
  return cosmosAdapterCache.get(chainId)!;
}

export function clearCosmosAdapterCache(): void {
  cosmosAdapterCache.forEach((adapter) => {
    adapter.disconnect().catch(() => {});
  });
  cosmosAdapterCache.clear();
}
