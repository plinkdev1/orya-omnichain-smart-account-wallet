# ORYA Wallet — Omnichain Smart-Account Wallet Platform

![pnpm](https://img.shields.io/badge/pnpm-monorepo-F69220) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6) ![Sui](https://img.shields.io/badge/Sui-MPC-6FBCF0) ![EVM](https://img.shields.io/badge/EVM-AA-627EEA) ![Solana](https://img.shields.io/badge/Solana-✓-14F195) ![Bitcoin](https://img.shields.io/badge/Bitcoin-BTCfi-F7931A) ![NATS](https://img.shields.io/badge/NATS-microservices-27AAE1)

> An omnichain, smart-account wallet platform spanning EVM, Sui, Solana, and Bitcoin — a pnpm monorepo with a 30+ service microservices backend, account abstraction across four providers, on-chain MPC (IKA 2PC-MPC on Sui), DeFi/bridge/fiat routing, and zero-knowledge KYC.

**Two repositories, one product.** This repo is the **platform and architecture**. The runnable product UI lives in **[plinkdev1/orya-wallet-app](https://github.com/plinkdev1/orya-wallet-app)** (private until release) — a navigable front-end prototype on mock data.

## System Overview

ORYA is one pnpm workspace in three layers:

1. **Apps** — the clients (web, mobile, admin).
2. **Packages** — shared SDKs the apps and services build on (wallet core, account-abstraction providers, protocol adapters, the cross-platform design system).
3. **Services** — 30+ independently-deployable microservices behind an API gateway, communicating over NATS, each owning a domain.

A typical request flows **client → API gateway → NATS → domain service(s) → chain adapters / subgraphs → response**. Signing for enhanced accounts is delegated to the MPC service, which coordinates 2PC-MPC on Sui rather than custodying keys.

## Apps (apps/)

| App | Description |
|---|---|
| web | Browser wallet (Next.js) |
| mobile | React Native mobile wallet |
| admin | Operations and support dashboard |

## Packages (packages/)

**Account abstraction** — a unified smart-account layer: aa-provider-alchemy, aa-provider-biconomy, aa-provider-openzeppelin, zkSync-aa-contracts, zkSync-aa-sdk.

**Wallet & protocol core** — wallet-core, wallet-sdk, protocol-core, protocol-adapters (chain-agnostic engine plus per-network adapters).

**Design system** — design-tokens feeding design-system, design-system-web, and design-system-native (one token source, web + native components).

**Shared & data** — database, shared-types, shared-utils, shared-ui, sui-subgraph, human-network-sdk, copy-framework.

## Services (services/)

**Core ledger & accounts** — api-gateway, user-service, wallet-service, transaction-service, portfolio-service, ledger-service.

**DeFi & markets** — defi-service, staking-service, oracles-service, fx-routing-engine, eigenlayer-service.

**Cross-chain & BTCfi** — crosschain-service, btcfi-service, sui-mpc-aa-service (MPC account abstraction on Sui).

**Payments & fiat** — fiat-bridge-service, payment-routing-service, payment-terminal-service.

**Trust & safety** — security-service, fraud-engine.

**Platform** — analytics-service, notification-service, concierge-service, plugin-service, provider-adapters, chainbase-service.

**Indexing subgraphs** — defi-subgraph, transaction-subgraph, user-subgraph, wallet-subgraph.

## Multichain & Integrations

| Domain | Integrations |
|---|---|
| Chains | EVM, Sui, Solana, Bitcoin / BTCfi |
| RPC | Alchemy, QuickNode, Infura |
| Account abstraction | Alchemy, Biconomy, OpenZeppelin, zkSync |
| MPC | IKA 2PC-MPC (Sui) |
| Bridges | LayerZero, Hop, Axelar, Wormhole |
| DeFi | Aave, Compound, Cetus, DeepBook, Aftermath, Raydium, Orca, Bluefin, Navi |
| Oracles | Chainlink, Pyth, RedStone |
| Fiat & cards | MoonPay, Stripe, Coinbase, Ramp, Banxa; Lithic, Marqeta |
| zkKYC | zkPass, zKYC, Gitcoin Passport, Human Network |
| Storage | Pinata/IPFS, Arweave, Cloudflare R2, AWS S3 |

## Engineering Highlights

- **On-chain MPC zero-trust** — enhanced accounts sign via IKA 2PC-MPC on Sui; the platform never custodies raw keys.
- **Provider-agnostic account abstraction** — four AA providers behind one adapter interface, so the wallet is never locked to a single vendor.
- **Domain-driven microservices** — 30+ services over NATS behind an API gateway, each independently scoped and deployable.
- **Adapter pattern throughout** — chains, bridges, oracles, fiat ramps, and AA providers are all pluggable behind common interfaces.
- **Cross-platform design system** — a single token source generates both web and native component libraries.
- **GraphQL indexing** — per-domain subgraphs for fast reads over on-chain data.
- **Zero-knowledge KYC** — proof-of-humanity and credential verification with configurable thresholds.

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces |
| Languages | TypeScript; React (web), React Native (mobile) |
| Messaging | NATS |
| Data | PostgreSQL / Neon, Redis |
| Indexing | The Graph / subgraphs |
| Smart accounts | Alchemy, Biconomy, OpenZeppelin, zkSync AA |
| MPC | IKA 2PC-MPC (Sui) |

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

```bash
pnpm install
pnpm --filter "./apps/web" dev
```

Copy `.env.example` to `.env` first — it documents every integration the platform can use.

## Status

Prototype / in active development. This repository represents the system and protocol architecture for an omnichain smart-account wallet; it is not audited and is experimental.

## Related

The runnable front-end prototype: **[plinkdev1/orya-wallet-app](https://github.com/plinkdev1/orya-wallet-app)** (private until release).
