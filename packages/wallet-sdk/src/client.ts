import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';

/**
 * GraphQL SDK Client
 * Wraps Apollo Client for consuming Rust microservices
 * 
 * TODO: Implement in Week 2-3
 * - Auto-generate types from GraphQL schema
 * - Set up query/mutation helpers
 * - Error handling
 */

export interface WalletClientConfig {
  apiUrl: string;
  wsUrl?: string;
}

export class WalletClient {
  private client: ApolloClient<any>;

  constructor(config: WalletClientConfig) {
    // Placeholder implementation
    this.client = new ApolloClient({
      link: new HttpLink({
        uri: config.apiUrl,
        credentials: 'include',
      }),
      cache: new InMemoryCache(),
    });
  }

  getClient() {
    return this.client;
  }
}