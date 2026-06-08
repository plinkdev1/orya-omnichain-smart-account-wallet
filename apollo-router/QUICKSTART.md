# Apollo Router - Quick Start Guide

Get ORYA Apollo Router running in 5 minutes.

## Prerequisites

- Node.js 18+
- pnpm 8+
- Redis running locally

## 1. Install Dependencies

```bash
cd apollo-router
pnpm install
```

## 2. Configure Environment

```bash
cp .env.example .env
```

**Minimum required** in `.env`:
```env
JWT_SECRET=dev-secret-key
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 3. Compose Supergraph

```bash
pnpm run compose
```

This creates `supergraph.graphql` from all subgraph schemas.

**Note**: Make sure subgraph services are running on ports 4001-4007.

## 4. Start Router

```bash
pnpm run dev
```

You should see:
```
🚀 Apollo Router listening on port 4000
📊 Health check: http://localhost:4000/health
🔍 Metrics: http://localhost:4000/metrics
📋 Schema: http://localhost:4000/schema
🔌 Subgraphs: http://localhost:4000/subgraphs
⚙️  Config: http://localhost:4000/config
```

## 5. Test It

```bash
# Health check
curl http://localhost:4000/health | jq .

# GraphQL query (no auth required for health)
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'
```

## What's Running

| Service | Port | Purpose |
|---------|------|---------|
| Apollo Router | 4000 | GraphQL API |
| Health Server | 8081 | Health checks |
| Redis | 6379 | Rate limiting & caching |

## Common Issues

### "Cannot find supergraph.graphql"

Ensure you ran `pnpm run compose` and all subgraph services are accessible.

### "Redis connection refused"

Start Redis:
```bash
redis-server
```

Or with Docker:
```bash
docker run -d -p 6379:6379 redis:latest
```

### "Subgraph unreachable"

Check subgraph services are running:
```bash
curl http://localhost:4002/graphql  # User Service
curl http://localhost:4001/graphql  # Wallet Service
# etc...
```

## Next Steps

- Read [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for full details
- Check [README.md](./README.md) for all endpoints
- See [docker-compose.yml](./docker-compose.yml) to run all services together

## Quick Commands Reference

```bash
# Development
pnpm run dev                # Start in watch mode
pnpm run build              # Build for production
pnpm run start              # Start production build
pnpm run lint               # Check code style

# Supergraph
pnpm run compose            # Compose schema from subgraphs
pnpm run graph:publish      # Publish to Apollo Studio
pnpm run graph:check        # Check for breaking changes

# Testing
pnpm run test               # Run tests
```

## Using with Docker Compose

All services (router + subgraphs + Redis) in one command:

```bash
docker-compose up
```

Then access at `http://localhost:4000/graphql`
