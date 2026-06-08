/**
 * Apollo Client - Mobile (React Native/Expo)
 * Configured with InMemoryCache, storage abstraction, offline support
 * Uses @orya/wallet-core/storage for consistent storage behavior
 */

import { ApolloClient, HttpLink, InMemoryCache, NormalizedCacheObject } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { StorageFactory } from "@orya/wallet-core/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

let apolloClient: ApolloClient<NormalizedCacheObject> | undefined;

// Initialize storage abstraction for Apollo persistence
const storage = StorageFactory.create('mobile', AsyncStorage);

/**
 * Create Apollo Client instance for React Native
 * TODO: Implement
 * - Configure cache with storage abstraction persistence
 * - Setup authentication (JWT in headers)
 * - Implement offline queue
 * - Add error handling for network errors
 * - Support subscription via WebSocket
 */
function createApolloClient() {
  // Error link for logging
  const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path }) => {
        console.log(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
      });
    }
    if (networkError) {
      console.log(`[Network error]: ${networkError}`);
      // TODO: Queue offline requests
      // Store operation in AsyncStorage for retry
    }
  });

  // HTTP link to API Gateway
  const httpLink = new HttpLink({
    uri: process.env.EXPO_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql",
    fetch: async (uri, options) => {
      // Add authentication token to headers via storage abstraction
      try {
        const token = await storage.getItem("auth-token");
        if (token && options.headers) {
          (options.headers as any).authorization = `Bearer ${token}`;
        }
      } catch (e) {
        console.error("[Apollo] Failed to get auth token", e);
      }
      return fetch(uri, options);
    },
  });

  return new ApolloClient({
    link: errorLink.concat(httpLink),
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            user: {
              merge(existing, incoming) {
                return incoming;
              },
            },
            portfolio: {
              merge(existing, incoming) {
                return incoming;
              },
            },
          },
        },
      },
    }),
    connectToDevTools: __DEV__,
  });
}

/**
 * Initialize Apollo Client (singleton)
 */
export function initializeApollo() {
  if (!apolloClient) {
    apolloClient = createApolloClient();
  }
  return apolloClient;
}

/**
 * Get existing Apollo Client
 */
export function getApolloClient() {
  if (!apolloClient) {
    return initializeApollo();
  }
  return apolloClient;
}

export default initializeApollo();