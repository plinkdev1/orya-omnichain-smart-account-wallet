---
description: Repository Information Overview
alwaysApply: true
---

# Repository Information Overview

## Repository Summary

**ORŸA** is a comprehensive, modular crypto wallet and DeFi super-app built as a full-stack application featuring React Native mobile (iOS/Android), Rust microservices backend, and multi-blockchain support (SUI-first, with Ethereum, Solana, BTCfi). The application includes 13+ main menu interfaces, 14 Atrium Portal sub-pages, 7 core microservices, 5 blockchain adapters, and complete KYC integration with production-grade infrastructure (Kubernetes, PostgreSQL, Redis, monitoring).

## Repository Structure

```
orya-wallet-repo/
├── apps/                      # User-facing applications
│   ├── mobile/               # React Native Expo app (iOS/Android)
│   ├── web/                  # Next.js web dashboard
│   └── admin/                # Admin interface
├── packages/                 # Shared libraries (12+ packages)
│   ├── wallet-core/          # Core wallet SDK
│   ├── wallet-sdk/           # Wallet SDK wrapper
│   ├── shared-types/         # TypeScript type definitions
│   ├── shared-ui/            # Shared UI components
│   ├── shared-utils/         # Utility functions
│   └── ...                   # Additional packages
├── services/                 # Rust microservices (13 services)
│   ├── api-gateway/          # GraphQL API Gateway
│   ├── user-service/         # Authentication & KYC
│   ├── transaction-service/  # Transaction history
│   ├── portfolio-service/    # Portfolio aggregation
│   └── ...                   # 9+ additional services
├── adapters/                 # Blockchain integrations
│   ├── blockchain-sui/       # SUI blockchain
│   ├── blockchain-evm/       # EVM/Ethereum
│   ├── blockchain-solana/    # Solana
│   └── ...                   # Additional adapters
├── infrastructure/           # Deployment & IaC
│   ├── docker-compose.yml    # Local development
│   ├── kubernetes/           # K8s manifests
│   └── terraform/            # Infrastructure as Code
└── .github/workflows/        # CI/CD pipelines
```

## Main Components

- **Mobile App**: React Native with Expo, comprehensive wallet UI for SUI/EVM/Solana chains
- **Web App**: Next.js with TailwindCSS, admin and user dashboards
- **API Gateway**: Axum-based GraphQL server routing all backend services
- **Microservices**: Rust services for user management, transactions, portfolio, DeFi, fraud detection, notifications
- **Blockchain Adapters**: Integration layers for multiple blockchain networks
- **Shared Libraries**: Core SDK, utilities, design systems, TypeScript types

## Projects

### Mobile Application (React Native)
**Location**: `apps/mobile`  
**Type**: React Native mobile app

#### Language & Runtime
**Language**: TypeScript  
**Version**: Node.js 18+  
**Framework**: React Native + Expo 51+  

#### Key Dependencies
Expo (Router, Camera, Auth), NativeWind, Reanimated, React Navigation, ethers.js, Solana SDK, SUI SDK, WalletConnect, Privy, Firebase, Zustand, Apollo Client

#### Build & Installation
```bash
cd apps/mobile
pnpm install
pnpm dev          # Start Expo dev server
pnpm ios          # iOS simulator
pnpm android      # Android emulator
```

#### Testing
**Framework**: Jest  
**Location**: `src/__tests__`  
**Run Command**: `pnpm test`

### Web Application (Next.js)
**Location**: `apps/web`  
**Type**: Next.js web application

#### Language & Runtime
**Language**: TypeScript  
**Version**: Node.js 18+  
**Framework**: Next.js 14+ with React

#### Key Dependencies
Radix UI, Shadcn/ui, TailwindCSS, React Hook Form, ethers.js, Recharts, Apollo Client, Zustand

#### Build & Installation
```bash
cd apps/web
pnpm install
pnpm dev          # Development (port 3000)
pnpm build && pnpm start  # Production
```

#### Testing
**Framework**: Jest + Testing Library  
**Run Command**: `pnpm test`

### Backend Microservices (Rust)
**Location**: `services/`  
**Type**: Rust async services

#### Language & Runtime
**Language**: Rust  
**Version**: 1.75+, 2021 edition  
**Build System**: Cargo  

#### Core Services (13 total)
**Core**: api-gateway, user-service, transaction-service, portfolio-service, defi-service, fraud-engine, notification-service, wallet-service  
**Financial**: ledger-service, fx-routing-engine, fiat-bridge-service  
**Advanced**: sui-mpc-aa-service, staking-service, analytics-service, security-service, crosschain-service, oracles-service, plugin-service, concierge-service

#### Key Dependencies
- **Framework**: Axum 0.7, Tokio 1.35 (async runtime)
- **GraphQL**: async-graphql 5.0
- **Database**: SQLx 0.7 (PostgreSQL), migrations
- **Cache**: Redis 0.25
- **RPC**: Tonic 0.10, gRPC
- **Serialization**: Serde, Serde JSON

#### Build & Installation
```bash
cd services
cargo build --workspace        # Build all
cargo build -p api-gateway    # Specific service
cargo test --workspace         # Run tests
```

#### Testing
**Framework**: Cargo test with PostgreSQL  
**Run Command**: `cargo test --workspace`

### Shared Libraries
**Location**: `packages/`

**wallet-core**: Core SDK with domain models, services, hooks, store (exports multiple entry points via ESM)

**shared-utils**: Utility functions (address, amount, crypto, validation)

**shared-types**: Centralized TypeScript types

**shared-ui**: Reusable UI components

**Additional**: design-system, design-tokens, design-system-native, wallet-sdk, zkSync-aa-sdk, sui-subgraph, human-network-sdk

## Docker & Infrastructure

### Docker Compose (Local Development)
**Location**: `infrastructure/docker-compose.yml`

**Services**: PostgreSQL 15, Redis 7, pgAdmin, Redis Commander, NATS, Prometheus, Grafana, Jaeger, Elasticsearch, Kibana

**Quick Start**:
```bash
cd infrastructure
docker compose up -d
docker compose ps    # Verify services
```

### Kubernetes
**Location**: `infrastructure/kubernetes/`  
**Manifests**: Deployments for PostgreSQL, Redis, API Gateway, services

### Terraform
**Location**: `infrastructure/terraform/`  
**Providers**: AWS EKS, GCP, Azure

## Root Monorepo Commands

```bash
pnpm install                # Install all dependencies
pnpm dev                    # Start all dev servers
pnpm build                  # Build all packages
pnpm test                   # Run all tests
pnpm lint                   # Lint all projects
```

## Version Requirements

- **Node.js**: 18+
- **Rust**: 1.75+
- **TypeScript**: 5.x
- **pnpm**: 8+
- **Docker**: Latest
- **PostgreSQL**: 15
- **Redis**: 7

## CI/CD Pipelines

**GitHub Actions Workflows**:
- `node-ci.yml`: TypeScript projects (lint, build, test)
- `rust-ci.yml`: Rust services (build, clippy, test with PostgreSQL service)
