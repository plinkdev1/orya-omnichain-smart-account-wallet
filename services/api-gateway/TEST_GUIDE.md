# API Gateway Testing Guide

## Prerequisites

- Ensure User Service is running on port 3001
- Ensure Wallet Service is running on port 3010
- API Gateway runs on port 3000

## Testing with GraphiQL

1. Start the API Gateway:
```bash
cd services
cargo run -p api-gateway
```

2. Open browser to: `http://localhost:3000/graphql`

3. Test Health Query:
```graphql
query {
  health
}
```

Expected response:
```json
{
  "data": {
    "health": "OK"
  }
}
```

## Testing with curl

### Health Check
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ health }"}'
```

### Get User
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ user(userId: \"user123\") { id email kycStatus } }"
  }'
```

### Register User
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { register(email: \"test@example.com\" authProvider: \"firebase\") { id email kycStatus } }"
  }'
```

### Get Wallets
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ wallets(userId: \"user123\") { id address chainId walletType } }"
  }'
```

### Create Wallet
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { createWallet(userId: \"user123\" chainId: \"sui-mainnet\" walletType: \"mpc\") { walletId address recoveryPhrase } }"
  }'
```

### Get Balance
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ walletBalance(walletId: \"wallet123\") { amount symbol usdValue } }"
  }'
```

### Sign Transaction
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { signTransaction(walletId: \"wallet123\" transaction: \"0x...\") }"
  }'
```

## Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /graphql | POST | GraphQL queries/mutations |
| /graphql | GET | GraphiQL playground |
| /health | GET | Health check |

## Error Handling

All errors are returned in GraphQL error format:

```json
{
  "errors": [
    {
      "message": "Failed to fetch user: connection refused"
    }
  ]
}
```

## Service Dependencies

Service must respond with correct JSON structure:

**User Service** (/user/{id}, /register):
```json
{
  "id": "string",
  "email": "string",
  "kyc_status": "string"
}
```

**Wallet Service** (/wallets/{userId}, /create, /balance/{walletId}, /sign):
```json
{
  "id": "string",
  "address": "string",
  "chain_id": "string",
  "wallet_type": "string"
}
```

## Troubleshooting

- **Connection refused**: Ensure downstream services (User, Wallet) are running
- **Invalid JSON**: Check GraphQL query syntax
- **Timeout**: Check network connectivity to downstream services
- **500 Error**: Check server logs for detailed error messages
