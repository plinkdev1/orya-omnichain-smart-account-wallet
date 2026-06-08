# Apollo Router Federation Setup - Implementation Guide

## PROMPT 7 Complete Implementation

This document provides a complete implementation guide for PROMPT 7: Apollo Router Federation Setup for ORYA Wallet.

## What Was Implemented

### 1. Router Configuration ✅

**File**: `router.yaml`

Complete Apollo Router configuration with:
- **Server**: Listening on port 4000 with GraphQL endpoint at `/graphql`
- **Health Check**: Separate health check server on port 8081 at `/health`
- **CORS**: Configured for localhost:3000, 19006, 3001, 5173
- **Authentication**: Firebase JWT validation with JWKS endpoint
- **Rate Limiting**: Redis-backed 100 req/min (configurable)
- **Telemetry**: Prometheus metrics and tracing enabled

### 2. Supergraph Composition ✅

**File**: `supergraph-config.yaml`

Defines all 7 federated subgraphs:
- User Service (4002)
- Wallet Service (4001)
- Transaction Service (4003)
- Protocol Service (4004)
- DeFi Service (4005)
- Portfolio Service (4006)
- Fiat Service (4007)

Each includes retry logic with exponential backoff (3 attempts, up to 2s delay).

### 3. Authentication Plugin ✅

**File**: `src/plugins/authentication.ts`

Features:
- Firebase ID token validation against Google JWKS
- Standard JWT validation with HS256
- Role-based access control
- Authorization guards for protected endpoints
- Full context attachment to requests

### 4. Rate Limiting Plugin ✅

**File**: `src/plugins/rate-limiting.ts`

Features:
- Per-authenticated-user rate limiting
- Per-IP fallback for unauthenticated requests
- Redis-backed distributed tracking
- Configurable limits and windows
- Standard rate limit headers (X-RateLimit-*)
- HTTP 429 response with retry information

### 5. CORS Setup ✅

**File**: `router.yaml`

Configured CORS:
- Allowed Origins: localhost:3000, 19006, 3001, 5173
- Allowed Methods: GET, POST, OPTIONS
- Allowed Headers: Authorization, Content-Type, X-Apollo-Tracing, X-Client-Version
- Exposed Headers: RateLimit headers and standard headers
- Max Age: 3600 seconds

### 6. Health Checks ✅

**File**: `src/health/health-check.ts`

Comprehensive health monitoring:
- Subgraph health checks (every 30 seconds)
- Redis connectivity verification
- Response time tracking
- Status aggregation (healthy/degraded/unhealthy)
- Kubernetes-compatible readiness probes

## Project Structure

```
apollo-router/
├── src/
│   ├── plugins/
│   │   ├── authentication.ts      # JWT validation & role-based access
│   │   ├── rate-limiting.ts       # Redis-backed rate limiting
│   │   └── index.ts               # Plugin exports
│   ├── health/
│   │   └── health-check.ts        # Subgraph health monitoring
│   ├── config/
│   │   └── index.ts               # Configuration management
│   └── main.ts                    # Server bootstrap
├── router.yaml                    # Apollo Router config
├── supergraph-config.yaml         # Subgraph registry for composition
├── supergraph.graphql             # Composed unified schema
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── Dockerfile                     # Container image
├── docker-compose.yml             # Local dev environment
├── .env.example                   # Environment template
├── README.md                      # Full documentation
└── IMPLEMENTATION_GUIDE.md        # This file
```

## Getting Started

### Step 1: Installation

```bash
cd apollo-router
pnpm install
```

### Step 2: Environment Setup

```bash
cp .env.example .env
```

Update `.env` with your configuration:
```env
APOLLO_KEY=your-key-here
FIREBASE_PROJECT_ID=your-project-id
JWT_SECRET=your-secret
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Step 3: Compose Supergraph

Ensure all subgraph services are running, then:

```bash
pnpm run compose
```

This uses Apollo Rover to compose the unified schema from all subgraphs.

### Step 4: Development

```bash
pnpm run dev
```

This starts the router on port 4000 with:
- GraphQL endpoint: `http://localhost:4000/graphql`
- Health check: `http://localhost:4000/health`
- Metrics: `http://localhost:4000/metrics`

## API Endpoints

### GraphQL API

```
POST http://localhost:4000/graphql
```

**Example with authentication:**
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ me { id email } }"}'
```

### Health Check

```
GET http://localhost:4000/health
```

Returns comprehensive status:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600000,
  "redis": {
    "status": "connected",
    "responseTime": 2
  },
  "subgraphs": [
    {
      "name": "user",
      "status": "healthy",
      "responseTime": 45,
      "lastCheck": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Readiness Probe

```
GET http://localhost:4000/ready
```

Kubernetes-compatible readiness endpoint.

### Metrics (Admin)

```
GET http://localhost:4000/metrics
```

Requires admin role. Returns detailed metrics.

## Usage Examples

### Authentication

#### Firebase JWT

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Authorization: Bearer <firebase-id-token>" \
  -H "Content-Type: application/json"
```

#### Standard JWT

```bash
# Generate JWT
node -e "console.log(require('jsonwebtoken').sign({sub:'user123', email:'user@example.com'}, 'your-jwt-secret'))"

# Use JWT
curl -X POST http://localhost:4000/graphql \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json"
```

### Rate Limiting

After 100 requests in 60 seconds:

```bash
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1705320660

{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Maximum 100 requests per minute.",
  "retryAfter": 45
}
```

### Query Example

```graphql
query GetUser {
  me {
    id
    email
    kycStatus
    advancedMode
    wallets {
      id
      address
      chainType
      balances {
        symbol
        amount
        amountUSD
      }
    }
  }
}
```

## Production Deployment

### 1. Build Docker Image

```bash
docker build -t orya-apollo-router:latest .
```

### 2. Push to Registry

```bash
docker tag orya-apollo-router:latest your-registry/orya-apollo-router:latest
docker push your-registry/orya-apollo-router:latest
```

### 3. Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: apollo-router
spec:
  replicas: 2
  selector:
    matchLabels:
      app: apollo-router
  template:
    metadata:
      labels:
        app: apollo-router
    spec:
      containers:
      - name: apollo-router
        image: your-registry/orya-apollo-router:latest
        ports:
        - containerPort: 4000
          name: graphql
        - containerPort: 8081
          name: health
        env:
        - name: NODE_ENV
          value: production
        - name: APOLLO_KEY
          valueFrom:
            secretKeyRef:
              name: apollo-secrets
              key: apollo-key
        - name: REDIS_HOST
          value: redis.default.svc.cluster.local
        - name: REDIS_PORT
          value: "6379"
        livenessProbe:
          httpGet:
            path: /health
            port: 8081
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /ready
            port: 8081
          initialDelaySeconds: 5
          periodSeconds: 10
```

## Troubleshooting

### Cannot Compose Supergraph

Ensure all subgraph services are running on their expected ports:

```bash
# Test each service
curl http://localhost:4002/graphql   # User
curl http://localhost:4001/graphql   # Wallet
curl http://localhost:4003/graphql   # Transaction
curl http://localhost:4004/graphql   # Protocol
curl http://localhost:4005/graphql   # DeFi
curl http://localhost:4006/graphql   # Portfolio
curl http://localhost:4007/graphql   # Fiat
```

### Redis Connection Failed

```bash
# Verify Redis is running
redis-cli ping  # Should return PONG

# Check Redis connection
redis-cli -h localhost -p 6379 info
```

### Authentication Errors

1. Check Authorization header format: `Bearer <token>`
2. Verify token is valid and not expired
3. For Firebase, ensure `FIREBASE_PROJECT_ID` is correct
4. For JWT, ensure `JWT_SECRET` matches token issuer

### Rate Limit False Positives

- Check Redis is accessible and responsive
- Verify Redis TTL is set correctly (60 seconds default)
- Check for clock skew between services

## Monitoring & Observability

### Health Monitoring

Poll health endpoint every 30 seconds:

```bash
while true; do
  curl http://localhost:4000/health | jq .
  sleep 30
done
```

### Metrics Collection

Expose metrics for Prometheus:

```bash
curl http://localhost:4000/metrics
```

### Logs

All logs are JSON formatted for easy parsing:

```bash
# View logs
docker logs orya-apollo-router | jq .

# Filter by level
docker logs orya-apollo-router | jq 'select(.level=="error")'
```

## Performance Tuning

### Rate Limiting Adjustments

Edit `src/main.ts`:

```typescript
const rateLimiter = createRateLimiter({
  maxRequests: 1000,        // Increase limit
  windowMs: 60 * 1000,      // Keep 60 second window
});
```

### Redis Connection Pool

Edit `src/config/index.ts`:

```typescript
redis: {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  poolSize: 20,  // Increase pool size
}
```

### Subgraph Timeout

Edit `supergraph-config.yaml`:

```yaml
subgraphs:
  user:
    schema:
      retry:
        attempts: 5     # Increase retries
        backoff:
          max_delay: 5s # Increase max delay
```

## Security Considerations

1. **JWT Secret**: Use strong, randomly generated secrets
2. **Firebase Keys**: Keep private keys in secure vaults
3. **CORS Origins**: Restrict to known domains in production
4. **Rate Limiting**: Adjust based on your threat model
5. **Redis Auth**: Enable Redis password in production
6. **HTTPS**: Use TLS/HTTPS in production

## Support & Resources

- **Apollo Router Docs**: https://www.apollographql.com/docs/router/
- **Apollo Federation**: https://www.apollographql.com/docs/federation/
- **ORYA Wallet Docs**: See main documentation
- **GraphQL Best Practices**: https://graphql.org/learn/best-practices/

## Testing

### Unit Tests

```bash
pnpm run test
```

### Integration Tests

```bash
pnpm run test:integration
```

### Load Testing

```bash
# Using Apache Bench
ab -n 1000 -c 100 http://localhost:4000/health

# Using wrk
wrk -t12 -c400 -d30s http://localhost:4000/health
```

## Maintenance

### Update Dependencies

```bash
pnpm update
```

### Rebuild Schema

After subgraph changes:

```bash
pnpm run compose
pnpm run graph:publish
```

### Check for Breaking Changes

```bash
pnpm run graph:check
```

## Next Steps

1. Integrate with CI/CD pipeline
2. Set up monitoring and alerting
3. Configure backup Redis instances
4. Implement caching strategies
5. Add custom authentication providers if needed
6. Scale horizontally with load balancing

## Completion Checklist

- [x] Router configuration with CORS, auth, rate limiting
- [x] Supergraph composition with all 7 subgraphs
- [x] Authentication plugin (Firebase + JWT)
- [x] Rate limiting plugin (Redis-backed)
- [x] CORS setup for web/mobile clients
- [x] Health checks and monitoring
- [x] TypeScript strict mode
- [x] Docker containerization
- [x] Docker Compose for local dev
- [x] Production deployment guide
- [x] Comprehensive documentation
- [x] No TODOs/FIXMEs in production code

**Status**: ✅ COMPLETE

PROMPT 7 implementation is ready for development and production use.
