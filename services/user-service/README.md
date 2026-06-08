# User Service

Authentication and user registration microservice for ORYA Wallet. Handles user onboarding, session management, KYC verification status, and profile management.

## Overview

The User Service is responsible for:
- User registration via Privy MPC wallet integration
- User authentication and login
- Session management
- KYC verification status tracking
- User profile management
- Token verification (Firebase Admin SDK integration)

## Architecture

```
User Service (Port 3001)
├── Registration (POST /register)
├── Login (POST /login)
├── Token Verification (POST /verify-token)
├── KYC Status (GET /kyc-status)
├── Profile (GET /profile, POST /profile)
└── Health Check (GET /health)
```

## Database Schema

The service uses the following tables:
- **users** - Core user data, KYC status, profile info
- **sessions** - Session management with refresh tokens
- **kyc_verifications** - KYC provider integration records

## API Endpoints

### Health Check

**GET** `/health`

```
Response: 200 OK
{
  "status": "User Service - OK"
}
```

### Register User

**POST** `/register`

Creates a new user in the system.

**Request:**
```json
{
  "privy_user_id": "privy_user_123",
  "email": "user@example.com",
  "phone_number": "+1234567890",
  "username": "johndoe"
}
```

**Response (201 Created):**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "privy_user_id": "privy_user_123"
}
```

**Error Codes:**
- `400 Bad Request` - Invalid request (missing privy_user_id)
- `409 Conflict` - User already exists

### Login User

**POST** `/login`

Authenticates a user and creates a session.

**Request:**
```json
{
  "privy_user_id": "privy_user_123",
  "device_id": "device_abc123",
  "device_name": "iPhone 15"
}
```

**Response (200 OK):**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "privy_user_id": "privy_user_123",
  "is_kyc_verified": false,
  "session_id": "session_xyz789"
}
```

**Error Codes:**
- `400 Bad Request` - Invalid request
- `404 Not Found` - User not found

### Verify Token

**POST** `/verify-token`

Verifies a Firebase authentication token.

**Request:**
```json
{
  "firebase_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "valid": true,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "privy_user_id": "privy_user_123"
}
```

Or when token is valid but user not found:
```json
{
  "valid": false,
  "user_id": null,
  "privy_user_id": null
}
```

**Error Codes:**
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Invalid token

### Get KYC Status

**GET** `/kyc-status?user_id=550e8400-e29b-41d4-a716-446655440000`

Retrieves KYC verification status for a user.

**Response (200 OK):**
```json
{
  "is_verified": false,
  "provider": "sumsub",
  "verified_at": null
}
```

**Error Codes:**
- `400 Bad Request` - Invalid user_id format
- `404 Not Found` - User not found

### Get Profile

**GET** `/profile?user_id=550e8400-e29b-41d4-a716-446655440000`

Retrieves user profile information.

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "privy_user_id": "privy_user_123",
  "email": "user@example.com",
  "phone_number": "+1234567890",
  "username": "johndoe",
  "profile_picture_url": "https://example.com/profile.jpg",
  "is_kyc_verified": false,
  "kyc_provider": "sumsub",
  "last_login_at": "2024-01-15T10:30:00Z",
  "created_at": "2024-01-10T08:15:00Z"
}
```

**Error Codes:**
- `400 Bad Request` - Invalid user_id format
- `404 Not Found` - User not found

### Update Profile

**POST** `/profile?user_id=550e8400-e29b-41d4-a716-446655440000`

Updates user profile information.

**Request:**
```json
{
  "username": "johndoe_updated",
  "phone_number": "+9876543210",
  "profile_picture_url": "https://example.com/new-profile.jpg"
}
```

**Response (200 OK):**
```json
{
  "message": "Profile updated successfully",
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Codes:**
- `400 Bad Request` - Invalid user_id format
- `404 Not Found` - User not found

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/orya_wallet

# Service
RUST_LOG=info
PORT=3001
```

## Development

### Prerequisites

- Rust 1.75+
- PostgreSQL 15+
- sqlx-cli

### Setup

1. **Install dependencies:**
   ```bash
   cargo build
   ```

2. **Run migrations:**
   ```bash
   sqlx migrate run
   ```

3. **Start the service:**
   ```bash
   cargo run
   ```

The service will start on `http://0.0.0.0:3001`

### Database Setup

The database schema is initialized via migrations in `/services/migrations/`. The main tables used by this service:

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    privy_user_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    phone_number TEXT,
    username TEXT UNIQUE,
    profile_picture_url TEXT,
    is_kyc_verified BOOLEAN DEFAULT FALSE,
    kyc_provider TEXT,
    kyc_verification_id TEXT,
    kyc_verified_at TIMESTAMP,
    kyc_data JSONB,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    refresh_token_hash TEXT NOT NULL UNIQUE,
    device_id TEXT,
    device_name TEXT,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP
);
```

## Testing

### Run Tests

```bash
cargo test
```

### Test with curl

```bash
# Health check
curl http://localhost:3001/health

# Register user
curl -X POST http://localhost:3001/register \
  -H "Content-Type: application/json" \
  -d '{
    "privy_user_id": "privy_test_123",
    "email": "test@example.com",
    "username": "testuser"
  }'

# Login
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{
    "privy_user_id": "privy_test_123",
    "device_id": "device_123"
  }'
```

## Security Considerations

1. **Token Verification**: Tokens are verified with Firebase Admin SDK (production)
2. **Session Management**: Refresh tokens are hashed before storage
3. **Row Level Security**: PostgreSQL RLS policies enforce user data isolation
4. **Rate Limiting**: Should be implemented at API Gateway level
5. **HTTPS**: Always use HTTPS in production

## Error Handling

All errors return standardized error responses:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "status": 400
}
```

Common error codes:
- `INVALID_REQUEST` - Malformed request
- `USER_NOT_FOUND` - User doesn't exist
- `USER_ALREADY_EXISTS` - User already registered
- `INVALID_TOKEN` - Invalid or expired token
- `DATABASE_ERROR` - Database operation failed
- `INTERNAL_SERVER_ERROR` - Unexpected error

## Integration with Other Services

### API Gateway
The User Service is called by the API Gateway for authentication middleware.

### Transaction Service
Transaction Service calls User Service to verify user ownership of wallets.

### KYC Service
KYC verification updates are pushed to User Service via KYC provider webhooks.

## Deployment

### Docker

```dockerfile
FROM rust:latest as builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
COPY --from=builder /app/target/release/user-service /usr/local/bin/
EXPOSE 3001
CMD ["user-service"]
```

### Kubernetes

See `/infrastructure/kubernetes/user-service.yaml`

## Monitoring

The service logs important events:
- User registration
- Login attempts
- Token verification
- Profile updates
- Database errors

View logs:
```bash
RUST_LOG=debug cargo run
```

## Troubleshooting

### Service won't start
- Check DATABASE_URL is correct
- Ensure PostgreSQL is running
- Verify migrations have run

### User registration fails
- Check for duplicate email
- Verify privy_user_id format
- Check database permissions

### Authentication fails
- Verify Firebase credentials
- Check token expiration
- Ensure user exists in database

## Contributing

Follow the style guide in CONTRIBUTING.md

## License

MIT