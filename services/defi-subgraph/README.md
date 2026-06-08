# DeFi Operations Subgraph

DeFi Operations Subgraph is a GraphQL subgraph service that provides unified access to staking, lending, and yield farming operations across multiple protocols and blockchains.

## Features

✅ **Staking Operations**: Stake tokens, track positions, claim rewards
✅ **Lending Markets**: Supply, borrow, repay, and manage lending positions
✅ **Yield Farming**: Deposit LP tokens, harvest rewards, track positions
✅ **Protocol Abstraction**: Support for multiple protocols via adapter pattern
✅ **Multi-Chain**: Support for Ethereum, SUI, Solana, and other chains
✅ **Caching**: Redis-based caching for optimized performance
✅ **Real-Time Updates**: GraphQL subscriptions for position updates
✅ **Rewards Calculation**: Automatic reward estimation and tracking

## Architecture

### Core Components

**Services**:
- `StakingService`: Manages staking operations and positions
- `LendingService`: Handles lending market queries and position management
- `YieldFarmingService`: Manages yield farming operations
- `RewardsService`: Calculates and tracks rewards

**Protocol Integration**:
- `ProtocolAdapterRegistry`: Manages protocol adapters
- `ProtocolAdapter`: Interface for protocol-specific implementations

**Utilities**:
- `CacheManager`: Redis-based caching with TTL
- `ProtocolAdapterRegistry`: Registry for managing protocol adapters

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL (Neon)
- Redis
- TypeScript 5+

### Installation

```bash
npm install
```

### Configuration

Create `.env` file:

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
DEFI_SUBGRAPH_PORT=4005
LOG_LEVEL=info
JWT_SECRET=your-secret-key
```

### Running Locally

```bash
npm run dev
```

### Building

```bash
npm run build
npm start
```

## GraphQL Schema

### Queries

#### Staking

```graphql
stakingOpportunities(chainId: String!, protocol: String): [StakingOpportunity!]!
stakingOpportunity(id: ID!): StakingOpportunity
stakingPositions(userId: ID!, chainId: String): [StakingPosition!]!
stakingPosition(id: ID!): StakingPosition
```

#### Lending

```graphql
lendingMarkets(chainId: String!, protocol: String): [LendingMarket!]!
lendingMarket(id: ID!): LendingMarket
lendingPositions(userId: ID!, chainId: String): [LendingPosition!]!
lendingPosition(id: ID!): LendingPosition
```

#### Yield Farming

```graphql
yieldFarmingOpportunities(chainId: String!, protocol: String): [YieldFarmingOpportunity!]!
yieldFarmingOpportunity(id: ID!): YieldFarmingOpportunity
yieldFarmingPositions(userId: ID!, chainId: String): [YieldFarmingPosition!]!
yieldFarmingPosition(id: ID!): YieldFarmingPosition
```

#### Rewards & Health

```graphql
positionSummary(userId: ID!, chainId: String): PositionSummary
calculateRewards(positionId: ID!): RewardCalculation!
protocolHealth(protocol: String!, chainId: String!): ProtocolHealth!
```

### Mutations

#### Staking

```graphql
stakeTokens(
  chainId: String!
  protocol: String!
  amount: String!
  validator: String
): Transaction!

unstakeTokens(
  chainId: String!
  protocol: String!
  positionId: ID!
  amount: String!
): Transaction!

claimRewards(
  chainId: String!
  protocol: String!
  positionId: ID!
): Transaction!
```

#### Lending

```graphql
depositLending(
  chainId: String!
  protocol: String!
  assetAddress: String!
  amount: String!
): Transaction!

borrowLending(
  chainId: String!
  protocol: String!
  assetAddress: String!
  amount: String!
): Transaction!

repayLending(
  chainId: String!
  protocol: String!
  assetAddress: String!
  amount: String!
): Transaction!
```

#### Yield Farming

```graphql
depositYieldFarming(
  chainId: String!
  protocol: String!
  farmAddress: String!
  lpTokenAmount: String!
): Transaction!

withdrawYieldFarming(
  chainId: String!
  protocol: String!
  positionId: ID!
  amount: String!
): Transaction!

harvestRewards(
  chainId: String!
  protocol: String!
  positionId: ID!
): Transaction!
```

### Subscriptions

```graphql
stakingPositionUpdated(userId: ID!): StakingPosition!
lendingPositionUpdated(userId: ID!): LendingPosition!
yieldFarmingPositionUpdated(userId: ID!): YieldFarmingPosition!
rewardsEarned(userId: ID!): RewardCalculation!
```

## Protocol Adapter Integration

To add a new protocol adapter:

1. **Implement ProtocolAdapter Interface**:

```typescript
class MyProtocolAdapter implements ProtocolAdapter {
  async getStakingOpportunities(): Promise<StakingOpportunity[]> {
    // Implementation
  }
  
  async stakeTokens(input: StakeTokensInput): Promise<string> {
    // Implementation returns transaction hash
  }
  
  // ... implement other methods
}
```

2. **Register Adapter**:

```typescript
const adapter = new MyProtocolAdapter();
protocolAdapters.register('ethereum:my-protocol', adapter);
```

## Caching Strategy

The service uses Redis for caching with chain-scoped TTLs:

- **Staking Opportunities**: 600 seconds
- **Lending Markets**: 600 seconds  
- **Yield Farming Opportunities**: 600 seconds
- **Rewards Calculations**: 300 seconds
- **Position Summary**: 300 seconds
- **Protocol Health**: 60 seconds

Cache keys are namespaced by entity type and IDs for efficient invalidation.

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

## Type Checking

```bash
npm run typecheck
```

## Linting

```bash
npm run lint
```

## Error Handling

The service implements comprehensive error handling:

- **Missing Adapter**: Returns empty array or null
- **Network Errors**: Logged and gracefully handled
- **Invalid Input**: GraphQL validation
- **Cache Failures**: Falls back to direct queries

## Performance Considerations

1. **Batch Operations**: Implement data loaders for batch fetches
2. **Caching**: Strategic TTLs to balance freshness and performance
3. **Pagination**: Implement cursor-based pagination for large datasets
4. **Lazy Loading**: Load related data only when requested

## Federation

This subgraph is part of Apollo Federation architecture:

```
Apollo Router (4000)
├── Wallet Subgraph (4001)
├── User Subgraph (4002)
├── Portfolio Subgraph (4003)
├── Transaction Subgraph (4004)
└── DeFi Subgraph (4005)
```

## Monitoring

The service logs important events using Pino:

- Service startup
- Protocol adapter registration
- Cache hits/misses
- API calls
- Errors

Set `LOG_LEVEL=debug` for detailed logs.

## Security

- JWT authentication via Authorization header
- User data isolation
- RPC provider failover for resilience
- Input validation via GraphQL

## Troubleshooting

### Redis Connection Fails

Check Redis is running:
```bash
redis-cli ping
```

### Database Connection Fails

Verify DATABASE_URL is set correctly and PostgreSQL is accessible.

### Protocol Adapter Not Found

Ensure adapter is registered before queries:
```typescript
protocolAdapters.register('chainId:protocol', adapter);
```

## License

MIT
