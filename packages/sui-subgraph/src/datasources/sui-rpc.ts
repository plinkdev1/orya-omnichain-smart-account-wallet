import { addressCache, transactionCache, objectCache, eventCache } from '../utils/cache.js';

const SUI_GRAPHQL_ENDPOINT = 'https://sui-mainnet.mystenlabs.com/graphql';

async function queryGraphQL(query: string, variables: Record<string, any> = {}): Promise<any> {
  const response = await fetch(SUI_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`SUI GraphQL Error: ${response.statusText}`);
  }

  const result = await response.json();
  if (result.errors) {
    throw new Error(`SUI GraphQL Error: ${result.errors[0]?.message || 'Unknown error'}`);
  }

  return result;
}

export class SUIRpcDataSource {
  async getAddress(address: string): Promise<any> {
    const cacheKey = `address:${address}`;
    const cached = addressCache.get(cacheKey);
    if (cached) return cached;

    try {
      const query = `
        query GetAddress($address: String!) {
          address(address: $address) {
            address
            balance {
              totalBalance
              coinType
            }
            coins {
              pageInfo {
                hasNextPage
                endCursor
              }
              data {
                coinObjectId
                balance
                coinType
              }
            }
          }
        }
      `;

      const result = await queryGraphQL(query, { address });
      addressCache.set(cacheKey, result.data.address, 300);
      return result.data.address;
    } catch (error) {
      throw new Error(`Failed to fetch address ${address}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getBalance(address: string): Promise<any> {
    const cacheKey = `balance:${address}`;
    const cached = addressCache.get(cacheKey);
    if (cached) return cached;

    try {
      const query = `
        query GetBalance($owner: String!) {
          address(address: $owner) {
            balance {
              totalBalance
              coinType
            }
          }
        }
      `;

      const result = await queryGraphQL(query, { owner: address });
      const balance = result.data.address.balance;
      addressCache.set(cacheKey, balance, 300);
      return balance;
    } catch (error) {
      throw new Error(`Failed to fetch balance for ${address}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getCoins(address: string, limit: number = 50): Promise<any[]> {
    const cacheKey = `coins:${address}:${limit}`;
    const cached = addressCache.get<any[]>(cacheKey);
    if (cached) return cached;

    try {
      const query = `
        query GetCoins($owner: String!, $limit: Int) {
          address(address: $owner) {
            coins(first: $limit) {
              data {
                coinObjectId
                balance
                coinType
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      `;

      const result = await queryGraphQL(query, { owner: address, limit });
      const coins: any[] = result.data?.address?.coins?.data || [];
      addressCache.set(cacheKey, coins, 300);
      return coins;
    } catch (error) {
      throw new Error(`Failed to fetch coins for ${address}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getOwnedObjects(address: string, limit: number = 50): Promise<any[]> {
    const cacheKey = `objects:${address}:${limit}`;
    const cached = objectCache.get<any[]>(cacheKey);
    if (cached) return cached;

    try {
      const query = `
        query GetOwnedObjects($owner: String!, $limit: Int) {
          address(address: $owner) {
            objects(first: $limit) {
              data {
                objectId
                version
                digest
                type
                owner {
                  __typename
                  ... on AddressOwner {
                    address
                  }
                  ... on ObjectOwner {
                    objectId
                  }
                  ... on Shared {
                    initialSharedVersion
                  }
                  ... on Immutable
                }
                display {
                  data
                  error
                }
                previousTransaction
                storageRebate
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      `;

      const result = await queryGraphQL(query, { owner: address, limit });
      const objects: any[] = result.data?.address?.objects?.data || [];
      objectCache.set(cacheKey, objects, 600);
      return objects;
    } catch (error) {
      throw new Error(`Failed to fetch objects for ${address}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getTransactionBlock(digest: string): Promise<any> {
    const cacheKey = `tx:${digest}`;
    const cached = transactionCache.get(cacheKey);
    if (cached) return cached;

    try {
      const query = `
        query GetTransactionBlock($digest: String!) {
          transactionBlock(digest: $digest) {
            digest
            sender
            gasPrice
            gasBudget
            gasUsed
            effects {
              status
              gasUsed
            }
            events {
              data {
                id
                packageId
                transactionModule
                eventType
                sender
                timestampMs
              }
            }
            timestamp
          }
        }
      `;

      const result = await queryGraphQL(query, { digest });
      const tx = result.data.transactionBlock;
      transactionCache.set(cacheKey, tx, 600);
      return tx;
    } catch (error) {
      throw new Error(`Failed to fetch transaction ${digest}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async queryEvents(filter: any): Promise<any> {
    const cacheKey = `events:${JSON.stringify(filter)}`;
    const cached = eventCache.get(cacheKey);
    if (cached) return cached;

    try {
      const query = `
        query QueryEvents($filter: EventFilter, $limit: Int) {
          events(filter: $filter, first: $limit) {
            data {
              id
              packageId
              transactionModule
              transactionFunction
              eventType
              sender
              parsedJson
              bcs
              timestampMs
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;

      const result = await queryGraphQL(query, filter);
      const events = result.data.events.data;
      eventCache.set(cacheKey, events, 60);
      return events;
    } catch (error) {
      throw new Error(`Failed to query events: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getTransactions(address: string, limit: number = 20): Promise<any[]> {
    const cacheKey = `user-txs:${address}:${limit}`;
    const cached = transactionCache.get<any[]>(cacheKey);
    if (cached) return cached;

    try {
      const query = `
        query GetTransactions($filter: TransactionFilter!, $limit: Int) {
          transactions(filter: $filter, first: $limit) {
            data {
              digest
              sender
              gasPrice
              gasBudget
              gasUsed
              effects {
                status
              }
              timestamp
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;

      const result = await queryGraphQL(query, {
        filter: { fromAddress: address },
        limit,
      });

      const transactions: any[] = result.data?.transactions?.data || [];
      transactionCache.set(cacheKey, transactions, 600);
      return transactions;
    } catch (error) {
      throw new Error(`Failed to fetch transactions for ${address}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  clearCache(): void {
    addressCache.clear();
    transactionCache.clear();
    objectCache.clear();
    eventCache.clear();
  }
}
