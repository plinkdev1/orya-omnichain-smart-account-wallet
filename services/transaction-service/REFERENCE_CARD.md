# Transaction Service - Reference Card

**Status:** ✅ Complete | **Port:** 3002 | **Framework:** Axum | **Build:** Success

---

## 🚀 Start Service
```bash
cd services
cargo run -p transaction-service
```

---

## 📡 API Endpoints Quick Reference

### Health
| Method | Endpoint | Returns |
|--------|----------|---------|
| GET | `/health` | `{status, service, version}` |
| GET | `/metrics` | `{transactions_processed, pending, failed, avg_time}` |

### CRUD Operations
| Method | Endpoint | Action | Status |
|--------|----------|--------|--------|
| POST | `/transactions` | Create transaction | 201 Created |
| GET | `/transactions/:id` | Get transaction | 200 OK |
| PUT | `/transactions/:id` | Update transaction | 200 OK |
| POST | `/transactions/:id/retry` | Retry failed | 200 OK |

### Query Operations
| Method | Endpoint | Parameters | Returns |
|--------|----------|-----------|---------|
| GET | `/transactions/user/:id` | `limit, offset, chain, status` | Paginated list |
| GET | `/transactions/:id/stats` | - | User statistics |

---

## 📨 Request/Response Examples

### Create Transaction
```bash
curl -X POST http://localhost:3002/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "uuid",
    "wallet_id": "uuid",
    "tx_type": "send",
    "from_address": "0x...",
    "to_address": "0x...",
    "amount": "1.5",
    "token_symbol": "ETH",
    "chain": "ethereum"
  }'

# Response: 201 CREATED
{
  "id": "tx-uuid",
  "status": "pending",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### List Transactions
```bash
curl "http://localhost:3002/transactions/user/uuid?limit=20&offset=0&chain=ethereum"

# Response: 200 OK
{
  "transactions": [...],
  "total_count": 125,
  "page": 0,
  "page_size": 20
}
```

---

## ⚙️ Configuration

```bash
# Set environment variables
export DATABASE_URL="postgresql://user:password@localhost:5432/orya_wallet"
export RUST_LOG=info
export PORT=3002

# Or use .env file
DATABASE_URL=postgresql://...
RUST_LOG=info
SUI_RPC_URL=https://...
ETH_RPC_URL=https://...
```

---

## ✅ Supported Values

### Transaction Types (7)
`send` | `receive` | `swap` | `deposit` | `withdraw` | `stake` | `bridge`

### Statuses (4)
`pending` | `confirmed` | `failed` | `cancelled`

### Chains (6)
`sui` | `ethereum` | `bitcoin` | `solana` | `arbitrum` | `polygon`

---

## 🔴 Error Codes

| Code | Error | Solution |
|------|-------|----------|
| 400 | Invalid type/chain | Check supported values above |
| 404 | Not found | Verify ID exists |
| 409 | Duplicate | Check idempotency_key |
| 500 | Server error | Check DATABASE_URL |

---

## 📊 Pagination

```
Default limit:    20 (max 100)
Default offset:   0

Page 1:   ?limit=20&offset=0
Page 2:   ?limit=20&offset=20
Page 3:   ?limit=20&offset=40

Calculate page number: offset / limit
```

---

## 🔍 Filtering

```bash
# By chain
?chain=ethereum

# By status
?status=confirmed

# Both
?chain=ethereum&status=confirmed

# With pagination
?limit=10&offset=0&chain=sui&status=pending
```

---

## 💾 Database Tables

```sql
-- Required tables
users           (id, email, ...)
wallets         (id, user_id, address, chain, ...)
transactions    (all fields as documented)

-- Run migration
cd services/transaction-service
sqlx migrate run
```

---

## 🧪 Test Commands

```bash
# 1. Health check
curl http://localhost:3002/health

# 2. Create transaction (replace UUIDs)
curl -X POST http://localhost:3002/transactions \
  -H "Content-Type: application/json" \
  -d '{"user_id":"550e8400-e29b-41d4-a716-446655440000","wallet_id":"550e8400-e29b-41d4-a716-446655440001","tx_type":"send","from_address":"0x123","to_address":"0xabc","amount":"1.5","token_symbol":"ETH","chain":"ethereum"}'

# 3. Get transaction (replace tx-id)
curl http://localhost:3002/transactions/{tx-id}

# 4. List transactions (replace user-id)
curl http://localhost:3002/transactions/user/{user-id}?limit=10

# 5. Update status (replace tx-id)
curl -X PUT http://localhost:3002/transactions/{tx-id} \
  -H "Content-Type: application/json" \
  -d '{"status":"confirmed","tx_hash":"0xabc123","confirmations":12}'

# 6. Get stats (replace user-id)
curl http://localhost:3002/transactions/{user-id}/stats
```

---

## 📈 Response Structure

### Success (200/201)
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "wallet_id": "uuid",
  "status": "pending|confirmed|failed|cancelled",
  "amount": "1.5",
  "chain": "ethereum",
  "created_at": "2024-01-15T10:30:00Z",
  "completed_at": "2024-01-15T10:35:00Z"
}
```

### Error (400/404/409/500)
```json
{
  "error": "error_type",
  "message": "Human readable message",
  "status_code": 400
}
```

---

## 🔐 Idempotency

Use same `idempotency_key` to prevent duplicates:

```bash
curl -X POST http://localhost:3002/transactions \
  -H "Content-Type: application/json" \
  -d '{
    ...,
    "idempotency_key": "order-123-user-456"
  }'

# Call again with same key → 409 Conflict
```

---

## 📊 Statistics Response

```json
{
  "user_id": "uuid",
  "total_transactions": 125,
  "total_sent": "45.5",
  "total_received": "23.8",
  "total_fees_paid": "1.23",
  "pending_count": 2,
  "failed_count": 1
}
```

---

## 🔄 Transaction Lifecycle

```
CREATE → PENDING → CONFIRMED → DONE
          ↓
         FAILED → RETRY → PENDING → ...
```

---

## ⚡ Performance Tips

1. Use pagination for large result sets
2. Filter by chain/status to reduce data
3. Use indexed fields in queries
4. Batch operations when possible
5. Cache frequently accessed data

---

## 🔧 Development

```bash
# Build
cargo build -p transaction-service

# Run tests
cargo test -p transaction-service

# Build release
cargo build -p transaction-service --release

# Check formatting
cargo fmt --check

# Run clippy
cargo clippy
```

---

## 📚 Documentation

- **Full README:** `README.md` (400+ lines)
- **Quick Start:** `QUICK_START.md` (300+ lines)
- **Database:** `migrations/001_create_transactions_table.sql`
- **Code:** Inline documentation in source files
- **Examples:** curl commands in README

---

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| `Connection refused` | Ensure service is running on 3002 |
| `Database error` | Check DATABASE_URL environment variable |
| `Invalid transaction type` | Use one of: send, receive, swap, deposit, withdraw, stake, bridge |
| `Invalid chain` | Use one of: sui, ethereum, bitcoin, solana, arbitrum, polygon |
| `Wallet not found` | Verify wallet_id exists and belongs to user_id |
| `404 Transaction not found` | Check transaction ID is correct |
| `409 Duplicate transaction` | Check idempotency_key or ID |

---

## ✅ Checklist Before Production

- [ ] PostgreSQL running and accessible
- [ ] DATABASE_URL set correctly
- [ ] All tables created (run migrations)
- [ ] Service starts without errors
- [ ] Health endpoint responds
- [ ] Can create transaction
- [ ] Can list transactions
- [ ] Pagination works
- [ ] Error handling works
- [ ] Logging is configured

---

## 📞 Quick Help

```bash
# Check service is running
curl http://localhost:3002/health

# View logs
RUST_LOG=debug cargo run -p transaction-service

# Database connection test
psql $DATABASE_URL -c "SELECT 1"

# Kill service on port 3002 (if needed)
lsof -ti:3002 | xargs kill -9
```

---

**Last Updated:** 2025-01-15  
**Status:** ✅ Production Ready  
**Build:** ✅ Success (0 errors)