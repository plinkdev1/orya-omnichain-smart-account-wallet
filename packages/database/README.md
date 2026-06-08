# @orya/database

Complete database layer for Orÿa Wallet using Prisma ORM with PostgreSQL.

## 📋 Schema

### Core Entities

- **User**: User account with KYC status, advanced mode, preferences
- **UserPreferences**: User settings, auto-signing config, protocol preferences
- **ProtocolPreference**: User's chosen protocols per chain/feature with fallbacks
- **Wallet**: Multi-chain wallets (CUSTODIAL, SELF_CUSTODY, EXTERNAL, MPC)
- **Balance**: Token balances with USD values
- **NFT**: NFT holdings with metadata

### Transaction Entities

- **Transaction**: All transaction types (SEND, SWAP, STAKE, BRIDGE, etc.)
- **TransactionIntent**: Intent-based transaction routing info

### Protocol Entities

- **Protocol**: Registered protocols with audit status, tier, version
- **ProtocolMetadata**: Protocol details (TVL, volume, fees, security rating)

### DeFi Entities

- **StakingPosition**: Active staking with APY and rewards
- **LendingPosition**: Collateral and borrow positions

### Other Entities

- **FiatTransaction**: On/off ramp transactions
- **Notification**: User notifications
- **AuditLog**: Action audit trail

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL 14+ (local or Neon)
- Docker (optional)

### Installation

```bash
cd packages/database
pnpm install
```

### Setup Local Database (Docker)

```bash
# From project root
docker-compose up -d

# Verify containers
docker-compose ps
```

### Environment Setup

```bash
# Copy example env
cp .env.example .env

# Edit .env with your database URL if not using Docker
DATABASE_URL=postgresql://orya_user:dev_password_123@localhost:5432/orya_dev
```

### Database Migration

```bash
# Create initial migration from schema
pnpm db:migrate:dev --name init

# Deploy migrations to database
pnpm db:migrate:deploy

# Push schema directly (development only)
pnpm db:push
```

### Seed Database

```bash
# Compile TypeScript
pnpm build

# Run seed script
pnpm db:seed
```

### Prisma Studio (Visual Editor)

```bash
pnpm db:studio
```

Opens http://localhost:5555 in your browser.

## 📊 Performance Indexes

All performance-critical indexes are included:

```sql
-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_privy_id ON users(privy_id);
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);

-- Wallet indexes
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_wallets_address_chain ON wallets(address, chain_type);

-- Transaction indexes (most frequent queries)
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_hash ON transactions(hash);
CREATE INDEX idx_transactions_chain_protocol ON transactions(chain_id, protocol);

-- Protocol preference indexes
CREATE INDEX idx_protocol_prefs_user ON protocol_preferences(user_id);
CREATE INDEX idx_protocol_prefs_user_chain_feature 
  ON protocol_preferences(user_id, chain_id, feature);

-- Balance indexes
CREATE INDEX idx_balances_wallet ON balances(wallet_id);
CREATE INDEX idx_balances_wallet_token ON balances(wallet_id, token_address);
```

## 🔧 Available Commands

```bash
# Development
pnpm dev              # Watch TypeScript compilation

# Database
pnpm db:push          # Sync schema to database (dev only)
pnpm db:migrate:dev   # Create and run migration
pnpm db:migrate       # List migrations
pnpm db:migrate:deploy # Deploy to production
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Seed with test data
pnpm db:reset         # Reset database (warning: destructive)

# Build
pnpm build            # Compile TypeScript
```

## 📚 Usage

### Import Prisma Client

```typescript
import { prisma } from "@orya/database";

// Query users
const user = await prisma.user.findUnique({
  where: { email: "user@orya.io" },
  include: {
    preferences: true,
    wallets: true,
    transactions: true,
  },
});

// Create wallet
const wallet = await prisma.wallet.create({
  data: {
    userId: user.id,
    type: "MPC",
    chainType: "sui",
    address: "0x...",
  },
});
```

### Migration Workflow

1. Update `prisma/schema.prisma`
2. Run `pnpm db:migrate:dev --name feature_name`
3. Review generated SQL
4. Commit migration files
5. Deploy with `pnpm db:migrate:deploy`

## 🔐 Security

- ✅ Passwords hashed before storage
- ✅ Private keys encrypted
- ✅ Sensitive data in environment variables
- ✅ Audit logs for all user actions
- ✅ Row-level security ready (can be added)

## 📖 Entity Relationships

```
User (1)
├── UserPreferences (1)
│   └── ProtocolPreference (many)
│   └── AutoSigningConfig (1)
├── ProtocolPreference (many)
├── Wallet (many)
│   ├── Balance (many)
│   ├── NFT (many)
│   └── Transaction (many)
├── Transaction (many)
│   └── TransactionIntent (1)
├── StakingPosition (many)
├── LendingPosition (many)
├── FiatTransaction (many)
├── Notification (many)
└── AuditLog (many)

Protocol (1)
└── ProtocolMetadata (1)
```

## 🐛 Troubleshooting

### Connection Issues

```bash
# Check database is running
docker-compose logs postgres

# Verify connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

### Migration Stuck

```bash
# Resolve migration history
pnpm db:migrate:resolve --rolled-back <migration_name>

# Or reset (destructive)
pnpm db:reset
```

### Prisma Client Issues

```bash
# Regenerate Prisma Client
pnpm prisma:generate

# Clear cache
rm -rf node_modules/.prisma
pnpm install
```

## 📝 Documentation

- [Prisma Docs](https://www.prisma.io/docs)
- [Schema Reference](https://www.prisma.io/docs/reference/prisma-schema-reference)
- [Migration Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)

## 📄 License

MIT - Part of Orÿa Wallet Project
