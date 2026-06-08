# Copy Framework - Implementation Guide

**Quick start guide for integrating microcopy tokens into ORŸA components**

## 5-Minute Quick Start

### 1. Import and Use in Web Component

```typescript
// components/LoginButton.tsx
import { useCopy } from '@/lib/copy';

export function LoginButton() {
  const { t } = useCopy();
  
  return (
    <button onClick={handleLogin}>
      {t('auth.signIn')}  {/* "Sign In" */}
    </button>
  );
}
```

### 2. Import and Use in Mobile Component

```typescript
// app/login.tsx
import { useCopy } from '@/hooks/useCopy';

export function LoginScreen() {
  const { t } = useCopy();
  
  return (
    <TouchableOpacity onPress={handleLogin}>
      <Text>{t('auth.signIn')}</Text>  {/* "Sign In" */}
    </TouchableOpacity>
  );
}
```

### 3. With Variables

```typescript
function SendTransaction() {
  const { t } = useCopy();
  
  return (
    <Text>
      {t('flow.send.step4.youSending', {
        amount: '1.5',
        currency: 'ETH'
      })}
    </Text>
  );
  // Output: "You're Sending 1.5 ETH"
}
```

---

## Full Integration Steps

### Step 1: Set Up Copy Hook (One-time per app)

#### Web (Next.js)
```typescript
// lib/useCopy.ts
import { createUseCopy } from '@orya/copy-framework';
import { copyEN } from '@/copy/en';
import { copyPremiumEN } from '@/copy/premium-en';
import { useContext } from 'react';
import { UserContext } from '@/contexts/UserContext';

export function useCopy() {
  const { isPremium } = useContext(UserContext);
  
  const createHook = createUseCopy({
    dictionary: isPremium ? copyPremiumEN : copyEN,
    tier: isPremium ? 'premium' : 'standard',
    language: 'en',
    onMissing: (key) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Copy] Missing token: ${key}`);
      }
    },
  });

  return createHook();
}
```

#### Mobile (React Native/Expo)
```typescript
// hooks/useCopy.ts
import { createUseCopy } from '@orya/copy-framework';
import { copyMobileEN } from '@/copy/en';
import { copyMobilePremiumEN } from '@/copy/premium-en';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

export function useCopy() {
  const { isPremium } = useContext(AuthContext);
  
  const createHook = createUseCopy({
    dictionary: isPremium ? copyMobilePremiumEN : copyMobileEN,
    tier: isPremium ? 'premium' : 'standard',
    language: 'en',
    onMissing: (key) => {
      console.warn(`[Copy] Missing: ${key}`);
    },
  });

  return createHook();
}
```

### Step 2: Use in Component (Everywhere)

```typescript
import { useCopy } from '@/lib/useCopy';  // Web
// OR
import { useCopy } from '@/hooks/useCopy';  // Mobile

export function MyComponent() {
  const { t } = useCopy();
  
  return (
    <div>
      <h1>{t('vault.overview.portfolio')}</h1>
      <button>{t('actions.save')}</button>
    </div>
  );
}
```

### Step 3: Update Dictionary Files

**Web Standard:**
```typescript
// apps/web/copy/en.ts
export const copyEN = {
  vault: {
    overview: {
      portfolio: "Portfolio",
      totalBalance: "Total Balance",
      // ... more tokens
    }
  }
};
```

**Web Premium:**
```typescript
// apps/web/copy/premium-en.ts
import { copyEN } from './en';

export const copyPremiumEN = {
  ...copyEN,
  atrium: {
    ...copyEN.atrium,
    yieldOptimization: "AI-Powered Yield Optimization",
  }
};
```

**Mobile Standard:**
```typescript
// apps/mobile/copy/en.ts
export const copyMobileEN = {
  vault: {
    overview: {
      portfolio: "Portfolio",
      totalBalance: "Total",  // Shorter for mobile
    }
  }
};
```

**Mobile Premium:**
```typescript
// apps/mobile/copy/premium-en.ts
import { copyMobileEN } from './en';

export const copyMobilePremiumEN = {
  ...copyMobileEN,
  // Premium overrides
};
```

---

## Common Patterns

### Pattern 1: Simple Label
```typescript
<button>{t('actions.send')}</button>
// Output: "Send"
```

### Pattern 2: Label with Variables
```typescript
<p>
  {t('flow.send.step4.youSending', {
    amount: formValues.amount,
    currency: selectedToken.symbol
  })}
</p>
// Output: "You're Sending 1.5 ETH"
```

### Pattern 3: Optional/Fallback Text
```typescript
<h3>
  {t('custom.header') || t('vault.overview.portfolio')}
</h3>
// Falls back to portfolio label if custom doesn't exist
```

### Pattern 4: Multiple Tokens
```typescript
const { t } = useCopy();
const buttonLabels = t.tMultiple([
  'actions.send',
  'actions.receive',
  'actions.swap'
]);

return (
  <>
    <Button>{buttonLabels['actions.send']}</Button>
    <Button>{buttonLabels['actions.receive']}</Button>
    <Button>{buttonLabels['actions.swap']}</Button>
  </>
);
```

### Pattern 5: Error Messages
```typescript
try {
  await transaction.send();
} catch (error) {
  setError(t('errors.transactionFailed'));
  // Output: "Transaction failed"
}
```

### Pattern 6: Conditional Copy
```typescript
const { t } = useCopy();

return (
  <span>
    {transactionStatus === 'pending' 
      ? t('status.processing')
      : t('status.success')
    }
  </span>
);
```

### Pattern 7: Dynamic Sections
```typescript
const { t } = useCopy();

const sections = [
  { title: t('atrium.assetsManagement'), page: 'assets' },
  { title: t('atrium.defiMonitoring'), page: 'defi' },
  { title: t('atrium.yieldOptimization'), page: 'yield' },
];

return sections.map(s => <MenuItem key={s.page}>{s.title}</MenuItem>);
```

### Pattern 8: Placeholder/Loading
```typescript
const { t } = useCopy();

return (
  <div>
    {isLoading 
      ? <Spinner /> 
      : <p>{t('empty.noTransactions')}</p>
    }
  </div>
);
```

---

## Token Reference by Page

### Navigation Tokens
```typescript
t('nav.vault')      // "Vault"
t('nav.link')       // "Link"
t('nav.flow')       // "Flow"
t('nav.insights')   // "Insights"
t('nav.settings')   // "Settings"
t('nav.atrium')     // "Atrium"
// ... and 7 more
```

### Auth Tokens
```typescript
t('auth.signIn')                    // "Sign In"
t('auth.createPassword')            // "Create Password"
t('auth.passwordMismatch')          // "Passwords do not match"
t('auth.twoFactor')                 // "Two-Factor Authentication"
t('auth.sessionExpired')            // "Your session has expired"
```

### Action Tokens (Reusable)
```typescript
t('actions.back')       // "Back"
t('actions.continue')   // "Continue"
t('actions.send')       // "Send"
t('actions.receive')    // "Receive"
t('actions.swap')       // "Swap"
t('actions.confirm')    // "Confirm"
t('actions.cancel')     // "Cancel"
t('actions.save')       // "Save"
```

### Vault Tokens
```typescript
t('vault.overview.totalBalance')    // "Total Balance"
t('vault.overview.portfolio')       // "Portfolio"
t('vault.performance.24h')          // "24h Change"
t('vault.actions.rebalance')        // "Rebalance Portfolio"
```

### Flow (Transaction) Tokens
```typescript
t('flow.send.step1.selectAsset')    // "Select Asset to Send"
t('flow.send.step2.enterAmount')    // "Enter Amount"
t('flow.send.step4.youSending')     // "You're Sending"
t('flow.send.step4.fee')            // "Transaction Fee"

t('flow.receive.step1.selectAsset') // "Select Asset to Receive"
t('flow.receive.addressCopied')     // "Address copied to clipboard"

t('flow.types.sent')                // "Sent"
t('flow.types.received')            // "Received"
t('flow.status.pending')            // "Pending"
t('flow.status.completed')          // "Completed"
```

### Insights Tokens
```typescript
t('insights.summary.portfolioValue') // "Portfolio Value"
t('insights.assetDetails.price')    // "Current Price"
t('insights.holdings.gain')         // "Gain/Loss"
t('insights.ai.insights')           // "AI Insights"
```

### Settings Tokens
```typescript
t('settings.profile.name')          // "Full Name"
t('settings.security.password')     // "Password"
t('settings.preferences.theme')     // "Theme"
t('settings.notifications.email')   // "Email Notifications"
```

### Atrium Tokens (Premium)
```typescript
t('atrium.assetsManagement')        // "Assets Management"
t('atrium.yieldOptimization')       // "Yield Optimization"
t('atrium.taxPlanning')             // "Tax Planning"
t('atrium.advisory.connect')        // "Connect with Advisor"
```

### Status & Error Tokens
```typescript
t('status.loading')                 // "Loading..."
t('status.success')                 // "Success!"
t('status.processingTransaction')   // "Processing your transaction..."

t('errors.required')                // "This field is required"
t('errors.invalidEmail')            // "Please enter a valid email address"
t('errors.insufficientBalance')     // "Insufficient balance"
t('errors.walletNotConnected')      // "Wallet not connected"
```

---

## Migration Checklist

### For Each Component:

- [ ] Add `import { useCopy } from '@/lib/useCopy'`
- [ ] Add `const { t } = useCopy()` at top of component
- [ ] Replace hardcoded strings with `t('token.key')`
- [ ] Add variables for dynamic content
- [ ] Test on web and mobile
- [ ] Verify copy loads correctly
- [ ] Check for console warnings
- [ ] Run `npm run test:validate`

### For Dictionary Files:

- [ ] Add new tokens to `en.ts`
- [ ] Add premium variants to `premium-en.ts`
- [ ] Add mobile variants to mobile `en.ts`
- [ ] Test variable resolution
- [ ] Validate no unresolved placeholders
- [ ] Update this documentation

---

## Advanced Usage

### Bound Resolver (Pre-set Variables)

```typescript
import { createBoundResolver } from '@orya/copy-framework';

const userResolver = createBoundResolver({
  userName: 'John Doe',
  currency: 'USD'
});

// Use across component without repeating variables
const welcome = userResolver('greeting.welcome').resolved;
// "Welcome John Doe"

const balance = userResolver('vault.balance').resolved;
// "Your USD balance"
```

### Debug Mode

```typescript
const { tDebug } = useCopy();

const result = tDebug('flow.send.step4.youSending', {
  amount: '1.5',
  currency: 'ETH'
});

console.log(result);
// {
//   raw: "You're Sending {amount} {currency}",
//   resolved: "You're Sending 1.5 ETH",
//   hasUnresolvedVariables: false,
//   unresolvedVariables: []
// }
```

### Validation Utilities

```typescript
import {
  extractVariables,
  getUnresolvedVariables,
  validateCopyVariables
} from '@orya/copy-framework';

// Extract all variables from a string
const vars = extractVariables("Send {amount} {currency}");
// ["amount", "currency"]

// Check for missing variables
const missing = getUnresolvedVariables(
  "Send {amount} {currency}",
  { amount: "1.5" }
);
// ["currency"]

// Full validation
const result = validateCopyVariables(
  "Send {amount} {currency}",
  { amount: "1.5", currency: "ETH", extra: "unused" }
);
// {
//   valid: true,
//   missing: [],
//   extra: ["extra"],
//   message: "Unused variables: extra"
// }
```

---

## Troubleshooting

### Issue: Console warnings about missing keys

```
[Copy] Missing key: "auth.signIn"
```

**Solution:**
1. Check spelling: `auth.signIn` not `auth.signin`
2. Verify key exists in dictionary
3. Check imports point to correct dictionary

### Issue: Variables not resolving

```typescript
t('flow.send.step4.youSending')
// Output: "You're Sending {amount} {currency}"
```

**Solution:**
Provide variables:
```typescript
t('flow.send.step4.youSending', { amount: '1.5', currency: 'ETH' })
```

### Issue: Platform shows different text

**Solution:**
This is expected! Web and mobile have different copy lengths:
- Web: "Total Balance" 
- Mobile: "Total"

### Issue: Premium tier not showing

**Solution:**
Check that `isPremium` flag is set correctly:
```typescript
const { t } = useCopy();
// Make sure useCopy() is reading tier from context/store
```

---

## Testing

### Component Test Example

```typescript
import { render, screen } from '@testing-library/react';
import { SendButton } from '@/components/SendButton';

// Mock useCopy hook
jest.mock('@/lib/useCopy', () => ({
  useCopy: () => ({
    t: (key) => {
      const copy = { 'actions.send': 'Send' };
      return copy[key] || key;
    }
  })
}));

describe('SendButton', () => {
  it('should display send button text', () => {
    render(<SendButton />);
    expect(screen.getByText('Send')).toBeInTheDocument();
  });
});
```

### Validation Test

```bash
# Run copy framework validation
npm run test:validate

# Should output:
# ✓ Test 1: Extract Variables
# ✓ Test 2: Validate Variables
# ✓ Test 3: Resolve Copy with Variables
# ✓ Test 4: Token Naming Convention
# ✓ Test 5: Dictionary Validation
# ✓ Test 6: Edge Cases
# ✅ Validation Complete
```

---

## Performance Tips

1. **Memoize `useCopy()` result**
   ```typescript
   const { t } = useCopy(); // Call once
   return <Component text={t('key')} />;
   ```

2. **Batch token access**
   ```typescript
   // Good ✓
   const labels = t.tMultiple(['key1', 'key2', 'key3']);
   
   // Avoid repeated calls
   // Bad ✗
   {t('key1')} {t('key2')} {t('key3')}
   ```

3. **Use optional chaining for custom keys**
   ```typescript
   const custom = t.tOptional('custom.key');
   ```

---

## Best Practices Summary

✅ **DO:**
- Use token constants
- Provide variables for placeholders
- Check console for warnings
- Test on both platforms
- Validate variable usage

❌ **DON'T:**
- Hardcode UI strings
- Forget to import hook
- Mix platforms carelessly
- Leave unresolved variables
- Override without reason

---

**Need Help?**
- Check `packages/copy-framework/README.md` for API reference
- Review token definitions: `packages/copy-framework/src/tokens.ts`
- Run validation: `npm run test:validate`
- Check dictionary files in `apps/web/copy/` and `apps/mobile/copy/`

---

**Version:** 1.0.0  
**Last Updated:** 2025-01