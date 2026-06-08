# Copy Framework

**Microcopy Token System for ORŸA**

A comprehensive copy management framework that provides centralized, scalable, and maintainable microcopy (UI text) across web and mobile applications.

## Overview

The Copy Framework provides:

- ✅ **Centralized Token Management** - All UI text organized by feature/page
- ✅ **Platform-Specific Variants** - Different copy for web vs. mobile
- ✅ **Tier-Based Variants** - Standard vs. Premium copy
- ✅ **Variable Substitution** - Dynamic text with `{placeholders}`
- ✅ **Type Safety** - Full TypeScript support
- ✅ **Validation** - Built-in checks for missing tokens and unresolved variables

## Structure

```
copy-framework/
├── src/
│   ├── types.ts              # TypeScript type definitions
│   ├── tokens.ts             # All token key definitions
│   ├── resolver.ts           # Variable resolution utilities
│   ├── useCopyCore.ts        # React hook for components
│   ├── index.ts              # Public exports
│   └── __tests__/
│       └── validate.ts       # Validation tests
├── package.json
├── tsconfig.json
└── README.md
```

## Token Naming Convention

Tokens follow a hierarchical dot-notation pattern:

```
[page].[section].[element]
```

### Examples

```typescript
// Navigation
"nav.vault"                    // Vault menu item

// Authentication
"auth.signIn"                  // Sign In button
"auth.passwordMismatch"        // Error message

// Transactions
"flow.send.step1.selectAsset"  // Send flow, step 1
"flow.send.step4.youSending"   // Send flow, step 4 with variable

// Portfolio
"vault.overview.totalBalance"  // Total balance label
"vault.performance.24h"        // 24-hour performance

// Atrium (Premium)
"atrium.yieldOptimization"     // Yield optimization page
"atrium.advisory.connect"      // Connect with advisor

// Global Actions
"actions.continue"             // Reusable continue button
"actions.approve"              // Approval action

// Status & Errors
"status.loading"               // Loading state
"errors.insufficientBalance"   // Error message
```

## Usage

### Basic Usage

```typescript
// In a React component
import { useCopy } from '@orya/copy-framework';

function LoginButton() {
  const { t } = useCopy();
  
  return (
    <button onClick={handleLogin}>
      {t('auth.signIn')}
    </button>
  );
}
```

### With Variables

```typescript
function SendConfirmation() {
  const { t } = useCopy();
  
  const message = t('flow.send.step4.youSending', {
    amount: '1.5',
    currency: 'ETH'
  });
  
  // Output: "You're Sending 1.5 ETH"
  return <p>{message}</p>;
}
```

### Advanced Usage

```typescript
function TransactionDetails() {
  const { t, tDebug, tOptional } = useCopy();
  
  // Get with debugging info
  const debugInfo = tDebug('flow.send.step4.youSending', {
    amount: '1.5',
    currency: 'ETH'
  });
  
  // Get with fallback
  const customCopy = tOptional('custom.key', 'Default text');
  
  // Get multiple at once
  const labels = tMultiple([
    'actions.send',
    'actions.receive',
    'actions.swap'
  ]);
  
  return null;
}
```

## Token Categories

### 1. Navigation (13 Main Menus)
```typescript
NAV_TOKENS = {
  vault, link, flow, insights, curio, grove, care,
  nexus, atrium, settings, chains, help, support
}
```

### 2. Authentication
```typescript
AUTH_TOKENS = {
  signIn, signUp, connectWallet, twoFactor,
  backupPhrase, sessionExpired, ...
}
```

### 3. Global Actions
```typescript
ACTIONS_TOKENS = {
  back, next, continue, send, receive, swap,
  approve, reject, confirm, cancel, save, ...
}
```

### 4. Feature Pages
- **Vault** - Portfolio overview
- **Link** - Wallet management
- **Flow** - Transactions
- **Insights** - Analytics
- **Settings** - User preferences
- **Atrium** - Wealth management (14 sub-pages)

### 5. Status & Errors
```typescript
STATUS_TOKENS = {
  loading, processing, success, error, retry, ...
}

ERROR_TOKENS = {
  required, invalid, insufficientBalance, ...
}
```

## Platform Differences

### Web (Desktop)
- Full labels: "Total Balance", "Two-Factor Authentication"
- More detailed messaging
- Longer action labels

### Mobile (React Native)
- Condensed labels: "Total", "2FA"
- Single-word actions: "Send" → "Send", "Get" (for Receive)
- Shorter error messages

### Example
```typescript
// Web
"vault.overview.totalBalance"  // "Total Balance"

// Mobile
"vault.overview.totalBalance"  // "Total"
```

## Tier Variants

### Standard Tier (Free)
- Core functionality
- Basic messaging
- No premium features

### Premium Tier (Paid)
- Enhanced copy: "Advanced Assets Management"
- Additional features: "AI-Powered Insights"
- Premium actions: "Connect with Financial Advisor"
- Concierge copy

### Usage
```typescript
// In your app setup
const dict = tier === 'premium' ? copyPremiumEN : copyEN;
const useCopy = createUseCopy({
  dictionary: dict,
  tier: 'premium'
});
```

## Variable Substitution

### Syntax
```
{variableName}
```

### Examples
```typescript
// Single variable
"Your balance: {amount}"
{ amount: "1,234.56" }
// Output: "Your balance: 1,234.56"

// Multiple variables
"Sending {amount} {currency} to {address}"
{ amount: "1.5", currency: "ETH", address: "0x742d..." }
// Output: "Sending 1.5 ETH to 0x742d..."

// Dynamic types
"You have {count} transactions"
{ count: 42 }  // Numbers automatically converted to strings
// Output: "You have 42 transactions"
```

### Common Replacers

```typescript
import { commonReplacers } from '@orya/copy-framework';

const amountVars = commonReplacers.amount(1234.56, "USD");
// { amount: "1234.56", currency: "USD" }

const addressVars = commonReplacers.address(
  "0x742d35Cc6634C0532925a3b844Bc8e7595f42e1e"
);
// { address: "0x742d...f42e1e" }

const userVars = commonReplacers.user("John", "Doe");
// { user: "John Doe" }
```

## Validation

### Check Token Validity
```typescript
import { validateCopyVariables } from '@orya/copy-framework';

const text = "Sending {amount} {currency}";
const variables = { amount: "100" };

const result = validateCopyVariables(text, variables);
// {
//   valid: false,
//   missing: ["currency"],
//   extra: [],
//   message: "Missing variables: currency"
// }
```

### Run Validation Tests
```bash
npm run test:validate
```

## Dictionary Structure

### Web (Standard)
```
apps/web/copy/en.ts
```

```typescript
export const copyEN = {
  nav: { vault: "Vault", ... },
  auth: { signIn: "Sign In", ... },
  vault: { overview: { totalBalance: "Total Balance", ... }, ... },
  // ...
};
```

### Web (Premium)
```
apps/web/copy/premium-en.ts
```

```typescript
import { copyEN } from './en';

export const copyPremiumEN = {
  ...copyEN,
  atrium: {
    ...copyEN.atrium,
    yieldOptimization: "AI-Powered Yield Optimization",
    // Additional premium overrides
  }
};
```

### Mobile (Standard)
```
apps/mobile/copy/en.ts
```

```typescript
export const copyMobileEN = {
  nav: { vault: "Vault", ... },
  auth: { signIn: "Sign In", ... },
  vault: { overview: { totalBalance: "Total", ... }, ... },
  // Shorter labels for mobile
};
```

### Mobile (Premium)
```
apps/mobile/copy/premium-en.ts
```

## Setup Instructions

### 1. Install Package
```bash
npm install @orya/copy-framework
```

### 2. Create Usage Hook in Your App

```typescript
// lib/copy.ts (web example)
import { createUseCopy } from '@orya/copy-framework';
import { copyEN } from '../copy/en';
import { copyPremiumEN } from '../copy/premium-en';

export const useCopy = createUseCopy({
  dictionary: isPremium ? copyPremiumEN : copyEN,
  tier: isPremium ? 'premium' : 'standard',
  language: 'en',
  onMissing: (key) => {
    console.warn(`Missing copy key: ${key}`);
  },
});
```

### 3. Use in Components

```typescript
// components/Button.tsx
import { useCopy } from '@/lib/copy';

export function SendButton() {
  const { t } = useCopy();
  return <button>{t('actions.send')}</button>;
}
```

## API Reference

### Types

#### `CopyTokenKey`
Type-safe token key in dot notation.

#### `CopyDictionary`
Nested object mapping token keys to localized strings.

#### `CopyVariables`
Object mapping variable names to their values.

#### `ResolvedCopy`
Result of variable resolution with metadata.

### Functions

#### `createCopyResolver(dictionary, onMissing?)`
Creates a resolver function for a dictionary.

#### `extractVariables(text)`
Extracts variable names from copy string.

#### `getUnresolvedVariables(text, variables)`
Finds unresolved placeholders.

#### `resolveCopy(text, variables)`
Replaces placeholders with values.

#### `createBoundResolver(variables)`
Creates a pre-configured resolver.

#### `validateCopyVariables(text, variables)`
Validates variable completeness.

### Hooks

#### `useCopy()`
React hook to access copy utilities in components.

**Returns:**
- `t(key, variables?)` - Translate token
- `tDebug(key, variables?)` - Get with metadata
- `tOptional(key, fallback?)` - Get with fallback
- `tMultiple(keys)` - Get multiple tokens
- `dictionary` - Current dictionary
- `tier` - Current tier
- `language` - Current language

## Token Statistics

| Category | Count | Coverage |
|----------|-------|----------|
| Navigation | 13 | 100% |
| Authentication | 26 | 85% |
| Global Actions | 29 | 90% |
| Vault | 16 | 80% |
| Link | 19 | 75% |
| Flow | 48 | 70% |
| Insights | 30 | 65% |
| Settings | 35 | 60% |
| Atrium | 70+ | 50% |
| Status & Errors | 40 | 95% |
| **TOTAL** | **~330** | **~76%** |

## Migration Guide

### From Hardcoded Strings to Tokens

**Before:**
```typescript
function Button() {
  return <button>Send</button>;
}
```

**After:**
```typescript
function Button() {
  const { t } = useCopy();
  return <button>{t('actions.send')}</button>;
}
```

### Multiple Language Support (Future)

```typescript
// Currently: 'en' only
const useCopy = createUseCopy({
  language: 'en'
});

// Future: Add Spanish, French, etc.
// apps/web/copy/es.ts
// apps/web/copy/fr.ts
```

## Best Practices

1. **Use Token Keys** - Never hardcode UI strings
2. **Consistent Naming** - Follow `[page].[section].[element]` pattern
3. **Provide Fallbacks** - Use `tOptional()` for custom text
4. **Validate Variables** - Check for unresolved placeholders
5. **Document Tokens** - Add comments for non-obvious keys
6. **Keep It Concise** - Mobile-first copy (web extends if needed)
7. **Platform Variants** - Only differ when necessary (mobile vs. web)

## Troubleshooting

### Missing Token Warning
```
[Copy] Missing key: "auth.signIn"
```
**Solution:** Check token exists in dictionary and key spelling.

### Unresolved Variables
```typescript
const text = t('flow.send.step4.youSending');
// "You're Sending {amount} {currency}"
```
**Solution:** Provide variables: `t('flow.send.step4.youSending', { amount: '1.5', currency: 'ETH' })`

### Type Errors
```
Type 'string' is not assignable to type 'CopyTokenKey'
```
**Solution:** Use token constants: `TOKENS.auth.signIn` instead of string literals.

## Testing

### Run Validation Suite
```bash
npm run test:validate
```

### Check Specific Tokens
```typescript
import { TOKENS } from '@orya/copy-framework';

const key = TOKENS.auth.signIn;  // Type-safe
const value = dict[key];         // Always exists
```

## Contributing

When adding new tokens:

1. Define token in `tokens.ts`
2. Add copy to each dictionary (en, premium-en)
3. Add for both platforms (web, mobile)
4. Run validation: `npm run test:validate`
5. Update this README if adding new categories

## License

Proprietary - ORŸA Wallet

---

**Version:** 1.0.0  
**Last Updated:** 2025-01  
**Status:** Production Ready