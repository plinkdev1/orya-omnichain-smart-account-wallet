# ORŸA Mobile Deep Linking Guide

## Overview

The ORŸA mobile wallet implements deep linking to enable seamless wallet connections and transaction callbacks from external wallets like Phantom, MetaMask, and others.

## Configuration

### Deep Link Scheme
- **Custom Scheme**: `orya://`
- **Universal Links (iOS)**: `https://orya.app/wallet/*`, `https://wallet.orya.app/*`
- **App Links (Android)**: `https://orya.app/wallet/*`, `https://wallet.orya.app/*`

### App Configuration

Deep linking is configured in `app.json`:

```json
{
  "expo": {
    "scheme": "orya",
    "ios": {
      "bundleIdentifier": "com.orya.wallet",
      "associatedDomains": [
        "applinks:orya.app",
        "applinks:wallet.orya.app"
      ]
    },
    "android": {
      "package": "com.orya.wallet",
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "orya.app",
              "pathPrefix": "/wallet"
            },
            {
              "scheme": "https",
              "host": "wallet.orya.app"
            },
            {
              "scheme": "orya"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

## Deep Link Handlers

### Core Utility (`lib/deepLinking.ts`)

The deep linking utility provides:

1. **URL Parsing**: Parse incoming deep links
2. **Wallet Callbacks**: Handle wallet connection responses
3. **Transaction Callbacks**: Handle transaction status updates
4. **Redirect URI Generation**: Create callback URLs for external wallets

### Key Functions

#### `handleDeepLink(url: string)`
Main handler for all incoming deep links. Routes to appropriate screens based on URL path and parameters.

#### `handleWalletCallback(params: DeepLinkParams)`
Handles wallet connection callbacks with actions:
- `connect`: Wallet connection success
- `transaction`: Transaction status update
- `sign`: Signature request response

#### `createWalletConnectRedirectUri()`
Generates the redirect URI for wallet connections: `orya://wallet/callback`

#### `subscribeToDeepLinks(callback)`
Subscribes to deep link events and handles initial URL on app launch.

## Supported Deep Link Patterns

### Wallet Connection Callback
```
orya://wallet/callback?action=connect&address=0x123...&chain=ethereum
https://orya.app/wallet/callback?action=connect&address=0x123...&chain=ethereum
```

### Transaction Callback
```
orya://wallet/callback?action=transaction&txHash=0xabc...&status=success
https://orya.app/wallet/callback?action=transaction&txHash=0xabc...&status=pending
```

### Signature Callback
```
orya://wallet/callback?action=sign&status=success
orya://wallet/callback?action=sign&status=rejected
```

### Error Callback
```
orya://wallet/callback?error=user_rejected
https://orya.app/wallet/callback?error=connection_failed
```

## Integration with External Wallets

### Phantom Wallet
```typescript
const redirectUri = createWalletConnectRedirectUri();
const url = `https://phantom.app/ul/browse/${encodeURIComponent(
  `https://orya.app/connect?redirect=${redirectUri}`
)}`;
await Linking.openURL(url);
```

### MetaMask Mobile
```typescript
const redirectUri = createWalletConnectRedirectUri();
const url = `https://metamask.app.link/dapp/orya.app/connect?redirect=${encodeURIComponent(redirectUri)}`;
await Linking.openURL(url);
```

### OKX Wallet
```typescript
const redirectUri = createWalletConnectRedirectUri();
const url = `okx://wallet/dapp/url?dappUrl=${encodeURIComponent(
  `https://orya.app/connect?redirect=${redirectUri}`
)}`;
await Linking.openURL(url);
```

## Testing Deep Links

### iOS Simulator

#### Test Custom Scheme
```bash
xcrun simctl openurl booted "orya://wallet/callback?action=connect&address=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&chain=ethereum"
```

#### Test Universal Link
```bash
xcrun simctl openurl booted "https://orya.app/wallet/callback?action=connect&address=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&chain=ethereum"
```

### Android Emulator

#### Test Custom Scheme
```bash
adb shell am start -W -a android.intent.action.VIEW -d "orya://wallet/callback?action=connect&address=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&chain=ethereum" com.orya.wallet
```

#### Test App Link
```bash
adb shell am start -W -a android.intent.action.VIEW -d "https://orya.app/wallet/callback?action=connect&address=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&chain=ethereum" com.orya.wallet
```

### Physical Devices

#### iOS
1. Send the deep link URL via Messages, Notes, or Email
2. Tap the link to open the app
3. Or use Safari: Navigate to the URL and it should prompt to open the app

#### Android
1. Send the deep link URL via Messages, Email, or any app
2. Tap the link to open the app
3. Or use Chrome: Navigate to the URL and it should prompt to open the app

## Testing Wallet Connections

### Test Flow
1. Open ORŸA app
2. Navigate to **Onboarding → Connect External Wallet**
3. Select a wallet (e.g., Phantom, MetaMask)
4. App opens the external wallet
5. Approve connection in external wallet
6. External wallet redirects back to ORŸA with callback URL
7. ORŸA processes the callback and shows confirmation screen

### Mock Testing (Development)
For testing without actual wallet apps:

```bash
# iOS
xcrun simctl openurl booted "orya://wallet/callback?action=connect&address=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&chain=ethereum"

# Android
adb shell am start -W -a android.intent.action.VIEW -d "orya://wallet/callback?action=connect&address=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&chain=ethereum" com.orya.wallet
```

## Universal Links Setup (Production)

### iOS - Apple App Site Association (AASA)

Host this file at `https://orya.app/.well-known/apple-app-site-association`:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.orya.wallet",
        "paths": ["/wallet/*"]
      }
    ]
  }
}
```

Replace `TEAM_ID` with your Apple Developer Team ID.

### Android - Digital Asset Links

Host this file at `https://orya.app/.well-known/assetlinks.json`:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.orya.wallet",
      "sha256_cert_fingerprints": [
        "YOUR_APP_SHA256_FINGERPRINT"
      ]
    }
  }
]
```

Get your SHA256 fingerprint:
```bash
keytool -list -v -keystore your-release-key.keystore
```

## Troubleshooting

### Deep Links Not Working

1. **Check URL Format**: Ensure the URL matches the configured patterns
2. **Verify App Installation**: App must be installed on the device
3. **iOS Universal Links**: Verify AASA file is accessible and valid
4. **Android App Links**: Verify assetlinks.json is accessible and valid
5. **Check Logs**: Look for `[DeepLink]` logs in console

### Wallet Not Opening

1. **Check Wallet Installation**: Ensure the external wallet is installed
2. **Verify URL Scheme**: Check if the wallet supports the URL scheme
3. **Test with `Linking.canOpenURL()`**: Verify the URL can be opened

### Callback Not Received

1. **Check Redirect URI**: Ensure the redirect URI is correctly formatted
2. **Verify Deep Link Handler**: Check if `subscribeToDeepLinks` is active
3. **Test Manually**: Use command-line tools to test the callback URL

## Security Considerations

1. **Validate Callback Data**: Always validate addresses and transaction hashes
2. **User Confirmation**: Require user confirmation for sensitive actions
3. **HTTPS Only**: Use HTTPS for universal/app links in production
4. **Domain Verification**: Enable `autoVerify` for Android app links
5. **Error Handling**: Handle malformed URLs and invalid parameters gracefully

## References

- [Expo Linking Documentation](https://docs.expo.dev/guides/linking/)
- [iOS Universal Links](https://developer.apple.com/ios/universal-links/)
- [Android App Links](https://developer.android.com/training/app-links)
- [WalletConnect Deep Linking](https://docs.walletconnect.com/2.0/mobile-linking)
