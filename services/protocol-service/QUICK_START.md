# Protocol Service - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Install Dependencies

```bash
cd services/protocol-service
npm install
```

### Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set:
```
PROTOCOL_SUBGRAPH_PORT=4004
REDIS_HOST=localhost
REDIS_PORT=6379
DATABASE_URL=postgresql://user:password@localhost:5432/orya_wallet
```

### Step 3: Start Development Server

```bash
npm run dev
```

You should see:
```
info: Redis connected
info: Protocol Subgraph listening on http://localhost:4004
```

### Step 4: Test GraphQL Endpoint

Open browser to `http://localhost:4004` and run:

```graphql
query {
  protocols(chainId: "ethereum", feature: SWAP) {
    id
    name
    tier
  }
}
```

## 📋 Common Tasks

### Register a New Protocol

```bash
curl -X POST http://localhost:4004/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { registerProtocol(input: { name: \"Uniswap\", chainId: \"ethereum\", type: SWAP, version: \"3.0.0\", logoUrl: \"https://...\", tier: CORE, website: \"https://uniswap.org\", docs: \"https://docs.uniswap.org\", securityRating: 95, supportedTokens: [\"ETH\", \"USDC\"], protocolFee: 0.25, platformFee: 0.05 }) { id name tier isActive } }"
  }'
```

### Get User Protocol Preferences

```graphql
query {
  userProtocolPreferences(userId: "user123") {
    chainId
    feature
    preferredProtocol
    fallbackProtocols
  }
}
```

### Find Best Protocol for Swap

```graphql
query {
  bestProtocolForIntent(intent: {
    type: "SWAP"
    chainId: "ethereum"
    inputToken: "ETH"
    outputToken: "USDC"
    minOutputAmount: "1000"
    maxSlippage: 0.5
    deadline: "2024-12-31T23:59:59Z"
    routingPreference: "BEST_PRICE"
  }) {
    id
    name
    metadata {
      securityRating
      tvl
      fees {
        totalFee
      }
    }
  }
}
```

## 🧪 Run Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

## 📦 Build for Production

```bash
npm run build
npm start
```

## 🔍 Debugging

### Enable Debug Logging

```bash
LOG_LEVEL=debug npm run dev
```

### Check Redis Connection

```bash
redis-cli ping
# Should output: PONG
```

### Verify Database Connection

```bash
npm run dev
# Check logs for: info: Prisma client initialized
```

## 🛠️ Troubleshooting

### Redis Connection Failed

```bash
# Start Redis locally
redis-server
```

### Database Connection Failed

Ensure PostgreSQL is running and DATABASE_URL is correct:
```bash
psql $DATABASE_URL -c "SELECT version();"
```

### Port Already in Use

```bash
# Change port in .env
PROTOCOL_SUBGRAPH_PORT=4005
```

### Type Errors

Run typecheck:
```bash
npm run typecheck
```

## 📚 Next Steps

1. Read [README.md](./README.md) for full documentation
2. Check [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for architecture details
3. Review GraphQL schema in `src/schema.graphql`
4. Run tests: `npm test`
5. Deploy to production

## 📞 Support

For issues:
1. Check logs: `npm run dev -- --debug`
2. Review test files for usage examples
3. Check environment variables in `.env.example`
