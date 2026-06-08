# ORŸA Backend Services

Production-grade Rust microservices for the ORŸA platform.

## Overview

**11 independent microservices** working together via GraphQL federation + NATS event bus:

### Core Services (Original)
1. **api-gateway** - GraphQL API Gateway (port 3000)
2. **user-service** - Authentication & KYC (port 3001)
3. **transaction-service** - Transaction history & streaming (port 3002)
4. **portfolio-service** - Portfolio aggregation (port 3003)
5. **defi-service** - DeFi protocol integration (port 3004)
6. **fraud-engine** - Fraud detection (port 3005)
7. **notification-service** - Alerts & notifications (port 3006)

### New Services (doc_26 - Card System & MPC)
8. **ledger-service** - Multi-currency ledger for card system (port 3007)
   - Reservation & settlement logic
   - Real-time balance tracking
   - Idempotency & audit trails

9. **fx-routing-engine** - Smart spend optimization (port 3008)
   - Real-time FX quoting (Pyth + RedStone)
   - Smart routing decisions
   - Fee calculation & spread management

10. **sui-mpc-aa-service** - SUI wallet core (port 3009)
    - MPC/AA signing (zero-trust security)
    - Key shard management
    - Transaction batching

11. **wallet-service** - Multi-wallet management (port 3010)
    - Multi-chain wallet support
    - Balance aggregation
    - Address book

## Getting Started

### Prerequisites

- Rust 1.75+
- PostgreSQL 15
- Redis 7
- Docker Compose (recommended for database/cache)

### Build

```bash
cd services

# Build all services
cargo build --workspace

# Build specific service
cargo build -p api-gateway
```

### Run

```bash
# Start all services (requires running PostgreSQL + Redis)
cargo run --release

# Or run individual service
cargo run -p api-gateway --release
```

### Test

```bash
# Test all services
cargo test --workspace

# Test specific service
cargo test -p user-service --workspace
```

## Development

### Code Quality

```bash
# Format code
cargo fmt --all

# Lint with Clippy
cargo clippy --workspace -- -D warnings

# Type checking
cargo check --workspace
```

### Environment Setup

Copy `.env.example` to `.env`:

```bash
cp ../../.env .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `JWT_SECRET` - Authentication key
- `LOG_LEVEL` - Logging level (debug, info, warn, error)

### Dependencies

All services share workspace dependencies defined in `Cargo.toml`:

- **tokio** - Async runtime
- **axum** - Web framework
- **async-graphql** - GraphQL
- **sqlx** - Database ORM
- **redis** - Cache layer
- **serde** - Serialization
- **tracing** - Logging

## Service Architecture

### Core Services

#### API Gateway
- GraphQL Federation gateway (Apollo Router v2)
- Routes requests to subgraphs
- Handles authentication, rate limiting
- Entry point for mobile app & web
- NATS pub/sub integration

#### User Service
- User registration & authentication
- KYC workflow
- Session management
- Wallet connections

#### Transaction Service
- Transaction history
- Real-time transaction streaming
- Transaction status tracking
- Audit logging

#### Portfolio Service
- Asset aggregation across chains
- Portfolio analytics
- Value tracking
- Historical data

#### DeFi Service
- Protocol integrations (Aave, Uniswap, Cetus, DeepBook, etc.)
- Position tracking
- Yield calculation
- Swap execution

#### Fraud Engine
- Anomaly detection
- Transaction validation
- Risk scoring
- Alert generation

#### Notification Service
- Email notifications
- SMS (future)
- Push notifications
- Alert management

### New Services (Card System & MPC - doc_26)

#### Ledger Service (Port 3007)
**Purpose:** Multi-currency ledger for card spending
- Multi-currency balance tracking (fiat + tokens)
- Reservation holds for card payments
- Settlement coordination
- Idempotency & audit trails
- Real-time balance queries

**Critical Endpoints:**
```
POST   /ledger/reserve           # Hold amount for card payment
POST   /ledger/finalize          # Complete or fail the transaction
GET    /ledger/balances/:user_id # Get current balances
```

**Events Published:**
- `ledger.reserved` - When funds are held
- `ledger.settled` - When transaction completes
- `ledger.failed` - When transaction fails

#### FX Routing Engine (Port 3008)
**Purpose:** Smart asset routing for card spending
- Real-time FX quoting (Pyth + RedStone)
- Intelligent routing (which asset to spend)
- Fee calculation & spread management
- AI-powered spend optimization
- User preference rules

**Critical Endpoints:**
```
POST   /fx/quote              # Get FX rate for conversion
POST   /routing/optimize      # Get optimized spending route
```

**Events Published:**
- `fx.quoted` - When quote is provided
- `routing.optimized` - When route is calculated

#### SUI MPC/AA Service (Port 3009)
**Purpose:** Wallet core with MPC signing and Account Abstraction
- 2PC-MPC signing (zero-trust security)
- Account Abstraction (gasless, batching)
- Key shard management (encrypted, distributed)
- Recovery & backup management
- Paymaster integration

**Critical Endpoints:**
```
POST   /wallet/init           # Initialize MPC wallet
POST   /transaction/sign      # Sign single transaction
POST   /transaction/batch     # Batch & sign multiple transactions
GET    /wallet/:wallet_id     # Get wallet details
```

**Events Published:**
- `wallet.created` - New MPC wallet initialized
- `wallet.transaction.signed` - Transaction signed
- `wallet.batch.signed` - Batch transactions signed

#### Wallet Service (Port 3010)
**Purpose:** Multi-wallet management across chains
- Multi-wallet account support (users can have multiple)
- Cross-chain balance aggregation
- Transaction history per wallet
- Address book management

**Critical Endpoints:**
```
POST   /wallet/create              # Create new wallet
GET    /wallet/balances/:user_id   # Get all balances across wallets
GET    /wallet/:wallet_id          # Get specific wallet details
```

**Events Published:**
- `wallet.connected` - New wallet added to account
- `wallet.balance.updated` - Balance changed

## Database

PostgreSQL 15 with schemas:
- `users` - User accounts, sessions, wallets, card accounts, settings
- `transactions` - Transaction history, ledgers, reservations
- `portfolio` - Assets, holdings, portfolio summary
- `defi` - DeFi positions, FX rates, routing rules
- `audit` - Audit logs, fraud events

**New Tables (doc_26):**
- `users.card_accounts` - Card issuance data
- `users.user_settings` - User preferences (card mode, etc.)
- `transactions.ledgers` - Multi-currency ledger entries
- `transactions.ledger_reservations` - Hold reservations for payments
- `defi.fx_rates` - FX rate cache (Pyth, RedStone, Chainlink)
- `defi.routing_rules` - Smart routing preferences
- `audit.fraud_events` - Fraud detection events

All tables have Row-Level Security (RLS) enabled.
Automatic indexes on frequently queried columns.

## Event Bus (NATS)

Inter-service communication via **NATS JetStream**:

**Available Topics:**
- `wallet.created` - New wallet initialized
- `wallet.transaction` - Transaction initiated
- `wallet.transaction.completed` - Transaction settled
- `user.kyc.completed` - KYC verification done
- `portfolio.updated` - Portfolio state changed
- `ledger.reserved` - Card payment hold placed
- `ledger.settled` - Card payment completed
- `card.payment.initiated` - Payment started
- `card.payment.completed` - Payment finished

**Usage Pattern:**
```rust
// Subscribe to events
let subscriber = nc.subscribe("ledger.settled")?;

// Publish events
nc.publish("card.payment.initiated", json_event)?;
```

**Benefits:**
- Loosely coupled services
- Async communication
- Request/Reply pattern support
- Queue groups for load balancing
- Persistent message store

## Provider Adapters

External integrations in `provider-adapters/`:

**Chain Adapters:**
- `sui/` - Suiet, DeepBook, Cetus, Pyth, Wormhole
- `evm/` - viem, ethers.js, 0x, LayerZero, Hop
- `solana/` - @solana/web3.js, Jupiter, Wormhole
- `bitcoin/` - Bitcoin RPC, Babylon, Stacks, Bitlayer

**DEX Adapters:**
- `0x_adapter` - EVM best pricing
- `meld` - Transaction batching
- `deepbook` - SUI CLOB
- `jupiter` - Solana aggregation

**RPC Providers:**
- `alchemy` - Primary for EVM (Cortex)
- `quicknode` - Multi-chain fallback

**Fiat Bridges:**
- `moonpay` - Primary on/off ramp
- `ramp` - Fallback redundancy

**Oracles:**
- `pyth` - Low-latency quotes
- `redstone` - BTC/BTCfi focus
- `chainlink` - High-value settlements

See `provider-adapters/README.md` for detailed documentation.

## Deployment

### Local Development

```bash
# Start Docker services
cd infrastructure
docker compose up -d

# Build services
cd services
cargo build --workspace

# Run services
cargo run --release
```

### Production

```bash
# Build release binary
cargo build --workspace --release

# Deploy via Kubernetes
kubectl apply -f ../infrastructure/kubernetes/
```

## Monitoring

Services emit structured logs via `tracing`:

```bash
RUST_LOG=debug cargo run
```

Logs are JSON-formatted for easy parsing in production.

## API Documentation

GraphQL schema is auto-generated from code.

Access at: `http://localhost:3000/graphql`

## Testing

```bash
# Unit tests
cargo test --lib

# Integration tests
cargo test --test '*'

# All tests
cargo test --workspace

# With logging
RUST_LOG=debug cargo test -- --nocapture
```

## Contributing

1. Follow Rust style guidelines (enforced by rustfmt)
2. Add tests for new functionality
3. Update documentation
4. Pass `cargo clippy` checks

## Troubleshooting

### Compilation fails

```bash
rustup update
cargo clean
cargo build --workspace
```

### Database connection refused

Ensure PostgreSQL is running:
```bash
cd infrastructure
docker compose up -d postgres
```

### Tests fail

Ensure test database is available:
```bash
cd infrastructure
docker compose up -d postgres redis
```

## Documentation

- Full architecture: `../../.zencoder/ARCHITECTURE_STRATEGY_v1.md`
- Phase 1 details: `../../.zencoder/PHASE_0_STARTUP.md`
- Quick reference: `../../.zencoder/QUICK_REFERENCE.md`

## Support

For issues:
1. Check `../../.zencoder/QUICK_REFERENCE.md`
2. Review existing issues
3. Create new issue with full context