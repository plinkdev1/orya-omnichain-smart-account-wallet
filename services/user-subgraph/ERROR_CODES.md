# Orÿa Wallet - Error Codes & Handling

## Error Response Format

All GraphQL errors follow the standard GraphQL specification with custom extensions:

```json
{
  "errors": [
    {
      "message": "User not found",
      "extensions": {
        "code": "USER_NOT_FOUND",
        "details": "Additional error details"
      }
    }
  ]
}
```

## Error Categories

### 1. Authentication Errors (4xx)

#### UNAUTHORIZED (401)
- **Message**: `Unauthorized: Authentication required`
- **Cause**: Missing or invalid JWT token
- **HTTP Status**: 401
- **Solution**: Include valid `Authorization: Bearer <token>` header
- **Example**:
```json
{
  "errors": [{
    "message": "Unauthorized: Authentication required",
    "extensions": { "code": "UNAUTHORIZED" }
  }]
}
```

#### INVALID_TOKEN (401)
- **Message**: `Invalid refresh token`
- **Cause**: Refresh token expired, malformed, or invalid
- **HTTP Status**: 401
- **Solution**: Use `refreshToken` mutation to get new tokens
- **Example**:
```graphql
mutation {
  refreshToken(refreshToken: "your-refresh-token") {
    accessToken
    refreshToken
  }
}
```

#### INVALID_CREDENTIALS (401)
- **Message**: `Invalid credentials`
- **Cause**: Wrong password or email combination
- **HTTP Status**: 401
- **Solution**: Verify email and password, or reset password
- **Example Response**:
```json
{
  "errors": [{
    "message": "Invalid credentials",
    "extensions": {
      "code": "INVALID_CREDENTIALS",
      "details": "Email or password is incorrect"
    }
  }]
}
```

---

### 2. Authorization Errors (403)

#### FORBIDDEN (403)
- **Message**: `Forbidden: Cannot access this user data` or `Forbidden: Admin access required`
- **Cause**: User lacks permission for the operation
- **HTTP Status**: 403
- **Solution**: Only users and admins can query/mutate their own data
- **Scenarios**:
  - Non-admin trying to access `users` query
  - User trying to access another user's data
  - Insufficient role permissions
- **Example**:
```json
{
  "errors": [{
    "message": "Forbidden: Admin access required",
    "extensions": { "code": "FORBIDDEN" }
  }]
}
```

---

### 3. Not Found Errors (404)

#### USER_NOT_FOUND (404)
- **Message**: `User not found`
- **Cause**: User with specified ID doesn't exist
- **HTTP Status**: 404
- **Solution**: Verify user ID exists
- **Example**:
```json
{
  "errors": [{
    "message": "User not found",
    "extensions": { "code": "USER_NOT_FOUND" }
  }]
}
```

#### NOT_FOUND (404)
- **Message**: `User preferences not found` or similar
- **Cause**: Related resource doesn't exist
- **HTTP Status**: 404
- **Solution**: Create the missing resource first
- **Example**:
```json
{
  "errors": [{
    "message": "User preferences not found",
    "extensions": { "code": "NOT_FOUND" }
  }]
}
```

---

### 4. Conflict Errors (409)

#### USER_ALREADY_EXISTS (409)
- **Message**: `User already exists`
- **Cause**: Email is already registered
- **HTTP Status**: 409
- **Solution**: Use different email or login instead
- **Example**:
```json
{
  "errors": [{
    "message": "User already exists",
    "extensions": {
      "code": "USER_ALREADY_EXISTS",
      "details": "Email newuser@example.com is already registered"
    }
  }]
}
```

---

### 5. Validation Errors (400)

#### INVALID_INPUT (400)
- **Message**: `Invalid input`
- **Cause**: Malformed or invalid input data
- **HTTP Status**: 400
- **Solution**: Validate input before sending
- **Common Issues**:
  - Invalid email format
  - Password too short (< 8 chars)
  - Missing required fields
  - Invalid enum values
- **Example**:
```json
{
  "errors": [
    {
      "message": "Invalid input",
      "extensions": {
        "code": "INVALID_INPUT",
        "details": "Password must be at least 8 characters"
      }
    }
  ]
}
```

---

### 6. Rate Limiting Errors (429)

#### RATE_LIMIT_EXCEEDED (429)
- **Message**: `Too many requests, please retry after {seconds}s`
- **Cause**: Too many requests in time window
- **HTTP Status**: 429
- **Solution**: Implement exponential backoff and retry
- **Rate Limits**:
  - Authenticated: 100 req/min per user
  - Unauthenticated: 10 req/min per IP
  - Burst: 20 req/10s
- **Headers**:
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 5
  X-RateLimit-Reset: 1700000000
  Retry-After: 60
  ```
- **Example**:
```json
{
  "errors": [{
    "message": "Too many requests, please retry after 60s",
    "extensions": {
      "code": "RATE_LIMIT_EXCEEDED",
      "retryAfter": 60
    }
  }],
  "extensions": {
    "rateLimitRemaining": 0,
    "rateLimitReset": 1700000060
  }
}
```

---

### 7. Server Errors (5xx)

#### INTERNAL_ERROR (500)
- **Message**: `Internal server error`
- **Cause**: Unexpected server error
- **HTTP Status**: 500
- **Solution**: Retry with exponential backoff, contact support if persists
- **Example**:
```json
{
  "errors": [{
    "message": "Internal server error",
    "extensions": {
      "code": "INTERNAL_ERROR",
      "traceId": "trace-12345"
    }
  }]
}
```

---

## Error Handling Best Practices

### 1. Always Check for Errors

```graphql
query {
  me { id email }
}
```

**Always check response for `errors` array:**
```javascript
const response = await graphql(query);
if (response.errors && response.errors.length > 0) {
  const error = response.errors[0];
  const code = error.extensions.code;
  
  switch(code) {
    case 'UNAUTHORIZED':
      // Redirect to login
      break;
    case 'RATE_LIMIT_EXCEEDED':
      // Implement backoff
      break;
    case 'USER_NOT_FOUND':
      // Handle not found
      break;
  }
}
```

### 2. Retry Logic with Exponential Backoff

```javascript
async function retryWithBackoff(query, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await graphql(query);
      
      if (response.errors) {
        const error = response.errors[0];
        const code = error.extensions.code;
        
        // Don't retry on client errors
        if (['UNAUTHORIZED', 'FORBIDDEN', 'USER_NOT_FOUND'].includes(code)) {
          throw new Error(error.message);
        }
        
        // Retry on server errors and rate limiting
        if (code === 'RATE_LIMIT_EXCEEDED') {
          const retryAfter = error.extensions.retryAfter || Math.pow(2, attempt);
          await sleep(retryAfter * 1000);
          continue;
        }
      }
      
      return response;
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }
}
```

### 3. Token Refresh on Expiration

```javascript
async function executeWithTokenRefresh(query, token, refreshToken) {
  let response = await graphql(query, token);
  
  if (response.errors?.[0]?.extensions.code === 'UNAUTHORIZED') {
    // Token expired, try to refresh
    const refreshResponse = await refreshAccessToken(refreshToken);
    
    if (refreshResponse.errors) {
      // Refresh failed, redirect to login
      redirectToLogin();
      return;
    }
    
    // Retry with new token
    const newToken = refreshResponse.data.refreshToken.accessToken;
    response = await graphql(query, newToken);
  }
  
  return response;
}
```

### 4. User-Friendly Error Messages

```javascript
const errorMessages = {
  'UNAUTHORIZED': 'Please log in to continue',
  'FORBIDDEN': 'You do not have permission to perform this action',
  'USER_NOT_FOUND': 'User account not found',
  'USER_ALREADY_EXISTS': 'This email is already registered',
  'INVALID_CREDENTIALS': 'Email or password is incorrect',
  'RATE_LIMIT_EXCEEDED': 'Too many requests, please wait a moment',
  'INTERNAL_ERROR': 'Something went wrong, please try again'
};

function getUserFriendlyMessage(errorCode) {
  return errorMessages[errorCode] || 'An error occurred';
}
```

---

## Error Codes Reference Table

| Code | HTTP | Category | Retryable | Resolution |
|------|------|----------|-----------|-----------|
| UNAUTHORIZED | 401 | Auth | No | Refresh token or login |
| FORBIDDEN | 403 | Auth | No | Check permissions |
| INVALID_TOKEN | 401 | Auth | No | Login again |
| INVALID_CREDENTIALS | 401 | Auth | No | Check email/password |
| USER_NOT_FOUND | 404 | Resource | No | Check user ID |
| USER_ALREADY_EXISTS | 409 | Resource | No | Use different email |
| NOT_FOUND | 404 | Resource | No | Create resource first |
| INVALID_INPUT | 400 | Validation | No | Fix input data |
| RATE_LIMIT_EXCEEDED | 429 | Limit | Yes | Wait & retry |
| INTERNAL_ERROR | 500 | Server | Yes | Retry with backoff |

---

## Handling Specific Scenarios

### Scenario 1: Session Expires During Operation

```graphql
mutation UpdateProfile {
  updateProfile(input: { email: "new@example.com" }) {
    id
    email
  }
}
```

**Error Response**:
```json
{
  "errors": [{
    "message": "Unauthorized: Authentication required",
    "extensions": { "code": "UNAUTHORIZED" }
  }]
}
```

**Solution**:
1. Catch UNAUTHORIZED error
2. Call `refreshToken` mutation
3. Retry original mutation with new token

### Scenario 2: Rate Limited User

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

**Solution**:
1. Display countdown timer to user
2. Disable submit buttons temporarily
3. Retry after specified duration
4. Use exponential backoff: 1s, 2s, 4s, 8s...

### Scenario 3: Duplicate Email Registration

```json
{
  "errors": [{
    "message": "User already exists",
    "extensions": { "code": "USER_ALREADY_EXISTS" }
  }]
}
```

**Solution**:
1. Display error message
2. Suggest login or password reset
3. Validate email format before submission

### Scenario 4: Admin Query Without Permission

```json
{
  "errors": [{
    "message": "Forbidden: Admin access required",
    "extensions": { "code": "FORBIDDEN" }
  }]
}
```

**Solution**:
1. Only show admin features to admin users
2. Verify user role before making admin queries
3. Handle gracefully if user loses admin status

---

## Testing Error Scenarios

### Test Case 1: Expired Token
```graphql
query {
  me { id }
}
```
**Headers**: `Authorization: Bearer expired-token`
**Expected**: UNAUTHORIZED error

### Test Case 2: Invalid Input
```graphql
mutation {
  signup(email: "invalid-email", password: "short") {
    user { id }
  }
}
```
**Expected**: INVALID_INPUT error

### Test Case 3: Rate Limit
```javascript
// Send 150 requests in 60 seconds
for (let i = 0; i < 150; i++) {
  await graphql(query);
}
```
**Expected**: RATE_LIMIT_EXCEEDED after 100 requests

### Test Case 4: Duplicate Email
```graphql
mutation {
  signup(email: "alice@example.com", password: "password123") {
    user { id }
  }
}

mutation {
  signup(email: "alice@example.com", password: "password456") {
    user { id }
  }
}
```
**Expected**: USER_ALREADY_EXISTS on second signup

---

## Debugging Tips

### 1. Enable Detailed Logging
```javascript
const response = await graphql(query);
if (response.errors) {
  console.error('GraphQL Error:', {
    message: response.errors[0].message,
    code: response.errors[0].extensions?.code,
    details: response.errors[0].extensions?.details,
    timestamp: new Date().toISOString()
  });
}
```

### 2. Check Rate Limit Headers
```javascript
const remaining = response.headers.get('X-RateLimit-Remaining');
const reset = response.headers.get('X-RateLimit-Reset');
console.log(`Remaining: ${remaining}, Resets at: ${new Date(reset * 1000)}`);
```

### 3. Use Request IDs for Tracing
```javascript
const traceId = response.errors?.[0]?.extensions?.traceId;
console.log(`Include trace ID in support request: ${traceId}`);
```

---

## Support

For issues not covered here:
- **Email**: support@orya.io
- **Discord**: [Orÿa Community](https://discord.gg/orya)
- **GitHub Issues**: [Orÿa Wallet](https://github.com/orya-wallet)

Include error code and trace ID when reporting issues.
