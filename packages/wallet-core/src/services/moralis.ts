/**
 * Moralis SDK Integration
 * Real-time blockchain data, portfolio monitoring, and event tracking
 * Supports multiple blockchains: Ethereum, Polygon, Solana, BSC, Avalanche, etc.
 */

export interface MoralisConfig {
  apiKey: string;
  environment?: 'development' | 'production';
  apiUrl?: string;
}

export interface PortfolioToken {
  token_address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balance_formatted: string;
  dollar_value: number;
  percentage_relative_to_wallet: number;
  usd_price: number;
  logo: string;
  thumbnail: string;
}

export interface Portfolio {
  address: string;
  chain: string;
  tokens: PortfolioToken[];
  total_value_usd: number;
  portfolio_collection_updated_at: string;
}

export interface ChainBalance {
  chain: string;
  balance: string;
  balance_formatted: string;
  decimals: number;
  usd_price: number;
  usd_value: number;
}

export interface MultiChainBalance {
  address: string;
  balances: ChainBalance[];
  total_usd_value: number;
}

export interface Transaction {
  hash: string;
  from_address: string;
  to_address: string;
  value: string;
  value_formatted: string;
  gas: string;
  gas_price: string;
  transaction_fee: string;
  transaction_fee_formatted: string;
  block_timestamp: string;
  block_number: string;
  chain: string;
  status: 'success' | 'failed' | 'pending';
}

export interface NftMetadata {
  token_id: string;
  contract_address: string;
  owner_of: string;
  token_uri: string;
  metadata: any;
  block_number: string;
  block_number_minted: string;
  token_hash: string;
  amount: string;
  contract_type: string;
  name: string;
  symbol: string;
  token_address: string;
  last_token_uri_sync: string;
  last_metadata_sync: string;
}

export interface TokenPrice {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  usd_price: number;
  usd_price_24h_ago: number;
  usd_price_24h_change: number;
  usd_market_cap: number;
  usd_market_cap_24h_ago: number;
  usd_market_cap_change_24h: number;
  market_cap_rank: number;
  logo: string;
  thumbnail: string;
}

/**
 * Moralis Service for blockchain data aggregation
 */
export class MoralisService {
  private config: MoralisConfig;
  private isInitialized: boolean = false;
  private apiUrl: string;

  constructor(config: MoralisConfig) {
    this.config = config;
    this.apiUrl = config.apiUrl || 'https://deep-index.moralis.io/api/v2.2';
  }

  /**
   * Initialize Moralis service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      if (!this.config.apiKey) {
        throw new Error('Moralis API key is required');
      }
      this.isInitialized = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize Moralis: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get native balance for an address on a specific chain
   */
  async getNativeBalance(address: string, chain: string): Promise<ChainBalance> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await fetch(
        `${this.apiUrl}/${address}/balance?chain=${chain}`,
        {
          headers: {
            'X-API-Key': this.config.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get balance: ${response.statusText}`);
      }

      const data = (await response.json()) as any;

      return {
        chain,
        balance: data.balance || '0',
        balance_formatted: data.balance_formatted || '0',
        decimals: 18,
        usd_price: data.usd_price || 0,
        usd_value: data.usd_value || 0,
      };
    } catch (error) {
      throw new Error(
        `Failed to get native balance: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get token balances for an address on a specific chain
   */
  async getTokenBalances(address: string, chain: string): Promise<PortfolioToken[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await fetch(
        `${this.apiUrl}/${address}/erc20?chain=${chain}&exclude_spam=true`,
        {
          headers: {
            'X-API-Key': this.config.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get token balances: ${response.statusText}`);
      }

      const data = (await response.json()) as { result: PortfolioToken[] };
      return data.result || [];
    } catch (error) {
      throw new Error(
        `Failed to get token balances: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get multi-chain balance aggregation
   */
  async getMultiChainBalance(
    address: string,
    chains: string[]
  ): Promise<MultiChainBalance> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const balances: ChainBalance[] = [];
      let totalUsdValue = 0;

      for (const chain of chains) {
        const balance = await this.getNativeBalance(address, chain);
        balances.push(balance);
        totalUsdValue += balance.usd_value;
      }

      return {
        address,
        balances,
        total_usd_value: totalUsdValue,
      };
    } catch (error) {
      throw new Error(
        `Failed to get multi-chain balance: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get transaction history for an address
   */
  async getTransactionHistory(
    address: string,
    chain: string,
    limit: number = 25
  ): Promise<Transaction[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await fetch(
        `${this.apiUrl}/${address}?chain=${chain}&limit=${limit}`,
        {
          headers: {
            'X-API-Key': this.config.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get transactions: ${response.statusText}`);
      }

      const data = (await response.json()) as { result: Transaction[] };
      return data.result || [];
    } catch (error) {
      throw new Error(
        `Failed to get transaction history: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get NFT metadata for an address
   */
  async getNFTs(
    address: string,
    chain: string,
    limit: number = 25
  ): Promise<NftMetadata[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await fetch(
        `${this.apiUrl}/${address}/nft?chain=${chain}&limit=${limit}&exclude_spam=true`,
        {
          headers: {
            'X-API-Key': this.config.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get NFTs: ${response.statusText}`);
      }

      const data = (await response.json()) as { result: NftMetadata[] };
      return data.result || [];
    } catch (error) {
      throw new Error(
        `Failed to get NFTs: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get ERC20 token price
   */
  async getTokenPrice(
    tokenAddress: string,
    chain: string
  ): Promise<TokenPrice | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await fetch(
        `${this.apiUrl}/erc20/${tokenAddress}/price?chain=${chain}`,
        {
          headers: {
            'X-API-Key': this.config.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to get token price: ${response.statusText}`);
      }

      const data = (await response.json()) as TokenPrice;
      return data;
    } catch (error) {
      throw new Error(
        `Failed to get token price: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get portfolio for an address (aggregated data)
   */
  async getPortfolio(address: string, chain: string): Promise<Portfolio> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const nativeBalance = await this.getNativeBalance(address, chain);
      const tokens = await this.getTokenBalances(address, chain);

      let totalValue = nativeBalance.usd_value;
      tokens.forEach((token) => {
        totalValue += token.dollar_value || 0;
      });

      return {
        address,
        chain,
        tokens,
        total_value_usd: totalValue,
        portfolio_collection_updated_at: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(
        `Failed to get portfolio: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check if initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get config
   */
  getConfig(): MoralisConfig {
    return { ...this.config };
  }
}

/**
 * Factory function to create Moralis service
 */
export function createMoralisService(config: MoralisConfig): MoralisService {
  return new MoralisService(config);
}

let moralisServiceInstance: MoralisService | null = null;

/**
 * Initialize Moralis service singleton
 */
export function initializeMoralisService(config: MoralisConfig): MoralisService {
  if (!moralisServiceInstance) {
    moralisServiceInstance = createMoralisService(config);
  }
  return moralisServiceInstance;
}

/**
 * Get Moralis service singleton
 */
export function getMoralisService(): MoralisService | null {
  return moralisServiceInstance;
}
