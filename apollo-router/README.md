# Apollo Router Federation Gateway

Unified GraphQL API gateway for ORYA Wallet - Protocol-agnostic, multi-chain wallet with user-selectable protocols.

## Overview

The Apollo Router federates all GraphQL subgraphs into a unified API serving at port `4000`.

### Architecture

```
Clients (Web/Mobile)
    ↓
Apollo Router (Port 4000)
    ├── Authentication Plugin (JWT/Firebase)
    ├── Rate Limiting Plugin (Redis)
    └── Health Check Service
    ↓
Federated Subgraphs
    ├── User Service (4002)
    ├── Wallet Service (4001)
    ├── Transaction Service (4003)
    ├── Protocol Service (4004)
    ├── DeFi Service (4005)
    ├── Portfolio Service (4006)
    └── Fiat Service (4007)
```

## Setup

### Installation

```bash
cd apollo-router
pnpm install
```

### Environment Configuration

Create `.env` file:

```env
# Server
PORT=4000
NODE_ENV=development

# Apollo Graph Registry
APOLLO_GRAPH_REF=orya-wallet@current
APOLLO_KEY=your-apollo-key

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# JWT
JWT_SECRET=your-jwt-secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Supergraph
SUPERGRAPH_PATH=./supergraph.graphql
```

## Running

### Development

```bash
pnpm run dev
```

### Production Build

```bash
pnpm run build
pnpm run start
```

### Compose Supergraph

Before running the router, compose the supergraph from all subgraphs:

```bash
pnpm run compose
```

This uses Rover CLI to compose `supergraph.graphql` from all subgraph schemas defined in `supergraph-config.yaml`.

## Configuration Files

### router.yaml

Main Apollo Router configuration file with:
- **CORS Setup**: Allows requests from localhost:3000, 19006, 3001, 5173
- **Authentication**: Firebase JWT validation
- **Rate Limiting**: 100 requests per 60 seconds (configurable)
- **Telemetry**: Metrics and tracing enabled

### supergraph-config.yaml

Subgraph registry defining all federated services:
- User Service (4002)
- Wallet Service (4001)
- Transaction Service (4003)
- Protocol Service (4004)
- DeFi Service (4005)
- Portfolio Service (4006)
- Fiat Service (4007)

Each subgraph includes retry logic with exponential backoff.

### supergraph.graphql

Composed unified schema containing:
- All queries, mutations, and subscriptions from federated services
- Entity types with federation keys
- Complete data model for protocol-agnostic wallet

## API Endpoints

### GraphQL

```
POST http://localhost:4000/graphql
```

Full GraphQL API with authentication and rate limiting.

### Health Check

```
GET http://localhost:4000/health
```

Returns detailed health status including:
- Router status (healthy/degraded/unhealthy)
- Uptime
- Redis connection status
- All subgraph health status

### Readiness

```
GET http://localhost:4000/ready
```

Kubernetes-compatible readiness probe.

### Metrics (Admin Only)

```
GET http://localhost:4000/metrics
```

Detailed metrics including response times and health statistics.

### Schema

```
GET http://localhost:4000/schema
```

Returns the complete supergraph schema (authentication required).

### Subgraphs

```
GET http://localhost:4000/subgraphs
```

Lists all federated subgraphs with health status (authentication required).

### Configuration (Admin Only)

```
GET http://localhost:4000/config
```

Returns router configuration and settings.

## Authentication

The router supports two authentication methods:

### 1. Firebase JWT

```
Authorization: Bearer <firebase-id-token>
```

Firebase tokens are validated against public keys from Google's JWKS endpoint.

### 2. Standard JWT

```
Authorization: Bearer <jwt-token>
```

JWT tokens are validated using `JWT_SECRET` environment variable.

## Rate Limiting

- **Default**: 100 requests per 60 seconds
- **Key**: Per authenticated user (userId) or per IP address
- **Headers**:
  - `X-RateLimit-Limit`: Maximum requests
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

When limit exceeded: HTTP 429 with retry information.

## Plugins

### Authentication Plugin

Handles JWT validation for both Firebase and standard JWT tokens.

**File**: `src/plugins/authentication.ts`

Features:
- Firebase ID token validation
- Standard JWT validation
- Role-based access control
- Authorization guards

### Rate Limiting Plugin

Enforces rate limits using Redis for distributed tracking.

**File**: `src/plugins/rate-limiting.ts`

Features:
- Per-user rate limiting
- Per-IP fallback rate limiting
- Configurable limits and windows
- Redis-backed storage

### Health Check Service

Monitors router and all subgraph health.

**File**: `src/health/health-check.ts`

Features:
- Automatic subgraph health checks every 30 seconds
- Redis connectivity monitoring
- Response time tracking
- Status aggregation

## Error Handling

All errors include:
- Clear error message
- Timestamp
- Request path
- Request context

GraphQL errors from subgraphs are properly propagated through the gateway.

## Development

### TypeScript Strict Mode

All code uses TypeScript strict mode with:
- `noImplicitAny: true`
- `strictNullChecks: true`
- `strictFunctionTypes: true`

### Linting

```bash
pnpm run lint
```

### Testing

```bash
pnpm run test
```

## Performance Optimization

1. **Connection Pooling**: Redis configured with connection pool
2. **Caching**: Supergraph schema cached in memory
3. **Retry Logic**: Automatic retry for subgraph requests with exponential backoff
4. **Telemetry**: Prometheus metrics for monitoring

## Monitoring

### Health Endpoint

Regularly poll `/health` endpoint for comprehensive status:

```bash
curl http://localhost:4000/health
```

### Metrics Endpoint

View detailed metrics (requires admin role):

```bash
curl -H "Authorization: Bearer <admin-token>" \
  http://localhost:4000/metrics
```

### Subgraph Health

Check individual subgraph status:

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:4000/subgraphs
```

## Docker Deployment

### Build

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

EXPOSE 4000 8081
CMD ["pnpm", "start"]
```

### Run

```bash
docker run -p 4000:4000 -p 8081:8081 \
  -e APOLLO_KEY=$APOLLO_KEY \
  -e REDIS_HOST=redis \
  -e FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID \
  apollo-router:latest
```

## Troubleshooting

### Redis Connection Failed

Ensure Redis is running:

```bash
redis-cli ping  # Should return PONG
```

### Subgraph Unreachable

Check subgraph URLs in `supergraph-config.yaml` match running services:

```bash
curl http://localhost:4002/graphql  # User Service
curl http://localhost:4001/graphql  # Wallet Service
```

### Authentication Errors

1. Verify JWT in Authorization header
2. Check `JWT_SECRET` matches token issuer
3. For Firebase, ensure `FIREBASE_PROJECT_ID` is correct

### Rate Limit Errors

Check rate limit status in response headers:

```bash
curl -i http://localhost:4000/health
# Look for X-RateLimit-* headers
```

## Subgraph Composition

To update `supergraph.graphql` after changes to subgraph schemas:

```bash
pnpm run compose
```

This publishes the composed schema to Apollo Studio:

```bash
pnpm run graph:publish
```

Check for breaking changes:

```bash
pnpm run graph:check
```

## Resources

- [Apollo Router Documentation](https://www.apollographql.com/docs/router/)
- [Apollo Federation](https://www.apollographql.com/docs/federation/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)

## Support

For issues or questions about the Apollo Router setup, refer to the ORYA Wallet documentation or contact the team.
