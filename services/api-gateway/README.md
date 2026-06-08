# API Gateway - ORYA Wallet

GraphQL API Gateway for routing requests to microservices.

## Overview

- **Type:** GraphQL Gateway
- **Language:** Rust (Tokio + Axum + async-graphql)
- **Port:** 3000
- **Framework:** Axum 0.7
- **GraphQL:** async-graphql 5.0

## Features

- ✅ GraphQL API with async-graphql 5.0
- ✅ Axum web framework for high performance
- ✅ User and Wallet service integration
- ✅ GraphiQL playground for interactive testing
- ✅ Full error handling and logging
- ✅ Health check endpoint
- ✅ Async request handling
- ✅ Workspace dependency management

## Quick Start

### Build
```bash
cargo build -p api-gateway
```

### Run
```bash
cargo run -p api-gateway
```

Server starts on `http://localhost:3000`

## Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /graphql | POST | GraphQL mutations & queries |
| /graphql | GET | GraphiQL playground |
| /health | GET | Health check |

## GraphQL Operations

### Queries

**health** - Server health status
```graphql
query {
  health
}
```

**user** - Get user information
```graphql
query {
  user(userId: "user123") {
    id
    email
    kycStatus
  }
}
```

**wallets** - List user wallets
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

**walletBalance** - Get wallet balance
```graphql
query {
  walletBalance(walletId: "wallet123") {
    amount
    symbol
    usdValue
  }
}
```

### Mutations

**register** - Create new user
```graphql
mutation {
  register(email: "user@example.com", authProvider: "firebase") {
    id
    email
    kycStatus
  }
}
```

**createWallet** - Create wallet
```graphql
mutation {
  createWallet(userId: "user123", chainId: "sui-mainnet", walletType: "mpc") {
    walletId
    address
    recoveryPhrase
  }
}
```

**signTransaction** - Sign transaction
```graphql
mutation {
  signTransaction(walletId: "wallet123", transaction: "0x...") 
}
```

## Testing

See [TEST_GUIDE.md](./TEST_GUIDE.md) for detailed testing instructions.

### Quick Test
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ health }"}'
```

### Interactive Testing
Visit GraphiQL playground: `http://localhost:3000/graphql`

## Architecture

The API Gateway routes requests to microservices:

```
Client
  ↓
API Gateway (port 3000)
  ├── User Service (port 3001)
  ├── Wallet Service (port 3010)
  └── Transaction Service (port 3020)
```

## Implementation

See [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for implementation details.

### Project Structure
```
src/
├── main.rs           # Server setup & routes
└── resolvers/
    ├── mod.rs        # Query & Mutation definitions
    ├── user.rs       # User resolvers
    └── wallet.rs     # Wallet resolvers
```

## Dependencies

- **Axum 0.7** - Web framework
- **Async-GraphQL 5.0** - GraphQL implementation
- **Tokio 1.35** - Async runtime
- **Reqwest 0.11** - HTTP client for service calls
- **Serde 1.0** - Serialization
- **Tracing 0.1** - Logging & instrumentation

All dependencies managed via workspace Cargo.toml.

## Environment Variables

```bash
PORT=3000                              # Server port (default: 3000)
USER_SERVICE_URL=http://localhost:3001 # User service endpoint
WALLET_SERVICE_URL=http://localhost:3010 # Wallet service endpoint
```

## Running Tests

```bash
cargo test -p api-gateway
```

## Error Handling

All GraphQL operations include proper error handling:
- Service connection errors
- JSON parsing errors
- Request timeouts

Errors are returned in standard GraphQL error format:

```json
{
  "errors": [
    {
      "message": "Failed to fetch user: connection refused"
    }
  ]
}
```

## Logging

Logging configured via tracing. Set environment variable:

```bash
RUST_LOG=debug cargo run -p api-gateway
```

## Deployment

### Development
```bash
cargo run -p api-gateway
```

### Release Build
```bash
cargo build -p api-gateway --release
./target/release/api-gateway
```

## Acceptance Criteria

- ✅ API Gateway starts on port 3000
- ✅ GraphQL playground accessible at /graphql
- ✅ Health query returns "OK"
- ✅ User queries route to User Service
- ✅ Wallet mutations route to Wallet Service
- ✅ All resolvers work without errors

## Documentation

- [SCHEMA.md](./SCHEMA.md) - GraphQL schema documentation
- [TEST_GUIDE.md](./TEST_GUIDE.md) - Testing guide with examples
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Implementation details

## Project Status

**Task 2.8: API Gateway (GraphQL) - COMPLETE**

All components implemented:
- ✅ main.rs - GraphQL server
- ✅ resolvers/mod.rs - Schema definition
- ✅ resolvers/user.rs - User resolver
- ✅ resolvers/wallet.rs - Wallet resolver
- ✅ Cargo.toml - Dependencies configured
- ✅ Documentation - Schema, testing, implementation guides
