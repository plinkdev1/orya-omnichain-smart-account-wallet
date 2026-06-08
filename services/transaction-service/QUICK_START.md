# Transaction Service - Quick Start Guide

**Service:** Transaction Management & History  
**Port:** 3002  
**Framework:** Axum (async Rust web framework)  
**Database:** PostgreSQL  

---

## 🚀 Quick Start (5 minutes)

### 1. Start the Service
```bash
cd services
cargo run -p transaction-service
```

You'll see:
```
Transaction Service listening on 0.0.0.0:3002
```

### 2. Verify Health
```bash
curl http://localhost:3002/health
```

Response:
```json
{
  "status": "healthy",
  "service": "transaction-service",
  "version": "0.1.0"
}
```

### 3. Create a Transaction
```bash
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
```

---

## 📚 Common Operations

### List All Transactions for User
```bash
curl "http://localhost:3002/transactions/user/{user_id}"
```

With pagination and filtering:
```bash
curl "http://localhost:3002/transactions/user/{user_id}?limit=10&offset=0&chain=ethereum&status=confirmed"
```

### Get Specific Transaction
```bash
curl http://localhost:3002/transactions/{tx_id}
```

### Update Transaction Status
```bash
curl -X PUT http://localhost:3002/transactions/{tx_id} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed",
    "tx_hash": "0xabc123",
    "confirmations": 12
  }'
```

### Get User Statistics
```bash
curl http://localhost:3002/transactions/{user_id}/stats
```

### Retry Failed Transaction
```bash
curl -X POST http://localhost:3002/transactions/{tx_id}/retry
```

---

## 🔄 Transaction Types

All transactions start with status: `pending`

| Type | Use Case |
|------|----------|
| `send` | Outgoing transfer |
| `receive` | Incoming transfer |
| `swap` | Token exchange |
| `deposit` | Deposit to protocol |
| `withdraw` | Withdrawal from protocol |
| `stake` | Staking operation |
| `bridge` | Cross-chain bridge |

---

## ⛓️ Supported Chains

- `sui` - SUI blockchain (primary)
- `ethereum` - Ethereum mainnet
- `bitcoin` - Bitcoin network
- `solana` - Solana blockchain
- `arbitrum` - Arbitrum L2
- `polygon` - Polygon chain

---

## 📊 Response Examples

### Create Transaction (201 Created)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "wallet_id": "550e8400-e29b-41d4-a716-446655440001",
  "tx_type": "send",
  "status": "pending",
  "from_address": "0x1234567890abcdef",
  "to_address": "0xfedcba0987654321",
  "amount": "1.5",
  "chain": "ethereum",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### List Transactions (200 OK)
```json
{
  "transactions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "wallet_id": "550e8400-e29b-41d4-a716-446655440001",
      "tx_hash": "0xabc123",
      "tx_type": "send",
      "status": "confirmed",
      "amount": "1.5",
      "chain": "ethereum",
      "confirmations": 12,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total_count": 45,
  "page": 0,
  "page_size": 20
}
```

### Statistics (200 OK)
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

---

## ⚠️ Error Responses

### 400 Bad Request - Invalid Chain
```json
{
  "error": "invalid_chain",
  "message": "Invalid chain: xyz",
  "status_code": 400
}
```

### 404 Not Found
```json
{
  "error": "transaction_not_found",
  "message": "Transaction not found",
  "status_code": 404
}
```

### 409 Conflict - Duplicate
```json
{
  "error": "duplicate_transaction",
  "message": "Transaction already exists",
  "status_code": 409
}
```

---

## 🔐 Idempotency

Use idempotency keys to prevent duplicate transactions:

```bash
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
    "chain": "ethereum",
    "idempotency_key": "unique-id-12345"
  }'
```

Same request with same idempotency key will return 409 Conflict if already processed.

---

## 📈 Pagination

### Parameters
- `limit` (1-100, default: 20) - Number of results per page
- `offset` (default: 0) - Starting position

### Example
```bash
# Page 1: Records 0-19
curl "http://localhost:3002/transactions/user/{user_id}?limit=20&offset=0"

# Page 2: Records 20-39
curl "http://localhost:3002/transactions/user/{user_id}?limit=20&offset=20"

# Page 3: Records 40-59
curl "http://localhost:3002/transactions/user/{user_id}?limit=20&offset=40"
```

Response includes page metadata:
```json
{
  "transactions": [...],
  "total_count": 125,
  "page": 0,
  "page_size": 20
}
```

---

## 🔧 Configuration

Set environment variables before running:

```bash
# Database
export DATABASE_URL="postgresql://user:password@localhost:5432/orya_wallet"

# Logging level
export RUST_LOG=info

# Port (optional, defaults to 3002)
export PORT=3002
```

Or create `.env` file:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/orya_wallet
RUST_LOG=info
SUI_RPC_URL=https://fullnode.mainnet.sui.io
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/key
SOL_RPC_URL=https://api.mainnet-beta.solana.com
```

---

## 🧪 Testing with curl

Create a simple test script (test-transaction-service.sh):

```bash
#!/bin/bash

BASE_URL="http://localhost:3002"
USER_ID="550e8400-e29b-41d4-a716-446655440000"
WALLET_ID="550e8400-e29b-41d4-a716-446655440001"

echo "1. Health Check"
curl -s $BASE_URL/health | jq .

echo -e "\n2. Create Transaction"
TX_RESPONSE=$(curl -s -X POST $BASE_URL/transactions \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": \"$USER_ID\",
    \"wallet_id\": \"$WALLET_ID\",
    \"tx_type\": \"send\",
    \"from_address\": \"0x1234567890abcdef\",
    \"to_address\": \"0xfedcba0987654321\",
    \"amount\": \"1.5\",
    \"token_symbol\": \"ETH\",
    \"chain\": \"ethereum\"
  }")
echo $TX_RESPONSE | jq .
TX_ID=$(echo $TX_RESPONSE | jq -r '.id')

echo -e "\n3. Get Transaction ($TX_ID)"
curl -s $BASE_URL/transactions/$TX_ID | jq .

echo -e "\n4. List User Transactions"
curl -s "$BASE_URL/transactions/user/$USER_ID?limit=5" | jq .

echo -e "\n5. Update Transaction Status"
curl -s -X PUT $BASE_URL/transactions/$TX_ID \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed", "tx_hash": "0xabc123", "confirmations": 12}' | jq .

echo -e "\n6. Get Statistics"
curl -s "$BASE_URL/transactions/$USER_ID/stats" | jq .
```

Run it:
```bash
chmod +x test-transaction-service.sh
./test-transaction-service.sh
```

---

## 📋 Database Tables Required

The service expects these tables in PostgreSQL:

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wallets (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    address VARCHAR(255) NOT NULL,
    chain VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    tx_hash TEXT UNIQUE,
    tx_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    from_address TEXT,
    to_address TEXT,
    amount TEXT NOT NULL,
    amount_in_usd DECIMAL(18, 2),
    token_symbol TEXT,
    token_decimal INT,
    fee_amount TEXT,
    fee_in_usd DECIMAL(18, 2),
    chain TEXT NOT NULL,
    gas_used TEXT,
    nonce INT,
    block_number BIGINT,
    confirmations INT DEFAULT 0,
    transaction_data JSONB,
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
CREATE INDEX idx_transactions_chain ON transactions(chain);
```

---

## 🔗 Integration Points

### With API Gateway (GraphQL)
The Transaction Service integrates with the API Gateway via:
- gRPC inter-service calls
- REST API for direct access
- Shared PostgreSQL database

### With Wallet Service
- Validates wallet ownership before creating transactions
- Returns wallet-specific transaction history
- Supports multi-wallet portfolio views

### With Blockchain Adapters
- Receives tx_hash after broadcast
- Updates confirmation counts from chain data
- Handles transaction failures

---

## 📈 Performance Tips

1. **Use Pagination** - Always use limit/offset for large result sets
2. **Filter Early** - Use chain and status filters to reduce query size
3. **Batch Operations** - Group multiple transaction operations
4. **Cache Results** - Consumer services should cache static data
5. **Indexes** - Database has indexes on common filter columns

---

## 🐛 Troubleshooting

### Service won't start
```
Error: Failed to create database pool
```
Check DATABASE_URL and PostgreSQL connectivity

### 404 Not Found on POST
```
Ensure wallet_id belongs to user_id
```

### 409 Conflict on duplicate
```
idempotency_key already exists
```
Use a new key or remove the field

---

## 📞 Support

For issues or questions:
1. Check the full README.md
2. Review inline code documentation
3. Check error codes and messages
4. Verify database schema

---

**Service Ready:** ✅ Production-ready with comprehensive error handling and validation