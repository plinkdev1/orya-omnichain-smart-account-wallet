# Orÿa Wallet - Rate Limiting Guide

## Overview

The User Subgraph implements rate limiting to ensure fair resource usage and prevent abuse.

**Rate Limit Strategy**:
- **Authenticated Users**: 100 requests/minute
- **Unauthenticated Requests**: 10 requests/minute
- **Burst Limit**: 20 requests per 10 seconds
- **Window**: Sliding window per user/IP

---

## Rate Limit Headers

All GraphQL responses include rate limit information in headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700000060
Retry-After: 0
```

### Header Meanings

| Header | Example | Meaning |
|--------|---------|---------|
| `X-RateLimit-Limit` | 100 | Total requests allowed per minute |
| `X-RateLimit-Remaining` | 95 | Requests remaining in current window |
| `X-RateLimit-Reset` | 1700000060 | Unix timestamp when limit resets |
| `Retry-After` | 0 or 60 | Seconds to wait before retrying |

---

## Rate Limit Tiers

### Tier 1: Authenticated Users

- **Limit**: 100 requests/minute
- **Burst**: 20 requests/10 seconds
- **Identified By**: JWT token
- **Best For**: Regular API usage

**Example**:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.orya.io/graphql \
  -d '{"query": "{ me { id } }"}'
```

### Tier 2: Unauthenticated Users

- **Limit**: 10 requests/minute
- **Burst**: 3 requests/10 seconds
- **Identified By**: IP address
- **Best For**: Authentication endpoints only

**Example**:
```bash
curl https://api.orya.io/graphql \
  -d '{"query": "mutation { signup(email: \"user@example.com\", password: \"pass\") { user { id } } }"}'
```

---

## Rate Limit Responses

### Success - Within Limit

```json
{
  "data": { "me": { "id": "user-123", "email": "user@example.com" } },
  "extensions": {
    "rateLimitRemaining": 95,
    "rateLimitReset": 1700000060
  }
}
```

### Error - Rate Limited

```json
{
  "errors": [
    {
      "message": "Too many requests, please retry after 60s",
      "extensions": {
        "code": "RATE_LIMIT_EXCEEDED",
        "retryAfter": 60
      }
    }
  ],
  "extensions": {
    "rateLimitRemaining": 0,
    "rateLimitReset": 1700000060
  }
}
```

**HTTP Status**: `429 Too Many Requests`

---

## Best Practices

### 1. Check Headers Proactively

```javascript
async function graphqlRequest(query, token) {
  const response = await fetch('https://api.orya.io/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ query })
  });
  
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const reset = response.headers.get('X-RateLimit-Reset');
  
  if (remaining < 10) {
    console.warn(`Warning: Only ${remaining} requests remaining`);
  }
  
  return response.json();
}
```

### 2. Implement Exponential Backoff

```javascript
async function retryWithBackoff(query, token, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await graphqlRequest(query, token);
    
    if (response.errors?.[0]?.extensions.code === 'RATE_LIMIT_EXCEEDED') {
      const retryAfter = response.errors[0].extensions.retryAfter;
      const delay = retryAfter * 1000 + Math.random() * 1000;
      
      console.log(`Rate limited. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    
    return response;
  }
  
  throw new Error('Max retries exceeded');
}
```

### 3. Batch Related Queries

**Instead of**:
```graphql
# 3 separate requests
query { user(id: "123") { email } }
query { user(id: "456") { email } }
query { user(id: "789") { email } }
```

**Do This**:
```graphql
# 1 batched request
{
  user1: user(id: "123") { email }
  user2: user(id: "456") { email }
  user3: user(id: "789") { email }
}
```

**Saves**: 2 out of 3 requests

### 4. Cache Results Locally

```javascript
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getUser(userId, token) {
  // Check cache
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  // Fetch from API
  const query = `query { user(id: "${userId}") { id email } }`;
  const response = await graphqlRequest(query, token);
  
  // Update cache
  userCache.set(userId, {
    data: response.data,
    timestamp: Date.now()
  });
  
  return response.data;
}
```

### 5. Use Subscriptions Instead of Polling

**Instead of polling** (100 requests/min):
```javascript
setInterval(async () => {
  const response = await graphql(query, token);
  // Update UI
}, 1000);
```

**Use subscriptions** (1 connection):
```javascript
const subscription = client.subscribe({
  query: gql`subscription { userUpdated(userId: "123") { id email } }`
});

subscription.subscribe(data => {
  // Update UI on change
});
```

---

## Rate Limit Scenarios

### Scenario 1: Batch Processing

**Goal**: Process 1000 user queries

**Bad Approach**: 1000 sequential requests = rate limited
```javascript
for (let i = 0; i < 1000; i++) {
  await graphql(`query { user(id: "${ids[i]}") { id } }`);
  // After 100 requests: rate limited
}
```

**Good Approach**: Batch queries
```javascript
const batchSize = 20;
for (let i = 0; i < 1000; i += batchSize) {
  const batch = ids.slice(i, i + batchSize)
    .map((id, idx) => `u${idx}: user(id: "${id}") { id email }`)
    .join('\n');
  
  await graphql(`{ ${batch} }`);
  await delay(1000); // 1 sec between batches
  // 50 batched requests instead of 1000
}
```

### Scenario 2: Real-time Updates

**Bad Approach**: Polling every second
```javascript
setInterval(() => {
  // 60 requests/minute = limits after 1-2 minutes
  getUpdatedUser();
}, 1000);
```

**Good Approach**: Subscriptions
```javascript
client.subscribe({
  query: gql`subscription { userUpdated(userId: "123") { id } }`
}).subscribe(newData => {
  // Called on change only, no rate limit
});
```

### Scenario 3: Peak Load Handling

**Scenario**: 10 concurrent users doing signup

**Risk**: Each user gets 10 requests/min (total 100 req/min per user)
= Rate limited after 1 minute

**Solution**: Implement queue
```javascript
const requestQueue = [];
const maxConcurrent = 3;

async function queueRequest(query) {
  return new Promise((resolve) => {
    requestQueue.push({ query, resolve });
    processQueue();
  });
}

async function processQueue() {
  while (requestQueue.length > 0 && active < maxConcurrent) {
    const { query, resolve } = requestQueue.shift();
    active++;
    
    const result = await graphqlRequest(query);
    resolve(result);
    
    active--;
    await delay(100); // Stagger requests
  }
}
```

---

## Quota Calculation

### How Quota is Consumed

| Operation | Requests |
|-----------|----------|
| Simple query | 1 |
| Complex query with nested fields | 1 |
| Batched query (10 fields) | 1 |
| Mutation | 1 |
| Subscription connection | 0 (separate limit) |
| Failed request (error) | 1 |

**Note**: All requests count, regardless of success or failure.

### Quota Examples

#### Example 1: 10 User Lookups
- **Sequential**: 10 requests
- **Batched**: 1 request
- **Saved**: 9 requests (90%)

#### Example 2: User Profile Page
```graphql
query {
  me {
    id
    email
    preferences { defaultChain favoriteProtocols }
    protocolPreferences { chainId feature preferredProtocol }
  }
}
```
**Requests**: 1 (despite complexity)

#### Example 3: Dashboard Updates
- **Polling every 5s**: 12 requests/min
- **Subscription**: 0 per update + 1 initial connection
- **Saved per hour**: 600+ requests

---

## Monitor Rate Limit Status

### Client-Side Monitoring

```javascript
class RateLimitMonitor {
  constructor() {
    this.requests = [];
    this.windowSize = 60000; // 1 minute
  }
  
  recordRequest() {
    this.requests.push(Date.now());
    this.cleanup();
  }
  
  cleanup() {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < this.windowSize);
  }
  
  getRemaining() {
    this.cleanup();
    return 100 - this.requests.length; // Assume 100 req/min
  }
  
  isNearLimit() {
    return this.getRemaining() < 10;
  }
  
  getResetTime() {
    if (this.requests.length === 0) return null;
    return new Date(this.requests[0] + this.windowSize);
  }
}

// Usage
const monitor = new RateLimitMonitor();

async function smartRequest(query, token) {
  if (monitor.isNearLimit()) {
    console.warn(`Rate limit warning. Remaining: ${monitor.getRemaining()}`);
    await delay(5000);
  }
  
  const response = await graphqlRequest(query, token);
  monitor.recordRequest();
  
  return response;
}
```

### Server-Side Monitoring

Track rate limit metrics in your backend:

```javascript
// Express middleware
app.use((req, res, next) => {
  const remaining = res.getHeader('X-RateLimit-Remaining');
  
  metrics.gauge('rate_limit.remaining', remaining, {
    userId: req.user?.id,
    endpoint: req.path
  });
  
  if (remaining < 5) {
    metrics.increment('rate_limit.warning');
  }
  
  next();
});
```

---

## Handling Rate Limit Errors

### In Frontend

```javascript
async function handleGraphQLRequest(query, token) {
  try {
    const response = await graphqlRequest(query, token);
    
    if (response.errors?.[0]?.extensions.code === 'RATE_LIMIT_EXCEEDED') {
      const retryAfter = response.errors[0].extensions.retryAfter;
      
      showNotification({
        type: 'warning',
        message: `Too many requests. Please wait ${retryAfter} seconds.`,
        autoClose: retryAfter * 1000
      });
      
      // Disable UI interactions
      disableButtons();
      startCountdown(retryAfter);
      
      return null;
    }
    
    return response.data;
  } catch (error) {
    handleError(error);
  }
}

function startCountdown(seconds) {
  const timer = setInterval(() => {
    seconds--;
    updateUI(`Retry in ${seconds}s`);
    
    if (seconds <= 0) {
      clearInterval(timer);
      enableButtons();
      location.reload(); // Or retry operation
    }
  }, 1000);
}
```

### In Backend

```javascript
// Retry logic with exponential backoff
async function callGraphQL(query, token) {
  const maxRetries = 5;
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch('https://api.orya.io/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });
      
      const data = await response.json();
      
      if (data.errors?.[0]?.extensions.code === 'RATE_LIMIT_EXCEEDED') {
        const retryAfter = data.errors[0].extensions.retryAfter;
        const delay = retryAfter * 1000 + Math.random() * 1000;
        
        logger.warn(`Rate limited. Retrying in ${delay}ms...`, { attempt });
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      
      return data;
    } catch (error) {
      lastError = error;
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(r => setTimeout(r, delay));
    }
  }
  
  throw lastError;
}
```

---

## Rate Limit Limits by Operation Type

### Authenticated Requests (Per User)

| Operation | Limit |
|-----------|-------|
| Queries | 100/min |
| Mutations | 100/min |
| Subscriptions | 10 concurrent |
| Batch size max | 20 fields |

### Unauthenticated Requests (Per IP)

| Operation | Limit |
|-----------|-------|
| Auth queries | 10/min |
| Signup/Login | 10/min |
| Other | 5/min |

---

## Contact Support

If you need higher rate limits:
- **Email**: support@orya.io
- **Discord**: [Orÿa Community](https://discord.gg/orya)
- **Support Form**: https://orya.io/support

Provide:
- Use case description
- Estimated request volume
- Current rate limit status
- Implementation details

---

## FAQ

**Q**: Why am I getting rate limited when I'm under 100 req/min?  
**A**: Check for burst limit (20/10s). Distribute requests over time.

**Q**: How do I increase my rate limit?  
**A**: Contact support with your use case and volume requirements.

**Q**: Do failed requests count toward the limit?  
**A**: Yes, all requests count including errors.

**Q**: Can I use the API key instead of authentication?  
**A**: Only token-based authentication (JWT) qualifies for higher limits.

**Q**: How accurate is X-RateLimit-Remaining?  
**A**: It's accurate to within 1 request due to distributed processing.

**Q**: What happens after I'm rate limited?  
**A**: All requests will fail with 429 until the window resets.

**Q**: Can I get a higher limit for batch processing?  
**A**: Yes, contact support for enterprise batch processing limits.
