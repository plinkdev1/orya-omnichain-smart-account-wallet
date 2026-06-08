# ORYA Wallet — Omnichain Smart-Account Wallet Platform

![pnpm](https://img.shields.io/badge/pnpm-monorepo-F69220) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6) ![Sui](https://img.shields.io/badge/Sui-MPC-6FBCF0) ![EVM](https://img.shields.io/badge/EVM-AA-627EEA) ![Solana](https://img.shields.io/badge/Solana-✓-14F195) ![Bitcoin](https://img.shields.io/badge/Bitcoin-BTCfi-F7931A)

> An omnichain, smart-account wallet platform spanning EVM, Sui, Solana, and Bitcoin — built as a pnpm monorepo with a microservices backend, account abstraction across multiple providers, on-chain MPC (IKA 2PC-MPC on Sui), DEX/bridge/fiat routing, and zero-knowledge KYC.

**Status:** Prototype / in active development — the architecture and codebase of a large multi-app, multi-service system.

## Architecture at a Glance

A pnpm workspace in three tiers:

**Apps** (`apps/`) — `web` (browser wallet), `mobile` (React Native), `admin` (ops dashboard).

**Packages** (`packages/`):
- **Account abstraction:** `aa-provider-alchemy`, `aa-provider-biconomy`, `aa-provider-openzeppelin`, `zkSync-aa-contracts`, `zkSync-aa-sdk`
- **Core:** `wallet-core`, `wallet-sdk`, `protocol-core`, `protocol-adapters`
- **Cross-platform design system:** `design-tokens` → `design-system`, `design-system-web`, `design-system-native`
- **Data & shared:** `database`, `shared-types`, `shared-ui`, `shared-utils`, `sui-subgraph`, `human-network-sdk`, `copy-framework`

**Services** (`services/`) — 30+ microservices behind an API gateway (NATS):
- Core: `api-gateway`, `user-service`, `wallet-service`, `transaction-service`, `portfolio-service`, `ledger-service`
- DeFi & markets: `defi-service`, `staking-service`, `oracles-service`, `fx-routing-engine`, `eigenlayer-service`
- Cross-chain & BTCfi: `crosschain-service`, `btcfi-service`, `sui-mpc-aa-service`
- Payments & fiat: `fiat-bridge-service`, `payment-routing-service`, `payment-terminal-service`
- Trust & safety: `security-service`, `fraud-engine`
- Platform & indexing: `analytics-service`, `notification-service`, `concierge-service`, `plugin-service`, `provider-adapters`, `chainbase-service`, and `*-subgraph` indexers

## Engineering Highlights

- **On-chain MPC zero-trust** via IKA 2PC-MPC on Sui — signing through on-chain transactions, no custodial key store.
- **Account abstraction across four providers** (Alchemy, Biconomy, OpenZeppelin, zkSync) behind a unified adapter layer.
- **True omnichain** — EVM, Sui, Solana, Bitcoin/BTCfi (Thorchain, Bitlayer, Stacks); cross-chain via LayerZero, Hop, Axelar, Wormhole.
- **Microservices backend** — 30+ independently-scoped services behind an API gateway with NATS messaging.
- **Cross-platform design system** generated from shared tokens into web and native libraries.
- **Zero-knowledge KYC** — zkPass, zKYC, Gitcoin Passport / Human Network proof-of-humanity with configurable thresholds.
- **Fiat on/off-ramp + card issuance** — MoonPay, Stripe, Coinbase, Ramp, Banxa; Lithic / Marqeta cards.

## Tech Stack

| Area | Technology |
|---|---|
| Monorepo | pnpm workspaces (apps / packages / services) |
| Languages | TypeScript; React (web) + React Native (mobile) |
| Chains | Sui, EVM, Solana, Bitcoin / BTCfi |
| Smart accounts | Alchemy, Biconomy, OpenZeppelin, zkSync AA |
| MPC | IKA 2PC-MPC (Sui) |
| Backend | Node microservices, API gateway, NATS, Postgres/Neon, Redis |
| Indexing | The Graph / subgraphs |
| Identity | zkPass, zKYC, Gitcoin Passport, Human Network |

## Repository Layout
apps/        web · mobile · admin
packages/    wallet-core · wallet-sdk · protocol-core · protocol-adapters
aa-provider-{alchemy,biconomy,openzeppelin} · zkSync-aa-{contracts,sdk}
design-tokens · design-system{,-web,-native} · shared-{types,ui,utils}
database · sui-subgraph · human-network-sdk
services/    api-gateway · user · wallet · transaction · portfolio · ledger
defi · staking · oracles · fx-routing · eigenlayer · crosschain · btcfi
fiat-bridge · payment-routing · payment-terminal · security · fraud-engine
analytics · notification · concierge · plugin · *-subgraph

## Getting Started

Large pnpm workspace. Copy `.env.example` to `.env`, fill values, then install and run a target app:

```bash
pnpm install
pnpm --filter web dev
```

## Notes

Prototype demonstrating system and protocol architecture for an omnichain smart-account wallet. Not audited; experimental. Shared as a portfolio artifact.

## Related — The ORYA Wallet Product

**Two repositories, one product.** This repo is the **platform and architecture** (microservices, smart-account infrastructure, omnichain integrations). The runnable product interface lives in **[plinkdev1/orya-wallet-app](https://github.com/plinkdev1/orya-wallet-app)** (private until release) — a fully navigable front-end prototype you can clone and run on mock data.
