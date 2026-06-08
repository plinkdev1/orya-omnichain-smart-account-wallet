# User & Authentication Subgraph

Apollo GraphQL Subgraph for User Management, Authentication, and Protocol Preferences (Port 4002).

## Overview

The User Subgraph handles:
- **User Management**: Registration, login, profile updates
- **Authentication**: JWT-based auth with Firebase integration
- **Authorization**: Role-based access control (RBAC)
- **Protocol Preferences**: User-selectable protocol configuration per chain/feature
- **Advanced Mode**: Toggle for power users vs. simple mode
- **Auto-Signing**: Configurable auto-signing policies for micro-transactions
- **KYC Integration**: KYC status tracking with provider integration (Sumsub, Persona)
- **Caching**: Redis-based caching for performance
- **DataLoaders**: Batch loading to prevent N+1 queries

## Architecture

```
User Subgraph (Port 4002)
├── Schema (schema.graphql)
├── Resolvers (resolvers.ts)
├── Authentication Middleware (middleware/auth.ts)
├── Caching Layer (utils/cache.ts)
├── DataLoaders (dataloader.ts)
└── Database (Prisma ORM)
```

## GraphQL Schema

### Core Types

**User**
```graphql
type User @key(fields: "id") {
  id: ID!
  email: String!
  privyId: String!
  firebaseUid: String!
  kycStatus: KYCStatus!
  kycProvider: KYCProvider
  advancedMode: Boolean!
  preferences: UserPreferences!
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

**UserPreferences**
```graphql
type UserPreferences {
  protocols: [ProtocolPreference!]!
  autoSigning: AutoSigningConfig!
  defaultChain: String!
  hiddenTokens: [String!]!
  favoriteProtocols: [String!]!
}
```

**ProtocolPreference**
```graphql
type ProtocolPreference {
  chainId: String!
  feature: FeatureType!
  preferredProtocol: String!
  fallbackProtocols: [String!]!
  lastUpdated: DateTime!
}
```

**AutoSigningConfig**
```graphql
type AutoSigningConfig {
  enabled: Boolean!
  thresholdUSD: Float!
  whitelistedContracts: [String!]!
  expiryHours: Int!
  maxDailyAmountUSD: Float!
  requireBiometric: Boolean!
}
```

### Queries

**Get Current User**
```graphql
query {
  me {
    id
    email
    advancedMode
    preferences {
      protocols {
        chainId
        feature
        preferredProtocol
      }
    }
  }
}
```

**Get User by ID**
```graphql
query {
  user(id: "user-123") {
    id
    email
    kycStatus
    createdAt
  }
}
```

**List Users (Admin Only)**
```graphql
query {
  users(filter: { kycStatus: APPROVED }, pagination: { first: 10 }) {
    edges {
      node {
        id
        email
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

### Mutations

**Sign Up**
```graphql
mutation {
  signup(email: "user@example.com", password: "secure-password") {
    user {
      id
      email
    }
    accessToken
    refreshToken
    expiresIn
  }
}
```

**Login**
```graphql
mutation {
  login(email: "user@example.com", password: "secure-password") {
    user { id email }
    accessToken
    refreshToken
  }
}
```

**Set Protocol Preference**
```graphql
mutation {
  setProtocolPreference(
    chainId: "ethereum"
    feature: SWAP
    protocolId: "uniswap-v3"
    fallbacks: ["uniswap-v2"]
  ) {
    chainId
    feature
    preferredProtocol
    lastUpdated
  }
}
```

**Enable Advanced Mode**
```graphql
mutation {
  setAdvancedMode(enabled: true) {
    id
    advancedMode
  }
}
```

**Update Auto-Signing Config**
```graphql
mutation {
  updateAutoSigningConfig(config: {
    enabled: true
    thresholdUSD: 500
    maxDailyAmountUSD: 5000
    requireBiometric: true
  }) {
    id
    preferences {
      autoSigning {
        enabled
        thresholdUSD
      }
    }
  }
}
```

**Initiate KYC**
```graphql
mutation {
  initiateKYC(provider: SUMSUB) {
    id
    sessionId
    externalUrl
    expiresAt
  }
}
```

### Subscriptions

**User Updated**
```graphql
subscription {
  userUpdated(userId: "user-123") {
    id
    advancedMode
    updatedAt
  }
}
```

**KYC Status Changed**
```graphql
subscription {
  kycStatusChanged(userId: "user-123")
}
```

## Authentication & Authorization

### JWT Flow

1. **Sign Up/Login**: User receives `accessToken` (24h) and `refreshToken` (7d)
2. **Request**: Include token in `Authorization: Bearer <token>`
3. **Validation**: JWT verified using `JWT_SECRET`
4. **Cache**: User loaded into Redis for 5 minutes

### Authorization Checks

```typescript
// User can access their own data
canAccessUserData(context, userId) // true if userId === context.userId or admin

// Admin-only queries
requireAdmin(context) // throws error if not admin email

// Required authentication
requireAuth(context) // throws error if not authenticated
```

### Admin Emails

Set `ADMIN_EMAILS` env var:
```env
ADMIN_EMAILS=admin@example.com,support@example.com
```

## Protocol Preferences Integration

The User Subgraph integrates with `@orya/protocol-core` PreferencesStore:

```typescript
// User selects preferred protocol for each chain + feature
const preference = await setProtocolPreference({
  chainId: 'ethereum',
  feature: 'SWAP',
  protocolId: 'uniswap-v3',
  fallbacks: ['uniswap-v2', 'sushiswap']
});

// Protocol Router uses these preferences for transaction routing
const protocol = await getPreferredProtocol({
  userId: 'user-123',
  chainId: 'ethereum',
  feature: 'SWAP'
});
```

## Caching Strategy

### Cache Keys

```
user:<userId> => Full user object + preferences (TTL: 5 min)
user:<userId>:preferences => User preferences (TTL: 5 min)
user:<userId>:protocols => Protocol preferences (TTL: 10 min)
```

### Invalidation

```typescript
// On profile update
await cache.invalidateUser(userId);

// On preference change
await cache.del(`user:${userId}:protocols`);
```

## DataLoaders

Prevent N+1 queries:

```typescript
// Single SQL query for batch of users
const users = await Promise.all([
  dataloader.userById.load('user-1'),
  dataloader.userById.load('user-2'),
]);

// Batches: SELECT * FROM users WHERE id IN ('user-1', 'user-2')
```

## Installation

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+

### Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Initialize database:**
   ```bash
   pnpm -C packages/database db:push
   ```

4. **Start development:**
   ```bash
   pnpm dev
   ```

## Development

### Run Tests

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

### Type Checking

```bash
pnpm typecheck
```

### Linting

```bash
pnpm lint
```

### Build

```bash
pnpm build
```

## Production Deployment

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm build
EXPOSE 4002
CMD ["node", "dist/index.js"]
```

### Environment Variables (Production)

```env
NODE_ENV=production
LOG_LEVEL=info
JWT_SECRET=<generate-strong-secret>
DATABASE_URL=<production-db-url>
REDIS_HOST=<redis-host>
FIREBASE_PROJECT_ID=<firebase-id>
FIREBASE_PRIVATE_KEY=<firebase-key>
```

## Integration with Federation

The subgraph is part of Apollo Federation:

```
Apollo Router (Port 4000)
├── User Subgraph (Port 4002) ← This service
├── Wallet Subgraph (Port 4001)
├── Transaction Subgraph (Port 4003)
└── Portfolio Subgraph (Port 4003)
```

### Entity References

```graphql
type User @key(fields: "id") {
  id: ID!
  wallets: [Wallet!]! @external
  transactions: [Transaction!]! @external
}
```

## Monitoring & Logging

### Log Levels
- Development: `debug`
- Production: `info`

### Structured Logging (Pino)

```json
{
  "level": "info",
  "time": "2025-01-15T10:30:00Z",
  "userId": "user-123",
  "action": "LOGIN",
  "message": "User logged in successfully"
}
```

## Troubleshooting

### Authentication Fails
- Check `JWT_SECRET` is consistent
- Verify token hasn't expired
- Check Firebase credentials

### Cache Issues
- Verify Redis connection: `redis-cli ping`
- Check Redis logs: `redis-server --logfile redis.log`
- Clear cache: `redis-cli FLUSHDB`

### Database Connection
- Test PG connection: `psql $DATABASE_URL`
- Check pooling: Ensure `DATABASE_URL` has correct pool size
- Review migrations: `pnpm -C packages/database db:status`

## API Reference

See [PROTOCOL_PREFERENCES.md](./docs/PROTOCOL_PREFERENCES.md) for detailed protocol preferences integration.

See [CACHING.md](./docs/CACHING.md) for caching strategy documentation.

See [SECURITY.md](./docs/SECURITY.md) for security best practices.
