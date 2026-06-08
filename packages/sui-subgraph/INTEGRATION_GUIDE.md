# SUI Subgraph Integration Guide

This guide explains how to set up and integrate the SUI subgraph with the ORYA Apollo Gateway.

## Quick Start

### 1. Install Dependencies

```bash
cd packages/sui-subgraph
pnpm install
```

### 2. Build the Subgraph

```bash
pnpm build
```

### 3. Start the Subgraph Server

```bash
pnpm dev
```

The server will start on `http://localhost:4005`

## Architecture

```
Client Applications
        ↓
    Apollo Router (Gateway)
        ↓
    ┌───────┴────────────┬─────────────┐
    ↓                    ↓             ↓
sui-subgraph      users-subgraph   other-subgraphs
    ↓
SUI GraphQL RPC
(https://sui-mainnet.mystenlabs.com/graphql)
```

## Setup Steps

### Step 1: Configure Apollo Router

Update `apollo-router/supergraph.yaml`:

```yaml
subgraphs:
  sui-subgraph:
    routing_url: http://localhost:4005
    schema:
      subgraph_url: http://localhost:4005
```

### Step 2: Compose Supergraph

```bash
rover supergraph compose --config supergraph.yaml > supergraph.graphql
```

### Step 3: Start Apollo Router

```bash
rover dev --supergraph supergraph.graphql
```

Apollo Router will now be available at `http://localhost:4000`

## Federation Configuration

### Key Directives

The SUI subgraph uses Apollo Federation v2 with these key directives:

1. **@key** - Defines the primary key for entities
   ```graphql
   type SUIWallet @key(fields: "userId chain") {
     userId: ID!
     chain: String!
     # ...
   }
   ```

2. **@shareable** - Allows type sharing between subgraphs
   ```graphql
   type SUITransaction {
     digest: String! @shareable
     # ...
   }
   ```

3. **@external** - References fields from other subgraphs
   ```graphql
   extend type User @key(fields: "id") {
     id: ID! @external
     suiWallets: [SUIWallet!]!
   }
   ```

## Data Source Integration

### Connect to SUI GraphQL RPC

The `SUIRpcDataSource` automatically connects to:
- **Endpoint**: https://sui-mainnet.mystenlabs.com/graphql
- **Features**:
  - Automatic query batching via DataLoader
  - Multi-layer caching (Node cache + GraphQL level)
  - Error handling and retry logic

### Cache Configuration

TTL settings (in `utils/cache.ts`):

```typescript
walletCache = 300s     // 5 minutes
addressCache = 300s    // 5 minutes  
transactionCache = 600s // 10 minutes
objectCache = 600s     // 10 minutes
eventCache = 60s       // 1 minute
```

## Query Examples

### Through Apollo Router (Federated)

#### Get User with SUI Wallets

```graphql
query GetUserWithSUI($userId: ID!) {
  user(id: $userId) {
    id
    email
    wallets {
      ... on SUIWallet {
        address
        balance {
          total
          coinType
        }
        coins {
          coinType
          balance
        }
      }
    }
  }
}
```

#### Response

```json
{
  "data": {
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "wallets": [
        {
          "__typename": "SUIWallet",
          "address": "0x1234...abcd",
          "balance": {
            "total": "1000000000",
            "coinType": "0x2::sui::SUI"
          },
          "coins": [
            {
              "coinType": "0x2::sui::SUI",
              "balance": "1000000000"
            }
          ]
        }
      ]
    }
  }
}
```

### Direct to Subgraph (Non-Federated)

#### Query SUI Address

```graphql
query GetSUIAddress($address: String!) {
  suiAddress(address: $address) {
    address
    balance {
      total
    }
    coins {
      coinType
      balance
      coinObjectCount
    }
  }
}
```

#### Query User Wallet

```graphql
query GetUserWallet($userId: ID!, $address: String!) {
  suiWallet(userId: $userId, address: $address) {
    userId
    chain
    address
    balance {
      total
      coinType
    }
    transactions(first: 10) {
      edges {
        cursor
        node {
          digest
          sender
          status
          timestamp
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}
```

## Environment Variables

Create a `.env` file in `packages/sui-subgraph`:

```bash
# Server port
PORT=4005

# Environment
NODE_ENV=production

# SUI RPC (uses default, optional)
# SUI_RPC_URL=https://sui-mainnet.mystenlabs.com/graphql

# Cache settings (optional)
# CACHE_TTL_ADDRESS=300
# CACHE_TTL_TRANSACTION=600
```

## Development

### Watch Mode

```bash
pnpm dev
```

Automatically recompiles on file changes.

### Type Checking

```bash
pnpm typecheck
```

Ensures all TypeScript types are correct.

### Linting

```bash
pnpm lint
```

Checks code style and best practices.

## Troubleshooting

### SUI RPC Connection Issues

If you see errors connecting to SUI RPC:

1. Verify endpoint is accessible:
   ```bash
   curl -X POST https://sui-mainnet.mystenlabs.com/graphql \
     -H "Content-Type: application/json" \
     -d '{"query":"query { __typename }"}'
   ```

2. Check network connectivity and firewall

3. Review error logs in console

### Federation Issues

**Issue**: "Cannot find subgraph reference"

**Solution**: Ensure supergraph is properly composed:
```bash
rover supergraph compose --config apollo-router/supergraph.yaml
```

**Issue**: "User type not extending properly"

**Solution**: Verify federation-extensions.graphql is included in schema:
```bash
cat src/federation-extensions.graphql
```

### Cache Issues

To clear all caches:

```typescript
import { walletCache, addressCache, transactionCache, objectCache, eventCache } from './utils/cache';

walletCache.clear();
addressCache.clear();
transactionCache.clear();
objectCache.clear();
eventCache.clear();
```

## Performance Optimization

### 1. DataLoader Batching

Automatically batches GraphQL queries to prevent N+1 problems.

### 2. Multi-Layer Caching

- **Application Layer**: Node cache with configurable TTL
- **Transport Layer**: HTTP caching headers
- **SUI RPC Layer**: Query result memoization

### 3. Query Optimization

Use `first` and `after` parameters for pagination:

```graphql
query {
  suiWallet(userId: "123", address: "0x...") {
    transactions(first: 10, after: "cursor") {
      edges { node { digest } }
      pageInfo { hasNextPage endCursor }
    }
  }
}
```

## Monitoring

### Apollo Studio Integration

To connect to Apollo Studio:

1. Get Apollo API key from https://studio.apollographql.com
2. Set environment variable:
   ```bash
   export APOLLO_KEY=your-api-key
   ```
3. Restart server

### Health Check

```bash
curl http://localhost:4005/.well-known/apollo/server-health
```

Returns:
```json
{ "status": "ok" }
```

## Testing

### Unit Tests

```bash
pnpm test
```

### Integration Tests

```bash
pnpm test:integration
```

## Deployment

### Docker

```bash
docker build -t orya-sui-subgraph .
docker run -p 4005:4005 orya-sui-subgraph
```

### Production Checklist

- [ ] Environment variables configured
- [ ] Caching TTLs optimized
- [ ] Error logging configured
- [ ] Apollo Studio integration enabled
- [ ] Rate limiting configured
- [ ] Health checks passing
- [ ] Federation schema validated

## Next Steps

1. Start the subgraph server
2. Verify health check
3. Compose supergraph with Apollo Router
4. Test federated queries
5. Monitor performance in Apollo Studio

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review SUI GraphQL RPC documentation: https://docs.sui.io/concepts/graphql-rpc
3. Check Apollo Federation docs: https://www.apollographql.com/docs/apollo-server/federation/introduction/

## Related Documentation

- [SUI Subgraph README](./README.md)
- [SUI GraphQL RPC Docs](https://docs.sui.io/concepts/graphql-rpc)
- [Apollo Federation Guide](https://www.apollographql.com/docs/apollo-server/federation/introduction/)
- [Apollo Router Documentation](https://www.apollographql.com/docs/router/)
