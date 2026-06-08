# ORŸA CLI - Adapter Scaffolding Tool

Automated CLI tool for generating blockchain adapter scaffolds. Supports **30+ chains** with templates for both **Rust** and **TypeScript**.

## Features

- ✅ **30+ Chains Supported** - SUI, Ethereum, Solana, Aptos, Starknet, and more
- ✅ **Multi-Language** - Rust and TypeScript template generators
- ✅ **Type-Safe** - Full TypeScript with Zod validation
- ✅ **Interactive Mode** - Guided setup wizard
- ✅ **Extensible** - YAML-based chain registry
- ✅ **Production-Ready** - Error handling, validation, and logging

## Installation

```bash
# Install dependencies
pnpm install

# Build the CLI
pnpm build

# Make executable (Unix/Mac)
chmod +x dist/main.js

# Or use via npx
npx @orya/cli --help
```

## Usage

### Interactive Mode (Default)

```bash
orya-cli
# Follow the prompts to select chain and options
```

### Command Line

```bash
# Generate adapter
orya-cli generate-adapter --chain aptos

# Generate with language override
orya-cli generate-adapter --chain ethereum --language typescript

# List all available chains
orya-cli list-chains

# Show help
orya-cli --help
orya-cli -h

# Show version
orya-cli --version
orya-cli -v
```

## Examples

### Generate Aptos Adapter (Rust)

```bash
orya-cli generate-adapter --chain aptos
```

Creates: `adapters/aptos-adapter/` with:
- `Cargo.toml` - Package configuration
- `src/lib.rs` - Library root
- `src/client.rs` - RPC client
- `src/types.rs` - Type definitions
- `src/error.rs` - Error handling
- `src/account.rs` - Account management
- `src/transaction.rs` - Transaction builder
- `src/dex/mod.rs` - DEX integration
- `tests/integration.rs` - Integration tests
- `.env.example` - Environment template
- `README.md` - Documentation

### Generate Ethereum Adapter (TypeScript)

```bash
orya-cli generate-adapter --chain ethereum
```

Creates: `adapters/ethereum-adapter/` with:
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript config
- `src/index.ts` - Exports
- `src/client.ts` - Web3 client
- `src/types.ts` - TypeScript types
- `src/error.ts` - Error classes
- `src/account.ts` - Account class
- `src/transaction.ts` - Transaction builder
- `src/config.ts` - Configuration
- `tests/client.test.ts` - Unit tests
- `.env.example` - Environment template
- `README.md` - Documentation

## Supported Chains

### Tier 1 (Primary)
- **SUI** (Rust) - DeepBook
- **Ethereum** (TypeScript) - 0x Protocol
- **Solana** (TypeScript) - Jupiter

### Tier 2 (Advanced)
- **Aptos** (Rust) - Econia
- **Movement** (Rust) - Movement DEX
- **Starknet** (TypeScript) - Ekubo
- **Near** (TypeScript) - Ref Finance
- **Cosmos** (TypeScript) - Osmosis

### Tier 3 (Emerging)
- **TON** (TypeScript) - DeDust
- **Flow** (TypeScript) - FlowSwap
- **Ronin** (TypeScript) - Katana

### Tier 4 (Legacy/Special)
- **Tron** (TypeScript) - SunSwap
- **XRP Ledger** (TypeScript) - XRPL DEX

*Plus 15+ more chains available*

## Architecture

```
tools/cli/
├── src/
│   ├── main.ts                 # CLI entry point
│   ├── types.ts                # TypeScript interfaces
│   ├── commands/               # Command handlers
│   │   ├── generate-adapter.ts
│   │   ├── list-chains.ts
│   │   └── index.ts
│   ├── generators/             # Template generators
│   │   ├── base-generator.ts
│   │   ├── rust-generator.ts
│   │   ├── typescript-generator.ts
│   │   └── index.ts
│   └── utils/                  # Utilities
│       ├── config-loader.ts    # YAML config
│       ├── validators.ts       # Zod validation
│       ├── errors.ts           # Custom errors
│       ├── path-utils.ts       # File operations
│       └── index.ts
├── config/
│   └── chains.yaml             # Chain registry
├── templates/                  # (Optional) Template files
├── tests/                      # Unit tests
├── package.json
├── tsconfig.json
└── README.md
```

## Configuration

### Adding a New Chain

Edit `config/chains.yaml`:

```yaml
chains:
  mychain:
    name: MyChain
    dirName: mychain-adapter
    language: rust  # or typescript
    tier: 2
    mainDEX: MyDEX
    mainBridge: MyBridge
    rpcProvider: MyRPC
```

### Validation Schema

Chains are validated using Zod:
- `name` - Human-readable name
- `dirName` - Must be kebab-case
- `language` - `rust` or `typescript`
- `tier` - 1, 2, 3, or 4 (priority level)
- `mainDEX` - Primary DEX on chain (optional)
- `mainBridge` - Primary bridge (optional)
- `rpcProvider` - RPC provider name (optional)

## Development

### Build

```bash
pnpm build
```

### Test

```bash
pnpm test
```

### Lint

```bash
pnpm lint
```

### Type Check

```bash
pnpm type-check
```

### Run in Development

```bash
pnpm dev -- generate-adapter --chain aptos
pnpm dev -- list-chains
pnpm dev
```

## Error Handling

The CLI provides detailed error messages for common issues:

```
ChainNotFoundError      - Chain not in registry
AdapterExistsError      - Adapter directory exists
InvalidPathError        - Invalid file system path
TemplateError           - Template generation failed
ValidationError         - Configuration validation failed
```

## Generated Adapter Structure

### Rust Adapter

```
adapter/
├── Cargo.toml
├── src/
│   ├── lib.rs
│   ├── types.rs
│   ├── error.rs
│   ├── client.rs
│   ├── account.rs
│   ├── transaction.rs
│   └── dex/
│       └── mod.rs
├── tests/
│   └── integration.rs
├── .env.example
└── README.md
```

### TypeScript Adapter

```
adapter/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── types.ts
│   ├── error.ts
│   ├── client.ts
│   ├── account.ts
│   ├── transaction.ts
│   └── config.ts
├── tests/
│   └── client.test.ts
├── .env.example
└── README.md
```

## Next Steps

After generating an adapter:

1. **Navigate** to the adapter directory
2. **Install dependencies** (TypeScript: `pnpm install`, Rust: already configured)
3. **Implement** the adapter logic (replace placeholder code)
4. **Test** thoroughly with `pnpm test` or `cargo test`
5. **Document** implementation details in README
6. **Submit** PR for code review

## Best Practices

- ✅ Follow existing adapter patterns in the codebase
- ✅ Add comprehensive error handling
- ✅ Write unit and integration tests
- ✅ Document public APIs
- ✅ Handle edge cases (network errors, invalid inputs)
- ✅ Use type-safe patterns
- ✅ Validate all external inputs

## Troubleshooting

### "Chain not found"
```bash
# List available chains
orya-cli list-chains

# Use correct chain key
orya-cli generate-adapter --chain <key>
```

### "Adapter already exists"
```bash
# Remove existing adapter or choose different chain
rm -rf adapters/<adapter-name>
```

### "Invalid path"
```bash
# Ensure directory doesn't exist and is writable
cd adapters/
ls -la  # Check permissions
```

## Contributing

To add a new chain:

1. Edit `config/chains.yaml`
2. Add new chain configuration
3. Test generation: `pnpm dev -- generate-adapter --chain <key>`
4. Verify generated files
5. Submit PR

## License

MIT

## Support

For issues or questions:
1. Check existing adapters for examples
2. Review generated README in adapter
3. Consult ORŸA documentation
4. Open GitHub issue
