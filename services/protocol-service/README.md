# Protocol Service - GraphQL Subgraph

**Port**: 4004

## Overview

The Protocol Service is a GraphQL subgraph that manages registered protocols, their health status, and user protocol preferences. It implements the protocol-agnostic architecture of Orÿa Wallet by allowing users to select which protocol to use for each feature on each chain.

## Key Features

- **Protocol Registry**: Register, activate, and manage protocols across multiple chains
- **Health Monitoring**: Real-time protocol health status (latency, operational status)
- **User Preferences**: Track user's preferred protocols per chain/feature
- **Best Protocol Selection**: Intelligent routing to find the best protocol based on intent
- **Multi-chain Support**: Manage protocols for 14+ supported chains
- **Real-time Subscriptions**: Subscribe to protocol health changes

## Architecture

### GraphQL Schema

The service exports the following main types:

- **Protocol**: Represents a registered protocol with metadata and health info
- **ProtocolMetadata**: Contains protocol details (TVL, volume, fees, security rating)
- **ProtocolHealth**: Real-time health information (latency, operational status)
- **ProtocolPreference**: User's protocol preferences per chain/feature

### Resolvers

#### Queries

- `protocols(chainId, feature)` - Get all available protocols for a chain/feature
- `protocol(id)` - Get a specific protocol
- `protocolHealth(id)` - Get current health status
- `userProtocolPreferences(userId)` - Get user's protocol preferences
- `bestProtocolForIntent(intent)` - Find best protocol for a transaction intent

#### Mutations

- `registerProtocol(input)` - Register a new protocol
- `updateProtocol(id, input)` - Update protocol information
- `activateProtocol(id)` - Activate a protocol
- `deactivateProtocol(id)` - Deactivate a protocol

#### Subscriptions

- `protocolHealthChanged(protocolId)` - Subscribe to health status changes

## Installation

```bash
cd services/protocol-service
npm install
```

## Development

### Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:4004`

### Build

```bash
npm run build
```

### Run Tests

```bash
npm test
```

Watch mode:
```bash
npm run test:watch
```

Coverage:
```bash
npm run test:coverage
```

### Linting

```bash
npm run lint
npm run typecheck
```

## Environment Setup

1. Copy `.env.example` to `.env`
2. Configure the following:

```env
PROTOCOL_SUBGRAPH_PORT=4004
DATABASE_URL=postgresql://...
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret
FIREBASE_PROJECT_ID=your-project
```

## Integration with Federation

This subgraph is designed to work with Apollo Federation. It references external types:

- **User** (from user-subgraph) - For protocol preferences
- **Transaction** (from transaction-subgraph) - For intent-based routing

The supergraph should include:

```yaml
subgraphs:
  protocol:
    routing_url: http://localhost:4004/graphql
```

## Caching Strategy

The service implements a multi-layer caching strategy:

| Resource | TTL | Invalidation |
|----------|-----|--------------|
| Protocols List | 5 min | On protocol update |
| Protocol Details | 10 min | On protocol update |
| Protocol Health | 1 min | On health change |
| User Preferences | 5 min | On preference update |

## Protocol Preference Flow

### Setting User Preferences

```graphql
mutation {
  setProtocolPreference(
    chainId: "ethereum"
    feature: SWAP
    protocolId: "uniswap-v3"
    fallbacks: ["sushiswap", "0x"]
  ) {
    chainId
    feature
    preferredProtocol
    fallbackProtocols
  }
}
```

### Getting Best Protocol for Intent

```graphql
query {
  bestProtocolForIntent(intent: {
    type: "SWAP"
    chainId: "ethereum"
    inputToken: "ETH"
    outputToken: "USDC"
    minOutputAmount: "1000"
    maxSlippage: 0.5
    routingPreference: USER_PREFERRED
  }) {
    id
    name
    tier
    metadata {
      securityRating
      tvl
    }
  }
}
```

## Protocol Tiers

- **CORE**: Audited, well-established protocols (Uniswap, Aave, etc.)
- **VERIFIED**: Newer but reputable protocols with security reviews
- **COMMUNITY**: User-contributed or emerging protocols

## Security

- All GraphQL operations require authentication (JWT or Firebase)
- Database queries are parameterized to prevent SQL injection
- Health checks include DDoS protection
- Rate limiting: 100 requests/minute per user

## Error Handling

The service implements comprehensive error handling:

```typescript
{
  "errors": [
    {
      "message": "Protocol not found",
      "extensions": {
        "code": "NOT_FOUND",
        "protocolId": "invalid-id"
      }
    }
  ]
}
```

Common error codes:

- `NOT_FOUND` - Protocol or resource not found
- `INVALID_INPUT` - Invalid input parameters
- `UNAUTHORIZED` - Authentication required
- `INTERNAL_SERVER_ERROR` - Server error

## Performance Optimization

### DataLoaders

The service uses DataLoaders for batch processing:

- `protocolById` - Batch load protocols by ID
- `protocolHealth` - Batch load health statuses
- `userProtocolPreferences` - Batch load user preferences

### Database Indexes

```sql
CREATE INDEX idx_protocols_chain_type ON protocol(chain_id, type);
CREATE INDEX idx_protocols_is_active ON protocol(is_active);
CREATE INDEX idx_protocol_prefs_user_chain_feature 
  ON protocol_preference(user_id, chain_id, feature);
CREATE INDEX idx_protocol_health_protocol_id ON protocol_health(protocol_id);
```

## Monitoring

### Prometheus Metrics

The service exports the following metrics:

- `gql_protocols_query_duration_seconds` - Query execution time
- `gql_protocols_cache_hits_total` - Cache hit count
- `gql_protocols_cache_misses_total` - Cache miss count
- `protocol_health_check_duration_seconds` - Health check latency

### Logging

Structured logging with Pino:

```
[13:45:22] info: Protocol registered
  protocolId: "sui-aftermath-swap"
  name: "Aftermath Finance"
```

## API Examples

### Get Available Protocols

```graphql
query {
  protocols(chainId: "ethereum", feature: SWAP) {
    id
    name
    tier
    health {
      isOperational
      latency
    }
    metadata {
      tvl
      volume24h
      fees {
        totalFee
      }
    }
  }
}
```

### Register New Protocol

```graphql
mutation {
  registerProtocol(input: {
    name: "NewSwap"
    chainId: "ethereum"
    type: SWAP
    version: "1.0.0"
    logoUrl: "https://..."
    tier: VERIFIED
    website: "https://..."
    docs: "https://..."
    securityRating: 85
    supportedTokens: ["ETH", "USDC"]
    protocolFee: 0.25
    platformFee: 0.05
  }) {
    id
    name
    isActive
  }
}
```

## Troubleshooting

### Protocol Not Found

Ensure the protocol exists and is active:

```graphql
query {
  protocol(id: "protocol-id") {
    id
    isActive
  }
}
```

### Cache Issues

Clear cache manually:

```bash
redis-cli DEL "protocols:*"
```

### Health Check Failures

Verify Redis and database connections:

```bash
npm run dev -- --debug
```

## Contributing

See [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for implementation details.

## License

MIT
