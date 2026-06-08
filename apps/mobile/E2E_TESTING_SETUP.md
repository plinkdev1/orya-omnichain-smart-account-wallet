# E2E Testing Setup - ORYA Mobile App

## Overview

This document describes the E2E test infrastructure for the ORYA mobile app using Detox. Four comprehensive test suites cover all primary onboarding flows and the wallet upgrade path.

## Test Suites Created

### 1. **onboarding-normie.e2e.tsx**
Tests the Normie (Simple Wallet) onboarding flow:
- **Path**: Splash → Intro (5 screens) → Identity → Social Login → Card Setup → Vault
- **Assertions**: 
  - Splash screen renders with correct messaging
  - Intro screens show progress indicators
  - Identity selection branches correctly
  - Social login methods available (Google, Apple, Email, Phone)
  - Card setup form accepts input
  - Vault loads with custodial features
  - Normie-specific capabilities visible (Card, Simple Send, Receive)
  - Advanced DeFi features hidden
  - Redux state tracks Normie segment correctly

### 2. **onboarding-crypto.e2e.tsx**
Tests the Crypto Native (Next-gen Web3) onboarding flow:
- **Path**: Splash → Intro → Identity → SUI Choice → SUI Create → Vault
- **Assertions**:
  - MPC wallet creation initiated through Suiet
  - Recovery phrase displayed and copyable
  - Recovery phrase verification required
  - Vault shows MPC wallet active
  - Web3 capabilities enabled (Swap, Stake, NFT Gallery)
  - DeFi menu accessible
  - SUI blockchain available in chain selector
  - Self-custody model active
  - Crypto segment verified in Redux state

### 3. **onboarding-external.e2e.tsx**
Tests the External Wallet (WalletConnect) onboarding flow:
- **Path**: Splash → Intro → Identity → WalletConnect → Confirm → Vault
- **Assertions**:
  - WalletConnect certification info displayed
  - Available wallets shown (Phantom, MetaMask, Coinbase, TrustWallet)
  - WalletConnect modal opens with QR code
  - Wallet connection approval workflow
  - Confirmation screen displays wallet details
  - Connected wallet address shown in Vault
  - External wallet type verified
  - WalletConnect status indicator visible
  - Wallet disconnection capability available
  - Limited capabilities note displayed
  - External custody model active

### 4. **upgrade-normie-to-web3.e2e.tsx**
Tests the upgrade path from Normie to Web3:
- **Path**: Complete Normie flow → Settings → Upgrade → MPC Creation → Recovery Phrase → Vault with Both Wallets
- **Assertions**:
  - Normie onboarding completed first
  - Upgrade prompt visible in settings
  - Upgrade benefits displayed
  - MPC wallet creation initiated
  - Recovery phrase generated and verified
  - Vault reloads with both wallet types
  - Wallet selector shows both Normie and Web3 options
  - Can switch between wallets
  - MPC wallet now active with Web3 features
  - Normie wallet preserved with original features
  - Crypto segment indicators updated
  - All user data preserved after upgrade

## Installation & Setup

### 1. Install Dependencies

```bash
cd apps/mobile
pnpm install
```

Detox dependencies are already specified in `package.json`:
- `detox@^20.22.0`
- `detox-cli@^20.22.0`

### 2. Configuration Files

The following files have been created/configured:

#### `.detoxrc.json`
Detox configuration with iOS simulator setup:
- iPhone 15 simulator target
- Debug and Release build configurations
- Jest test runner integration

#### `jest.config.js`
Jest configuration for unit and E2E tests:
- React Native preset
- Module name mapping for internal packages
- Test path patterns for E2E tests
- Mock setup for React Native components

#### `jest.setup.js`
Jest setup file with mocks for:
- React Native Reanimated
- AsyncStorage
- React Navigation
- NativeEventEmitter

#### `babel.config.js` (Updated)
Modified to conditionally exclude `react-native-worklets-core/plugin` during testing:
```javascript
const isTestEnv = api.env(['test', 'jest']);
// ... plugin excluded during test runs
```

#### `.eslintrc.json`
ESLint configuration for React Native:
- TypeScript support
- React and React Native rules
- Jest environment

#### `package.json` (Updated)
New scripts and devDependencies:
```json
{
  "scripts": {
    "test": "jest",
    "test:e2e": "detox test --configuration ios.sim.debug --cleanup"
  },
  "devDependencies": {
    "detox": "^20.22.0",
    "detox-cli": "^20.22.0",
    "eslint": "^8.55.0",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-native": "^4.1.1"
  }
}
```

## Running E2E Tests

### Build the App for Testing

```bash
# Build for iOS simulator
npm run ios

# Or build via Xcode
xcodebuild -workspace ios/oryaWallet.xcworkspace \
  -scheme ORYA \
  -configuration Release \
  -sdk iphonesimulator \
  -derivedDataPath ios/build
```

### Run E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suite
npm run test:e2e -- --testNamePattern="Normie"

# Run with specific configuration
detox test --configuration ios.sim.debug

# Run with verbose output
detox test --configuration ios.sim.debug --verbose
```

### Run Unit Tests

```bash
npm test
```

## Test Structure

Each test suite follows this structure:

```typescript
import { device, element, by, expect as detoxExpect } from 'detox';

describe('Onboarding Flow - [Type]', () => {
  beforeAll(async () => {
    // Launch app before all tests
    await device.launchApp({ ... });
  });

  beforeEach(async () => {
    // Reload React Native before each test
    await device.reloadReactNative();
  });

  afterAll(async () => {
    // Clean up after all tests
    await device.sendUserInteraction({ type: 'background' });
  });

  it('should [specific assertion]', async () => {
    // Test implementation using Detox API
    await element(by.text('...')).waitForDisplayed({ timeout: 3000 });
    await detoxExpect(element(by.id('...'))).toBeVisible();
  });
});
```

## Detox API Reference

### Key Methods Used

- **`device.launchApp()`**: Launch the app
- **`device.reloadReactNative()`**: Reload React Native
- **`element(by.text('...'))`**: Find element by text
- **`element(by.id('...'))`**: Find element by test ID
- **`element(...).tap()`**: Tap/click element
- **`element(...).multiTap(n)`**: Multiple taps
- **`element(...).typeText('...')`**: Type text
- **`element(...).waitForDisplayed()`**: Wait for visibility
- **`detoxExpect(element(...)).toBeVisible()`**: Assert visibility
- **`detoxExpect(element(...)).not.toBeVisible()`**: Assert invisibility

## Redux State Verification

Tests verify Redux state at key points:

- **User Segment**: `user-segment-indicator-{segment}`
- **Wallet Type**: `wallet-type-{type}` (mpc, custodial, external)
- **Custody Model**: `custody-model-{model}`
- **Capabilities**: Feature-specific IDs (swap, stake, nft-gallery, defi-menu-item, card-feature)

## Critical Test IDs

The following test IDs should be added to components for proper E2E testing:

```
Screens:
- vault-screen
- intro-next-button, intro-get-started-button
- identity-option-{normie, crypto, external, institutional}

Forms:
- card-number-input, card-expiry-input, card-cvv-input
- recovery-phrase-display, copy-recovery-phrase-button
- recovery-word-{n}-input

Indicators:
- user-segment-indicator-{segment}
- custody-model-{model}
- wallet-type-{type}
- walletconnect-status

Features:
- send-button, receive-button
- swap-feature, stake-feature, nft-gallery
- defi-menu-item, card-widget
```

## Troubleshooting

### Issue: Detox command not found
**Solution**: Ensure `detox-cli` is installed globally or use `npx detox`
```bash
pnpm add -g detox-cli
```

### Issue: App build fails
**Solution**: Clean and rebuild Xcode project
```bash
cd ios
rm -rf build
xcodebuild -workspace oryaWallet.xcworkspace -scheme ORYA -configuration Release -sdk iphonesimulator -derivedDataPath build
cd ..
```

### Issue: Simulator not available
**Solution**: List available simulators and specify one
```bash
xcrun simctl list devices
# Update .detoxrc.json with device identifier
```

### Issue: Tests timeout
**Solution**: Increase timeout values in test configuration
```javascript
await element(...).waitForDisplayed({ timeout: 10000 }); // 10 seconds
```

## CI/CD Integration

To integrate with GitHub Actions:

```yaml
- name: Run E2E Tests
  run: |
    cd apps/mobile
    npm run test:e2e
  env:
    CI: true
```

## Performance Benchmarks

Target performance metrics:
- **Splash screen**: < 2 seconds
- **Intro screens**: < 1 second per screen navigation
- **Identity selection**: < 3 seconds to load
- **Social login**: < 5 seconds (simulated)
- **Card setup**: < 2 seconds form submission
- **Vault load**: < 1 second
- **Upgrade process**: < 5 seconds total

## Future Enhancements

- [ ] Add visual regression testing
- [ ] Add performance profiling
- [ ] Add accessibility testing
- [ ] Add API mocking for backend calls
- [ ] Add cross-device testing (Android)
- [ ] Add load testing scenarios
- [ ] Add network condition simulation (offline, slow 4G, etc.)
