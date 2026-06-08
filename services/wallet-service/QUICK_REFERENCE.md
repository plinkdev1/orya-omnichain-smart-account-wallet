# Wallet Service - Quick Reference

## 🚀 Quick Start

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Generate encryption key
openssl rand -hex 32  # Copy output to ENCRYPTION_KEY in .env

# 3. Update API keys in .env
# - Add your Privy API key
# - Add your Tatum API key

# 4. Run migrations
sqlx migrate run

# 5. Start service
cargo run --package wallet-service

# Service ready at: http://localhost:3003
```

## 📋 Environment Variables (Minimal)

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/orya_wallet
ENCRYPTION_KEY=your_64_hex_characters_here
PRIVY_API_KEY=privy_key_here
TATUM_API_KEY=tatum_key_here
SERVICE_PORT=3003
```

## 🔌 API Endpoints Cheat Sheet

### Create Wallet
```bash
# OWNED (Tatum) - with recovery phrase
POST /wallet/create
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "wallet_name": "My Wallet",
  "chain": "ethereum",
  "wallet_type": "OWNED"
}

# HUMAN_NETWORK (Privy) - no recovery phrase
POST /wallet/create
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "wallet_name": "SUI Wallet",
  "chain": "sui",
  "wallet_type": "HUMAN_NETWORK"
}

# CONNECTED - external wallet
POST /wallet/create
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "wallet_name": "My MetaMask",
  "chain": "ethereum",
  "wallet_type": "CONNECTED"
}
```

### Retrieve Wallets
```bash
# Get all user wallets
GET /wallets/user/{user_id}

# Get user wallets for specific chain
GET /wallets/user/{user_id}?chain=ethereum

# Get single wallet
GET /wallet/{wallet_id}

# Get wallet address
GET /wallet/{wallet_id}/address

# Get wallet balance
GET /wallet/{wallet_id}/balance
```

### Manage Wallets
```bash
# Delete wallet
DELETE /wallet/{wallet_id}

# Health check
GET /health
```

## 🔐 Wallet Types Quick Guide

| Type | Recovery Phrase | Keys Stored | Use Case |
|------|-----------------|-------------|----------|
| **OWNED** | ✅ Yes (saved on creation) | ✅ Encrypted locally | Self-custodied |
| **HUMAN_NETWORK** | ❌ No | ❌ Not stored | Privy MPC |
| **CONNECTED** | ❌ N/A | ❌ No | External wallets |

## 🔑 Supported Chains

### Tatum (OWNED type)
- ethereum
- polygon
- bitcoin
- solana

### Privy (HUMAN_NETWORK type)
- sui ⭐ (primary)
- ethereum
- polygon
- solana

## 📦 Response Format

### Wallet Object
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "wallet_name": "string",
  "chain": "string",
  "address": "0x... or bc1... etc",
  "wallet_type": "OWNED|CONNECTED|HUMAN_NETWORK",
  "privy_wallet_id": "uuid or null",
  "balance": "string (wei/satoshi/etc)",
  "balance_usd": "string",
  "is_primary": boolean,
  "created_at": "ISO8601 timestamp"
}
```

### Create Response (OWNED)
```json
{
  "wallet_id": "uuid",
  "user_id": "uuid",
  "wallet_name": "string",
  "chain": "string",
  "address": "0x...",
  "wallet_type": "OWNED",
  "privy_wallet_id": null,
  "recovery_phrase": ["word1", "word2", ..., "word12"],
  "created_at": "2025-01-20T10:30:00Z"
}
```

⚠️ **Recovery phrase is ONLY returned on creation. Save immediately!**

## 🛠️ Common Tasks

### Generate Encryption Key
```bash
# Option 1: OpenSSL
openssl rand -hex 32

# Option 2: Python
python3 -c "import os; print(os.urandom(32).hex())"

# Option 3: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Test API with cURL
```bash
# Create wallet
curl -X POST http://localhost:3003/wallet/create \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "wallet_name": "Test Wallet",
    "chain": "ethereum",
    "wallet_type": "OWNED"
  }'

# Get wallets
curl http://localhost:3003/wallets/user/550e8400-e29b-41d4-a716-446655440000

# Health check
curl http://localhost:3003/health
```

### Test with Postman/Insomnia
```
Base URL: http://localhost:3003

Variables:
- user_id: 550e8400-e29b-41d4-a716-446655440000
- wallet_id: (returned from create response)
- chain: ethereum

Collections:
1. POST /wallet/create
2. GET /wallets/user/{{user_id}}
3. GET /wallet/{{wallet_id}}/balance
4. DELETE /wallet/{{wallet_id}}
```

## 🧪 Testing Commands

```bash
# Run all tests
cargo test --package wallet-service

# Run with output
cargo test --package wallet-service -- --nocapture

# Test specific function
cargo test --package wallet-service create_wallet --

# Test with logging
RUST_LOG=debug cargo test --package wallet-service -- --nocapture

# Run integration tests
cargo test --package wallet-service --test '*'
```

## 📊 Database Queries Cheat Sheet

```sql
-- List all wallets for a user
SELECT * FROM wallets WHERE user_id = 'user-uuid' ORDER BY created_at DESC;

-- List wallets by type
SELECT * FROM wallets WHERE wallet_type = 'OWNED';

-- Find wallet by address
SELECT * FROM wallets WHERE address = '0x742d35Cc6634C0532925a3b844Bc493d38f01e57';

-- Check encrypted keys exist
SELECT id, wallet_name, encrypted_key_data IS NOT NULL as has_key 
FROM wallets WHERE wallet_type = 'OWNED';

-- Primary wallets only
SELECT * FROM wallets WHERE is_primary = true ORDER BY user_id;

-- Wallets by chain
SELECT DISTINCT chain FROM wallets ORDER BY chain;

-- Count wallets per user
SELECT user_id, COUNT(*) as wallet_count 
FROM wallets GROUP BY user_id ORDER BY wallet_count DESC;
```

## 🚨 Common Issues & Solutions

### Issue: `Invalid encryption key length`
```
Solution: ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)
  openssl rand -hex 32
```

### Issue: `Database connection refused`
```
Solution: Check DATABASE_URL and PostgreSQL is running
  psql -U postgres -d orya_wallet -c "SELECT NOW();"
```

### Issue: `Privy/Tatum API errors`
```
Solution: Verify API keys are correct and services are accessible
  curl https://api.privy.io/health (adjust URL)
```

### Issue: `Memory allocation error during build`
```
Solution: Reduce parallel compilation:
  cargo build -j 2 --package wallet-service
```

### Issue: `Recovery phrase is null`
```
Solution: Recovery phrase only returned for OWNED wallet type
  Check wallet_type in create request is "OWNED"
```

## 📈 Monitoring

### Logs
```bash
# View logs with timestamps
RUST_LOG=debug cargo run --package wallet-service

# Filter by module
RUST_LOG=wallet_service=debug,axum=warn cargo run --package wallet-service

# Save to file
RUST_LOG=info cargo run --package wallet-service > wallet-service.log 2>&1
```

### Health Check
```bash
curl -i http://localhost:3003/health
# Returns 200 OK if healthy
```

### Metrics
```bash
curl http://localhost:3003/metrics
# Prometheus format metrics
```

## 🔐 Security Checklist

Before production:
- [ ] ENCRYPTION_KEY is 64 hex characters
- [ ] ENCRYPTION_KEY is stored securely (not in .env on server)
- [ ] API keys are valid and have appropriate permissions
- [ ] DATABASE_URL is secure and read-only for application
- [ ] SSL/TLS is enabled for all connections
- [ ] CORS is restricted to known origins
- [ ] Rate limiting is configured
- [ ] Audit logging is enabled
- [ ] Backups are automated
- [ ] Monitoring alerts are configured

## 📚 Additional Resources

- Full Setup Guide: [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- Task Completion: [../../TASK_2_3_WALLET_SERVICE_COMPLETE.md](../../TASK_2_3_WALLET_SERVICE_COMPLETE.md)
- API Documentation: Check main.rs for route definitions
- Code Comments: See src/ files for implementation details

## ⚡ Performance Tips

1. **Connection pooling**: Adjust DB_POOL_MIN and DB_POOL_MAX
2. **Caching**: Consider Redis for frequently accessed wallets
3. **Batch operations**: Use `/wallets/user/:user_id` for multiple wallets
4. **Compression**: Enable gzip for responses in production

## 📝 Development Workflow

```bash
# 1. Make code changes
vim src/handlers/wallet.rs

# 2. Check compilation
cargo check --package wallet-service

# 3. Run tests
cargo test --package wallet-service

# 4. Format code
cargo fmt --package wallet-service

# 5. Lint code
cargo clippy --package wallet-service

# 6. Build
cargo build --package wallet-service

# 7. Run
cargo run --package wallet-service
```

## 🔗 Integration Points

### Called by: API Gateway (port 3000)
```
Routes /api/wallets/* → localhost:3003/*
```

### Calls: Databases
```
PostgreSQL: localhost:5432/orya_wallet
```

### Calls: External APIs
```
Privy: https://api.privy.io
Tatum: https://api.tatum.io/v3
```

### Called by: Transaction Service (Task 2.4)
```
Uses wallet addresses for transaction history
```

### Called by: Portfolio Service (Task 2.6)
```
Uses wallet balances for aggregation
```

## 📞 Quick Debugging

```bash
# Check if service is running
curl http://localhost:3003/health

# Check database connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM wallets;"

# Check recent logs
journalctl -u wallet-service -n 50

# Monitor in real-time
RUST_LOG=debug cargo run --package wallet-service 2>&1 | grep -i "wallet\|error"

# Test Privy connection
curl -H "Authorization: Bearer $PRIVY_API_KEY" https://api.privy.io/api/v1/health

# Test Tatum connection
curl -H "x-api-key: $TATUM_API_KEY" https://api.tatum.io/v3/health
```

---

**Version**: 1.0  
**Last Updated**: 2025-01-20  
**For More Info**: See SETUP_GUIDE.md