# Chainbase Service

The Chainbase Service is the primary data infrastructure layer for the ORŸA Wallet, handling multi-chain data indexing, analytics, and cross-chain data aggregation for 300+ blockchains.

## Overview

**Service**: Multi-chain data indexing and analytics  
**Language**: Rust (Axum framework)  
**Database**: PostgreSQL (with JSON storage for flexible data structures)  
**Cache**: Redis  
**Port**: 8085

## Features

- **Multi-chain Data Indexing**: Index data from 300+ blockchains
- **Balance Aggregation**: Cross-chain balance tracking and aggregation
- **Transaction History**: Indexed transaction data across chains
- **TVL Calculations**: Real-time Total Value Locked calculations
- **Cross-chain Asset Tracking**: Track assets across multiple blockchains
- **Real-time Data Feeds**: Analytics-ready data streams

## Architecture

```
chainbase-service/
├── src/
│   ├── main.rs                  # Service entry point
│   ├── lib.rs                   # Library root
│   ├── config.rs                # Configuration management
│   ├── error.rs                 # Error types and handling
│   ├── db.rs                    # Database utilities
│   ├── client/
│   │   ├── mod.rs              # Chainbase API client
│   │   ├── datasets.rs         # Dataset queries
│   │   └── manuscripts.rs      # Manuscript handling
│   ├── models/
│   │   ├── mod.rs
│   │   ├── chain_data.rs       # Chain data models
│   │   └── analytics.rs        # Analytics models
│   ├── handlers/
│   │   └── mod.rs              # HTTP endpoint handlers
│   └── services/
│       ├── mod.rs
│       ├── indexing.rs         # Data indexing logic
│       └── aggregation.rs      # Data aggregation logic
├── tests/
│   └── integration/            # Integration tests
├── Cargo.toml
├── README.md
└── .env.example
```

## Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

**Environment Variables**:

- `CHAINBASE_API_KEY`: Your Chainbase API key (required)
- `CHAINBASE_API_URL`: Chainbase API endpoint (default: https://api.chainbase.com/v1)
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `SERVICE_PORT`: Service port (default: 8085)

## Building

```bash
cd services
cargo build -p chainbase-service
```

## Running

```bash
cargo run -p chainbase-service
```

The service will be available at `http://localhost:8085`

### Health Check

```bash
curl http://localhost:8085/health
```

Response:
```json
{
  "status": "healthy",
  "service": "chainbase-service"
}
```

## Testing

```bash
cargo test -p chainbase-service
```

### Running Integration Tests

```bash
cargo test --test '*' -p chainbase-service
```

## Database

### Migrations

The service uses SQLx with PostgreSQL. Migrations are stored in `services/migrations/`.

Create new migration:
```bash
sqlx migrate add -r create_chainbase_tables
```

Run migrations:
```bash
sqlx migrate run
```

### Schema

The Chainbase service uses the following main tables:

- `chainbase_indexed_data`: Indexed data from multiple chains
- `chainbase_sync_status`: Tracking of sync progress per chain

## API Endpoints

### Health Check
- **GET** `/health` - Service health status

### Data Indexing (Planned)
- **POST** `/index/chain` - Index data for a chain
- **GET** `/data/{chain_id}/{address}` - Get indexed data

### Analytics (Planned)
- **GET** `/analytics/tvl` - Get total value locked across chains
- **GET** `/analytics/chain/{chain_id}` - Get chain-specific analytics

## Integration Points

### Provides Data To

- `portfolio-service`: Balance and asset data
- `transaction-service`: Transaction history
- `analytics-service`: Raw analytics data

### Depends On

- PostgreSQL: Data persistence
- Redis: Caching layer
- Chainbase API: Multi-chain data source

## Security

- Environment variables for sensitive data (API keys, credentials)
- PostgreSQL connection pooling
- Request validation and error handling
- Tracing and monitoring support

## Monitoring

Logging is configured with `tracing-subscriber`. Set `RUST_LOG` for log level:

```bash
RUST_LOG=debug cargo run -p chainbase-service
```

## Development

### Adding New Endpoints

1. Create handler in `src/handlers/`
2. Add to router in `main.rs`
3. Add unit tests

### Adding New Models

1. Define struct in `src/models/`
2. Derive necessary traits (Serialize, Deserialize, sqlx::FromRow)
3. Use in handlers and services

## Troubleshooting

### Database Connection Error
- Verify DATABASE_URL is correct
- Ensure PostgreSQL is running
- Check credentials

### Redis Connection Error
- Ensure Redis is running
- Check REDIS_URL configuration

### API Key Invalid
- Verify CHAINBASE_API_KEY is set
- Check API key has necessary permissions

## Future Enhancements

- [ ] gRPC endpoints for internal service communication
- [ ] WebSocket subscriptions for real-time data
- [ ] Caching layer optimization
- [ ] Advanced analytics dashboards
- [ ] Batch indexing optimization
- [ ] Cross-chain arbitrage detection

## License

MIT
