# SUI Subgraph

Apollo Federation subgraph that provides GraphQL access to the SUI blockchain through Mysten Labs' official GraphQL RPC endpoint.

## Features

- **Apollo Federation Support**: Seamlessly integrates with Apollo Gateway for multi-chain queries
- **SUI Blockchain Integration**: Direct connection to https://sui-mainnet.mystenlabs.com/graphql
- **Built-in Caching**: Node-based caching with configurable TTLs for different entity types
- **DataLoader Pattern**: Batch loading to prevent N+1 queries
- **TypeScript Support**: Fully typed resolvers and data sources

## Architecture

```
src/
├── index.ts                 # Apollo Server setup & federation
├── schema.graphql          # Business schema with @key directives
├── datasources/
│   └── sui-rpc.ts         # SUI GraphQL client with caching
├── resolvers/
│   ├── wallet.ts          # Wallet & balance resolvers
│   ├── transaction.ts     # Transaction & event resolvers
│   └── object.ts          # NFT & object resolvers
└── utils/
    └── cache.ts           # Cache manager instances
```

## Schema Overview

### Key Types

- **SUIWallet**: User's SUI wallet with federation key `(userId, chain)`
  - `address`: Wallet address
  - `balance`: SUIBalance object
  - `coins`: Array of coin types and balances
  - `transactions`: Paginated transaction history
  - `nfts`: Owned NFT objects

- **SUITransaction**: On-chain transaction data
  - `digest`: Transaction ID
  - `sender`: Transaction sender address
  - `effects`: Transaction effects with gas info
  - `events`: Associated events
  - `status`: SUCCESS | FAILURE | PENDING

- **SUIObject**: Blockchain objects (NFTs, coins, etc.)
  - `objectId`: Unique object identifier
  - `type`: Object type string
  - `owner`: Owner information
  - `display`: Display metadata

## Usage

### Start the Server

```bash
pnpm install
pnpm dev
```

Server runs on `http://localhost:4005`

### Query Examples

#### Get Wallet Balance

```graphql
query GetWalletBalance($address: String!) {
  suiAddress(address: $address) {
    balance {
      total
      coinType
    }
  }
}
```

#### Get User's SUI Wallet

```graphql
query GetSUIWallet($userId: ID!, $address: String!) {
  suiWallet(userId: $userId, address: $address) {
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

#### Get Transactions (Paginated)

```graphql
query GetTransactions($userId: ID!, $address: String!) {
  suiWallet(userId: $userId, address: $address) {
    transactions(first: 10) {
      edges {
        cursor
        node {
          digest
          sender
          gasUsed
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

#### Query Events

```graphql
query QueryEvents {
  suiEvents(filter: { limit: 50 }) {
    id
    eventType
    sender
    timestampMs
    parsedJson
  }
}
```

### Federation Query Example

```graphql
query {
  user(id: "123") {
    id
    email
    wallets {
      ... on SUIWallet {
        address
        balance {
          total
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

## Caching Strategy

### Cache TTLs

| Entity | TTL | Purpose |
|--------|-----|---------|
| Address/Balance | 5 min | Account state changes infrequently |
| Coins | 5 min | Coin balances update with transactions |
| Transactions | 10 min | Historical data is immutable |
| Objects (NFTs) | 10 min | Object metadata relatively stable |
| Events | 1 min | Real-time event data |

### Cache Management

```typescript
import {
  walletCache,
  addressCache,
  transactionCache,
  objectCache,
  eventCache,
} from './utils/cache';

// Clear specific cache
walletCache.clear();

// Get cache stats
const stats = walletCache.getStats();
```

## Data Source Methods

### SUIRpcDataSource

```typescript
// Get complete address data
await suiRpc.getAddress(address: string)

// Get balance only
await suiRpc.getBalance(address: string)

// Get coins with pagination
await suiRpc.getCoins(address: string, limit?: number)

// Get owned objects (NFTs, etc)
await suiRpc.getOwnedObjects(address: string, limit?: number)

// Get single transaction
await suiRpc.getTransactionBlock(digest: string)

// Query events with filtering
await suiRpc.queryEvents(filter: EventFilterInput)

// Get address's transaction history
await suiRpc.getTransactions(address: string, limit?: number)
```

## Environment Variables

```bash
PORT=4005                    # Server port
NODE_ENV=production         # Environment
```

## Integration with Apollo Router

### Update supergraph.yaml

```yaml
subgraphs:
  sui-subgraph:
    routing_url: http://localhost:4005
    schema:
      subgraph_url: http://localhost:4005
```

### Start Apollo Router

```bash
rover dev --supergraph supergraph.yaml
```

## Error Handling

All errors are wrapped with descriptive messages:

```typescript
try {
  const wallet = await suiRpc.getAddress(address);
} catch (error) {
  // Error: Failed to fetch address 0x123...: [reason]
  console.error(error.message);
}
```

## Performance Considerations

1. **DataLoader**: Automatically batches queries to single objects
2. **Caching**: Reduces redundant GraphQL queries to SUI RPC
3. **Pagination**: Use `first` and `after` for large result sets
4. **Filtering**: Query events with specific filters to reduce data

## Development

### Build

```bash
pnpm build
```

### Type Check

```bash
pnpm typecheck
```

### Lint

```bash
pnpm lint
```

## Related Packages

- `@orya/wallet-core`: Core wallet logic
- `@orya/sui-adapter`: Additional SUI-specific utilities

## References

- [SUI GraphQL RPC Docs](https://docs.sui.io/concepts/graphql-rpc)
- [Apollo Federation](https://www.apollographql.com/docs/apollo-server/federation/introduction/)
- [Apollo Subgraph](https://www.apollographql.com/docs/apollo-server/subgraphs-intro/)
