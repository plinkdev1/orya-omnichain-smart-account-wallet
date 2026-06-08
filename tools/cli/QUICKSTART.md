# Quick Start Guide

## Installation

```bash
# From project root
cd tools/cli
pnpm install
pnpm build
```

## Usage

### From Project Root

```bash
# Interactive mode
pnpm cli

# List all chains
pnpm cli:list

# Generate adapter
pnpm cli:generate --chain aptos

# Direct usage
pnpm cli -- generate-adapter --chain ethereum
pnpm cli -- list-chains
pnpm cli -- --help
```

### From CLI Directory

```bash
cd tools/cli

# Interactive
pnpm dev

# Commands
pnpm dev -- generate-adapter --chain sui
pnpm dev -- list-chains
pnpm dev -- --help
```

## Examples

### Generate Aptos Adapter (Rust)

```bash
pnpm cli:generate --chain aptos
```

This creates: `adapters/aptos-adapter/` with complete Rust project structure including:
- Cargo.toml with dependencies
- Structured source code (lib.rs, client.rs, types.rs, etc.)
- Integration tests
- README with setup instructions

### Generate Ethereum Adapter (TypeScript)

```bash
pnpm cli:generate --chain ethereum
```

This creates: `adapters/ethereum-adapter/` with:
- package.json with dev tools (tsup, vitest)
- TypeScript configuration
- Source files (client, types, account, transaction)
- Unit tests
- README with usage examples

### List Available Chains

```bash
pnpm cli:list
```

Output:
```
📦 Available Blockchain Chains

🎯 Tier 1:
   🦀 SUI             (sui           ) - sui-adapter
   📘 Ethereum        (ethereum      ) - ethereum-adapter
   📘 Solana          (solana        ) - solana-adapter

🎯 Tier 2:
   🦀 Aptos           (aptos         ) - aptos-adapter
   🦀 Movement        (movement      ) - movement-adapter
   📘 Starknet        (starknet      ) - starknet-adapter
   📘 Near            (near          ) - near-adapter
   📘 Cosmos          (cosmos        ) - cosmos-adapter

...

Total: 15 chains
```

## Development

```bash
# Build
pnpm build

# Test
pnpm test

# Lint
pnpm lint

# Type check
pnpm type-check

# Watch mode
pnpm dev
```

## After Generating an Adapter

1. **Navigate to the adapter**
   ```bash
   cd adapters/<adapter-name>
   ```

2. **Install dependencies** (TypeScript only)
   ```bash
   pnpm install
   ```

3. **Review the generated structure**
   ```bash
   ls -la
   cat README.md
   ```

4. **Implement the adapter logic**
   - Replace stub implementations in generated files
   - Add protocol-specific integration code
   - Update error handling as needed

5. **Run tests**
   ```bash
   # Rust
   cargo test

   # TypeScript
   pnpm test
   ```

6. **Build and verify**
   ```bash
   # Rust
   cargo build --release

   # TypeScript
   pnpm build
   ```

## Configuration

### Adding a New Chain

Edit `config/chains.yaml`:

```yaml
chains:
  mychain:
    name: "My Chain"
    dirName: "mychain-adapter"
    language: "rust"  # or "typescript"
    tier: 2            # 1-4 (priority)
    mainDEX: "MyDEX"
    mainBridge: "MyBridge"
    rpcProvider: "MyRPC"
```

Then regenerate:
```bash
pnpm cli -- list-chains  # See new chain
pnpm cli -- generate-adapter --chain mychain
```

## Troubleshooting

### "Chain not found" error

```bash
# Check available chains
pnpm cli:list

# Use correct chain key
pnpm cli:generate --chain <key>
```

### "Adapter already exists" error

```bash
# Remove existing adapter
rm -rf adapters/<adapter-name>

# Or choose different chain
pnpm cli:generate --chain <different-chain>
```

### TypeScript compilation errors

```bash
# Update TypeScript
pnpm update typescript

# Type check
pnpm type-check
```

### Build fails

```bash
# Clean and rebuild
rm -rf dist node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

## Next Steps

- Read the full [README.md](./README.md)
- Review the [DESIGN.md](./DESIGN.md) for architecture details
- Check generated adapter README for implementation guide
- Explore existing adapters in `adapters/` for patterns

## Support

For issues or questions:
1. Check generated adapter README
2. Review DESIGN.md architecture section
3. Look at existing adapter implementations
4. Open a GitHub issue
