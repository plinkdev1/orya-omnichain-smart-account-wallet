# [Adapter Name] Adapter

Type-safe [language] adapter for [blockchain] integration. Provides unified interface for [key features].

## Overview

- **Language:** [TypeScript/Rust]
- **Primary Libraries:** [key library names]
- **Supported Chains:** [chain names]
- **Architecture:** Chain adapter pattern

## Features

✅ [Feature 1]  
✅ [Feature 2]  
✅ [Feature 3]  
✅ [Feature 4]  

## Installation

### TypeScript

```bash
pnpm install
```

### Rust

```bash
cargo build
```

## Quick Start

### TypeScript

```typescript
import { AdapterName } from './src/index';

const adapter = new AdapterName({
  rpcUrl: process.env.RPC_URL,
  chainId: 1
});

// Get balance
const balance = await adapter.getBalance('0x...');

// Send transaction
const tx = await adapter.sendTransaction({
  to: recipient,
  value: amount,
  data: encodedCalldata
});
```

### Rust

```rust
use adapter_name::ChainClient;

let client = ChainClient::new(config)?;

// Get balance
let balance = client.get_balance("0x...").await?;

// Send transaction
let tx = client.send_transaction(&tx_request).await?;
```

## Configuration

See `.env.example` for environment variables:

```bash
RPC_URL=https://rpc.example.com
CHAIN_ID=1
API_KEY=your_api_key_here
```

## Supported Features

| Feature | Status | Module |
|---------|--------|--------|
| Balance queries | ✅ | `balance.ts`/`balance.rs` |
| Transaction sending | ✅ | `transaction.ts`/`transaction.rs` |
| Event listening | 🟡 | `events.ts`/`events.rs` |
| Smart contract calls | 🟡 | `contracts.ts`/`contracts.rs` |

## Testing

### TypeScript

```bash
pnpm test
pnpm test:watch
```

### Rust

```bash
cargo test
cargo test -- --nocapture
```

## Project Structure

```
[adapter-name]/
├── src/
│   ├── index.ts / lib.rs          # Entry point
│   ├── config.ts / config.rs      # Configuration
│   ├── client.ts / client.rs      # Main client
│   ├── error.ts / error.rs        # Error types
│   ├── types.ts / types.rs        # Type definitions
│   └── modules/
│       ├── balance.ts / balance.rs
│       ├── transaction.ts / transaction.rs
│       └── ...
├── tests/
│   ├── unit/
│   └── integration/
├── .env.example                    # Environment template
├── package.json / Cargo.toml       # Dependencies
├── tsconfig.json                   # TS config (TypeScript)
└── README.md                       # This file
```

## Error Handling

The adapter provides typed error handling:

### TypeScript

```typescript
try {
  await adapter.sendTransaction(tx);
} catch (error) {
  if (error instanceof AdapterError) {
    console.error(`Error [${error.code}]: ${error.message}`);
  }
}
```

### Rust

```rust
match client.send_transaction(&tx).await {
    Ok(response) => println!("Success: {:?}", response),
    Err(e) => eprintln!("Error: {:?}", e),
}
```

## Documentation

- [Main Adapters README](../../adapters/README.md)
- [ORŸA Architecture](../../docs/architecture/)
- [Implementation Checklist](../../.zencoder/IMPLEMENTATION_CHECKLIST.md)

## Contributing

1. Follow code style guidelines (prettier for TS, rustfmt for Rust)
2. Add tests for new functionality
3. Update README with new features
4. Test against testnet before production
5. Run linter before submitting PR

## Troubleshooting

### RPC Connection Failed

Check environment variables:
```bash
echo $RPC_URL
echo $CHAIN_ID
```

### Transaction Failed

1. Verify recipient address format
2. Check gas estimates
3. Ensure sufficient balance
4. Review transaction data

## Support

For issues:
1. Check this README
2. Review implementation checklist
3. Check adapter-specific tests
4. Create issue with full context
