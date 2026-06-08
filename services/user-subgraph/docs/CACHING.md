# Caching Strategy

## Overview

The User Subgraph implements a multi-layered caching strategy using Redis for:
- **Performance**: Reduce database queries
- **Availability**: Graceful degradation on DB failures
- **Consistency**: Strategic invalidation

## Cache Layers

### Layer 1: User Profile Cache

```
Key: user:{userId}
TTL: 5 minutes
Data: Full user object with preferences
```

**When to populate:**
- After signup/login
- After profile update
- Cache miss

**When to invalidate:**
- Profile update
- Password change
- Preference change
- Session end

### Layer 2: User Preferences Cache

```
Key: user:{userId}:preferences
TTL: 10 minutes
Data: UserPreferences object
```

**When to populate:**
- After preferences update
- Cache miss

**When to invalidate:**
- Any preference change
- Protocol preference update

### Layer 3: Protocol Preferences Cache

```
Key: user:{userId}:protocols
TTL: 15 minutes
Data: [ProtocolPreference, ...]
```

**When to populate:**
- After protocol preference update
- Cache miss

**When to invalidate:**
- New protocol preference
- Preference update
- Fallback modification

## Implementation

### Caching Function

```typescript
async function getUser(userId: string, context: GraphQLContext) {
  const cacheKey = `user:${userId}`;
  
  // 1. Try cache
  let cached = await context.redis.get(cacheKey);
  if (cached) {
    context.logger.debug('Cache HIT: user', { userId });
    return JSON.parse(cached);
  }
  
  // 2. Query database
  context.logger.debug('Cache MISS: user', { userId });
  const user = await context.prisma.user.findUnique({
    where: { id: userId },
    include: {
      preferences: {
        include: { autoSigning: true }
      }
    }
  });
  
  // 3. Store in cache
  if (user) {
    await context.redis.setex(
      cacheKey,
      300, // 5 minutes
      JSON.stringify(user)
    );
  }
  
  return user;
}
```

### Cache Manager

```typescript
class CacheManager {
  async get<T>(key: string): Promise<T | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set<T>(key: string, value: T, ttl = 300) {
    await this.redis.setex(
      key,
      ttl,
      JSON.stringify(value)
    );
  }

  async del(key: string) {
    await this.redis.del(key);
  }

  async invalidateUser(userId: string) {
    const pattern = `user:${userId}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

## Invalidation Patterns

### Profile Update

```typescript
async updateProfile(args, context) {
  const user = await context.prisma.user.update({
    where: { id: context.userId },
    data: args.input
  });

  // Invalidate all user caches
  await context.redis.del(`user:${context.userId}`);
  await context.redis.del(`user:${context.userId}:*`);

  return user;
}
```

### Preference Change

```typescript
async updatePreferences(args, context) {
  const prefs = await context.prisma.userPreferences.update({
    where: { userId: context.userId },
    data: args.input
  });

  // Invalidate preference caches
  await context.redis.del(`user:${context.userId}:preferences`);
  await context.redis.del(`user:${context.userId}:protocols`);

  return prefs;
}
```

### Protocol Preference Update

```typescript
async setProtocolPreference(args, context) {
  const pref = await context.prisma.protocolPreference.upsert({
    where: { 
      userId_chainId_feature: {
        userId: context.userId,
        chainId: args.chainId,
        feature: args.feature
      }
    },
    create: { /* ... */ },
    update: { /* ... */ }
  });

  // Invalidate specific cache
  await context.redis.del(`user:${context.userId}:protocols`);

  return pref;
}
```

## TTL Recommendations

| Entity | TTL | Reason |
|--------|-----|--------|
| User Profile | 5 min | Frequently accessed, moderate freshness |
| Preferences | 10 min | Less frequently changed |
| Protocols | 15 min | Stable, rarely changes |
| Sessions | 24h | Aligns with token expiry |
| KYC Status | 60 min | Important but slow to change |

## Cache Hit/Miss Strategy

### Optimal Hit Rate: 80-90%

**High hit rate indicators:**
- User logs in frequently
- Multiple requests from same user within TTL
- Preferences rarely change

**Low hit rate causes:**
- TTL too short
- Many unique users
- Frequent invalidation

### Monitoring

Track cache metrics:

```typescript
const cacheMetrics = {
  hits: 0,
  misses: 0,
  invalidations: 0,

  recordHit() {
    this.hits++;
  },

  recordMiss() {
    this.misses++;
  },

  recordInvalidation() {
    this.invalidations++;
  },

  getHitRate() {
    const total = this.hits + this.misses;
    return total > 0 ? (this.hits / total) * 100 : 0;
  }
};
```

## Fallback Strategy

### Cache Failure Handling

If Redis is down, continue with direct DB queries:

```typescript
async function getUser(userId, context) {
  try {
    // Try cache first
    const cached = await context.redis.get(`user:${userId}`);
    if (cached) return JSON.parse(cached);
  } catch (error) {
    context.logger.warn('Cache error', { error });
    // Fall through to DB
  }

  // Direct database query
  return context.prisma.user.findUnique({
    where: { id: userId }
  });
}
```

### Graceful Degradation

Services continue functioning without cache:
- Slower performance (acceptable temporary)
- No data loss
- No partial failures
- Log warning for ops team

## Cache Warming

### Pre-load Popular Data

```typescript
async function warmCache() {
  // Load active users
  const activeUsers = await prisma.user.findMany({
    where: { lastLoginAt: { gte: yesterday } },
    take: 1000
  });

  for (const user of activeUsers) {
    await redis.setex(
      `user:${user.id}`,
      300,
      JSON.stringify(user)
    );
  }
}

// Run on startup
setInterval(() => warmCache(), 30 * 60 * 1000); // Every 30 min
```

## Memory Management

### Redis Memory Limits

```
redis.conf:
maxmemory 512mb
maxmemory-policy allkeys-lru
```

**Policy options:**
- `allkeys-lru`: Evict least recently used
- `allkeys-lfu`: Evict least frequently used
- `volatile-lru`: Evict LRU keys with TTL

### Monitoring Memory Usage

```typescript
async function getRedisMemory() {
  const info = await redis.info('memory');
  return {
    used: info.used_memory,
    max: info.maxmemory,
    percentage: (info.used_memory / info.maxmemory) * 100
  };
}
```

## Testing

### Cache Hit/Miss Tests

```typescript
describe('Cache', () => {
  it('should cache user after first query', async () => {
    await getUser('user-1');
    const cached = await redis.get('user:user-1');
    expect(cached).toBeDefined();
  });

  it('should use cache on subsequent queries', async () => {
    const spy = vi.spyOn(prisma.user, 'findUnique');
    
    await getUser('user-1'); // DB hit
    await getUser('user-1'); // Cache hit
    
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should invalidate on update', async () => {
    await getUser('user-1'); // Cache
    await updateProfile('user-1', { email: 'new@example.com' });
    
    const cached = await redis.get('user:user-1');
    expect(cached).toBeNull();
  });
});
```

### Cache Stampede Prevention

```typescript
// If multiple requests come for uncached item
// Lock to prevent thundering herd

async function getWithLock<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 300
): Promise<T> {
  const lockKey = `lock:${key}`;
  
  // Try to acquire lock
  const locked = await redis.set(lockKey, '1', 'NX', 'EX', 10);
  
  if (!locked) {
    // Wait for other request to populate cache
    await sleep(100);
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);
  }

  try {
    // Fetch from database
    const value = await fetcher();
    await redis.setex(key, ttl, JSON.stringify(value));
    return value;
  } finally {
    await redis.del(lockKey);
  }
}
```

## Performance Impact

### Before Caching

```
Response time (p99): 500ms
Queries per second: 100
Database load: High
```

### After Caching

```
Response time (p99): 50ms    (-90%)
Queries per second: 1000     (+10x)
Database load: Low           (-80%)
```

## Debugging

### Cache Inspection

```bash
redis-cli
> KEYS "user:*"
> GET "user:user-123"
> TTL "user:user-123"
> FLUSHDB  # Clear all cache
```

### Cache Statistics

```typescript
async function getCacheStats() {
  const info = await redis.info('stats');
  return {
    totalCommands: info.total_commands_processed,
    hitRate: info.keyspace_hits / (info.keyspace_hits + info.keyspace_misses),
    evictions: info.evicted_keys
  };
}
```

## Cache vs Consistency Trade-off

| Trade-off | Approach |
|-----------|----------|
| **More consistency** | Shorter TTL (1-5 min) |
| **More performance** | Longer TTL (15-30 min) |
| **Real-time** | Invalidate on every change |
| **Eventually consistent** | Use TTL only, no invalidation |

**Recommended: Hybrid**
- Short TTL for safety
- Aggressive invalidation for critical changes
- Eventually consistent for non-critical data
