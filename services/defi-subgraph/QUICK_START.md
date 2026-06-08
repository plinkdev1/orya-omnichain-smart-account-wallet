# DeFi Subgraph - Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies

From the workspace root:
```bash
pnpm install
```

### 2. Set Environment Variables

Create `.env` in `services/defi-subgraph/`:
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/orya_wallet
REDIS_URL=redis://localhost:6379
DEFI_SUBGRAPH_PORT=4005
LOG_LEVEL=debug
JWT_SECRET=your-secret-key
```

### 3. Start Development Server

```bash
cd services/defi-subgraph
npm run dev
```

Server runs at `http://localhost:4005`

### 4. Query with Apollo Studio

Open GraphQL sandbox:
```bash
curl -X POST http://localhost:4005 \
  -H "Content-Type: application/json" \
  -d '{"query":"{ stakingOpportunities(chainId: \"ethereum\") { id apy } }"}'
```

Or visit http://localhost:4005 in browser if running standalone server.

## Common Tasks

### Add a New Protocol

1. Create adapter implementing `ProtocolAdapter` interface:
```typescript
// src/adapters/my-protocol-adapter.ts
import type { ProtocolAdapter } from '../types';

export class MyProtocolAdapter implements ProtocolAdapter {
  async getStakingOpportunities() { ... }
  async stakeTokens(input) { ... }
  // ... implement all methods
}
```

2. Register in `src/index.ts`:
```typescript
import { MyProtocolAdapter } from './adapters/my-protocol-adapter';

const myAdapter = new MyProtocolAdapter();
protocolAdapters.register('ethereum:my-protocol', myAdapter);
```

### Query Staking Opportunities

```graphql
query GetStakingOpportunities {
  stakingOpportunities(chainId: "ethereum") {
    id
    protocol
    apy
    tvl
    minStake
    rewardToken
  }
}
```

### Get User Positions

```graphql
query GetUserPositions {
  stakingPositions(userId: "user-123", chainId: "ethereum") {
    id
    stakedAmount
    rewardsEarned
    apy
    status
  }
}
```

### Stake Tokens

```graphql
mutation StakeTokens {
  stakeTokens(
    chainId: "ethereum"
    protocol: "lido"
    amount: "1000000000000000000"
  ) {
    id
  }
}
```

### Get Position Summary

```graphql
query GetSummary {
  positionSummary(userId: "user-123", chainId: "ethereum") {
    totalStakedUSD
    totalBorrowedUSD
    totalValueLockedUSD
    healthFactor
    riskLevel
  }
}
```

## Testing

Run tests:
```bash
npm run test
```

Watch mode:
```bash
npm run test:watch
```

Coverage:
```bash
npm run test:coverage
```

## Build & Deploy

### Development Build
```bash
npm run build
```

### Production Build & Start
```bash
npm run build
npm start
```

### Docker
```bash
docker build -t orya-defi-subgraph .
docker run -p 4005:4005 \
  -e DATABASE_URL=... \
  -e REDIS_URL=... \
  orya-defi-subgraph
```

## Troubleshooting

### Port 4005 Already in Use
```bash
# Change port
DEFI_SUBGRAPH_PORT=4006 npm run dev
```

### Redis Connection Error
```bash
# Verify Redis is running
redis-cli ping
# Should return: PONG

# Or start Redis
redis-server
```

### Database Connection Error
```bash
# Verify PostgreSQL is running
psql $DATABASE_URL -c "SELECT 1"

# Or check connection string
echo $DATABASE_URL
```

### No Data Returned from Queries
1. Check protocol adapter is registered
2. Verify protocol adapter implements all methods
3. Check service logs: `LOG_LEVEL=debug`
4. Review adapter error handling

### Tests Failing
```bash
# Clear cache and reinstall
rm -rf node_modules
pnpm install

# Run with verbose output
npm run test -- --reporter=verbose
```

## Development Tips

### Enable Debug Logging
```bash
LOG_LEVEL=debug npm run dev
```

### Use VS Code GraphQL Extension
Install "GraphQL" extension and create `.graphqlconfig.json`:
```json
{
  "projects": {
    "defi-subgraph": {
      "schema": "src/schema.graphql",
      "documents": "**/*.graphql"
    }
  }
}
```

### Mock Protocol Adapter for Testing
```typescript
const mockAdapter: ProtocolAdapter = {
  name: 'test',
  chainId: 'ethereum',
  async getStakingOpportunities() {
    return [{
      id: 'test-1',
      apy: 5,
      // ...
    }];
  },
  // ... other methods
};

protocolAdapters.register('ethereum:test', mockAdapter);
```

### Update Cache TTLs
Edit `src/services/*.ts` cache initialization:
```typescript
// Change TTL (in seconds)
private cacheManager = new CacheManager(300); // 5 minutes
```

## Documentation Links

- [Full README](./README.md) - Complete API documentation
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - Architecture overview
- [Protocol Adapter Guide](./PROTOCOL_ADAPTER_EXAMPLE.md) - How to add protocols
- [GraphQL Schema](./src/schema.graphql) - Complete schema definition

## Next Steps

1. ✅ Run the dev server
2. ✅ Test sample queries
3. ✅ Review adapter examples
4. ✅ Implement your first protocol adapter
5. ✅ Write tests for your adapter
6. ✅ Deploy to production

## Support

For help:
1. Check README.md FAQ
2. Review test files for examples
3. Check service implementation
4. Look at adapter implementations
5. File an issue with debug logs

## Performance

Typical response times:
- Opportunities query: 100ms (5ms with cache)
- Positions query: 150ms (10ms with cache)
- Mutations: 500-2000ms
- Subscriptions: Real-time

## Monitoring

Key metrics:
- Query count: `metrics.query_count`
- Error rate: `metrics.error_rate`
- Cache hit rate: Redis stats
- DB pool usage: Prisma metrics

Monitor logs for:
```
[INFO] User authenticated
[WARN] Cache retrieval failed
[ERROR] Protocol adapter error
```

Happy building! 🚀
