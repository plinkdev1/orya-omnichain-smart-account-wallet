# Wallet Subgraph Service

**Port**: 4001 (WALLET_SUBGRAPH_PORT)

## Overview

The Wallet Subgraph is a GraphQL federation subgraph that handles wallet management, balance tracking, and NFT support across multiple blockchain chains. It integrates with Privy for MPC wallet creation, RPC providers for multi-chain support, and Alchemy API for NFT fetching.

## Features

- **Multi-Chain Wallet Support**: Create, import, and manage wallets across 14+ blockchains
- **Balance Tracking**: Real-time balance syncing with automatic USD value calculation
- **NFT Management**: Fetch and track NFTs using Alchemy API
- **RPC Failover**: Multi-tier RPC provider failover for reliability
- **Real-Time Updates**: WebSocket subscriptions for balance and wallet updates
- **Caching Strategy**: Optimized caching for balances (30s), portfolio values (60s), and NFTs (5min)
- **User Authorization**: Wallet access control based on user ownership

## Architecture

### Key Services

#### RpcManager (`utils/rpc-manager.ts`)
- Manages multi-chain RPC integration with automatic failover
- Supports Alchemy, QuickNode, ZAN, Infura, and Ankr providers
- Provides methods for balance queries, gas estimates, and token transfers

#### WalletService (`services/wallet-service.ts`)
- Handles wallet lifecycle: creation, import, connection
- Supports multiple wallet types: CUSTODIAL, SELF_CUSTODY, EXTERNAL, MPC
- Validates addresses and private keys per chain

#### BalanceSyncService (`services/balance-sync.ts`)
- Syncs wallet balances from RPC endpoints
- Fetches token prices from CoinGecko
- Calculates portfolio values
- Publishes updates via Redis Pub/Sub

#### NFTService (`services/nft-service.ts`)
- Fetches NFTs using Alchemy API
- Caches NFT data for performance
- Supports multi-chain NFT discovery

### Caching Strategy

| Resource | TTL | Cache Key Pattern |
|----------|-----|-------------------|
| Balances | 30s | `balance:${walletId}:${tokenAddress}` |
| Portfolio Value | 60s | `portfolio:${userId}` |
| NFTs | 5min | `nfts:${walletId}:${chainId}` |
| Wallet | 5min | `wallet:${walletId}` |
| Gas Estimate | 60s | `gas:${chainId}:${from}:${to}` |

## GraphQL Schema

### Queries

```graphql
query GetWallet($id: ID!) {
  wallet(id: $id) {
    id
    userId
    type
    chainType
    address
    balances {
      symbol
      amount
      amountUSD
    }
    nfts {
      name
      contractAddress
      tokenId
    }
  }
}

query GetBalances($walletId: ID!) {
  balances(walletId: $walletId) {
    symbol
    decimals
    amount
    amountUSD
  }
}

query GetPortfolioValue($userId: ID!) {
  totalPortfolioValue(userId: $userId)
}
```

### Mutations

```graphql
mutation CreateWallet($chainId: String!, $type: WalletType!) {
  createWallet(chainId: $chainId, type: $type) {
    id
    address
    chainType
  }
}

mutation SyncBalances($walletId: ID!) {
  syncWalletBalances(walletId: $walletId) {
    symbol
    amount
    amountUSD
  }
}

mutation DeleteWallet($walletId: ID!) {
  deleteWallet(walletId: $walletId)
}
```

### Subscriptions

```graphql
subscription OnBalanceUpdate($walletId: ID!) {
  balanceUpdated(walletId: $walletId) {
    symbol
    amount
    amountUSD
  }
}

subscription OnWalletSync($walletId: ID!) {
  walletSynced(walletId: $walletId) {
    id
    lastSyncedAt
  }
}
```

## Setup & Configuration

### Environment Variables

```env
# Server
WALLET_SUBGRAPH_PORT=4001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/orya_wallet

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# RPC Providers
ALCHEMY_API_KEY=your_alchemy_key
QUICKNODE_API_KEY=your_quicknode_key
ZAN_API_KEY=your_zan_key
INFURA_API_KEY=your_infura_key
ANKR_API_KEY=your_ankr_key

# NFT API
ALCHEMY_NFT_API_KEY=your_alchemy_nft_key

# Authentication
JWT_SECRET=your_jwt_secret
PRIVY_APP_ID=your_privy_app_id

# Supported Chains
SUPPORTED_CHAINS=sui,ethereum,base,polygon,arbitrum,optimism,solana,bitcoin
```

### Installation

```bash
# Install dependencies
pnpm install

# Build TypeScript
pnpm build

# Run in development
pnpm dev

# Start production server
pnpm start
```

### Running Tests

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage
```

### Linting & Type Checking

```bash
# Lint code
pnpm lint

# Type check
pnpm typecheck
```

## API Integration Examples

### Create a Wallet

```bash
curl -X POST http://localhost:4001/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "query": "mutation { createWallet(chainId: \"ethereum\", type: MPC) { id address } }"
  }'
```

### Get Wallet Balances

```bash
curl -X POST http://localhost:4001/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "query": "query { balances(walletId: \"wallet-1\") { symbol amount amountUSD } }"
  }'
```

### Sync Wallet Balances

```bash
curl -X POST http://localhost:4001/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "query": "mutation { syncWalletBalances(walletId: \"wallet-1\") { symbol amount } }"
  }'
```

## RPC Failover Chain Support

- **Ethereum**: Alchemy → QuickNode → ZAN → Infura → Ankr
- **Base**: Alchemy → QuickNode
- **Polygon**: Alchemy → QuickNode
- **Arbitrum**: Alchemy → QuickNode
- **Optimism**: Alchemy → QuickNode
- **BSC**: QuickNode → Ankr
- **Avalanche**: QuickNode → Ankr
- **Solana**: (Custom RPC configuration)
- **Bitcoin**: (Custom RPC configuration)
- **SUI**: (Custom RPC configuration)

## Error Handling

The service implements comprehensive error handling:

- **Authentication errors**: 401 Unauthorized
- **Authorization errors**: 403 Forbidden
- **Not found errors**: 404 Not Found
- **RPC failures**: Automatic failover to next provider
- **Database errors**: Proper error logging and response

## Performance Optimizations

1. **DataLoaders**: Batch loading to prevent N+1 queries
2. **Redis Caching**: Multi-tier TTL-based caching
3. **RPC Connection Pooling**: Reused HTTP clients per provider
4. **Async/Await**: Non-blocking I/O operations
5. **Database Indexing**: Optimized queries via Prisma

## Monitoring & Logging

The service logs all critical operations:

- Wallet creation/deletion
- Balance sync operations
- RPC failures and failovers
- Authentication events
- Errors and warnings

Logs are output in JSON format compatible with log aggregation services.

## Federation & Integration

This subgraph federates with:

- **User Subgraph** (Port 4002): For user management
- **Portfolio Subgraph**: For portfolio aggregation
- **Transaction Subgraph**: For transaction history

All subgraphs federate through the Apollo Router (Port 4000).

## Troubleshooting

### RPC Failures
- Check provider API keys in environment variables
- Verify RPC endpoints are accessible
- Check rate limits on provider accounts

### Cache Issues
- Clear Redis cache: `redis-cli FLUSHDB`
- Check Redis connection: `redis-cli ping`

### Database Issues
- Verify PostgreSQL connection string
- Run migrations: `prisma migrate dev`
- Check database logs

## Future Enhancements

- [ ] Optimize gas price calculation
- [ ] Add more DeFi protocol integration
- [ ] Implement wallet recovery
- [ ] Add biometric authentication
- [ ] Implement wallet backup/restore
- [ ] Add hardware wallet support
