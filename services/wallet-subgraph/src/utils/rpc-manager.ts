import axios, { AxiosInstance } from 'axios';
import logger from './logger';

interface RpcProvider {
  name: string;
  url: string;
  priority: number;
}

interface RpcRequest {
  method: string;
  params: any[];
  id?: number;
}

export class RpcManager {
  private providers: Map<string, RpcProvider[]> = new Map();
  private clients: Map<string, AxiosInstance> = new Map();
  private requestCount: number = 0;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    const chainProviders: Record<string, Array<{ name: string; url: string; priority: number }>> = {
      ethereum: [
        { name: 'alchemy', url: this.buildAlchemyUrl('eth-mainnet'), priority: 1 },
        { name: 'quicknode', url: process.env.QUICKNODE_API_KEY || '', priority: 2 },
        { name: 'zan', url: process.env.ZAN_API_KEY || '', priority: 3 },
        { name: 'infura', url: process.env.INFURA_API_KEY || '', priority: 4 },
        { name: 'ankr', url: process.env.ANKR_API_KEY || '', priority: 5 },
      ],
      base: [
        { name: 'alchemy', url: this.buildAlchemyUrl('base-mainnet'), priority: 1 },
        { name: 'quicknode', url: process.env.QUICKNODE_API_KEY || '', priority: 2 },
      ],
      polygon: [
        { name: 'alchemy', url: this.buildAlchemyUrl('polygon-mainnet'), priority: 1 },
        { name: 'quicknode', url: process.env.QUICKNODE_API_KEY || '', priority: 2 },
      ],
      arbitrum: [
        { name: 'alchemy', url: this.buildAlchemyUrl('arbitrum-mainnet'), priority: 1 },
        { name: 'quicknode', url: process.env.QUICKNODE_API_KEY || '', priority: 2 },
      ],
      optimism: [
        { name: 'alchemy', url: this.buildAlchemyUrl('opt-mainnet'), priority: 1 },
        { name: 'quicknode', url: process.env.QUICKNODE_API_KEY || '', priority: 2 },
      ],
      bsc: [
        { name: 'quicknode', url: process.env.QUICKNODE_API_KEY || '', priority: 1 },
        { name: 'ankr', url: process.env.ANKR_API_KEY || '', priority: 2 },
      ],
      avalanche: [
        { name: 'quicknode', url: process.env.QUICKNODE_API_KEY || '', priority: 1 },
        { name: 'ankr', url: process.env.ANKR_API_KEY || '', priority: 2 },
      ],
    };

    for (const [chain, providers] of Object.entries(chainProviders)) {
      this.providers.set(chain, providers.filter(p => p.url));
    }
  }

  private buildAlchemyUrl(network: string): string {
    const key = process.env.ALCHEMY_API_KEY;
    if (!key) return '';
    return `https://${network}.g.alchemy.com/v2/${key}`;
  }

  async request(chainId: string, request: RpcRequest): Promise<any> {
    const providers = this.providers.get(chainId);
    if (!providers || providers.length === 0) {
      throw new Error(`No RPC providers configured for chain: ${chainId}`);
    }

    let lastError: Error | null = null;

    for (const provider of providers) {
      try {
        const client = this.getClient(provider.url);
        const response = await client.post('', {
          jsonrpc: '2.0',
          method: request.method,
          params: request.params,
          id: this.requestCount++,
        });

        if (response.data.error) {
          lastError = new Error(response.data.error.message);
          logger.warn(`RPC error from ${provider.name}:`, { error: response.data.error });
          continue;
        }

        logger.info(`RPC request successful from ${provider.name}`, {
          chain: chainId,
          method: request.method,
        });
        return response.data.result;
      } catch (error) {
        lastError = error as Error;
        logger.warn(`RPC request failed on ${provider.name}:`, { error: (error as Error).message });
        continue;
      }
    }

    throw new Error(
      `All RPC providers failed for chain ${chainId}: ${lastError?.message || 'Unknown error'}`
    );
  }

  private getClient(url: string): AxiosInstance {
    if (!this.clients.has(url)) {
      this.clients.set(
        url,
        axios.create({
          baseURL: url,
          timeout: 10000,
        })
      );
    }
    return this.clients.get(url)!;
  }

  async getBalance(chainId: string, address: string): Promise<string> {
    const result = await this.request(chainId, {
      method: 'eth_getBalance',
      params: [address, 'latest'],
    });
    return result || '0';
  }

  async getTokenBalance(
    chainId: string,
    walletAddress: string,
    tokenAddress: string,
    decimals: number
  ): Promise<string> {
    const abi = [
      'function balanceOf(address account) external view returns (uint256)',
    ];
    const selector = '0x70a08231';
    const paddedAddress = walletAddress.slice(2).padStart(64, '0');
    const data = `${selector}${paddedAddress}`;

    const result = await this.request(chainId, {
      method: 'eth_call',
      params: [
        {
          to: tokenAddress,
          data,
        },
        'latest',
      ],
    });

    return result || '0';
  }

  async getGasPrice(chainId: string): Promise<string> {
    const result = await this.request(chainId, {
      method: 'eth_gasPrice',
      params: [],
    });
    return result || '0';
  }
}
