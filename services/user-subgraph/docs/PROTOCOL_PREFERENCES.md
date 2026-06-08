# Protocol Preferences Integration

## Overview

Users can select their preferred protocols for each DeFi feature on each blockchain. This enables:
- **User Control**: Choose favorite protocols (Uniswap vs. SushiSwap for swaps)
- **Failover**: Define fallback protocols if primary is unavailable
- **Advanced Mode**: Toggle for complex multi-protocol strategies
- **Simple Mode**: Pre-selected best-practice protocols

## Data Model

```prisma
model ProtocolPreference {
  id                String @id @default(uuid())
  userId            String
  user              User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  chainId           String       // 'sui', 'ethereum', 'solana', etc.
  feature           String       // 'swap', 'stake', 'lend', 'bridge', 'aggregator'
  preferredProtocol String       // 'uniswap-v3', 'aave', 'lido', etc.
  fallbackProtocols String[]     // Ordered list of fallbacks
  
  lastUpdated       DateTime @updatedAt
  
  @@unique([userId, chainId, feature])
}
```

## GraphQL API

### Query: User Protocol Preferences

```graphql
query GetUserProtocolPreferences($userId: ID!) {
  user(id: $userId) {
    preferences {
      protocols {
        chainId
        feature
        preferredProtocol
        fallbackProtocols
        lastUpdated
      }
    }
  }
}
```

### Mutation: Set Protocol Preference

```graphql
mutation SetSwapPreference {
  setProtocolPreference(
    chainId: "ethereum"
    feature: SWAP
    protocolId: "uniswap-v3"
    fallbacks: ["uniswap-v2", "sushiswap"]
  ) {
    chainId
    feature
    preferredProtocol
    fallbackProtocols
    lastUpdated
  }
}
```

## Features

### Multi-Chain Support

Each chain has independent protocol preferences:

```typescript
const ethereumSwapProtocol = await getPreferredProtocol({
  userId: 'user-123',
  chainId: 'ethereum',
  feature: 'SWAP'
}); // Returns: { protocol: 'uniswap-v3', fallbacks: [...] }

const suiSwapProtocol = await getPreferredProtocol({
  userId: 'user-123',
  chainId: 'sui',
  feature: 'SWAP'
}); // Returns: { protocol: 'cetus', fallbacks: [...] }
```

### Feature-Based Selection

Different protocols for different DeFi operations:

```
SWAP          → Uniswap, SushiSwap, Curve
STAKE         → Lido, Rocket Pool, Stafi
LEND          → Aave, Compound, Radiant
BRIDGE        → LayerZero, Stargate, Hop
AGGREGATOR    → 0x, 1inch, Paraswap
```

### Fallback Mechanism

Ordered fallback chain for reliability:

```typescript
const protocols = [
  'uniswap-v3',  // Primary
  'uniswap-v2',  // Fallback 1
  'sushiswap',   // Fallback 2
];

// Try in order until success
for (const protocol of protocols) {
  try {
    return await executeSwap(protocol, params);
  } catch (error) {
    // Continue to next fallback
    continue;
  }
}
```

## Advanced Mode vs Simple Mode

### Simple Mode (Default)
```typescript
// User gets pre-configured protocols
const preferences = {
  ethereum: {
    SWAP: { protocol: 'uniswap-v3', fallbacks: ['uniswap-v2'] },
    STAKE: { protocol: 'lido', fallbacks: [] },
  },
  sui: {
    SWAP: { protocol: 'cetus', fallbacks: ['aftermath'] },
  }
};
```

### Advanced Mode
```typescript
// User can customize per chain/feature
mutation {
  setAdvancedMode(enabled: true)
}

// Now user can set granular preferences
mutation {
  setProtocolPreference(
    chainId: "ethereum"
    feature: SWAP
    protocolId: "curve"
    fallbacks: ["balancer", "uniswap-v3"]
  )
}
```

## Database Schema

### Unique Constraint

Ensures only one preference per (user, chain, feature):

```sql
UNIQUE (user_id, chain_id, feature)
```

### Indexes

For efficient queries:

```sql
CREATE INDEX idx_protocol_prefs_user 
  ON protocol_preferences(user_id);

CREATE INDEX idx_protocol_prefs_user_chain_feature 
  ON protocol_preferences(user_id, chain_id, feature);
```

## Integration with Protocol Router

The Protocol Router uses these preferences:

```typescript
class ProtocolRouter {
  async selectProtocol(
    userId: string,
    chainId: string,
    feature: FeatureType
  ): Promise<Protocol> {
    const preference = await getProtocolPreference({
      userId,
      chainId,
      feature,
    });

    for (const protocolId of [
      preference.preferredProtocol,
      ...preference.fallbackProtocols,
    ]) {
      const protocol = await getProtocol(protocolId);
      if (protocol.isHealthy()) {
        return protocol;
      }
    }

    throw new Error('No healthy protocols available');
  }
}
```

## Caching

Protocol preferences are cached in Redis:

```
user:<userId>:protocols => { chainId: feature: protocol: ... }
TTL: 10 minutes
```

Invalidated on update:

```typescript
await setProtocolPreference(args);
await cache.del(`user:${userId}:protocols`);
```

## Validation

### Protocol Exists

```typescript
const protocol = await prisma.protocol.findUnique({
  where: { protocolId: args.protocolId }
});
if (!protocol) {
  throw new Error('Protocol not found');
}
```

### Chain Supported

```typescript
const supportedChains = ['sui', 'ethereum', 'solana', 'bitcoin'];
if (!supportedChains.includes(args.chainId)) {
  throw new Error('Chain not supported');
}
```

### Feature Valid

```typescript
enum FeatureType {
  SWAP = 'SWAP',
  STAKE = 'STAKE',
  LEND = 'LEND',
  BRIDGE = 'BRIDGE',
  AGGREGATOR = 'AGGREGATOR',
}
```

## Examples

### Set Ethereum Swap Preference

```bash
curl 'http://localhost:4002/graphql' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "mutation { setProtocolPreference(chainId: \"ethereum\", feature: SWAP, protocolId: \"uniswap-v3\", fallbacks: [\"sushiswap\"]) { chainId preferredProtocol } }"
  }'
```

### Get All User Preferences

```bash
curl 'http://localhost:4002/graphql' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "query { me { preferences { protocols { chainId feature preferredProtocol fallbackProtocols } } } }"
  }'
```

### Update Multiple Preferences

```bash
for feature in SWAP STAKE LEND; do
  curl 'http://localhost:4002/graphql' \
    -H "Authorization: Bearer $TOKEN" \
    -d "{ \"query\": \"mutation { setProtocolPreference(chainId: \\\"ethereum\\\", feature: $feature, protocolId: \\\"best-$feature\\\") { preferredProtocol } }\" }"
done
```

## Migration Path

When adding new protocols:

1. **Register protocol** in `Protocol` registry
2. **Update preferences** for existing users (optional)
3. **Notify users** of new options
4. **Monitor adoption** via analytics

Example:

```typescript
// New protocol available
const newProtocol = await prisma.protocol.create({
  data: {
    protocolId: 'curve-finance',
    name: 'Curve Finance',
    type: 'swap',
    chainId: 'ethereum',
  }
});

// Update user preferences (async job)
await updateUserPreferences({
  action: 'ADD_FALLBACK',
  feature: 'SWAP',
  protocolId: 'curve-finance'
});
```

## Testing

### Unit Tests

```typescript
describe('setProtocolPreference', () => {
  it('should create preference for new combination', async () => {
    const result = await setProtocolPreference({
      chainId: 'ethereum',
      feature: 'SWAP',
      protocolId: 'uniswap-v3',
    });
    expect(result.preferredProtocol).toBe('uniswap-v3');
  });

  it('should validate protocol exists', async () => {
    await expect(setProtocolPreference({
      protocolId: 'non-existent',
    })).rejects.toThrow('Protocol not found');
  });
});
```

### Integration Tests

See [INTEGRATION_TESTS.md](./INTEGRATION_TESTS.md)
