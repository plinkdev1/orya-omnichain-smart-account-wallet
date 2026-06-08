# ORYA WALLET - DATABASE MIGRATIONS SETUP GUIDE

## Overview

This guide provides instructions for setting up and running the database migrations for ORYA Wallet backend services.

---

## Prerequisites

### Required Software

1. **PostgreSQL Client** (`psql` command-line tool)
   - **Windows:** Download from https://www.postgresql.org/download/windows/
   - **macOS:** Install via Homebrew: `brew install postgresql`
   - **Linux:** `sudo apt-get install postgresql-client`

2. **Database Connection**
   - Local PostgreSQL instance (port 5432) OR
   - Neon PostgreSQL managed service account

3. **Environment Configuration**
   - `.env` file in repository root with `DATABASE_URL` variable

### Verify Prerequisites

```bash
# Check psql installation
psql --version

# Verify PostgreSQL connectivity
psql postgresql://username:password@localhost:5432/database_name -c "SELECT 1"
```

---

## Environment Setup

### 1. Configure Database Connection

Edit `.env` file in the repository root:

```env
# Development (Local PostgreSQL)
DATABASE_URL=postgresql://orya_user:dev_password_123@localhost:5432/orya_dev

# OR Production (Neon)
NEON_URL=postgresql://user:password@ep-xxxxx.neon.tech/orya_production
```

### 2. Create Local Database (if needed)

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE orya_dev;

# Create user
CREATE USER orya_user WITH PASSWORD 'dev_password_123';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE orya_dev TO orya_user;

# Exit
\q
```

---

## Running Migrations

### Option 1: PowerShell (Windows)

```powershell
# Navigate to services directory
cd services

# Run migrations
.\run-migrations.ps1

# For production environment
.\run-migrations.ps1 -Environment production

# With custom database URL
.\run-migrations.ps1 -DatabaseUrl "postgresql://user:pass@host/db"
```

### Option 2: Bash (macOS/Linux)

```bash
# Navigate to services directory
cd services

# Make script executable
chmod +x run-migrations.sh

# Run migrations
./run-migrations.sh

# For production environment
./run-migrations.sh production
```

### Option 3: Manual psql Execution

```bash
# Execute single migration
psql $DATABASE_URL -f migrations/001_init_schema.sql

# Execute all migrations
for file in migrations/*.sql; do
    psql $DATABASE_URL -f "$file"
done
```

---

## Migration Files

### Current Migrations

Located in: `services/migrations/`

| File | Purpose | Tables Created |
|------|---------|-----------------|
| `001_init_schema.sql` | Foundation schema | users, wallets, transactions, sessions, portfolios, tokens, kyc_verifications, etc. |

### Migration Structure

Each migration file:
- ✅ Idempotent (uses `IF NOT EXISTS`)
- ✅ Includes indexes for performance
- ✅ Implements Row-Level Security (RLS)
- ✅ Sets up automatic `updated_at` triggers
- ✅ Includes seed data (tokens)

---

## Verification

### Check Migration Success

```bash
# Connect to database
psql $DATABASE_URL

# List all tables
\dt

# Check users table
SELECT * FROM users;

# Check wallets table
SELECT * FROM wallets;

# Check transactions table
SELECT * FROM transactions;

# View table structure
\d users
\d wallets
\d transactions
```

### Automated Verification

The migration runner automatically runs verification queries:

```
-- Users table
SELECT COUNT(*) as users_count FROM users;

-- Wallets table
SELECT COUNT(*) as wallets_count FROM wallets;

-- Transactions table
SELECT COUNT(*) as transactions_count FROM transactions;

-- Tokens table
SELECT COUNT(*) as tokens_count FROM tokens;
```

---

## Schema Overview

### Core Tables

#### users
- Stores user account information
- Links to Privy MPC wallet system
- Tracks KYC verification status
- **Key fields:** `id`, `privy_user_id`, `email`, `kyc_status`, `kyc_verified_at`

#### wallets
- Stores user cryptocurrency wallets
- Supports multiple chains (SUI, Ethereum, Solana, BTC, Aptos)
- Tracks wallet type and custody model
- **Key fields:** `id`, `user_id`, `public_address`, `chain`, `wallet_type`, `custody_type`

#### transactions
- Stores transaction history
- Tracks status (pending/confirmed/failed/cancelled)
- Stores transaction data and fees
- **Key fields:** `id`, `wallet_id`, `tx_hash`, `status`, `tx_type`, `amount_in_usd`

#### sessions
- Stores user session tokens
- Manages device tracking
- Handles token expiration
- **Key fields:** `id`, `user_id`, `refresh_token_hash`, `expires_at`

#### portfolios
- Aggregates user portfolio value
- Tracks 24h changes and P&L
- Stores asset allocation
- **Key fields:** `id`, `user_id`, `total_balance_usd`, `total_pnl_usd`

#### tokens
- Master list of supported tokens
- Stores price data and market information
- **Key fields:** `symbol`, `chain`, `contract_address`, `price_usd`

#### kyc_verifications
- Tracks KYC verification attempts
- Links to KYC provider
- Stores verification documents
- **Key fields:** `user_id`, `provider`, `status`, `verified_at`

---

## Security Features

### Row-Level Security (RLS)

All user-related tables have RLS enabled:

```sql
-- Example RLS policy
CREATE POLICY users_rls_policy ON users
    USING (privy_user_id = current_setting('app.current_user_id', true));
```

### Automatic Timestamps

All tables include automatic `updated_at` updates via triggers:

```sql
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Data Integrity

- Foreign key constraints with CASCADE delete
- Unique constraints on sensitive fields
- CHECK constraints for enum-like columns
- Soft deletes support (deleted_at fields)

---

## Troubleshooting

### Issue: psql command not found

**Solution:**
- Install PostgreSQL client tools
- Add PostgreSQL bin directory to system PATH
- Verify: `psql --version`

### Issue: Connection refused

**Solution:**
- Verify PostgreSQL is running: `psql --version`
- Check DATABASE_URL in .env file
- Ensure database server is accessible
- Test connection: `psql $DATABASE_URL -c "SELECT 1"`

### Issue: Permission denied on database

**Solution:**
```bash
# Verify user has correct privileges
psql -U postgres -d orya_dev -c "GRANT ALL PRIVILEGES ON DATABASE orya_dev TO orya_user;"

# Reconnect with correct user
psql postgresql://orya_user:password@localhost:5432/orya_dev
```

### Issue: Migration fails with "permission denied"

**Solution:**
- Ensure user has CREATE TABLE privileges
- For Neon: Use the connection string provided in dashboard
- For local: Grant full privileges to user

### Issue: Tables already exist

**Solution:**
- Migrations use `IF NOT EXISTS` - safe to re-run
- No data loss on re-execution
- Idempotent design ensures predictable behavior

---

## Next Steps

After migrations complete:

1. ✅ Verify schema created successfully
2. ✅ Start backend services
3. ✅ Initialize API Gateway with GraphQL schema
4. ✅ Configure RLS policies per service
5. ✅ Set up automated backups (production)

---

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Neon Documentation](https://neon.tech/docs)
- [ORYA Architecture Guide](../../.zencoder/ARCHITECTURE_STRATEGY_v1.md)
- [Backend Services README](./README.md)

---

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review migration files in `services/migrations/`
3. Contact development team with logs from migration runner