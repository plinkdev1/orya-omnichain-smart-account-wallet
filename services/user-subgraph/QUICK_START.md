# User Subgraph Quick Start

## Prerequisites

- Node.js 20+ with npm/pnpm
- PostgreSQL 15+ running
- Redis 7+ running
- Workspace already set up

## Installation (5 min)

### 1. Install Dependencies

```bash
cd services/user-subgraph
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
NODE_ENV=development
USER_SUBGRAPH_PORT=4002

DATABASE_URL=postgresql://user:pass@localhost:5432/orya_wallet
REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRY=24h

# Optional - for Firebase integration
FIREBASE_PROJECT_ID=xxx
FIREBASE_PRIVATE_KEY=xxx
```

### 3. Verify Database Schema

The Prisma schema should already have User entities. Verify:

```bash
pnpm -C packages/database db:status
```

If migrations are pending:
```bash
pnpm -C packages/database db:push
```

### 4. Start the Service

```bash
pnpm dev
```

Expected output:
```
[user-subgraph] User Subgraph Service ready at http://localhost:4002
```

## Quick Test (2 min)

### Test 1: Health Check

```bash
curl http://localhost:4002/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ __typename }"
  }'
```

Expected: GraphQL response (may show error but server is running)

### Test 2: Sign Up

```bash
curl http://localhost:4002/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { signup(email: \"test@example.com\", password: \"SecurePass123!\") { user { id email } accessToken } }"
  }'
```

Expected:
```json
{
  "data": {
    "signup": {
      "user": { "id": "xxx", "email": "test@example.com" },
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

### Test 3: Get Current User

```bash
TOKEN="<accessToken from signup>"

curl http://localhost:4002/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "{ me { id email advancedMode } }"
  }'
```

Expected: Current user data

## Development Workflow

### Code Changes

```bash
# Watch mode auto-reloads
pnpm dev
```

### Type Checking

```bash
pnpm typecheck
```

### Linting

```bash
pnpm lint
```

### Testing

```bash
# Run tests once
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

### Building

```bash
pnpm build
# Output: dist/
```

## Common Tasks

### Add New Query

1. **Update schema** (`src/schema.graphql`):
```graphql
extend type Query {
  myNewQuery(id: ID!): MyType!
}
```

2. **Add resolver** (`src/resolvers.ts`):
```typescript
Query: {
  myNewQuery: async (parent, args, context) => {
    return context.prisma.myTable.findUnique({
      where: { id: args.id }
    });
  }
}
```

3. **Test** with curl or Apollo Studio

### Add New Mutation

Follow same pattern as query, but in `Mutation` type.

### Connect to Apollo Federation

The schema is already Apollo Federation compatible (`@key` directives).

To register with Apollo Router (port 4000):

```yaml
# apollo-router/supergraph.yaml
subgraphs:
  user:
    routing_url: http://localhost:4002
```

Then update router config and restart router.

## Connecting to Other Services

### Reference External Types

```graphql
type User @key(fields: "id") {
  id: ID!
  wallets: [Wallet!]! @external
}

type Wallet @key(fields: "id") {
  id: ID!
  userId: ID!
}
```

Other subgraphs should reference User similarly.

## Database Schema Reference

Key tables for this service:

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  privy_id TEXT UNIQUE NOT NULL,
  firebase_uid TEXT UNIQUE NOT NULL,
  kyc_status VARCHAR DEFAULT 'NONE',
  advanced_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Preferences
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES users(id),
  default_chain VARCHAR DEFAULT 'sui',
  hidden_tokens TEXT[] DEFAULT ARRAY[]::TEXT[],
  favorite_protocols TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Protocol Preferences
CREATE TABLE protocol_preferences (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  chain_id VARCHAR NOT NULL,
  feature VARCHAR NOT NULL,
  preferred_protocol VARCHAR NOT NULL,
  fallback_protocols TEXT[] DEFAULT ARRAY[]::TEXT[],
  UNIQUE(user_id, chain_id, feature)
);

-- Auto-Signing Config
CREATE TABLE auto_signing_configs (
  id UUID PRIMARY KEY,
  user_pref_id UUID UNIQUE NOT NULL REFERENCES user_preferences(id),
  enabled BOOLEAN DEFAULT false,
  threshold_usd FLOAT DEFAULT 100,
  whitelisted_contracts TEXT[] DEFAULT ARRAY[]::TEXT[],
  max_daily_amount_usd FLOAT DEFAULT 10000
);
```

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 4002
lsof -i :4002 | grep -v PID | awk '{print $2}' | xargs kill -9

# Or use different port
USER_SUBGRAPH_PORT=4202 pnpm dev
```

### Database Connection Fails

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Verify Prisma can connect
pnpm -C packages/database db:status
```

### Redis Connection Fails

```bash
# Check Redis running
redis-cli ping

# If not running:
redis-server
```

### GraphQL Schema Error

```bash
# Rebuild schema
pnpm build

# Check syntax
pnpm typecheck
```

### Tests Failing

```bash
# Clear test cache
rm -rf .vitest

# Run with debug
DEBUG=* pnpm test
```

## Next Steps

1. **Review schema**: `src/schema.graphql`
2. **Update resolvers**: `src/resolvers.ts` with your logic
3. **Add tests**: `src/resolvers.test.ts`
4. **Setup databases**: Ensure migrations ran
5. **Configure auth**: Update `.env` with real Firebase/Privy credentials
6. **Deploy**: See README.md for deployment

## Useful Commands

```bash
# Start in dev mode
pnpm dev

# Run tests with watch
pnpm test:watch

# Build for production
pnpm build
pnpm start

# Check types
pnpm typecheck

# Format code
pnpm format

# View GraphQL schema
pnpm schema:view

# Generate TypeScript types from GraphQL
pnpm generate:types
```

## Important Files

| File | Purpose |
|------|---------|
| `src/schema.graphql` | GraphQL schema definition |
| `src/resolvers.ts` | Resolver implementations |
| `src/types.ts` | TypeScript type definitions |
| `src/middleware/auth.ts` | Authentication logic |
| `src/dataloader.ts` | N+1 query prevention |
| `.env.example` | Environment variables template |

## Documentation

- **README.md** - Full documentation
- **docs/PROTOCOL_PREFERENCES.md** - Protocol selection feature
- **docs/CACHING.md** - Caching strategy
- **docs/SECURITY.md** - Security best practices

## Support

Check logs for errors:

```bash
# Verbose logging
RUST_LOG=debug pnpm dev

# Or for specific module
RUST_LOG=user_subgraph=debug pnpm dev
```

For issues, check:
1. `.env` configuration
2. Database connectivity
3. Redis connectivity
4. Port conflicts
5. Service logs
