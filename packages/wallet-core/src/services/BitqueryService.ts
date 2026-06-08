/**
 * Bitquery GraphQL Service
 * Real-time blockchain data indexing via GraphQL
 * Supports 50+ chains: Ethereum, BSC, Solana, Polygon, Arbitrum, Base, Optimism, SUI (via bridges)
 */

export interface BitqueryConfig {
  apiKey: string;
  apiUrl?: string;
  environment?: 'development' | 'production';
}

export interface GraphQLQuery {
  query: string;
  variables?: Record<string, any>;
}

export interface TokenTransfer {
  transaction_hash: string;
  from_address: string;
  to_address: string;
  token_address: string;
  amount: string;
  amount_decimal: string;
  block_timestamp: string;
  gas_price: string;
  gas_used: string;
}

export interface TokenBalance {
  token_address: string;
  token_symbol: string;
  token_name: string;
  balance: string;
  balance_decimal: string;
  usd_value: number;
}

export interface PortfolioData {
  address: string;
  chain: string;
  native_balance: string;
  native_balance_usd: number;
  tokens: TokenBalance[];
  total_usd_value: number;
  updated_at: string;
}

export interface TransactionHistory {
  hash: string;
  from: string;
  to: string;
  value: string;
  value_usd: number;
  type: 'send' | 'receive' | 'swap' | 'contract_interaction';
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
  gas_price: string;
  gas_used: string;
  chain: string;
}

export interface DeFiPosition {
  protocol: string;
  token_address: string;
  token_symbol: string;
  balance: string;
  balance_decimal: string;
  usd_value: number;
  apy?: number;
}

/**
 * Bitquery Service
 * GraphQL-based blockchain data indexing
 */
export class BitqueryService {
  private config: BitqueryConfig;
  private isInitialized: boolean = false;
  private apiUrl: string;

  constructor(config: BitqueryConfig) {
    this.config = config;
    this.apiUrl = config.apiUrl || 'https://graphql.bitquery.io';
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      if (!this.config.apiKey) {
        throw new Error('Bitquery API key is required');
      }
      this.isInitialized = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize Bitquery: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async executeQuery(query: GraphQLQuery): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey,
        },
        body: JSON.stringify({
          query: query.query,
          variables: query.variables || {},
        }),
      });

      if (!response.ok) {
        throw new Error(`GraphQL error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.errors) {
        throw new Error(`GraphQL error: ${JSON.stringify(data.errors)}`);
      }

      return data.data;
    } catch (error) {
      throw new Error(
        `Failed to execute Bitquery query: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getTokenTransfers(
    address: string,
    chain: string,
    limit: number = 50
  ): Promise<TokenTransfer[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const query: GraphQLQuery = {
      query: `
        query getTransfers($address: String!, $limit: Int!) {
          EVM(dataset: ${this.getDataset(chain)}) {
            Transfers(
              where: {
                TransferFrom: {is: $address}
              }
              limit: {count: $limit}
              orderBy: {descending: Block_Time}
            ) {
              Transaction {
                Hash
              }
              Transfer {
                From
                To
                Currency {
                  Address
                }
              }
              Block {
                Time
              }
            }
          }
        }
      `,
      variables: {
        address: address.toLowerCase(),
        limit,
      },
    };

    try {
      const result = await this.executeQuery(query);
      return (result.EVM?.Transfers || []).map((t: any) => ({
        transaction_hash: t.Transaction?.Hash || '',
        from_address: t.Transfer?.From || '',
        to_address: t.Transfer?.To || '',
        token_address: t.Transfer?.Currency?.Address || '',
        amount: t.Transfer?.Amount || '0',
        amount_decimal: t.Transfer?.AmountDecimal || '0',
        block_timestamp: t.Block?.Time || new Date().toISOString(),
        gas_price: '0',
        gas_used: '0',
      }));
    } catch (error) {
      throw new Error(
        `Failed to get token transfers: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getTransactionHistory(
    address: string,
    chain: string,
    limit: number = 25
  ): Promise<TransactionHistory[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const query: GraphQLQuery = {
      query: `
        query getTransactions($address: String!, $limit: Int!) {
          EVM(dataset: ${this.getDataset(chain)}) {
            Transactions(
              where: {
                any: [
                  {TransactionFrom: {is: $address}}
                  {TransactionTo: {is: $address}}
                ]
              }
              limit: {count: $limit}
              orderBy: {descending: Block_Time}
            ) {
              Transaction {
                Hash
                From
                To
                Value
                Type
                Status
              }
              Block {
                Time
              }
              Gas {
                GasPrice
                GasUsed
              }
            }
          }
        }
      `,
      variables: {
        address: address.toLowerCase(),
        limit,
      },
    };

    try {
      const result = await this.executeQuery(query);
      return (result.EVM?.Transactions || []).map((t: any) => ({
        hash: t.Transaction?.Hash || '',
        from: t.Transaction?.From || '',
        to: t.Transaction?.To || '',
        value: t.Transaction?.Value || '0',
        value_usd: 0,
        type: this.parseTransactionType(t.Transaction?.Type),
        status: t.Transaction?.Status === 'Success' ? 'success' : 'failed',
        timestamp: t.Block?.Time || new Date().toISOString(),
        gas_price: t.Gas?.GasPrice || '0',
        gas_used: t.Gas?.GasUsed || '0',
        chain,
      }));
    } catch (error) {
      throw new Error(
        `Failed to get transaction history: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getPortfolio(
    address: string,
    chain: string
  ): Promise<PortfolioData> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const query: GraphQLQuery = {
      query: `
        query getPortfolio($address: String!) {
          EVM(dataset: ${this.getDataset(chain)}) {
            Address(where: {Address: {is: $address}}) {
              Address
              Balance
              BalanceUSD
              TokenBalances {
                Currency {
                  Address
                  Symbol
                  Name
                  Decimals
                }
                Balance
                BalanceUSD
              }
            }
          }
        }
      `,
      variables: {
        address: address.toLowerCase(),
      },
    };

    try {
      const result = await this.executeQuery(query);
      const addressData = result.EVM?.Address?.[0];

      if (!addressData) {
        return {
          address,
          chain,
          native_balance: '0',
          native_balance_usd: 0,
          tokens: [],
          total_usd_value: 0,
          updated_at: new Date().toISOString(),
        };
      }

      const tokens: TokenBalance[] = (addressData.TokenBalances || []).map((t: any) => ({
        token_address: t.Currency?.Address || '',
        token_symbol: t.Currency?.Symbol || '',
        token_name: t.Currency?.Name || '',
        balance: t.Balance || '0',
        balance_decimal: (
          parseFloat(t.Balance || '0') /
          Math.pow(10, t.Currency?.Decimals || 18)
        ).toString(),
        usd_value: t.BalanceUSD || 0,
      }));

      const totalUsdValue =
        (parseFloat(addressData.BalanceUSD || '0') || 0) +
        tokens.reduce((sum: number, t: TokenBalance) => sum + (t.usd_value || 0), 0);

      return {
        address,
        chain,
        native_balance: addressData.Balance || '0',
        native_balance_usd: parseFloat(addressData.BalanceUSD || '0') || 0,
        tokens,
        total_usd_value: totalUsdValue,
        updated_at: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(
        `Failed to get portfolio: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getDeFiPositions(
    address: string,
    chain: string
  ): Promise<DeFiPosition[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const query: GraphQLQuery = {
      query: `
        query getDeFiPositions($address: String!) {
          EVM(dataset: ${this.getDataset(chain)}) {
            DeFiPositions(
              where: {Address: {is: $address}}
            ) {
              Protocol
              Asset {
                Address
                Symbol
                Decimals
              }
              Balance
              BalanceUSD
              APY
            }
          }
        }
      `,
      variables: {
        address: address.toLowerCase(),
      },
    };

    try {
      const result = await this.executeQuery(query);
      return (result.EVM?.DeFiPositions || []).map((p: any) => ({
        protocol: p.Protocol || '',
        token_address: p.Asset?.Address || '',
        token_symbol: p.Asset?.Symbol || '',
        balance: p.Balance || '0',
        balance_decimal: (
          parseFloat(p.Balance || '0') /
          Math.pow(10, p.Asset?.Decimals || 18)
        ).toString(),
        usd_value: p.BalanceUSD || 0,
        apy: p.APY,
      }));
    } catch (error) {
      throw new Error(
        `Failed to get DeFi positions: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private getDataset(chain: string): string {
    const datasetMap: Record<string, string> = {
      ethereum: 'combined',
      polygon: 'combined',
      bsc: 'combined',
      arbitrum: 'combined',
      optimism: 'combined',
      base: 'combined',
      solana: 'solana',
      avalanche: 'combined',
    };
    return datasetMap[chain.toLowerCase()] || 'combined';
  }

  private parseTransactionType(
    type: string
  ): 'send' | 'receive' | 'swap' | 'contract_interaction' {
    if (!type) return 'contract_interaction';
    const lowerType = type.toLowerCase();
    if (lowerType.includes('call')) return 'contract_interaction';
    if (lowerType.includes('swap') || lowerType.includes('exchange')) return 'swap';
    if (lowerType.includes('transfer') || lowerType.includes('send')) return 'send';
    return 'contract_interaction';
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  getConfig(): BitqueryConfig {
    return { ...this.config };
  }
}

export function createBitqueryService(config: BitqueryConfig): BitqueryService {
  return new BitqueryService(config);
}

let bitqueryServiceInstance: BitqueryService | null = null;

export function initializeBitqueryService(config: BitqueryConfig): BitqueryService {
  if (!bitqueryServiceInstance) {
    bitqueryServiceInstance = createBitqueryService(config);
  }
  return bitqueryServiceInstance;
}

export function getBitqueryService(): BitqueryService | null {
  return bitqueryServiceInstance;
}
