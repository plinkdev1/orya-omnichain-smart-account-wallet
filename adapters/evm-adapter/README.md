# EVM Adapter

Type-safe TypeScript adapter for EVM-compatible blockchains. Provides unified interface for Ethereum, Polygon, Arbitrum, Base, and Optimism.

## Overview

- **Language:** TypeScript
- **Primary Libraries:** viem (primary), ethers.js (fallback)
- **Supported Chains:** Ethereum, Polygon, Arbitrum, Base, Optimism
- **Architecture:** Chain adapter pattern

## Features

✅ Multi-chain transaction execution  
✅ Type-safe EVM interactions (via viem)  
✅ DEX aggregation (0x Protocol, 1inch)  
✅ Smart contract interactions  
✅ Event listening & indexing  
✅ Account abstraction support (Reown)  

## Installation

```bash
pnpm install
```

## Quick Start

```typescript
import { EvmAdapter } from './src/EvmAdapter';

const adapter = new EvmAdapter({
  rpcUrl: process.env.ALCHEMY_ETH_RPC,
  chainId: 1
});

// Send transaction
const tx = await adapter.sendTransaction({
  to: recipient,
  value: amount,
  data: encodedCalldata
});
```

## Supported Chains

| Chain | Chain ID | Status |
|-------|----------|--------|
| Ethereum | 1 | ✅ |
| Polygon | 137 | ✅ |
| Arbitrum | 42161 | ✅ |
| Base | 8453 | ✅ |
| Optimism | 10 | ✅ |

## DEX Aggregators

| Aggregator | Status | Module |
|------------|--------|--------|
| 0x Protocol | ✅ | `dex/zerox.ts` |
| 1inch Fusion | ✅ | `dex/oneinch.ts` |
| Odos | 🟡 | `dex/odos.ts` |
| Uniswap | 🟡 | `dex/uniswap.ts` |

## Configuration

See `.env.example` for environment variables.

## Testing

```bash
pnpm test
pnpm test:watch
```

## Documentation

- [Viem Documentation](https://viem.sh)
- [Ethers.js Documentation](https://docs.ethers.org)
- [Adapter Architecture](../../docs/architecture/evm-adapter.md)