# Wallet Service

Multi-chain wallet management microservice for ORYA Wallet. Handles wallet creation with Privy MPC integration, multi-wallet management, balance tracking, and cross-chain support.

## Overview

The Wallet Service is responsible for:
- Multi-wallet management (users can have multiple wallets per chain)
- Privy MPC wallet creation and integration
- Wallet address generation and management
- Balance tracking and aggregation
- Cross-chain wallet support (SUI, Bitcoin, Ethereum, Solana, Arbitrum, Polygon)
- Primary wallet designation

## Architecture

```
Wallet Service (Port 3003)
├── Create Wallet (POST /wallet/create)
├── List Wallets (GET /wallet/list, GET /wallets/user/:user_id)
├── Get Wallet (GET /wallet/:wallet_id)
├── Delete Wallet (DELETE /wallet/:wallet_id)
├── Get Balance (GET /wallet/:wallet_id/balance)
├── Get Address (GET /wallet/:wallet_id/address)
├── Health Check (GET /health)
└── Metrics (GET /metrics)
```

## Supported Chains

- **SUI** - Primary chain with Privy MPC
- **Bitcoin** - Native segwit addresses
- **Ethereum** - EVM compatible
- **Solana** - Native addresses
- **Arbitrum** - EVM compatible
- **Polygon** - EVM compatible

## Database Schema

```sql
-- Wallets table
CREATE TABLE wallets (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    wallet_name TEXT NOT NULL,
    chain TEXT NOT NULL,
    address TEXT NOT NULL UNIQUE,
    public_key TEXT,
    privy_wallet_id TEXT,
    balance NUMERIC(38,8),
    balance_usd NUMERIC(20,2),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, wallet_name, chain)
);

CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_wallets_chain ON wallets(chain);
CREATE INDEX idx_wallets_address ON wallets(address);
```

## API Endpoints

### Health Check

**GET** `/health`

```
Response: 200 OK
{
  "status": "healthy",
  "service": "wallet-service",
  "version": "0.1.0"
}
```

### Create Wallet

**POST** `/wallet/create`

Creates a new wallet for a user using Privy MPC for embedded wallet generation.

**Request:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "wallet_name": "My SUI Wallet",
  "chain": "sui",
  "is_primary": true
}
```

**Response (201 Created):**
```json
{
  "wallet_id": "550e8400-e29b-41d4-a716-446655440001",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "wallet_name": "My SUI Wallet",
  "chain": "sui",
  "address": "0x1234567890abcdef...",
  "privy_wallet_id": "privy_wallet_123",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Error Codes:**
- `400 Bad Request` - Invalid request or unsupported chain
- `404 Not Found` - User not found
- `409 Conflict` - Wallet already exists

### List User Wallets

**GET** `/wallets/user/:user_id`

Lists all wallets for a user.

**Query Parameters:**
- `chain` (optional) - Filter by chain (e.g., "sui", "ethereum")

**Response (200 OK):**
```json
{
  "wallets": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "wallet_name": "My SUI Wallet",
      "chain": "sui",
      "address": "0x1234567890abcdef...",
      "balance": "1.5",
      "balance_usd": "450.00",
      "is_primary": true,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total_count": 1
}
```

**Error Codes:**
- `404 Not Found` - User not found

### Get Wallet

**GET** `/wallet/:wallet_id`

Retrieves details for a specific wallet.

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "wallet_name": "My SUI Wallet",
  "chain": "sui",
  "address": "0x1234567890abcdef...",
  "balance": "1.5",
  "balance_usd": "450.00",
  "is_primary": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Error Codes:**
- `404 Not Found` - Wallet not found

### Delete Wallet

**DELETE** `/wallet/:wallet_id`

Deletes a wallet (cannot delete primary wallet).

**Response (200 OK):**
```json
{
  "message": "Wallet deleted successfully",
  "wallet_id": "550e8400-e29b-41d4-a716-446655440001"
}
```

**Error Codes:**
- `400 Bad Request` - Cannot delete primary wallet
- `404 Not Found` - Wallet not found

### Get Wallet Balance

**GET** `/wallet/:wallet_id/balance`

Retrieves current balance and USD value.

**Response (200 OK):**
```json
{
  "wallet_id": "550e8400-e29b-41d4-a716-446655440001",
  "address": "0x1234567890abcdef...",
  "chain": "sui",
  "balance": "1.5",
  "balance_usd": "450.00",
  "last_updated": "2024-01-15T10:35:00Z"
}
```

**Error Codes:**
- `404 Not Found` - Wallet not found

### Get Wallet Address

**GET** `/wallet/:wallet_id/address`

Retrieves wallet address and public key.

**Response (200 OK):**
```json
{
  "wallet_id": "550e8400-e29b-41d4-a716-446655440001",
  "address": "0x1234567890abcdef...",
  "chain": "sui",
  "public_key": "0xpubkey..."
}
```

**Error Codes:**
- `404 Not Found` - Wallet not found

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/orya_wallet

# Service
RUST_LOG=info
PORT=3003

# Privy Integration (if using real Privy)
PRIVY_API_KEY=your_privy_api_key
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

The service will start on `http://0.0.0.0:3003`

## Testing

### Run Tests

```bash
cargo test
```

### Test with curl

```bash
# Health check
curl http://localhost:3003/health

# Create wallet
curl -X POST http://localhost:3003/wallet/create \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "wallet_name": "My SUI Wallet",
    "chain": "sui",
    "is_primary": true
  }'

# List user wallets
curl http://localhost:3003/wallets/user/550e8400-e29b-41d4-a716-446655440000

# Get wallet
curl http://localhost:3003/wallet/550e8400-e29b-41d4-a716-446655440001

# Get balance
curl http://localhost:3003/wallet/550e8400-e29b-41d4-a716-446655440001/balance
```

## Privy MPC Integration

### Address Generation Strategy

1. **Privy Embedded Wallets**: Uses Privy SDK to create MPC-based embedded wallets for users
2. **Address Derivation**: Generates unique addresses per chain
3. **Key Management**: Private keys never leave Privy's infrastructure
4. **Transaction Signing**: Transactions are signed via Privy's MPC infrastructure

### Implementation Details

```rust
// Pseudo-code: Integration with Privy
async fn create_mpc_wallet(privy_client: &PrivyClient, chain: &str) -> Result<WalletInfo> {
    let privy_wallet = privy_client
        .create_embedded_wallet(CreateWalletRequest {
            chain: chain.to_string(),
            ...
        })
        .await?;

    Ok(WalletInfo {
        privy_wallet_id: privy_wallet.id,
        address: privy_wallet.address,
        ...
    })
}
```

## Wallet State Management

### Primary Wallet

Each user has one primary wallet per chain category:
- When a wallet is set as primary, the previous primary is automatically unset
- Operations on the user's default wallet reference the primary wallet
- Cannot delete a primary wallet without reassigning

### Balance Updates

Balances are updated via:
1. Periodic polling from blockchain RPC (Transaction Service)
2. Real-time updates from blockchain listeners (WebSocket)
3. Manual refresh via `/wallet/{id}/balance` endpoint

## Security Considerations

1. **MPC Private Keys**: Never stored—managed entirely by Privy
2. **Address Validation**: Chain-specific address format validation
3. **User Ownership**: Each wallet is tied to a verified user
4. **Database RLS**: PostgreSQL RLS policies restrict access
5. **Rate Limiting**: Implemented at API Gateway level

## Monitoring

Key events logged:
- Wallet creation
- Wallet deletion
- Balance updates
- Address generation errors
- Chain validation failures

View logs:
```bash
RUST_LOG=debug cargo run
```

## Integration with Other Services

### User Service
Wallets depend on User Service for user verification during creation.

### Transaction Service
Transaction Service queries wallet addresses for transaction history.

### DeFi Service
DeFi Service uses wallet addresses for protocol interactions.

### Portfolio Service
Portfolio Service aggregates balances from all user wallets.

## Future Enhancements

- [ ] Real Privy SDK integration with proper credentials
- [ ] Batch wallet operations
- [ ] Wallet import from private keys (encrypted)
- [ ] Hardware wallet integration
- [ ] Multi-signature wallet support
- [ ] Wallet recovery mechanisms

## Deployment

### Docker

```dockerfile
FROM rust:latest as builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
COPY --from=builder /app/target/release/wallet-service /usr/local/bin/
EXPOSE 3003
CMD ["wallet-service"]
```

## Troubleshooting

### Wallet creation fails with "User not found"
- Ensure the user was created in User Service first
- Verify user_id format is valid UUID

### Unsupported chain error
- Check that the chain parameter is one of: sui, bitcoin, ethereum, solana, arbitrum, polygon

### Cannot delete wallet
- Verify it's not the primary wallet
- Check permissions and user ownership

## License

MIT