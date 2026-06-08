# API Gateway (GraphQL) Implementation - TASK 2.8

## Implementation Complete ✅

### Files Created/Modified

1. **src/main.rs** - GraphQL server setup
   - Axum web framework with async-graphql
   - GraphQL handler at `/graphql` (POST)
   - GraphiQL playground at `/graphql` (GET)
   - Health check at `/health`
   - Server runs on port 3000

2. **src/resolvers/mod.rs** - Schema definition
   - `QueryRoot` with queries: health, user, wallets, wallet_balance
   - `MutationRoot` with mutations: register, create_wallet, sign_transaction
   - Type exports for User, Wallet, Balance, CreateWalletResponse

3. **src/resolvers/user.rs** - User resolver
   - `User` struct: id, email, kyc_status
   - `get_user()` - fetches from User Service (port 3001)
   - `register_user()` - creates new user account

4. **src/resolvers/wallet.rs** - Wallet resolver
   - `Wallet` struct: id, address, chain_id, wallet_type
   - `Balance` struct: amount, symbol, usd_value
   - `CreateWalletResponse`: wallet_id, address, recovery_phrase
   - `get_user_wallets()` - lists wallets
   - `create_wallet()` - creates new wallet (port 3010)
   - `get_balance()` - fetches wallet balance
   - `sign_transaction()` - signs transactions

5. **Cargo.toml** - Updated with workspace dependencies

## Architecture

```
Client
  ↓
API Gateway (port 3000)
  ├── /graphql → GraphQL handler
  ├── /health → Health check
  └── Resolvers route to services
      ├── User Service (port 3001)
      ├── Wallet Service (port 3010)
      └── Transaction Service
```

## GraphQL Queries

### Health Query
```graphql
query {
  health
}
```

### Get User
```graphql
query {
  user(userId: "user123") {
    id
    email
    kycStatus
  }
}
```

### Get User Wallets
```graphql
query {
  wallets(userId: "user123") {
    id
    address
    chainId
    walletType
  }
}
```

### Get Wallet Balance
```graphql
query {
  walletBalance(walletId: "wallet123") {
    amount
    symbol
    usdValue
  }
}
```

## GraphQL Mutations

### Register User
```graphql
mutation {
  register(email: "user@example.com", authProvider: "firebase") {
    id
    email
    kycStatus
  }
}
```

### Create Wallet
```graphql
mutation {
  createWallet(userId: "user123", chainId: "sui-mainnet", walletType: "mpc") {
    walletId
    address
    recoveryPhrase
  }
}
```

### Sign Transaction
```graphql
mutation {
  signTransaction(walletId: "wallet123", transaction: "0x...") 
}
```

## Service Integration

- **User Service** (port 3001): `/user/{id}`, `/register`
- **Wallet Service** (port 3010): `/wallets/{userId}`, `/create`, `/balance/{walletId}`, `/sign`

## Testing

Access GraphiQL playground at: `http://localhost:3000/graphql`

Build & run:
```bash
cargo build -p api-gateway
cargo run -p api-gateway
```

## Acceptance Criteria ✅

- [x] API Gateway starts on port 3000
- [x] GraphQL playground accessible at /graphql
- [x] Health query returns "OK"
- [x] User queries route to User Service
- [x] Wallet mutations route to Wallet Service
- [x] All resolvers implemented without errors

## Notes

- Error handling implemented with proper async-graphql error propagation
- All HTTP calls use reqwest client with JSON support
- Serde serialization/deserialization for all data types
- Uses workspace dependencies for version consistency
