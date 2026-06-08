# Web Onboarding Quick Start Guide

**Last Updated:** January 2025  
**Status:** ✅ Production Ready  
**Mobile Parity:** 100%

---

## Quick Navigation

### Access Points
```
Development:     http://localhost:3000/onboarding
Production:      https://app.orya.io/onboarding
Test Directly:   http://localhost:3000/onboarding/splash
```

### Key Files Location
```
Screens:         apps/web/app/onboarding/[screen]/page.tsx
Components:      apps/web/components/onboarding/
Hooks:           apps/web/hooks/use*.ts
Store:           apps/web/lib/onboardingStore.ts
Layout:          apps/web/app/onboarding/layout.tsx
```

---

## Screen Directory

| Screen | Route | File | Purpose |
|--------|-------|------|---------|
| Splash | `/onboarding/splash` | `splash/page.tsx` | Entry point, 2s auto-advance |
| Welcome | `/onboarding/welcome` | `welcome/page.tsx` | 5-slide intro carousel |
| Auth Method | `/onboarding/auth-method` | `auth-method/page.tsx` | 3 wallet + 2 social options |
| Biometric | `/onboarding/biometric-setup` | `biometric-setup/page.tsx` | WebAuthn setup (flow-aware) |
| Import | `/onboarding/import-wallet` | `import-wallet/page.tsx` | Import seed/key/keystore |
| Connect | `/onboarding/connect-external` | `connect-external/page.tsx` | WalletConnect URI input |
| Chain | `/onboarding/chain-selection` | `chain-selection/page.tsx` | SUI/ETH/SOL/APT selection |
| Creating | `/onboarding/creating-wallet` | `creating-wallet/page.tsx` | 3-step wallet creation |
| Recovery | `/onboarding/recovery-phrase-display` | `recovery-phrase-display/page.tsx` | 12-word phrase display |
| Verify | `/onboarding/recovery-phrase-verify` | `recovery-phrase-verify/page.tsx` | 3-word verification quiz |
| Success | `/onboarding/success` | `success/page.tsx` | Celebration + Terms |

---

## Component Quick Reference

### OnboardingContainer
```typescript
<OnboardingContainer
  showBackButton={boolean}
  onBack={() => void}
>
  {/* Content */}
</OnboardingContainer>
```

### OnboardingButton
```typescript
<OnboardingButton
  label="Click me"
  onClick={() => void}
  variant="primary" | "secondary" | "tertiary"
  size="sm" | "md" | "lg"
  disabled={boolean}
/>
```

### ProgressBar
```typescript
<ProgressBar
  currentStep={number}
  totalSteps={number}
  style="linear" | "dots"
/>
```

### CheckBox
```typescript
<CheckBox
  label="I agree"
  checked={boolean}
  onChange={(e) => void}
  error={string | null}
/>
```

### ChainOption
```typescript
<ChainOption
  id="sui"
  name="Sui Network"
  shortName="SUI"
  description="..."
  icon="🌊"
  color="#0066FF"
  selected={boolean}
  onClick={() => void}
/>
```

### AuthMethodButton
```typescript
<AuthMethodButton
  id="create-wallet"
  method="create-wallet"
  title="Create New Wallet"
  description="..."
  icon="➕"
  onClick={() => void}
/>
```

### Carousel
```typescript
<Carousel slides={CarouselSlide[]} />
```

---

## Hook Quick Reference

### useOnboardingStore
```typescript
const {
  // State
  currentFlow,          // 'standard' | 'import' | 'connect-external'
  currentStep,          // 0-8
  authMethod,           // Selected auth method
  selectedChain,        // Selected blockchain
  walletAddress,        // Created/imported wallet
  recoveryPhrase,       // Generated recovery phrase
  biometricEnabled,     // User enabled biometric?
  biometricType,        // 'webauthn' | 'passwordless' | 'none'
  termsAccepted,        // User accepted terms?
  
  // Actions
  setFlow,
  setStep,
  setAuthMethod,
  setSelectedChain,
  setWalletAddress,
  setRecoveryPhrase,
  setBiometricType,
  setBiometricEnabled,
  setTermsAccepted,
  reset,
} = useOnboardingStore();
```

### useBiometricCapabilities
```typescript
const {
  capabilities: {
    available: boolean,
    types: BiometricType[]
  },
  isLoading: boolean,
  registerBiometric: () => Promise<void>,
  authenticateWithBiometric: () => Promise<void>,
} = useBiometricCapabilities();
```

### useRecoveryPhraseGenerator
```typescript
const {
  generatePhrase: () => string,
  verifyPhrase: (phrase: string) => boolean,
  isValidWord: (word: string) => boolean,
  getVerificationQuizWords: (phrase: string, count: number) => QuizQuestion[],
} = useRecoveryPhraseGenerator();
```

### useOnboardingNavigation
```typescript
const {
  navigateToStep: (step: number) => void,
  goNext: () => void,
  goBack: () => void,
  exitOnboarding: () => void,
  isOnScreen: (step: number) => boolean,
} = useOnboardingNavigation();
```

---

## Common Tasks

### Add a New Onboarding Screen

1. Create directory: `apps/web/app/onboarding/[screen-name]/`
2. Create file: `page.tsx`
3. Use template:
```typescript
'use client';
import { useRouter } from 'next/navigation';
import { useOnboardingStore } from '@/lib/onboardingStore';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';

export default function ScreenName() {
  const router = useRouter();
  const { setStep } = useOnboardingStore();

  return (
    <OnboardingContainer
      showBackButton
      onBack={() => router.back()}
    >
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Your content */}
        </div>
      </div>
    </OnboardingContainer>
  );
}
```

### Test a Specific Flow

**Standard Flow:**
```bash
# From splash
1. Click "Get Started" on welcome
2. Click "Create New Wallet"
3. Enable/Skip biometric
4. Select chain (SUI default)
5. Wait for wallet creation
6. Copy recovery phrase
7. Verify recovery phrase
8. Accept terms
```

**Import Flow:**
```bash
# From splash
1. Click "Get Started" on welcome
2. Click "Import Existing Wallet"
3. Enter seed phrase (12+ words)
4. Enable/Skip biometric
5. Accept terms
```

**Connect Flow:**
```bash
# From splash
1. Click "Get Started" on welcome
2. Click "Connect External"
3. Enter WalletConnect URI (starts with wc:)
4. Wait for connection
5. Approve connection
6. Enable/Skip biometric
7. Accept terms
```

### Debug State

In browser console:
```javascript
// View current store state
localStorage.getItem('@orya/onboarding-store')

// Clear and restart
localStorage.removeItem('@orya/onboarding-store')
location.reload()

// View specific values
const state = JSON.parse(localStorage.getItem('@orya/onboarding-store'))
console.log(state.state.currentFlow)
console.log(state.state.currentStep)
```

### Styling Guide

#### Colors
```typescript
// Light mode
- Background: bg-bone-white (#F8F6F1)
- Text: text-deep-charcoal (#1A1A1A)
- Accent: text-pale-gold (#D4C29E)

// Dark mode
- Background: dark:bg-deep-charcoal (#111111)
- Text: dark:text-bone-white (#F8F6F1)
- Accent: dark:text-neon-gold (#FFD700)
```

#### Typography
```typescript
- H1: text-4xl font-bold
- H2: text-2xl font-bold
- H3: text-lg font-semibold
- Body: text-base
- Caption: text-sm
```

#### Spacing
```typescript
- Container padding: px-4, py-8
- Max width: max-w-2xl
- Section gap: mb-12
- Item gap: gap-4
```

### Form Validation Examples

```typescript
// Seed phrase
const words = input.trim().split(/\s+/);
if (words.length !== 12 && words.length !== 24) {
  setError('Must be 12 or 24 words');
}

// Private key
if (!input.startsWith('0x') || input.length !== 66) {
  setError('Invalid hex format');
}

// WalletConnect URI
if (!input.startsWith('wc:')) {
  setError('Must start with wc:');
}
```

---

## Troubleshooting

### Screen Not Rendering
- Check route matches file location
- Verify component exports default
- Check 'use client' directive present
- Clear .next cache: `rm -rf .next`

### Store Not Persisting
- Check localStorage key: `@orya/onboarding-store`
- Verify localStorage not disabled
- Check browser privacy mode
- Clear localStorage and retry

### Styling Issues
- Verify Tailwind classes in tailwind.config
- Check dark mode class in html element
- Verify dark: prefix for dark mode classes
- Check CSS imports in globals.css

### TypeScript Errors
- Run: `pnpm type-check`
- Check imports match exact paths
- Verify interface implementations
- Use `satisfies` for type assertions

### Navigation Issues
- Check step numbers match routes
- Verify router.push() paths exist
- Check currentFlow before routing
- Trace flow logic in store

---

## Performance Tips

### Optimize Bundle
```typescript
// Use dynamic imports for heavy components
const HeavyComponent = dynamic(() => import('./Heavy'), {
  loading: () => <div>Loading...</div>,
});
```

### Optimize Images
```typescript
// Use Next.js Image component
import Image from 'next/image';
<Image src="/logo.svg" width={100} height={100} />
```

### Optimize Stores
```typescript
// Separate stores for different concerns
const store1 = create(...); // Onboarding
const store2 = create(...); // App state
```

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot read property 'push' of undefined` | Router not imported | Add `useRouter` import |
| `localStorage is not defined` | SSR issue | Add `'use client'` directive |
| `Module not found` | Wrong import path | Check exact path in directory |
| `Tailwind class not applied` | Class not in config | Add to `content` in tailwind.config |
| `Type error on props` | Missing type definition | Check component interface |

---

## Testing Checklist

- [ ] Can reach /onboarding
- [ ] Splash auto-advances
- [ ] All 3 flows complete
- [ ] Dark mode works
- [ ] Mobile responsive
- [ ] Back buttons work
- [ ] State persists
- [ ] Terms acceptance required
- [ ] No console errors
- [ ] All animations smooth

---

## Deployment Notes

### Environment Variables
```
NEXT_PUBLIC_API_URL=https://api.orya.io
NEXT_PUBLIC_FIREBASE_CONFIG={...}
```

### Build Command
```bash
pnpm build
```

### Start Production
```bash
pnpm start
```

### Monitor After Deploy
- Check error tracking (Sentry)
- Monitor onboarding completion rate
- Check analytics events
- Monitor load times

---

## Resources

- 📖 [Full Flow Documentation](./WEB_ONBOARDING_FLOW_COMPLETE.md)
- 📋 [Build Plan](./WEB_ONBOARDING_BUILD_PLAN.md)
- ✅ [Implementation Complete](./ONBOARDING_IMPLEMENTATION_COMPLETE.md)
- 🔧 [Mobile Reference](../mobile/IMPLEMENTATION_COMPLETE.md)

---

## Need Help?

### Quick Reference Commands
```bash
# Start dev server
pnpm dev

# Type check
pnpm type-check

# Lint
pnpm lint

# Build
pnpm build

# Run tests
pnpm test
```

### Debug Flags
```typescript
// In component
console.log('[ScreenName] State:', state);
console.log('[ScreenName] Props:', props);
console.log('[ScreenName] Route:', router.pathname);
```

---

**Ready to build? Start with `/onboarding/splash` and follow the user flows!** 🚀