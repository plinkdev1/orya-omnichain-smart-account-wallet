/**
 * Apollo Client Configuration
 * GraphQL client for communicating with API Gateway
 */

import { ApolloClient, InMemoryCache, HttpLink, type NormalizedCacheObject } from '@apollo/client';

const getApiUrl = (): string => {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/graphql';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/graphql';
};

const httpLink = new HttpLink({
  uri: getApiUrl(),
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apolloClient = new ApolloClient<NormalizedCacheObject>({
  link: httpLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          user: {
            merge(existing, incoming) {
              return incoming;
            },
          },
          wallets: {
            merge(existing, incoming) {
              return incoming;
            },
          },
          walletBalance: {
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

export default apolloClient;
