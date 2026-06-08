# IKA 2PC-MPC Zero-Trust Architecture (CORRECTED PHASE 3.D)

## Overview

IKA is a **decentralized, on-chain protocol** running on Sui blockchain for implementing enterprise-grade zero-trust wallet architecture. This document describes the **corrected implementation** that fixes previous incorrect assumptions about IKA being a centralized API-based service.

## Key Correction: IKA Is Fully Decentralized

### ❌ WRONG (Previous Architecture)
- IKA treated as centralized API service with API keys
- Backend HTTP endpoints like `/api/ika-mpc/*`
- Authentication via `X-IKA-API-Key` headers
- **This violated IKA's actual decentralized design**

### ✅ CORRECT (Current Architecture)
- IKA is a **decentralized on-chain protocol** on Sui
- **NO API KEYS required**
- All interactions through Sui smart contracts
- User encryption keys managed locally
- Network coordination happens on-chain

## Architecture Overview

```
User Action
    ↓
UserShareEncryptionKeys (User's Ed25519 Keypair + Encryption Keys)
    ↓
IKA Smart Contracts on Sui (On-chain MPC coordination)
    ↓
Distributed Key Generation (DKG) - 4 Steps
    ↓
Zero-Trust dWallet Created (Keys never exist in full)
    ↓
Sign Transactions (Presign + Sign pattern)
```

## Service Components

### 1. **IkaClientService** (Singleton)
**Location**: `services/ika/ika-client.service.ts`

Manages the connection to the IKA SDK and Sui network.

```typescript
const ikaService = IkaClientService.getInstance({
  network: 'testnet',
  suiRpcUrl: 'https://fullnode.testnet.sui.io' // optional custom RPC
});

await ikaService.initialize();
const client = ikaService.getClient();
const suiClient = ikaService.getSuiClient();
```

**Key Features**:
- Singleton pattern - one instance per app
- Lazy initialization
- Network configuration
- Cache invalidation support

### 2. **UserKeysService**
**Location**: `services/ika/user-keys.service.ts`

Manages user's local encryption keys derived from a root seed.

```typescript
const userKeysService = new UserKeysService();

// Initialize from secure random seed
const seed = generateSecureRandomSeed(); // 32 bytes
const keys = await userKeysService.initializeFromSeed(seed);

// Get user's Sui address
const suiAddress = userKeysService.getSuiAddress();

// Get public key
const pubKey = userKeysService.getPublicKeyBytes();

// Serialize for storage
const serialized = userKeysService.serializeKeys();

// Restore from storage
const restoredKeys = await newService.initializeFromBytes(serialized);
```

**Security Properties**:
- Keys derived from 32-byte root seed (SECP256K1 curve)
- Keys never exist in full - only shares
- Public key derivable but private key compartmentalized
- Signature verification support

### 3. **KeyStorageService**
**Location**: `services/ika/key-storage.service.ts`

Securely encrypts and stores user keys in browser localStorage.

```typescript
const storage = new KeyStorageService();

// Store encrypted keys
await storage.storeKeys(serializedKeys, userPassword);

// Retrieve and decrypt keys
const decryptedKeys = await storage.retrieveKeys(userPassword);

// Check if keys exist
if (storage.hasStoredKeys()) {
  // Load keys on app startup
}

// Clear on logout
storage.clearKeys();
```

**Encryption Details**:
- PBKDF2 key derivation from user password
- AES-GCM encryption with random IV
- 100,000 PBKDF2 iterations
- Salt stored separately
- **Note**: For production, use hardware security module (HSM)

### 4. **IKAMPCService**
**Location**: `services/ika-mpc.ts`

Orchestrates 2PC-MPC signing using IKA protocol.

```typescript
const ikaService = new IKAMPCService(ikaClient);
await ikaService.initialize();

// Initialize wallet
const wallet = await ikaService.initializeWallet(userId, privyWalletId);

// Create signing session
const session = await ikaService.createSigningSession(
  shareId,
  transactionData,
  { metadata: 'optional' }
);

// Combine signatures from Privy + IKA
const finalSignature = await ikaService.combineSignatures({
  sessionId: session.id,
  signatures: [privySignature, ikaSignature],
  threshold: 2
});
```

### 5. **PrivyIKABridge**
**Location**: `services/privy-ika-bridge.ts`

Bridges Privy (user device) with IKA (network) for enhanced wallets.

```typescript
const bridge = new PrivyIKABridge({
  privyService,
  ikaMPCService,
  auditLogging: true
});

// Create enhanced wallet (Privy + IKA)
const enhanced = await bridge.createEnhancedWallet(userId, 'sui');

// Sign transaction with 2PC
const result = await bridge.signTransactionEnhanced({
  privyWalletId: enhanced.privyWalletId,
  ikaShareId: enhanced.ikaShareId,
  transaction: txData
});

// Verify ownership
const isValid = await bridge.verifyWalletOwnership(
  privyWalletId,
  ikaShareId,
  challenge
);
```

## Wallet Types

ORYA supports three wallet types:

### 1. **Standard Wallet** (Default)
- Uses only Privy MPC
- Single device key management
- **Recommended for**: Most users, casual trading

### 2. **Enhanced Wallet** (Privy + IKA)
- 2-of-2 threshold signature
- Privy Share 1 (device) + IKA Share 2 (network)
- No single entity has full key
- **Recommended for**: Power users, large positions, institutional

### 3. **Human Network Wallet** (Alternative)
- Proof-of-humanity verification
- Community-governed security
- **Recommended for**: Privacy-conscious users

## Configuration

### Environment Variables

```bash
# ✅ REQUIRED
NEXT_PUBLIC_SUI_NETWORK=testnet            # testnet|mainnet|devnet
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.testnet.sui.io

# ✅ OPTIONAL
DEFAULT_WALLET_TYPE=enhanced               # standard|enhanced|human-network
ENABLE_IKA_ZERO_TRUST=true                 # enable IKA features

# ❌ REMOVED (WRONG ARCHITECTURE)
# IKA_API_KEY - NO LONGER NEEDED
# IKA_NETWORK - USE NEXT_PUBLIC_SUI_NETWORK INSTEAD
# IKA_PRIVY_INTEGRATION - HANDLED INTERNALLY
```

## Initialization Flow

### App Startup

```typescript
// 1. Initialize IKA services
const ikaService = IkaClientService.getInstance({
  network: (process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet') as IkaNetwork,
  suiRpcUrl: process.env.NEXT_PUBLIC_SUI_RPC_URL,
});
await ikaService.initialize();

// 2. Load stored user keys (if they exist)
const storage = new KeyStorageService();
if (storage.hasStoredKeys()) {
  const encrypted = await storage.retrieveKeys(userPassword);
  const userKeysService = new UserKeysService();
  await userKeysService.initializeFromBytes(encrypted);
}
```

### User Registration

```typescript
// 1. Create Privy wallet
const privyWallet = await privyService.createEmbeddedWallet('sui');

// 2. Generate user encryption keys
const userKeysService = new UserKeysService();
const seed = generateSecureRandomSeed();
const keys = await userKeysService.initializeFromSeed(seed);

// 3. Store encrypted keys
const serialized = userKeysService.serializeKeys();
await keyStorage.storeKeys(serialized, userPassword);

// 4. Initialize IKA wallet
const ikaWallet = await ikaMpcService.initializeWallet(userId, privyWallet.id);

// 5. Link wallets
const enhanced = await bridge.createEnhancedWallet(userId, 'sui');
```

### Transaction Signing

```typescript
// 1. Get Privy signature
const privySignature = await privyService.signTransaction({
  walletId: enhanced.privyWalletId,
  transaction: txData,
  chainType: 'sui'
});

// 2. Create IKA signing session
const session = await ikaMpcService.createSigningSession(
  enhanced.ikaShareId,
  transactionData
);

// 3. Combine signatures (2-of-2 threshold)
const finalSignature = await ikaMpcService.combineSignatures({
  sessionId: session.id,
  signatures: [privySignature, session.ikaSignature],
  threshold: 2
});

// 4. Broadcast to Sui network
await suiClient.sendSignedTransaction(finalSignature);
```

## Security Properties

### Zero-Trust Guarantees
- ✅ Private keys **never transmitted** over network
- ✅ Private keys **never exist in full** anywhere
- ✅ Each signing requires **2-of-2 consensus** (Privy + IKA)
- ✅ Compromise of one share **cannot result in key exposure**

### Key Compartmentalization
```
User Device (Privy)              Sui Network (IKA)
    ↓                                ↓
Share 1                          Share 2
(User's Ed25519)                 (Distributed)
    ↓                                ↓
[XOR or Shamir] ←→ 2PC-MPC ←→ [Distributed]
    ↓                                ↓
Presign Signature             MPC Computation
    ↓                                ↓
Combined Signature = Presign XOR MPC Signature
```

### Session Expiry
- Signing sessions expire after 5 minutes
- Challenge-response proves ownership
- Audit logging for all operations

## Migration from Standard to Enhanced

```typescript
async function upgradeToEnhanced(userId: string) {
  // 1. User already has Privy wallet (standard)
  const privyWallet = await privyService.getWallet(userId);
  
  // 2. Generate IKA share
  const userKeys = new UserKeysService();
  const seed = generateSecureRandomSeed();
  await userKeys.initializeFromSeed(seed);
  
  // 3. Link wallets
  const enhanced = await bridge.createEnhancedWallet(userId, 'sui');
  
  // 4. Store keys
  const serialized = userKeys.serializeKeys();
  await keyStorage.storeKeys(serialized, userPassword);
  
  return enhanced;
}
```

## Wallet Recovery

```typescript
async function recoverWallet(userId: string, recoveryCode: string) {
  // Recovery requires:
  // 1. Knowledge of user password
  // 2. Recovery code stored securely
  // 3. Privy account recovery
  
  const recovered = await bridge.recoverEnhancedWallet(userId, recoveryCode);
  return recovered;
}
```

## Optional Feature Flag

IKA is an **optional feature** for power users. Enable via:

```bash
ENABLE_IKA_ZERO_TRUST=true
```

When disabled:
- Standard Privy wallets only
- No IKA SDK initialization
- No additional complexity

When enabled:
- Enhanced wallet option during onboarding
- Zero-trust option during settings
- Full 2PC-MPC architecture available

## Error Handling

```typescript
try {
  const signature = await bridge.signTransactionEnhanced(request);
} catch (error) {
  if (error.message.includes('Not enough signatures')) {
    // Threshold not met
  } else if (error.message.includes('Session expired')) {
    // Create new session and retry
  } else if (error.message.includes('Privy signature failed')) {
    // User rejected on device
  } else if (error.message.includes('IKA share offline')) {
    // Network issue with IKA
  }
}
```

## Testing

```typescript
// packages/wallet-core/src/services/ika/__tests__/

describe('IKA Integration', () => {
  it('should initialize IKA client', async () => {
    const service = IkaClientService.getInstance({ network: 'testnet' });
    await service.initialize();
    expect(service.isInitialized()).toBe(true);
  });

  it('should create user keys from seed', async () => {
    const userKeys = new UserKeysService();
    const seed = generateSecureRandomSeed();
    const keys = await userKeys.initializeFromSeed(seed);
    expect(userKeys.getSuiAddress()).toMatch(/^0x[a-f0-9]+$/);
  });

  it('should encrypt and decrypt keys', async () => {
    const storage = new KeyStorageService();
    const data = new Uint8Array(32);
    await storage.storeKeys(data, 'password123');
    const retrieved = await storage.retrieveKeys('password123');
    expect(retrieved).toEqual(data);
  });
});
```

## Future Enhancements

1. **3-of-3 Threshold** (coming soon)
   - Privy Share 1 + IKA Share 2 + User Guardian Share 3
   - Enhanced security for institutional users

2. **Account Recovery Chains** (coming soon)
   - Social recovery with guardians
   - Timelock contracts

3. **Cross-Chain Support** (coming soon)
   - EVM + Solana + Aptos + Cosmos
   - Unified identity across chains

## Summary

| Aspect | Standard | Enhanced |
|--------|----------|----------|
| Backend | Privy only | Privy + IKA |
| Threshold | Single device | 2-of-2 |
| Key Shares | 1 location | 2 locations |
| Security | Device MPC | Device + Network MPC |
| Complexity | Simple | Enterprise |
| Recommended For | General users | Power users |

---

**Version**: 3.0.0 (Corrected)  
**Last Updated**: 2024  
**Status**: Stable for Sui mainnet
