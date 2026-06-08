# Transaction Subgraph Service

GraphQL subgraph for transaction management with protocol-agnostic execution and intent-based routing.

**Port**: 4003 (TRANSACTION_SUBGRAPH_PORT)

## Features

- ✅ **Protocol-Agnostic Transaction Execution**: Route transactions through user's preferred protocol
- ✅ **Intent-Based Routing**: Express intent ("swap 1 ETH for max USDC"), system finds best route
- ✅ **Automatic Failover**: Fallback between protocols if primary fails
- ✅ **Real-time Monitoring**: Track transaction status with subscriptions
- ✅ **Multi-Chain Support**: Execute on 14+ blockchain networks
- ✅ **Gas Estimation**: Accurate fee forecasting for each transaction
- ✅ **Caching & Performance**: Redis-backed caching for quotes and protocols

## Architecture

```
Frontend GraphQL Query
    ↓
Transaction Subgraph (Port 4003)
    ↓
Protocol Router (selects best protocol)
    ↓
Protocol Adapter (Uniswap, 0x, Aftermath, etc.)
    ↓
Blockchain RPC (with failover)
    ↓
On-chain Execution
```

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Update with your configuration:

- `DATABASE_URL`: PostgreSQL connection
- `REDIS_HOST/PORT`: Redis connection for caching
- `ALCHEMY_API_KEY`: Alchemy API key for RPC fallback
- `QUICKNODE_API_KEY`: QuickNode API key

### 3. Database Setup

Ensure Prisma migrations have run:

```bash
pnpm run prisma:migrate
```

## Development

### Start Development Server

```bash
pnpm run dev
```

Server will be available at `http://localhost:4003`

### TypeScript Check

```bash
pnpm run typecheck
```

### Lint Code

```bash
pnpm run lint
```

## Testing

### Run Tests

```bash
pnpm test
```

### Watch Mode

```bash
pnpm test:watch
```

### Coverage Report

```bash
pnpm test:coverage
```

## GraphQL Operations

### Query: Get Transaction

```graphql
query {
  transaction(id: "tx-123") {
    id
    type
    status
    protocol
    amount
    hash
    createdAt
  }
}
```

### Query: List Transactions

```graphql
query {
  transactions(
    walletId: "wallet-1"
    status: PENDING
    pagination: { first: 10 }
  ) {
    edges {
      node {
        id
        type
        status
        protocol
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

### Query: Estimate Gas

```graphql
query {
  estimateGas(
    chainId: "ethereum"
    from: "0x..."
    to: "0x..."
    amount: "1000000000000000000"
    tokenAddress: "0x..."
  ) {
    estimatedFee
    estimatedFeeUSD
  }
}
```

### Query: Get Swap Quote

```graphql
query {
  swapQuote(
    chainId: "ethereum"
    fromToken: "ETH"
    toToken: "USDC"
    amount: "1000000000000000000"
    slippage: 0.01
  ) {
    toAmount
    priceImpact
    estimatedGasUSD
  }
}
```

### Mutation: Execute Direct Swap

```graphql
mutation {
  executeSwap(
    chainId: "ethereum"
    protocol: "uniswap-v3"
    fromToken: "ETH"
    toToken: "USDC"
    amount: "1000000000000000000"
    slippage: 0.01
  ) {
    id
    hash
    status
    protocol
  }
}
```

### Mutation: Intent-Based Swap

```graphql
mutation {
  initiateSwap(
    intent: {
      chainId: "ethereum"
      inputToken: "ETH"
      outputToken: "USDC"
      amount: "1000000000000000000"
      minOutputAmount: "2800000000"
      maxSlippage: 0.01
      deadline: "2025-12-31T23:59:59Z"
      routingPreference: BEST_PRICE
    }
  ) {
    id
    protocol
    status
  }
}
```

### Mutation: Send Tokens

```graphql
mutation {
  sendTokens(
    walletId: "wallet-1"
    toAddress: "0xrecipient"
    amount: "1000000000000000000"
    tokenAddress: "0x..."
  ) {
    id
    type
    status
  }
}
```

### Mutation: Cancel Transaction

```graphql
mutation {
  cancelTransaction(id: "tx-123") {
    id
    status
  }
}
```

### Subscription: Transaction Status Updates

```graphql
subscription {
  transactionStatusChanged(transactionId: "tx-123") {
    id
    status
    hash
    confirmedAt
  }
}
```

## Protocol Integration

### Supported Protocols

The service automatically integrates with registered protocols:

- **DEX Swaps**: Uniswap, 0x, Aftermath, Cetus
- **Cross-Chain Bridges**: LayerZero, Stargate, Hop
- **Staking**: Lido, Rocket Pool, SUI validators
- **Lending**: Aave, Compound, SuiLend

### Protocol Selection Logic

1. **User Preferred**: If user has protocol preference for (chainId, feature), use it
2. **Best Price**: Get quotes from all protocols, select lowest price
3. **Fastest**: Select protocol with lowest gas estimate
4. **Most Secure**: Select audited, high-tier protocols

### Failover Mechanism

If primary protocol fails:

```
Try Protocol 1 (Preferred)
  ↓ fails
Try Protocol 2 (Verified)
  ↓ fails
Try Protocol 3 (Community)
  ↓ fails
Error: All protocols exhausted
```

## Performance Optimization

### Caching Strategy

- **Protocol List**: 1 hour TTL
- **Swap Quotes**: 30 seconds TTL
- **Gas Prices**: 5 minutes TTL
- **User Transactions**: 5 minutes TTL

### RPC Failover

Multi-tier RPC provider priority:

1. **Tier 1**: Alchemy, QuickNode (premium speed)
2. **Tier 2**: Infura, Ankr (reliable fallback)
3. **Tier 3**: Public RPCs (free alternative)

## Monitoring & Debugging

### View Logs

Development mode includes pretty logs:

```bash
LOG_LEVEL=debug pnpm run dev
```

### Check Protocol Cache

```bash
redis-cli
> KEYS "protocol:*"
> GET "protocol:ethereum:swap:default"
```

### Monitor Transactions

```bash
redis-cli
> SUBSCRIBE "transaction:created"
> SUBSCRIBE "transaction:confirmed"
```

## Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| "No active protocols" | No protocols registered | Register protocols in database |
| "All RPC providers failed" | All RPC endpoints down | Check RPC API keys |
| "Protocol execution failed" | Swap failed on-chain | Check slippage, liquidity |
| "Unauthorized" | Missing/invalid JWT | Include valid Authorization header |

## Database Schema

Key tables:

- `transactions` - Transaction records with protocol tracking
- `protocols` - Registered protocol adapters
- `protocol_preferences` - User protocol selections
- `users` - User accounts
- `wallets` - User wallets

## Build

```bash
pnpm run build
```

Output: `dist/index.js`

## Production Deployment

1. Build: `pnpm run build`
2. Set NODE_ENV=production
3. Start: `pnpm run start`
4. Monitor: Use Prometheus metrics from port 9090

## References

- [Protocol Abstraction Layer](https://github.com/orya-wallet/protocol-core)
- [GraphQL Federation](https://www.apollographql.com/docs/federation/)
- [Apollo Server](https://www.apollographql.com/docs/apollo-server/)
