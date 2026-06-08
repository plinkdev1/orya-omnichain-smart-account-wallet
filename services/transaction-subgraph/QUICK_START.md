# Transaction Subgraph - Quick Start

## Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Redis 6+
- pnpm

## 5-Minute Setup

### 1. Install Dependencies

```bash
cd services/transaction-subgraph
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Update `.env` with your database and API keys:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/orya_db
REDIS_HOST=localhost
REDIS_PORT=6379
ALCHEMY_API_KEY=your_key_here
```

### 3. Start Development Server

```bash
pnpm run dev
```

Server runs at `http://localhost:4003`

## Try It Out

### Test in GraphQL Playground

Open `http://localhost:4003` and try:

```graphql
query {
  estimateGas(
    chainId: "ethereum"
    from: "0x742d35Cc6634C0532925a3b844Bc9e7595f42e01"
    to: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
    amount: "1000000000000000000"
    tokenAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
  ) {
    estimatedFee
    estimatedFeeUSD
  }
}
```

### Create a Swap Transaction

```graphql
mutation {
  executeSwap(
    chainId: "ethereum"
    fromToken: "ETH"
    toToken: "USDC"
    amount: "1000000000000000000"
    slippage: 0.01
  ) {
    id
    status
    protocol
  }
}
```

## Common Commands

| Command | Purpose |
|---------|---------|
| `pnpm run dev` | Start dev server |
| `pnpm run build` | Build for production |
| `pnpm run test` | Run tests |
| `pnpm run typecheck` | Check TypeScript |
| `pnpm run lint` | Lint code |

## Architecture Overview

```
Client App (port 3000)
     ↓
GraphQL Router (port 4000)
     ↓
Transaction Subgraph (port 4003) ← YOU ARE HERE
     ↓
Protocol Router
     ↓
Protocol Adapter (0x, Uniswap, Aftermath, etc.)
     ↓
Blockchain RPC
```

## How It Works

### 1. Intent-Based Routing (Recommended)

User expresses intent → System finds best route across protocols:

```graphql
mutation {
  initiateSwap(
    intent: {
      chainId: "ethereum"
      inputToken: "ETH"
      outputToken: "USDC"
      amount: "1000000000000000000"
      maxSlippage: 0.01
      deadline: "2025-12-31T23:59:59Z"
      routingPreference: BEST_PRICE
    }
  ) {
    id
    protocol
  }
}
```

**Benefits:**
- System automatically selects best protocol
- Automatic failover if primary fails
- Respects user preferences

### 2. Direct Execution (Advanced)

User specifies protocol:

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
    protocol
  }
}
```

**Benefits:**
- User has full control
- Transparent protocol selection
- Lower latency (no routing decision)

## Key Features

### 🔄 Multi-Protocol Support

Automatically switch between:
- 0x Protocol
- Uniswap V3
- Aftermath (SUI)
- Cetus (SUI)
- LayerZero Bridge
- And more...

### 🚀 Automatic Failover

```
Try Uniswap
  ↓ fails
Try 0x Protocol
  ↓ fails
Try Curve
  ✓ success!
```

### 💰 Gas Estimation

```graphql
query {
  estimateGas(
    chainId: "ethereum"
    from: "0x..."
    to: "0x..."
    amount: "1000000000000000000"
    tokenAddress: "0x..."
  ) {
    estimatedFee     # in wei
    estimatedFeeUSD  # in dollars
  }
}
```

### 📊 Swap Quotes

```graphql
query {
  swapQuote(
    chainId: "ethereum"
    fromToken: "ETH"
    toToken: "USDC"
    amount: "1000000000000000000"
  ) {
    toAmount
    priceImpact
    estimatedGasUSD
    route {
      protocol
      percentage
    }
  }
}
```

### ✅ Real-time Status Updates

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

## Troubleshooting

### Port 4003 Already in Use

```bash
# Find process using port 4003
lsof -i :4003

# Kill it
kill -9 <PID>
```

### Redis Connection Error

```bash
# Check Redis is running
redis-cli ping
# Expected: PONG
```

### Database Connection Error

```bash
# Verify PostgreSQL is running
psql -U postgres -h localhost

# Check DATABASE_URL in .env
echo $DATABASE_URL
```

### No Protocols Found Error

Ensure protocols are registered in the database:

```bash
# Check protocol registration
psql $DATABASE_URL -c "SELECT * FROM protocols WHERE is_active = true;"
```

## Next Steps

1. **Configure RPC Providers**: Add your Alchemy/QuickNode API keys
2. **Register Protocols**: Ensure swap/bridge protocols are registered
3. **Set User Preferences**: Configure protocol preferences per user
4. **Enable Monitoring**: Set up transaction monitoring and alerts
5. **Test with Real Data**: Use testnet first, then mainnet

## Documentation

- [Full README](./README.md)
- [Schema Reference](./src/schema.graphql)
- [Protocol Core Docs](../../packages/protocol-core/README.md)

## Support

For issues or questions:

1. Check logs: `LOG_LEVEL=debug pnpm run dev`
2. Review error messages in GraphQL response
3. Check database: `SELECT * FROM transactions WHERE status = 'FAILED';`
4. Check Redis cache: `redis-cli KEYS "transaction:*"`
