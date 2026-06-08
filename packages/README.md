# ORŸA Shared Packages

Reusable libraries shared across the ORŸA monorepo.

## Packages

### @orya/shared-types

Core TypeScript type definitions used across mobile, web, and services.

**Exports:**
- `User` - User profile & authentication
- `Transaction` - Blockchain transactions
- `Portfolio` - Asset holdings
- `ApiResponse` - Standard API response wrapper
- `DeFiPosition` - DeFi protocol positions
- And more...

```bash
cd shared-types
pnpm build
```

### @orya/shared-ui

Reusable React Native UI components following the design system.

**Components:**
- `Button` - Interactive button component
- `Card` - Card container
- `Input` - Text input field
- `Modal` - Modal dialog
- `Toast` - Notification toast
- And more...

```bash
cd shared-ui
pnpm build
```

### @orya/shared-utils

Common utility functions used throughout the app.

**Utilities:**
- `format` - Formatting functions (currency, date, etc.)
- `validation` - Input validation
- `crypto` - Crypto utilities (hashing, signing, etc.)
- `api` - API client helpers
- `storage` - Local storage wrappers
- And more...

```bash
cd shared-utils
pnpm build
```

## Development

### Setup

```bash
pnpm install
```

### Build

```bash
# Build all packages
pnpm build

# Build specific package
cd shared-types && pnpm build
```

### Testing

```bash
# Test all packages
pnpm test

# Test specific package
cd shared-types && pnpm test
```

### Publishing

For internal use only (monorepo). No npm publishing.

## Usage in Apps

Import from published packages:

```typescript
// In apps/mobile/src/screens/Vault.tsx
import { User, Transaction } from '@orya/shared-types';
import { Button, Card } from '@orya/shared-ui';
import { formatCurrency, validateEmail } from '@orya/shared-utils';
```

## Type Safety

All packages use strict TypeScript:
- `strict: true` in tsconfig
- No implicit `any`
- Full type coverage required

## Documentation

Each package has its own README.md and inline documentation.

## Contributing

1. Update types/utilities when needed
2. Maintain backward compatibility
3. Add tests for new exports
4. Update documentation
5. Run type checking before commit

## Workspace Configuration

All packages are part of the pnpm workspace:

```json
{
  "workspaces": [
    "packages/*",
    "apps/*"
  ]
}
```

This enables:
- Single dependency tree
- Fast installation
- Easy cross-package importing
- Shared dev dependencies