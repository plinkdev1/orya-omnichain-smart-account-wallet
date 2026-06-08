import axios from 'axios';

interface RpcProvider {
  url: string;
  priority: number;
  name: string;
}

export class RpcManager {
  private providers: Map<string, RpcProvider[]> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    const rpcConfig: Record<string, RpcProvider[]> = {
      ethereum: [
        {
          url: process.env.ALCHEMY_API_KEY
            ? `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
            : 'https://eth-mainnet.alchemyapi.io/v2/',
          priority: 1,
          name: 'Alchemy',
        },
        {
          url: process.env.QUICKNODE_API_KEY
            ? `https://quicknode.com/api/v1/${process.env.QUICKNODE_API_KEY}`
            : 'https://eth-mainnet.infura.io/v3/',
          priority: 2,
          name: 'QuickNode',
        },
        {
          url: 'https://rpc.ankr.com/eth',
          priority: 3,
          name: 'Ankr',
        },
      ],
      base: [
        {
          url: process.env.BASE_RPC_HTTPS || 'https://base.llamarpc.com',
          priority: 1,
          name: 'Chainstack',
        },
        {
          url: 'https://base.publicrpc.com',
          priority: 2,
          name: 'PublicRPC',
        },
      ],
      polygon: [
        {
          url: 'https://polygon-rpc.com/',
          priority: 1,
          name: 'Polygon',
        },
        {
          url: 'https://rpc.ankr.com/polygon',
          priority: 2,
          name: 'Ankr',
        },
      ],
      arbitrum: [
        {
          url: 'https://arb1.arbitrum.io/rpc',
          priority: 1,
          name: 'Arbitrum',
        },
        {
          url: 'https://rpc.ankr.com/arbitrum',
          priority: 2,
          name: 'Ankr',
        },
      ],
      optimism: [
        {
          url: 'https://mainnet.optimism.io',
          priority: 1,
          name: 'Optimism',
        },
        {
          url: 'https://rpc.ankr.com/optimism',
          priority: 2,
          name: 'Ankr',
        },
      ],
      sui: [
        {
          url: process.env.SUI_RPC_URL || 'https://fullnode.mainnet.sui.io',
          priority: 1,
          name: 'SUI',
        },
      ],
      solana: [
        {
          url: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
          priority: 1,
          name: 'Solana',
        },
      ],
    };

    Object.entries(rpcConfig).forEach(([chain, providers]) => {
      this.providers.set(chain, providers.sort((a, b) => a.priority - b.priority));
    });
  }

  async request(
    chainId: string,
    method: string,
    params: any[] = []
  ): Promise<any> {
    const providers = this.providers.get(chainId);
    if (!providers || providers.length === 0) {
      throw new Error(`No RPC providers configured for chain: ${chainId}`);
    }

    let lastError: Error | null = null;

    for (const provider of providers) {
      try {
        const response = await axios.post(
          provider.url,
          {
            jsonrpc: '2.0',
            id: Math.random(),
            method,
            params,
          },
          { timeout: 5000 }
        );

        if (response.data.error) {
          lastError = new Error(response.data.error.message);
          continue;
        }

        return response.data.result;
      } catch (error) {
        lastError = error as Error;
        continue;
      }
    }

    throw new Error(`All RPC providers failed for ${chainId}: ${lastError?.message}`);
  }

  async estimateGas(
    chainId: string,
    from: string,
    to: string,
    data: string,
    value?: string
  ): Promise<string> {
    try {
      const gasEstimate = await this.request(chainId, 'eth_estimateGas', [
        {
          from,
          to,
          data,
          value: value || '0x0',
        },
      ]);
      return gasEstimate;
    } catch (error) {
      throw new Error(`Failed to estimate gas on ${chainId}: ${(error as Error).message}`);
    }
  }

  async getGasPrice(chainId: string): Promise<string> {
    try {
      const gasPrice = await this.request(chainId, 'eth_gasPrice', []);
      return gasPrice;
    } catch (error) {
      throw new Error(`Failed to get gas price for ${chainId}: ${(error as Error).message}`);
    }
  }

  async getBalance(chainId: string, address: string): Promise<string> {
    try {
      const balance = await this.request(chainId, 'eth_getBalance', [address, 'latest']);
      return balance;
    } catch (error) {
      throw new Error(`Failed to get balance on ${chainId}: ${(error as Error).message}`);
    }
  }
}
