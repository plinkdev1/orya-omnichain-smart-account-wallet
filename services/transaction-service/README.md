# Transaction Service

Multi-chain transaction management and tracking microservice for ORYA Wallet. Handles transaction creation, status tracking, history retrieval, and blockchain event monitoring.

## Overview

The Transaction Service is responsible for:
- Creating and tracking transactions across multiple blockchains
- Managing transaction lifecycle (pending → confirmed → completed)
- Retrieving transaction history with filtering and pagination
- Broadcasting transactions to blockchain networks
- Handling transaction retries and error recovery
- Providing transaction statistics and analytics

## Architecture

```
Transaction Service (Port 3002)
├── Create Transaction (POST /transactions)
├── List Transactions (GET /transactions/user/:user_id)
├── Get Transaction (GET /transactions/:tx_id)
├── Update Transaction (PUT /transactions/:tx_id)
├── Retry Transaction (POST /transactions/:tx_id/retry)
├── Get Stats (GET /transactions/:user_id/stats)
├── Health Check (GET /health)
└── Metrics (GET /metrics)
```

## Supported Chains

- **SUI** - Primary chain
- **Ethereum** - EVM compatible
- **Bitcoin** - Native
- **Solana** - Native
- **Arbitrum** - EVM compatible
- **Polygon** - EVM compatible

## Database Schema

```sql
-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    tx_hash TEXT UNIQUE,
    tx_type TEXT NOT NULL ('send', 'receive', 'swap', 'deposit', 'withdraw', 'stake', 'bridge'),
    status TEXT NOT NULL ('pending', 'confirmed', 'failed', 'cancelled'),
    from_address TEXT,
    to_address TEXT,
    amount TEXT NOT NULL,
    amount_in_usd DECIMAL(18, 2),
    token_symbol TEXT,
    fee_amount TEXT,
    fee_in_usd DECIMAL(18, 2),
    chain TEXT NOT NULL,
    block_number BIGINT,
    confirmations INT DEFAULT 0,
    error_message TEXT,
    retries INT DEFAULT 0,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_status ON transactions(status);
```

## API Endpoints

### Health Check

**GET** `/health`

```
Response: 200 OK
{
  "status": "healthy",
  "service": "transaction-service",
  "version": "0.1.0"
}
```

### Create Transaction

**POST** `/transactions`

Creates a new transaction record.

**Request:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "wallet_id": "550e8400-e29b-41d4-a716-446655440001",
  "tx_type": "send",
  "from_address": "0x1234567890abcdef...",
  "to_address": "0xfedcba0987654321...",
  "amount": "1.5",
  "amount_in_usd": 3150.00,
  "token_symbol": "ETH",
  "token_decimal": 18,
  "fee_amount": "0.001",
  "fee_in_usd": 2.10,
  "chain": "ethereum",
  "idempotency_key": "unique-key-123"
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "wallet_id": "550e8400-e29b-41d4-a716-446655440001",
  "tx_type": "send",
  "status": "pending",
  "from_address": "0x1234567890abcdef...",
  "to_address": "0xfedcba0987654321...",
  "amount": "1.5",
  "chain": "ethereum",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Error Codes:**
- `400 Bad Request` - Invalid transaction type or chain
- `404 Not Found` - User or wallet not found
- `409 Conflict` - Duplicate idempotency key

### List User Transactions

**GET** `/transactions/user/:user_id`

Lists all transactions for a user with pagination and filtering.

**Query Parameters:**
- `limit` (optional, default: 20, max: 100) - Number of results
- `offset` (optional, default: 0) - Pagination offset
- `chain` (optional) - Filter by chain
- `status` (optional) - Filter by status (pending, confirmed, failed, cancelled)

**Response (200 OK):**
```json
{
  "transactions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "wallet_id": "550e8400-e29b-41d4-a716-446655440001",
      "tx_hash": "0xabc123...",
      "tx_type": "send",
      "status": "confirmed",
      "from_address": "0x1234567890abcdef...",
      "to_address": "0xfedcba0987654321...",
      "amount": "1.5",
      "amount_in_usd": 3150.00,
      "token_symbol": "ETH",
      "fee_amount": "0.001",
      "fee_in_usd": 2.10,
      "chain": "ethereum",
      "confirmations": 12,
      "created_at": "2024-01-15T10:30:00Z",
      "completed_at": "2024-01-15T10:35:00Z"
    }
  ],
  "total_count": 45,
  "page": 0,
  "page_size": 20
}
```

**Error Codes:**
- `404 Not Found` - User not found

### Get Transaction

**GET** `/transactions/:tx_id`

Retrieves details for a specific transaction.

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "wallet_id": "550e8400-e29b-41d4-a716-446655440001",
  "tx_hash": "0xabc123...",
  "tx_type": "send",
  "status": "confirmed",
  "from_address": "0x1234567890abcdef...",
  "to_address": "0xfedcba0987654321...",
  "amount": "1.5",
  "amount_in_usd": 3150.00,
  "token_symbol": "ETH",
  "fee_amount": "0.001",
  "fee_in_usd": 2.10,
  "chain": "ethereum",
  "confirmations": 12,
  "error_message": null,
  "created_at": "2024-01-15T10:30:00Z",
  "completed_at": "2024-01-15T10:35:00Z"
}
```

**Error Codes:**
- `404 Not Found` - Transaction not found

### Update Transaction

**PUT** `/transactions/:tx_id`

Updates transaction status and blockchain confirmation details.

**Request:**
```json
{
  "status": "confirmed",
  "tx_hash": "0xabc123...",
  "block_number": 19234567,
  "confirmations": 12,
  "error_message": null
}
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "status": "confirmed",
  "tx_hash": "0xabc123...",
  "block_number": 19234567,
  "confirmations": 12,
  "updated_at": "2024-01-15T10:35:00Z"
}
```

**Error Codes:**
- `400 Bad Request` - Cannot update confirmed transaction
- `404 Not Found` - Transaction not found

### Retry Transaction

**POST** `/transactions/:tx_id/retry`

Retries a failed transaction.

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "wallet_id": "550e8400-e29b-41d4-a716-446655440001",
  "tx_type": "send",
  "status": "pending",
  "from_address": "0x1234567890abcdef...",
  "to_address": "0xfedcba0987654321...",
  "amount": "1.5",
  "chain": "ethereum",
  "created_at": "2024-01-15T10:30:00Z",
  "completed_at": null
}
```

**Error Codes:**
- `404 Not Found` - Transaction not found or not in failed state

### Get Transaction Statistics

**GET** `/transactions/:user_id/stats`

Retrieves transaction statistics for a user.

**Response (200 OK):**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "total_transactions": 125,
  "total_sent": "45.5",
  "total_received": "23.8",
  "total_fees_paid": "1.23",
  "pending_count": 2,
  "failed_count": 1
}
```

**Error Codes:**
- `404 Not Found` - User not found

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/orya_wallet

# Service
RUST_LOG=info
PORT=3002

# Optional: Blockchain RPC endpoints for confirmation polling
SUI_RPC_URL=https://fullnode.mainnet.sui.io
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/api-key
SOL_RPC_URL=https://api.mainnet-beta.solana.com
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

The service will start on `http://0.0.0.0:3002`

## Testing

### Run Tests

```bash
cargo test
```

### Test with curl

```bash
# Health check
curl http://localhost:3002/health

# Create transaction
curl -X POST http://localhost:3002/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "wallet_id": "550e8400-e29b-41d4-a716-446655440001",
    "tx_type": "send",
    "from_address": "0x1234567890abcdef",
    "to_address": "0xfedcba0987654321",
    "amount": "1.5",
    "token_symbol": "ETH",
    "chain": "ethereum"
  }'

# List user transactions
curl "http://localhost:3002/transactions/user/550e8400-e29b-41d4-a716-446655440000?limit=10&status=confirmed"

# Get transaction
curl http://localhost:3002/transactions/550e8400-e29b-41d4-a716-446655440002

# Update transaction
curl -X PUT http://localhost:3002/transactions/550e8400-e29b-41d4-a716-446655440002 \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed", "tx_hash": "0xabc123", "confirmations": 12}'
```

## Transaction Lifecycle

```
1. PENDING
   - Transaction created and broadcast
   - Waiting for blockchain confirmation
   - Status: "pending"
   
2. CONFIRMED
   - Transaction included in block
   - Confirmations > 0
   - Status: "confirmed"
   - completed_at set
   
3. FAILED
   - Transaction reverted or rejected
   - Error message captured
   - Status: "failed"
   - Can be retried
   
4. CANCELLED
   - Transaction cancelled by user
   - Status: "cancelled"
```

## Idempotency

All transaction creation requests support idempotency via the `idempotency_key` field:

- First request with key: Creates transaction, returns 201
- Subsequent requests with same key: Returns 409 Conflict or same response

This prevents duplicate transactions if requests are retried.

## Blockchain Integration

### Status Polling

The service polls blockchain RPC endpoints to:
1. Track transaction confirmation status
2. Detect failed transactions
3. Update gas used and block information

### Webhook Support (Future)

Support for blockchain-specific webhooks:
- Alchemy Webhook for Ethereum/Polygon
- Triton for Solana
- SUI event subscriptions

## Error Handling

The service implements comprehensive error handling:

- **Validation Errors (400):** Invalid inputs, unsupported chains
- **Not Found (404):** Resource doesn't exist
- **Conflict (409):** Duplicate idempotency key
- **Server Errors (500):** Database or network failures

## Integration with Other Services

### Wallet Service
- Validates wallet ownership during transaction creation
- Links transactions to user wallets

### Portfolio Service
- Queries transaction history for portfolio calculations
- Updates portfolio balance based on transactions

### DeFi Service
- Integrates with DeFi protocol transactions (swaps, staking)
- Tracks yield farming transactions

## Performance Optimizations

1. **Pagination:** Default 20 items/page, max 100
2. **Indexing:** Status, created_at, user_id indexed for queries
3. **Caching:** Recently confirmed transactions cached
4. **Batch Updates:** Confirmation polling in batches

## Security Considerations

1. **Idempotency:** Prevents duplicate transactions
2. **User Ownership:** Validates transaction belongs to authenticated user
3. **Address Validation:** Chain-specific address format checking
4. **Rate Limiting:** Implemented at API Gateway level
5. **RLS Policies:** PostgreSQL row-level security

## Monitoring & Observability

Key metrics tracked:
- Total transactions processed
- Pending transactions count
- Failed transactions count
- Average confirmation time

View logs:
```bash
RUST_LOG=debug cargo run
```

## Future Enhancements

- [ ] Real-time transaction confirmation via WebSocket
- [ ] Blockchain webhook integration
- [ ] Transaction nonce management
- [ ] Gas price estimation and optimization
- [ ] Multi-signature transaction support
- [ ] Transaction bundling
- [ ] Analytics dashboard

## Deployment

### Docker

```dockerfile
FROM rust:latest as builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
COPY --from=builder /app/target/release/transaction-service /usr/local/bin/
EXPOSE 3002
CMD ["transaction-service"]
```

## Troubleshooting

### Transactions stuck in pending
- Check if tx_hash is set (should be set before moving to confirmed)
- Verify blockchain RPC endpoint connectivity
- Check error logs for network issues

### Duplicate transaction error
- idempotency_key already exists in database
- Verify idempotency_key is unique for each transaction
- Use UUID or hash for idempotency keys

### Cannot update confirmed transaction
- Confirmed transactions are immutable
- Remove the status field if not changing status
- Create new transaction if reversal needed

## License

MIT