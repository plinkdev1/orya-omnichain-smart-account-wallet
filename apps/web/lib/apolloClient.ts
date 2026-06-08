/**
 * Apollo Client - Web (Next.js)
 * Configured with InMemoryCache, localStorage persistence, offline support stubs
 */

import { ApolloClient, HttpLink, InMemoryCache, NormalizedCacheObject } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { useMemo } from "react";

let apolloClient: ApolloClient<NormalizedCacheObject> | undefined;

/**
 * Create Apollo Client instance
 * TODO: Implement
 * - Configure cache policies (cache-first, network-only, etc.)
 * - Setup authentication (JWT in headers)
 * - Implement offline caching
 * - Add error handling and logging
 */
function createApolloClient() {
  // Error link for logging
  const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path }) =>
        console.log(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`)
      );
    }
    if (networkError) {
      console.log(`[Network error]: ${networkError}`);
      // TODO: Implement offline handling
    }
  });

  // HTTP link to API Gateway
  const httpLink = new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql",
    credentials: "include", // Send cookies with requests
    fetch: async (uri, options) => {
      // NOTE: Using localStorage directly for synchronous auth token access in fetch callback
      // Zustand store updates auth token when available
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("auth-token");
        if (token && options.headers) {
          (options.headers as any).authorization = `Bearer ${token}`;
        }
      }
      return fetch(uri, options);
    },
  });

  return new ApolloClient({
    ssrMode: typeof window === "undefined", // SSR mode for Next.js
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
    connectToDevTools: process.env.NODE_ENV === "development",
  });
}

/**
 * Initialize Apollo Client
 * Reuse singleton instance for SSR
 */
export function initializeApollo() {
  const _apolloClient = apolloClient ?? createApolloClient();

  // For SSG and SSR always create a new client
  if (typeof window === "undefined") return _apolloClient;

  // Create the Apollo Client once in the client
  if (!apolloClient) apolloClient = _apolloClient;

  return _apolloClient;
}

/**
 * Hook to use Apollo Client in React components
 */
export function useApollo() {
  const store = useMemo(() => initializeApollo(), []);
  return store;
}

export default initializeApollo();