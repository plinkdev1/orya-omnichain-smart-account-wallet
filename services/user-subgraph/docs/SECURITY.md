# Security Best Practices

## Authentication

### JWT Implementation

**Access Token (24h)**
```typescript
{
  userId: string;
  email: string;
  iat: number;
  exp: number;
}
```

**Refresh Token (7d)**
```typescript
{
  userId: string;
  iat: number;
  exp: number;
}
```

### Token Handling

1. **Never log tokens**: Tokens must never appear in logs
2. **HTTPS only**: Always use HTTPS in production
3. **Secure storage**: Store refresh tokens in HttpOnly cookies
4. **Token rotation**: Implement refresh token rotation
5. **Short expiry**: Access tokens should be short-lived

### Secret Management

```env
JWT_SECRET=<generate-cryptographically-secure-random-32-char-string>
```

Generate securely:
```bash
openssl rand -hex 32
```

Never commit secrets:
```bash
# Add to .gitignore
.env
.env.local
*.pem
```

## Authorization

### Role-Based Access Control (RBAC)

```typescript
// Admin operations
if (!isAdminEmail(context.user?.email)) {
  throw new AuthorizationError('Admin access required');
}

// User data isolation
if (context.userId !== userId) {
  throw new AuthorizationError('Cannot access other users\' data');
}
```

### Admin Emails

Keep minimal, use separate admin accounts:
```env
ADMIN_EMAILS=admin@example.com,support@example.com
```

## Password Security

### Hashing Algorithm

Use PBKDF2 (production):
```typescript
crypto.pbkdf2(password, salt, 100000, 64, 'sha512');
```

- **Iterations**: 100,000 (OWASP recommendation)
- **Algorithm**: SHA-512
- **Salt**: Cryptographically random

### Password Requirements

Enforce in client + server:
- Minimum 12 characters
- Uppercase + lowercase + numbers + symbols
- No common passwords (use `zxcvbn` library)

## Database Security

### Row-Level Security (RLS)

Enable PostgreSQL RLS policies:

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_self_access ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY admin_full_access ON users
  FOR ALL USING (auth.role() = 'admin');
```

### Connection Pooling

```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require&pool_size=20
```

- Use SSL/TLS
- Limit connections (20 is reasonable)
- Timeout queries after 30s

### Data Protection

**Never expose**:
- Password hashes in responses
- Private keys
- API keys
- Sensitive PII

## Input Validation

### Email Validation

```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  throw new ValidationError('Invalid email');
}
```

### Rate Limiting

Implement at API Gateway:

```typescript
// 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.ip,
});
```

### Mutation Input Validation

```typescript
async signup(parent, args, context) {
  // Validate email format
  if (!isValidEmail(args.email)) {
    throw new ValidationError('Invalid email');
  }

  // Validate password strength
  const strength = checkPasswordStrength(args.password);
  if (strength < 3) {
    throw new ValidationError('Password too weak');
  }

  // Prevent SQL injection (handled by Prisma)
  // Prevent XSS (handled by GraphQL escaping)
}
```

## Firebase Integration

### Token Verification

```typescript
import admin from 'firebase-admin';

async function verifyFirebaseToken(token: string) {
  const decodedToken = await admin.auth().verifyIdToken(token);
  return decodedToken;
}
```

### Service Account Credentials

Store securely:
```env
FIREBASE_PROJECT_ID=xxx
FIREBASE_PRIVATE_KEY=xxx
FIREBASE_CLIENT_EMAIL=xxx
```

Never hardcode credentials in source code.

## Privy Integration

### MPC Wallet Security

- Let Privy manage private keys
- Never request private keys
- Verify Privy signatures server-side

```typescript
// ✓ Correct - Privy handles signing
const wallet = await privy.createWallet({
  userId: context.user.id,
  chainType: 'ethereum'
});

// ✗ Wrong - Never ask for private key
const privateKey = user.getPrivateKey();
```

## KYC Integration

### Data Protection

KYC data is highly sensitive:

```typescript
// Encrypt sensitive data
const encrypted = await encryptKYCData(kycData);
await prisma.user.update({
  data: { kycData: encrypted }
});

// Only decrypt when needed
const decrypted = await decryptKYCData(user.kycData);
```

### Provider Integration

Use official APIs only:
```typescript
// ✓ Use official SDK
const sumsub = new SumsubClient({ apiKey });

// ✗ Don't make custom API calls
fetch('https://api.sumsub.com/...')
```

## Caching Security

### Cache Invalidation

Don't cache sensitive data indefinitely:

```typescript
// ✓ Short TTL for user data
await cache.set(`user:${userId}`, user, 300); // 5 min

// ✗ Long TTL risks stale auth state
await cache.set(`user:${userId}`, user, 3600); // Too long
```

### Cache Key Format

Use hierarchical keys:
```
user:123:profile    (5 min)
user:123:prefs      (10 min)
user:123:tokens     (Never cache!)
```

## API Security

### GraphQL Best Practices

1. **Depth Limiting**: Prevent deeply nested queries
   ```typescript
   const apollo = new ApolloServer({
     plugins: {
       didResolveOperation: ({ operationName, depth }) => {
         if (depth > 10) throw new Error('Query too deep');
       },
     },
   });
   ```

2. **Query Complexity Analysis**
   ```typescript
   // Estimate query cost
   const cost = estimateQueryCost(query);
   if (cost > 1000) throw new Error('Query too expensive');
   ```

3. **Introspection Disabled in Production**
   ```typescript
   const apollo = new ApolloServer({
     introspection: process.env.NODE_ENV !== 'production',
   });
   ```

## Monitoring & Logging

### Security Events

Always log:
- Login attempts (success + failure)
- Failed authentication
- Authorization violations
- Sensitive data access
- Admin operations

```typescript
logger.info('LOGIN_SUCCESS', {
  userId: user.id,
  email: user.email,
  ipAddress: context.req.ip,
  timestamp: new Date(),
});

logger.warn('LOGIN_FAILURE', {
  email: args.email,
  reason: 'INVALID_PASSWORD',
  ipAddress: context.req.ip,
});

logger.warn('AUTH_FAILURE', {
  action: 'FETCH_USERS',
  userId: context.userId,
  reason: 'NOT_ADMIN',
});
```

### Never Log

```typescript
// ✗ Never log tokens
logger.debug('Token received', { token });

// ✗ Never log passwords
logger.debug('User data', { password });

// ✗ Never log private keys
logger.debug('Wallet created', { privateKey });
```

### Log Retention

- **Short-term**: 30 days in application logs
- **Medium-term**: 90 days in audit logs
- **Long-term**: 1 year in archive storage

## Security Checklist

- [ ] JWT secret is strong and rotated regularly
- [ ] HTTPS enabled in production
- [ ] CORS configured properly
- [ ] Rate limiting implemented
- [ ] Input validation on all mutations
- [ ] Authorization checks on sensitive queries
- [ ] Password hashing with PBKDF2
- [ ] Sensitive data not logged
- [ ] Database uses SSL/TLS
- [ ] Row-level security enabled
- [ ] Firebase credentials secured
- [ ] Admin emails minimized
- [ ] Introspection disabled in production
- [ ] Query depth limiting enabled
- [ ] Security headers set properly

## Incident Response

### Suspected Token Compromise

1. Invalidate all refresh tokens
2. Force re-authentication
3. Review audit logs
4. Notify affected users
5. Rotate JWT secret

### Suspected Data Breach

1. Enable forensic logging
2. Query audit logs
3. Identify affected records
4. Notify users (per GDPR)
5. Escalate to security team

## References

- OWASP: https://owasp.org/
- JWT Best Practices: https://tools.ietf.org/html/rfc8725
- NIST Password Guidelines: https://pages.nist.gov/800-63-3/
- GraphQL Security: https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html
