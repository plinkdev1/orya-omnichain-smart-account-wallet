<div align="center">

# ORYA

**An omnichain smart-account wallet - account abstraction, gasless, recoverable**

[![ERC-4337](https://img.shields.io/badge/ERC--4337-627EEA)]()
[![Next.js](https://img.shields.io/badge/Next.js-000?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Status](https://img.shields.io/badge/status-MVP-orange)]()

*A smart-account wallet built on account abstraction: one account, many chains, no seed-phrase friction.*

</div>

> **Related:** UI prototype -> [orya-wallet-ui-prototype](https://github.com/plinkdev1/orya-wallet-ui-prototype)

---

## What Is This?

ORYA is an omnichain smart-account wallet built on ERC-4337 account abstraction. Instead of a single externally-owned account, users get a programmable smart account that can batch transactions, pay gas flexibly, and recover socially - across multiple chains from one interface.

---

## Features

| Feature | Description | Status |
|---|---|:---:|
| Wallet dashboard | Unified balances and activity | ✅ |
| Smart accounts | ERC-4337 account abstraction | 🚧 |
| Omnichain view | Assets across multiple chains | 🚧 |
| Gasless / sponsored tx | Paymaster-backed transactions | 🚧 |
| Batched transactions | Multiple actions in one signature | 🚧 |
| Social recovery | Recover access without a seed phrase | Roadmap |

---

## How It Works

```
User ──▶ ORYA smart account (ERC-4337)
              │
     bundler · paymaster (gasless)
              │
     ┌────────┼────────┐
     ▼        ▼        ▼
  chain A  chain B  chain C   (omnichain)
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js, React, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Web3 | viem / wagmi, ERC-4337 (bundler + paymaster) |
| Omnichain | Cross-chain messaging |

---

## Project Structure

```
orya-omnichain-smart-account-wallet/
.github/
   instructions/
   workflows/
.vscode/
   settings.json
.zencoder/
   rules/
   templates/
adapters/
   algorand-adapter/
   aptos-adapter/
   arbitrum-adapter/
   avax-adapter/
   base-adapter/
   bitcoin-adapter/
apollo-router/
   scripts/
   src/
   .env.example
   .gitignore
   COMPLETION_SUMMARY.md
   docker-compose.yml
apps/
   admin/
   mobile/
   web/
   README.md
docs/
   security/
infrastructure/
   kubernetes/
   migrations/
   docker-compose.dev.yml
   docker-compose.yml
   postgres-init.sql
   prometheus.yml
packages/
   aa-provider-alchemy/
   aa-provider-biconomy/
   aa-provider-openzeppelin/
   copy-framework/
   database/
   design-system/
scripts/
   generate-encryption-key.js
   health-check.bat
   health-check.ps1
   health-check.sh
   start-all-services.bat
   start-all-services.ps1
services/
   analytics-service/
   api-gateway/
   chainbase-service/
   concierge-service/
   crosschain-service/
   defi-service/
tests/
   integration/
   adapters-integration.test.ts
   authgate-verification.test.ts
   firebase-verification.test.ts
   routing-verification.test.ts
   store-verification.test.ts
tools/
   cli/
   convert-svg-to-png.mjs
   create-png-fallbacks.js
   fetch-icons-enhanced.mjs
   fetch-icons-pure.js
   fetch-icons-standalone.mjs
.env.example
.gitignore
build.bat
docker-compose.yml
Makefile
pnpm-lock.yaml
pnpm-workspace.yaml
README.md
```

---

## Screenshots

_Screenshots coming soon._

---

## Getting Started

```bash
npm install --legacy-peer-deps --ignore-scripts
npx next dev
```

---

## Notes

Shared as a portfolio artifact demonstrating product and system design. Early prototype, not a finished product. The UI prototype lives in [orya-wallet-ui-prototype](https://github.com/plinkdev1/orya-wallet-ui-prototype).

<div align="center">

MIT

</div>
