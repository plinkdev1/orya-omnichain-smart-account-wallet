# Wallet Subgraph - Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies

```bash
cd services/wallet-subgraph
pnpm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- Database URL (PostgreSQL)
- Redis connection details
- RPC provider API keys
- Privy app ID
- JWT secret

### 3. Build & Run

**Development Mode:**
```bash
pnpm dev
```

**Production Mode:**
```bash
pnpm build
pnpm start
```

### 4. Verify Server is Running

The service should be accessible at: `http://localhost:4001`

You can test with Apollo Studio or any GraphQL client.

## Common Queries

### Get User's Wallets

```graphql
query {
  wallets(userId: "user-123") {
    id
    address
    chainType
    type
    createdAt
  }
}
```

### Create a New Wallet

```graphql
mutation {
  createWallet(chainId: "ethereum", type: MPC) {
    id
    address
    chainType
  }
}
```

### Check Wallet Balances

```graphql
query {
  balances(walletId: "wallet-123") {
    symbol
    amount
    amountUSD
    lastUpdated
  }
}
```

### Sync Balances

```graphql
mutation {
  syncWalletBalances(walletId: "wallet-123") {
    symbol
    amount
    amountUSD
  }
}
```

### Get Portfolio Value

```graphql
query {
  totalPortfolioValue(userId: "user-123")
}
```

### Fetch NFTs

```graphql
query {
  nfts(walletId: "wallet-123", chainId: "ethereum") {
    id
    name
    contractAddress
    tokenId
    imageUrl
  }
}
```

## Testing

### Run Tests

```bash
pnpm test
```

### Run Tests in Watch Mode

```bash
pnpm test:watch
```

## Code Quality

### Lint Code

```bash
pnpm lint
```

### Type Check

```bash
pnpm typecheck
```

## Troubleshooting

### Port Already in Use

If port 4001 is already in use, change it:

```bash
WALLET_SUBGRAPH_PORT=4001 pnpm dev
```

### Redis Connection Error

Ensure Redis is running:

```bash
redis-cli ping
# Should return: PONG
```

### Database Connection Error

Verify the DATABASE_URL in `.env`:

```bash
# Test the connection
psql $DATABASE_URL -c "SELECT 1"
```

### RPC Provider Errors

Check that API keys are set and valid:

```bash
# Verify environment variables
echo $ALCHEMY_API_KEY
echo $QUICKNODE_API_KEY
```

## Integration with Apollo Router

When all subgraphs are running, the Apollo Router (port 4000) will federate them:

```bash
# Query through the Apollo Router
curl http://localhost:4000/graphql \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"{ wallets(userId: \"user-1\") { id } }"}'
```

## Next Steps

1. **Configure RPC Providers**: Set up API keys for your chains
2. **Run Database Migrations**: Ensure database schema is up to date
3. **Set JWT Secret**: Generate a secure secret for token signing
4. **Test Wallet Creation**: Create a test wallet
5. **Monitor Logs**: Watch for any errors during initial use

## Performance Tips

- Enable Redis caching for better performance
- Monitor RPC provider rate limits
- Use appropriate TTL for cached data
- Batch wallet operations when possible

## Support & Documentation

- Full README: `README.md`
- GraphQL Schema: `src/schema.graphql`
- Examples: Check `src/resolvers.test.ts` for usage examples

---

Need more help? Check the comprehensive README.md for detailed documentation.
