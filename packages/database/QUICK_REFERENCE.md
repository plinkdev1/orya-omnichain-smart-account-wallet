# Database Package - Quick Reference

## 🎯 Most Important Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema (21 entities, 14 indexes) |
| `src/client.ts` | Prisma Client singleton |
| `src/seed.ts` | Test data seed script |
| `.env.example` | Environment variables template |
| `package.json` | npm scripts & dependencies |

---

## ⚡ Essential Commands

```bash
# Setup
pnpm install
pnpm db:migrate:dev --name init
pnpm build && pnpm db:seed

# Development
pnpm dev                    # Watch TypeScript
pnpm db:studio              # Visual editor

# Maintenance
pnpm db:push                # Sync schema (dev)
pnpm db:migrate:deploy      # Deploy migrations
pnpm db:reset               # Reset database
```

---

## 📊 Entity Shortcuts

### Core Tables
| Entity | Indexes | Purpose |
|--------|---------|---------|
| users | 3 (email, privy_id, firebase_uid) | User accounts |
| wallets | 2 (user_id, address_chain) | Multi-chain wallets |
| balances | 2 (wallet_id, token) | Token holdings |
| transactions | 6 (wallet, user, time, status, hash, protocol) | Transaction history |
| protocol_preferences | 2 (user, user_chain_feature) | User protocol selection |

### DeFi Tables
| Entity | Purpose |
|--------|---------|
| staking_positions | Staking with APY |
| lending_positions | Collateral & borrows |
| nfts | NFT holdings |
| fiat_transactions | On/off ramp |

### Registry Tables
| Entity | Purpose |
|--------|---------|
| protocols | All supported protocols |
| protocol_metadata | TVL, volume, APY, security |

---

## 🔍 Query Examples

### Get User with All Data
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    preferences: true,
    protocolPreferences: true,
    wallets: { include: { balances: true } },
    transactions: true,
    stakingPositions: true,
    lendingPositions: true
  }
});
```

### Get Protocol Preference
```typescript
const pref = await prisma.protocolPreference.findFirst({
  where: {
    userId,
    chainId: "sui",
    feature: "swap"
  }
});
```

### Get Recent Transactions
```typescript
const txs = await prisma.transaction.findMany({
  where: { walletId },
  orderBy: { createdAt: 'desc' },
  take: 20
});
```

### Get Wallet with Balances
```typescript
const wallet = await prisma.wallet.findUnique({
  where: { id: walletId },
  include: { balances: true }
});
```

---

## 🔐 Security Fields

| Entity | Security Field |
|--------|-----------------|
| User | kycStatus, kycProvider |
| Wallet | encryptedPrivateKey |
| UserPreferences | AutoSigningConfig |
| Protocol | isAudited, auditors, tier |
| AuditLog | All user actions |

---

## 📝 Entity Relationships

```
User (1)
├── UserPreferences (1:1)
├── ProtocolPreference (1:many)
├── Wallet (1:many)
│   ├── Balance (1:many)
│   └── Transaction (1:many)
├── Transaction (1:many)
├── StakingPosition (1:many)
└── LendingPosition (1:many)

Protocol (1)
└── ProtocolMetadata (1:1)
```

---

## 🚀 Deployment

### Development
```bash
pnpm db:push           # Sync schema directly
pnpm db:studio         # Check data visually
```

### Production
```bash
pnpm db:migrate:deploy # Deploy migrations safely
```

---

## 🆘 Quick Fixes

### Docker Won't Start
```bash
docker-compose down
docker-compose up -d
```

### Connection Failed
```bash
psql postgresql://orya_user:dev_password_123@localhost:5432/orya_dev
```

### Reset Database
```bash
pnpm db:reset
```

---

## 📞 Support Files

- **README.md** - Full documentation
- **SCHEMA_VALIDATION.md** - Validation report
- **package.json** - Scripts available

**All scripts are in `packages/database/package.json`**
