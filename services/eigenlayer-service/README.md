# EigenLayer Service

Rust microservice for managing EigenLayer/EigenCloud LST (Liquid Staking Tokens) restaking, verifiable services, and data availability operations.

## Features

- **LST Restaking Management**: Create, manage, and monitor LST restaking positions
- **EigenLayer AVS Integration**: Actively Validated Services (AVS) management and orchestration
- **Slashing Event Monitoring**: Real-time tracking of slashing events and penalties
- **Reward Calculation & Distribution**: Automated reward tracking and claiming
- **EigenDA Integration**: Data availability layer for verifiable compute
- **Operator Management**: Register and manage node operators

## Architecture

### Service Structure

```
src/
├── clients/              # External API clients
│   ├── eigenlayer.rs    # EigenLayer contract client
│   ├── eigencloud.rs    # EigenCloud API client
│   └── eigenda.rs       # EigenDA client
├── contracts/            # Smart contract interaction helpers
│   ├── strategy_manager.rs
│   ├── delegation_manager.rs
│   └── avs_directory.rs
├── models/              # Data models
│   ├── restaking.rs
│   ├── operator.rs
│   └── rewards.rs
├── handlers/            # HTTP request handlers
│   ├── restake.rs
│   ├── operator.rs
│   └── rewards.rs
├── services/            # Business logic
│   ├── restaking_logic.rs
│   ├── slashing_monitor.rs
│   └── rewards_calc.rs
├── config.rs            # Configuration management
├── error.rs             # Error types
└── main.rs              # Service entry point
```

## API Endpoints

### Restaking

- `POST /restaking/create` - Create a new restaking position
- `POST /restaking/withdraw` - Queue a withdrawal
- `GET /restaking/positions?user_id=<id>` - Get user's positions

### Operators

- `GET /operators/details?address=<addr>` - Get operator details
- `POST /operators/register` - Register a new operator

### Rewards

- `GET /rewards?user_id=<id>` - Get user's rewards
- `POST /rewards/claim` - Claim rewards

### Health & Monitoring

- `GET /health` - Health check endpoint
- `GET /metrics` - Prometheus metrics

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:

- `ETHEREUM_RPC_URL` - Ethereum RPC endpoint
- `EIGENLAYER_STRATEGY_MANAGER` - Strategy Manager contract address
- `EIGENLAYER_DELEGATION_MANAGER` - Delegation Manager contract address
- `EIGENLAYER_AVS_DIRECTORY` - AVS Directory contract address
- `EIGENCLOUD_API_KEY` - EigenCloud API key
- `DATABASE_URL` - PostgreSQL connection string
- `SERVICE_PORT` - Port to listen on (default: 8086)

## Database Migrations

The service requires database tables for restaking positions, operators, slashing events, and rewards. Migrations are in `services/migrations/011_eigenlayer_integration.sql`.

Run migrations:

```bash
sqlx migrate run --database-url $DATABASE_URL
```

## Running the Service

```bash
cargo run -p eigenlayer-service
```

## Testing

```bash
cargo test -p eigenlayer-service
```

## Integration with Other Services

### Used By
- `staking-service` - Orchestrates LST restaking
- Grove UI Module - User interface for restaking operations

### Depends On
- PostgreSQL - Data persistence
- Redis - Caching
- NATS - Event messaging
- Ethereum RPC - Contract interaction

## Contract Interactions

### Supported EigenLayer Contracts

1. **Strategy Manager** - Manages deposit and withdrawal strategies
2. **Delegation Manager** - Handles operator delegation
3. **AVS Directory** - Manages Actively Validated Services registrations

## Key Operations

### Restaking Flow

1. User initiates restaking with strategy address and amount
2. Service validates strategy and user balance
3. Creates restaking position in database
4. Monitors operator delegations
5. Tracks earned rewards

### Withdrawal Process

1. User queues withdrawal with position ID
2. Service calculates withdrawal amount and delays
3. Records queued withdrawal state
4. Monitors completion block
5. Updates position status to withdrawn

### Reward Distribution

1. Monitor EigenLayer for reward events
2. Calculate rewards based on strategy APY
3. Record earned rewards in database
4. Allow users to claim rewards on demand

## Performance Considerations

- Database connection pooling for efficiency
- Redis caching for frequently accessed data
- Async/await for non-blocking operations
- Batch processing for rewards calculations

## Security Considerations

- Address validation for all contract interactions
- Amount validation to prevent overflows
- Database constraints for data integrity
- User ID verification for authorization

## Monitoring & Observability

- Structured logging with tracing
- Prometheus metrics for operational insights
- Health check endpoint for monitoring
- Event publishing to NATS for downstream services
