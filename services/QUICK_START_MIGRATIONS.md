# 🚀 QUICK START - Database Migrations

**TL;DR:** 3 commands to set up your database

---

## Prerequisites Check

```powershell
# Verify psql is installed
psql --version

# Should output something like: psql (PostgreSQL) 15.2
```

If not installed:
- **Windows:** https://www.postgresql.org/download/windows/
- **macOS:** `brew install postgresql`
- **Linux:** `sudo apt-get install postgresql-client`

---

## Setup (One-Time)

### 1. Configure Database Connection

Edit `.env` in project root:

**Option A: Local PostgreSQL**
```env
DATABASE_URL=postgresql://orya_user:dev_password_123@localhost:5432/orya_dev
```

**Option B: Neon (Cloud)**
```env
DATABASE_URL=postgresql://user:password@ep-xxxxx.neon.tech/orya_dev
```

### 2. Create Local Database (if using local PostgreSQL)

```bash
psql -U postgres

# In psql prompt:
CREATE DATABASE orya_dev;
CREATE USER orya_user WITH PASSWORD 'dev_password_123';
GRANT ALL PRIVILEGES ON DATABASE orya_dev TO orya_user;
\q
```

### 3. Run Migrations

**Windows (PowerShell):**
```powershell
cd services
.\run-migrations.ps1
```

**macOS/Linux:**
```bash
cd services
chmod +x run-migrations.sh
./run-migrations.sh
```

---

## Verify Success

```powershell
# Windows
.\verify-migrations.ps1

# macOS/Linux
psql $DATABASE_URL -c "\dt"
```

You should see 9 tables:
- ✅ users
- ✅ wallets
- ✅ transactions
- ✅ sessions
- ✅ portfolios
- ✅ tokens
- ✅ kyc_verifications
- ✅ ledger_entries
- ✅ portfolio_history

---

## Common Issues

| Issue | Solution |
|-------|----------|
| `psql: command not found` | Install PostgreSQL client tools |
| `connection refused` | Check DATABASE_URL, ensure PostgreSQL running |
| `permission denied` | User needs CREATE TABLE privilege |
| `database does not exist` | Run: `psql -U postgres -c "CREATE DATABASE orya_dev;"` |

---

## Next Steps

✅ Migrations complete!

Now:
1. Start backend services: `cd services && cargo build`
2. Run API gateway: `cargo run --bin api-gateway`
3. Test connections with GraphQL queries

---

## Detailed Help

- Full guide: `MIGRATION_SETUP_GUIDE.md`
- Implementation details: `MIGRATION_IMPLEMENTATION_SUMMARY.md`

---

**Status:** Ready for backend development! 🎉