# Orÿa Wallet - User Subgraph API Documentation

**GraphQL Endpoint**: `http://localhost:4002/graphql`  
**Port**: `4002`  
**Federation**: Apollo Federation v2

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [Rate Limiting](#rate-limiting)
5. [Queries](#queries)
6. [Mutations](#mutations)
7. [Subscriptions](#subscriptions)
8. [Types](#types)
9. [Examples](#examples)

---

## Quick Start

### Basic Query

```graphql
query {
  me {
    id
    email
    advancedMode
  }
}
```

### Basic Mutation (Sign Up)

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

---

## Authentication

### JWT Flow

1. **Sign Up or Login** to receive `accessToken` and `refreshToken`
2. **Include token** in every request header:
   ```
   Authorization: Bearer <accessToken>
   ```
3. **Token Expiry**: Access tokens valid for 24 hours
4. **Refresh Token**: Valid for 7 days
5. **Cache TTL**: User data cached for 5 minutes

### Token Refresh

When access token expires, use `refreshToken` mutation:

```graphql
mutation {
  refreshToken(refreshToken: "your-refresh-token") {
    user { id email }
    accessToken
    refreshToken
    expiresIn
  }
}
```

### Headers

```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```

---

## Error Handling

### Standard GraphQL Errors

All errors follow GraphQL spec with extensions:

```json
{
  "errors": [
    {
      "message": "User not found",
      "extensions": {
        "code": "USER_NOT_FOUND"
      }
    }
  ]
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|---|---|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | User lacks permission for operation |
| `USER_NOT_FOUND` | 404 | User does not exist |
| `USER_ALREADY_EXISTS` | 409 | Email already registered |
| `INVALID_CREDENTIALS` | 401 | Wrong password or invalid credentials |
| `INVALID_TOKEN` | 401 | Refresh token expired or invalid |
| `NOT_FOUND` | 404 | Resource not found |
| `INVALID_INPUT` | 400 | Validation error in input |
| `INTERNAL_ERROR` | 500 | Server error |

### Error Response Examples

**Missing Authentication**
```json
{
  "errors": [{
    "message": "Unauthorized: Authentication required",
    "extensions": { "code": "UNAUTHORIZED" }
  }]
}
```

**Duplicate Email**
```json
{
  "errors": [{
    "message": "User already exists",
    "extensions": { "code": "USER_ALREADY_EXISTS" }
  }]
}
```

---

## Rate Limiting

### Rate Limit Strategy

- **Authenticated Requests**: 100 req/minute per user
- **Unauthenticated Requests**: 10 req/minute per IP
- **Burst Limit**: 20 requests per 10 seconds

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700000000
```

### Rate Limit Exceeded

```json
{
  "errors": [{
    "message": "Too many requests, please retry after 60s",
    "extensions": {
      "code": "RATE_LIMIT_EXCEEDED",
      "retryAfter": 60
    }
  }]
}
```

### Best Practices

1. **Batch Queries**: Combine multiple queries when possible
2. **Cache Results**: Use Redis/local cache for user preferences
3. **Implement Backoff**: Use exponential backoff for retries
4. **Monitor Headers**: Check `X-RateLimit-Remaining` proactively

---

## Queries

### `me`

Get the current authenticated user.

**Arguments**: None

**Returns**: `User!`

**Required Auth**: Yes

**Example**:
```graphql
query {
  me {
    id
    email
    privyId
    firebaseUid
    kycStatus
    advancedMode
    preferences {
      defaultChain
      hiddenTokens
      favoriteProtocols
    }
    createdAt
    updatedAt
  }
}
```

**Response**:
```json
{
  "data": {
    "me": {
      "id": "user-123",
      "email": "user@example.com",
      "kycStatus": "APPROVED",
      "advancedMode": true,
      "preferences": {
        "defaultChain": "ethereum",
        "hiddenTokens": ["SPAM-TOKEN"],
        "favoriteProtocols": ["uniswap-v3"]
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T15:45:30Z"
    }
  }
}
```

---

### `user`

Get a specific user by ID.

**Arguments**:
- `id: ID!` - User ID

**Returns**: `User`

**Required Auth**: Yes (can query own or admin)

**Example**:
```graphql
query {
  user(id: "user-456") {
    id
    email
    kycStatus
    createdAt
  }
}
```

---

### `users`

List all users with filtering and pagination.

**Arguments**:
- `filter: UserFilter` - Optional filter criteria
- `pagination: Pagination` - Required pagination params

**Returns**: `UserConnection!`

**Required Auth**: Yes (Admin only)

**Filter Options**:
```graphql
input UserFilter {
  email: String       # Partial match
  kycStatus: KYCStatus  # Exact match
  advancedMode: Boolean # Exact match
  search: String      # Search email or privyId
}
```

**Pagination**:
```graphql
input Pagination {
  first: Int        # Number of items to return
  after: String     # Cursor for pagination
  last: Int         # Alternative to first
  before: String    # Alternative to after
}
```

**Example**:
```graphql
query {
  users(
    filter: { kycStatus: APPROVED, advancedMode: true }
    pagination: { first: 20, after: "cursor-123" }
  ) {
    edges {
      node {
        id
        email
        kycStatus
        advancedMode
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
```

---

## Mutations

### `signup`

Register a new user account.

**Arguments**:
- `email: String!` - User email
- `password: String!` - Account password (min 8 chars)

**Returns**: `AuthPayload!`

**Required Auth**: No

**Example**:
```graphql
mutation {
  signup(email: "newuser@example.com", password: "SecurePass123!") {
    user {
      id
      email
      kycStatus
      advancedMode
    }
    accessToken
    refreshToken
    expiresIn
  }
}
```

**Response**:
```json
{
  "data": {
    "signup": {
      "user": {
        "id": "user-789",
        "email": "newuser@example.com",
        "kycStatus": "NONE",
        "advancedMode": false
      },
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 86400
    }
  }
}
```

---

### `login`

Authenticate an existing user.

**Arguments**:
- `email: String!` - User email
- `password: String!` - Account password

**Returns**: `AuthPayload!`

**Required Auth**: No

**Example**:
```graphql
mutation {
  login(email: "user@example.com", password: "MyPassword123") {
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

---

### `refreshToken`

Refresh an expired access token.

**Arguments**:
- `refreshToken: String!` - Valid refresh token

**Returns**: `AuthPayload!`

**Required Auth**: No

**Example**:
```graphql
mutation {
  refreshToken(refreshToken: "expired-refresh-token") {
    user { id }
    accessToken
    refreshToken
    expiresIn
  }
}
```

---

### `updateProfile`

Update user profile information.

**Arguments**:
- `input: UpdateProfileInput!` - Profile update data

**UpdateProfileInput**:
```graphql
input UpdateProfileInput {
  email: String
  advancedMode: Boolean
}
```

**Returns**: `User!`

**Required Auth**: Yes

**Example**:
```graphql
mutation {
  updateProfile(input: {
    email: "newemail@example.com"
    advancedMode: true
  }) {
    id
    email
    advancedMode
    updatedAt
  }
}
```

---

### `updatePreferences`

Update user preferences.

**Arguments**:
- `input: UserPreferencesInput!` - Preference updates

**UserPreferencesInput**:
```graphql
input UserPreferencesInput {
  defaultChain: String
  hiddenTokens: [String!]
  favoriteProtocols: [String!]
}
```

**Returns**: `User!`

**Required Auth**: Yes

**Example**:
```graphql
mutation {
  updatePreferences(input: {
    defaultChain: "ethereum"
    hiddenTokens: ["SPAM1", "SPAM2"]
    favoriteProtocols: ["uniswap-v3", "aave-v3"]
  }) {
    id
    preferences {
      defaultChain
      hiddenTokens
      favoriteProtocols
    }
  }
}
```

---

### `setAdvancedMode`

Enable or disable advanced mode.

**Arguments**:
- `enabled: Boolean!` - Enable/disable flag

**Returns**: `User!`

**Required Auth**: Yes

**Example**:
```graphql
mutation {
  setAdvancedMode(enabled: true) {
    id
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

---

### `setProtocolPreference`

Set preferred protocol for a specific chain and feature.

**Arguments**:
- `chainId: String!` - Chain ID (e.g., "ethereum", "sui")
- `feature: FeatureType!` - Feature type
- `protocolId: String!` - Protocol identifier
- `fallbacks: [String!]` - Fallback protocols

**FeatureType** Enum: `SWAP`, `STAKE`, `LEND`, `BRIDGE`, `AGGREGATOR`

**Returns**: `ProtocolPreference!`

**Required Auth**: Yes

**Example**:
```graphql
mutation {
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

**Supported Chains & Protocols**:

| Chain | Features | Protocols |
|---|---|---|
| `ethereum` | SWAP, STAKE, LEND, BRIDGE | uniswap-v3, uniswap-v2, aave-v3, compound-v3, lido, curve |
| `sui` | SWAP, STAKE, LEND | cetus, aftermath, suilen, navi |
| `solana` | SWAP, STAKE | jupiter, raydium, marinade |
| `base` | SWAP, LEND | uniswap-v3, aave-v3 |

---

### `updateAutoSigningConfig`

Configure auto-signing for micro-transactions.

**Arguments**:
- `config: AutoSigningConfigInput!` - Auto-signing config

**AutoSigningConfigInput**:
```graphql
input AutoSigningConfigInput {
  enabled: Boolean!
  thresholdUSD: Float!
  whitelistedContracts: [String!]
  expiryHours: Int!
  maxDailyAmountUSD: Float!
  requireBiometric: Boolean!
}
```

**Returns**: `User!`

**Required Auth**: Yes

**Example**:
```graphql
mutation {
  updateAutoSigningConfig(config: {
    enabled: true
    thresholdUSD: 500
    whitelistedContracts: ["0x1111111254fb6c44bac0bed2854e76f90643097d"]
    expiryHours: 48
    maxDailyAmountUSD: 5000
    requireBiometric: true
  }) {
    id
    preferences {
      autoSigning {
        enabled
        thresholdUSD
        maxDailyAmountUSD
      }
    }
  }
}
```

---

### `initiateKYC`

Start KYC verification process.

**Arguments**:
- `provider: KYCProvider!` - KYC provider (SUMSUB, PERSONA)

**Returns**: `KYCSession!`

**Required Auth**: Yes

**Example**:
```graphql
mutation {
  initiateKYC(provider: SUMSUB) {
    id
    userId
    provider
    sessionId
    externalUrl
    status
    createdAt
    expiresAt
  }
}
```

**Response**:
```json
{
  "data": {
    "initiateKYC": {
      "id": "kyc-123",
      "userId": "user-789",
      "provider": "SUMSUB",
      "sessionId": "session-abc123",
      "externalUrl": "https://kyc-provider.com/session/abc123",
      "status": "PENDING",
      "createdAt": "2024-01-20T10:00:00Z",
      "expiresAt": "2024-01-21T10:00:00Z"
    }
  }
}
```

---

### `submitKYCDocuments`

Submit KYC documents for verification.

**Arguments**:
- `sessionId: ID!` - KYC session ID
- `documents: [Upload!]!` - Document files

**Returns**: `KYCSubmission!`

**Required Auth**: Yes

**Example**:
```graphql
mutation($docs: [Upload!]!) {
  submitKYCDocuments(sessionId: "kyc-123", documents: $docs) {
    id
    sessionId
    status
    documents
    submittedAt
  }
}
```

---

## Subscriptions

### `userUpdated`

Subscribe to real-time user profile updates.

**Arguments**:
- `userId: ID!` - User ID to subscribe to

**Returns**: `User!`

**Required Auth**: Yes

**Example**:
```graphql
subscription {
  userUpdated(userId: "user-123") {
    id
    email
    advancedMode
    updatedAt
  }
}
```

---

### `kycStatusChanged`

Subscribe to KYC status change events.

**Arguments**:
- `userId: ID!` - User ID to subscribe to

**Returns**: `KYCStatus!`

**Required Auth**: Yes

**Example**:
```graphql
subscription {
  kycStatusChanged(userId: "user-123")
}
```

---

## Types

### User

```graphql
type User {
  id: ID!
  email: String!
  privyId: String!
  firebaseUid: String!
  kycStatus: KYCStatus!
  kycProvider: KYCProvider
  advancedMode: Boolean!
  preferences: UserPreferences!
  wallets: [Wallet!]!
  transactions: [Transaction!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

### UserPreferences

```graphql
type UserPreferences {
  protocols: [ProtocolPreference!]!
  autoSigning: AutoSigningConfig!
  defaultChain: String!
  hiddenTokens: [String!]!
  favoriteProtocols: [String!]!
}
```

### ProtocolPreference

```graphql
type ProtocolPreference {
  chainId: String!
  feature: FeatureType!
  preferredProtocol: String!
  fallbackProtocols: [String!]!
  lastUpdated: DateTime!
}
```

### AutoSigningConfig

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

### AuthPayload

```graphql
type AuthPayload {
  user: User!
  accessToken: String!
  refreshToken: String!
  expiresIn: Int!
}
```

### KYCStatus

Enum: `NONE`, `PENDING`, `APPROVED`, `REJECTED`

### KYCProvider

Enum: `SUMSUB`, `PERSONA`

### FeatureType

Enum: `SWAP`, `STAKE`, `LEND`, `BRIDGE`, `AGGREGATOR`

---

## Examples

### Complete Authentication Flow

```graphql
# 1. Sign up
mutation {
  signup(email: "alice@example.com", password: "SecurePass123") {
    accessToken
    refreshToken
  }
}

# 2. Get current user
query {
  me { id email }
}

# 3. Refresh token when expired
mutation {
  refreshToken(refreshToken: "...") {
    accessToken
    refreshToken
  }
}
```

### Multi-Chain Setup

```graphql
mutation {
  # Ethereum - Uniswap for swaps, Aave for lending
  eth_swap: setProtocolPreference(
    chainId: "ethereum"
    feature: SWAP
    protocolId: "uniswap-v3"
  ) { chainId preferredProtocol }
  
  eth_lend: setProtocolPreference(
    chainId: "ethereum"
    feature: LEND
    protocolId: "aave-v3"
  ) { chainId preferredProtocol }
  
  # SUI - Cetus for swaps
  sui_swap: setProtocolPreference(
    chainId: "sui"
    feature: SWAP
    protocolId: "cetus"
  ) { chainId preferredProtocol }
  
  # Solana - Jupiter for swaps
  sol_swap: setProtocolPreference(
    chainId: "solana"
    feature: SWAP
    protocolId: "jupiter"
  ) { chainId preferredProtocol }
}
```

### KYC Integration

```graphql
# 1. Initiate KYC
mutation {
  initiateKYC(provider: SUMSUB) {
    sessionId
    externalUrl
  }
}

# 2. Submit documents after user completes KYC
mutation($documents: [Upload!]!) {
  submitKYCDocuments(
    sessionId: "kyc-session-id"
    documents: $documents
  ) {
    status
    submittedAt
  }
}

# 3. Subscribe to KYC status changes
subscription {
  kycStatusChanged(userId: "user-123")
}
```

---

## Pagination Examples

### Using Cursor-Based Pagination

```graphql
# First page
query {
  users(pagination: { first: 20 }) {
    edges {
      cursor
      node { id email }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}

# Next page
query {
  users(pagination: { first: 20, after: "cursor-from-previous" }) {
    edges { cursor node { id } }
    pageInfo { hasNextPage }
  }
}
```

---

## Caching Strategy

### Recommended Cache TTLs

| Resource | TTL | Invalidation |
|----------|-----|---|
| User Profile | 5 min | On profile update |
| User Preferences | 10 min | On preference change |
| Protocol List | 1 hour | Manual refresh |
| KYC Status | 30 sec | Real-time subscription |

### Cache Invalidation Events

- `updateProfile` → invalidates `user:*` keys
- `setProtocolPreference` → invalidates `user:*:protocols`
- `updateAutoSigningConfig` → invalidates `user:*` keys

---

## Best Practices

1. **Always validate email format** before signup
2. **Use HTTPS** in production
3. **Implement exponential backoff** for retries
4. **Cache user preferences locally** to reduce queries
5. **Subscribe to status changes** instead of polling
6. **Batch related mutations** when possible
7. **Monitor rate limit headers** proactively
8. **Rotate refresh tokens** periodically
9. **Validate protocol IDs** against supported list
10. **Test error scenarios** in development

---

## Support & Feedback

**Issues**: Report via GitHub Issues  
**Email**: support@orya.io  
**Discord**: [Orÿa Community](https://discord.gg/orya)
