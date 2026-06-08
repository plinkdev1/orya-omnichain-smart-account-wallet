# Unified Type Architecture: ORŸA Wallet Advanced Features

## Overview

This document describes the unified type system architecture for advanced wallet features across ORŸA's multi-blockchain, multi-custody platform. The system integrates multi-signature management, account abstraction (ERC-4337), session-based authorization, recovery mechanisms, and cross-chain bridging.

**Last Updated**: 2025-11-13  
**Type Modules**: 4 new modules + 10 existing modules  
**Total Type Definitions**: 150+ interfaces and enums

---

## Core Architecture Layers

### Layer 1: Foundation Types (`common.types.ts`)
Base types used across all domains:
- **UUID**: Unique identifiers for resources
- **Address**: Blockchain addresses with type safety
- **Hash**: Transaction/message hashes
- **Result<T, E>**: Error handling pattern
- **ErrorCode**: Standardized error enumeration

### Layer 2: Blockchain Configuration (`chain.types.ts`, `blockchain-config.ts`)
Chain support and capabilities:
- **ChainType**: 20+ supported chains (SUI, Ethereum, Solana, etc.)
- **BlockchainConfig**: Feature availability per chain
- **BlockchainAdapter**: Integration method (native, Privy, Safe, custom)
- **BlockchainFeature**: Capability flags (swap, stake, bridge, defi, nft)

### Layer 3: Wallet Infrastructure (`wallet.types.ts`, `wallet-profile.types.ts`)
Core wallet entities:
- **WalletProfile**: User segmentation (Normie, Crypto Native, Institutional)
- **Wallet**: Individual wallet instances with capabilities
- **CustodyModel**: Custody types (Self, Semi, Custodial)
- **WalletTypeEnum**: Wallet variants per user segment
- **WalletCapabilities**: Feature permissions per wallet

### Layer 4: Advanced Features
New capabilities built on foundation layers.

---

## Type Module Integration Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                      WALLET ECOSYSTEM                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────┐      ┌──────────────────────┐              │
│  │   MULTI-SIGNATURE    │      │ ACCOUNT ABSTRACTION  │              │
│  │   (multi-sig.types)  │      │     (aa.types)       │              │
│  ├──────────────────────┤      ├──────────────────────┤              │
│  │ • MultiSigWallet     │      │ • SmartAccount       │              │
│  │ • MultiSigSigner     │      │ • UserOperation      │              │
│  │ • TransactionProposal│      │ • EntryPoint         │              │
│  │ • SignatureThreshold │      │ • Paymaster          │              │
│  │ • CustodyRecovery    │      │ • ModuleConfig       │              │
│  └──────────────────────┘      └──────────────────────┘              │
│          │                              │                             │
│          └──────────────┬───────────────┘                             │
│                         │                                             │
│                  ┌──────▼──────┐                                      │
│                  │   FOUNDATION │                                      │
│                  │   WALLET     │                                      │
│                  │   LAYER      │                                      │
│                  └──────┬───────┘                                      │
│                         │                                             │
│          ┌──────────────┼──────────────┐                              │
│          │              │              │                              │
│  ┌───────▼────────┐  ┌──▼─────────┐  ┌─▼──────────────┐              │
│  │ADVANCED FEATURE│  │ BRIDGING   │  │  SESSION &     │              │
│  │  (advanced)    │  │ (bridge)   │  │  RECOVERY      │              │
│  ├────────────────┤  ├────────────┤  │ (advanced)     │              │
│  │ • SessionKey   │  │ • Bridge   │  ├────────────────┤              │
│  │ • Permission   │  │   Tx       │  │ • SessionKey   │              │
│  │ • Recovery     │  │ • Atomic   │  │ • Authorization│              │
│  │ • Auth Policy  │  │   Swap     │  │   Policy       │              │
│  └────────────────┘  │ • Fee      │  │ • Recovery     │              │
│                      │   Agg      │  │   Policy       │              │
│                      └────────────┘  └────────────────┘              │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Type Relationships and Data Flows

### 1. Multi-Signature (Custody) Layer

**Primary Types**:
- `MultiSigWallet`: Container for M-of-N signing scheme
- `MultiSigSigner`: Individual signer with role and type
- `TransactionProposal`: Transaction awaiting signatures
- `SignatureThreshold`: M-of-N tuple (e.g., "2-of-3")
- `CustodyType`: Custody model enumeration
- `SignerRole`: Role-based permissions (Owner, Approver, Executor, etc.)

**Data Flow**:
```
1. User creates MultiSigWallet with config
   └─> MultiSigConfig (threshold, signers, custodyModel)

2. Create TransactionProposal for MultiSigWallet
   └─> TransactionProposal (requires threshold signatures)

3. Collect signatures from MultiSigSigners
   └─> TransactionSignature (per signer, with status)

4. Execute when signatures >= threshold
   └─> MultiSigAuditEntry (track all actions)
```

**Backward Compatibility**:
- Extends existing `Wallet.multiSigEnabled: boolean`
- Compatible with `CustodyModel` enum in wallet-profile.types.ts
- Integrates with IKA-MPC for key share management

---

### 2. Account Abstraction (ERC-4337) Layer

**Primary Types**:
- `UserOperation`: ERC-4337 standard transaction
- `EntryPointConfig`: Contract deployment info
- `SmartAccountConfig`: Smart contract account setup
- `PaymasterConfig`: Sponsorship configuration
- `AAWallet` (from zkSync-aa-sdk): AA execution wrapper

**Data Flow**:
```
1. Create SmartAccountConfig on specific chain
   └─> Register with EntryPointConfig

2. Prepare UserOperation with callData
   └─> UserOperationWithMetadata (extended with status/hash)

3. Optional: Get Paymaster sponsorship
   └─> PaymasterConfig validates sponsorship rules

4. Submit to bundler
   └─> UserOperationBundle (batched submissions)

5. Track execution on chain
   └─> AAuditEntry (all account activities)
```

**Interaction with Multi-Sig**:
```
MultiSigWallet can be the owner/validator of SmartAccount:

SmartAccountConfig {
  owners: [MultiSigWallet.address],
  factoryAddress: AAFactory
}

When executing through AA:
UserOperation.signature = MultiSigWallet.collectSignatures()
```

---

### 3. Advanced Features (Sessions, Policies, Recovery) Layer

**Primary Types**:
- `SessionKey`: Temporary access grants with permissions
- `AuthorizationPolicy`: Rule enforcement (rate limits, whitelists, etc.)
- `ProgrammableAuthorization`: Named authorization configurations
- `RecoveryPolicy`: Account recovery setup
- `SessionKeyRequest`: Creation request parameters

**Data Flow**:

#### 3.1 Session-Based Execution
```
1. Create SessionKey for specific permissions
   └─> SessionKeyRequest (walletAddress, permissions, duration)

2. Attach AuthorizationPolicies to session
   └─> RateLimitPolicy, ValueLimitPolicy, WhitelistPolicy, etc.

3. Use SessionKey for transactions
   └─> Policies automatically validate each operation

4. Session expires after duration or explicit revocation
   └─> AdvancedFeaturesAuditEntry logs usage
```

#### 3.2 Recovery Activation
```
1. Set up RecoveryPolicy on wallet
   └─> Select policy type (Social, Guardian, Time-Lock, Backup Key, etc.)

2. Configure recovery requirements
   └─> Set guardians, thresholds, time locks

3. If needed, initiate RecoverySession
   └─> Guardians/signers approve recovery

4. After approval + time lock, execute recovery
   └─> New owner/signer takes control
```

**Permission Hierarchy**:
```
Wallet
├── SessionKey (limited access, time-bound)
│   ├── SessionKeyPermission[] (TRANSFER, SWAP, STAKE, BRIDGE, etc.)
│   └── AuthorizationPolicy[] (rate limits, value limits, whitelist, etc.)
│
├── ProgrammableAuthorization (named policies, reusable)
│   ├── Scope (functions, contracts, operations)
│   └── AuthorizationPolicy[]
│
└── RecoveryPolicy (emergency access)
    ├── RecoveryMethod[] (primary + fallback)
    └── Guardians/Recovery mechanisms
```

---

### 4. Cross-Chain Bridging Layer

**Primary Types**:
- `BridgeTransaction`: Individual cross-chain transfer
- `BridgeQuote`: Fee and route estimation
- `BridgeRoute`: Multi-hop routing information
- `AtomicSwap`: Bridge + DEX swap combination
- `FeeAggregatorConfig`: Multi-protocol optimization

**Data Flow**:
```
1. Request BridgeQuote for source→destination + token
   └─> FeeAggregatorConfig evaluates multiple protocols

2. Quote returns optimal route with fees
   └─> BridgeRoute (can have multiple RouteSteps)
   └─> BridgeFee breakdown (protocol, relayer, gas, LP, etc.)

3. User approves quote and initiates transfer
   └─> BridgeTransaction created with status=INITIATED

4. Track cross-chain settlement
   └─> Status: SUBMITTED → CONFIRMED → BRIDGING → COMPLETED

5. For AtomicSwaps, combine bridge + destination swap
   └─> AtomicSwapExecution tracks both operations
```

**Integration with Multi-Sig/AA**:
```
BridgeTransaction can be:
- Initiated by MultiSigWallet (requires proposal + signatures)
- Executed via UserOperation (AA sender)
- Controlled by SessionKey (with bridge permission)
```

---

## Custody and Signing Flow

### End-to-End Custody Model

```
WALLET CREATION
├─ User Segment: Normie / CryptoNative / Institutional
├─ CustodyModel: Self / Semi / Custodial
└─ WalletType: Normie_Everyday / SUI_Native_Self / External / Inst_Suite

CUSTODY IMPLEMENTATION
├─ Self-Custody (User holds keys)
│  └─> Optional: MultiSigWallet for extra security
│
├─ Semi-Custody (Shared control)
│  ├─> MultiSigWallet (e.g., 2-of-3 with user + provider + backup)
│  └─> RecoveryPolicy with social recovery
│
└─ Custodial (Provider control)
   ├─> User cannot directly sign
   ├─> SessionKeys grant temporary permissions
   └─> Recovery through guardians/backup keys

SIGNING FLOWS

Flow 1: Simple EOA
  Transaction → Sign → Submit

Flow 2: Multi-Signature
  Transaction → Create Proposal → Collect Signatures → Execute

Flow 3: Smart Account (AA)
  UserOperation → Validation → Bundler → Include in bundle → Execute

Flow 4: Session-Based
  Transaction → Check SessionKey → Validate Policies → Sign → Submit

Flow 5: Hybrid (Multi-Sig + AA + Session)
  SessionKey creates UserOperation
  └─> SmartAccount has MultiSigWallet as owner/validator
  └─> Requires M-of-N signatures from MultiSigWallet
```

---

## Authorization Policy Architecture

### Policy Composition

```
AuthorizationPolicy (Abstract Type)
├── RateLimitPolicy: Max ops per time window
├── ValueLimitPolicy: Max transaction value
├── WhitelistPolicy: Allowed addresses
├── BlacklistPolicy: Blocked addresses
├── TimeLockPolicy: Execution delays
├── GasLimitPolicy: Max gas constraints
├── NonceBasedPolicy: Sequential execution
└── ConditionalPolicy: Custom logic/oracles

Applied To:
├── SessionKeys (temporary access with constraints)
├── ProgrammableAuthorization (reusable rules)
└── Wallet level (global constraints)

Validation Flow:
  Operation Request
  └─> Check all applicable policies
  └─> All must pass or transaction fails
```

---

## Recovery Architecture

### Multi-Layer Recovery Strategy

```
PRIMARY RECOVERY MECHANISMS
├── Backup Key (encrypted, stored securely)
├── Hardware Wallet Link (Ledger, Trezor)
├── Guardian-Based (trusted contacts/institutions)
├── Social Recovery (friends approve together)
├── Time-Lock Recovery (self-recovery after delay)
└── Multi-Sig Recovery (M-of-N signers approve)

RECOVERY SESSION FLOW
1. Initiate Recovery
   ├─ Verify recovery policy type
   └─ Create RecoverySession

2. Guardian Approval Phase
   ├─ Send recovery requests to guardians
   ├─ Collect signatures/approvals
   └─ Check quorum met

3. Time-Lock Phase
   ├─ Start execution delay
   └─ Track confirmations

4. Execution
   ├─ Execute recovery transaction
   └─ Update wallet owner/signers

HYBRID RECOVERY
  RecoveryPolicy {
    methods: [
      { type: 'social_recovery', priority: 1 },
      { type: 'time_lock_recovery', priority: 2 },
      { type: 'backup_key', priority: 3 }
    ],
    mode: 'priority_based'
  }
  → Try social first, fallback to time-lock, then backup
```

---

## Cross-Module Type Interactions

### Common Patterns

#### 1. Address Authority Resolution
```
Transaction execution checks:
1. Direct EOA signature (simple)
2. Multi-sig approval (MultiSigWallet)
3. AA validation (SmartAccount)
4. Session key authorization (SessionKey)
5. Recovery policy authorization (RecoveryPolicy)

First matching authority approves execution
```

#### 2. Fee Aggregation
```
BridgeFee combines:
- Protocol fees (required by bridge)
- Relayer fees (incentivize bundlers)
- Gas fees (on-chain execution)
- LP fees (liquidity provision)
- Slippage (market impact)
- Insurance (optional protection)

Total presented to user for approval
```

#### 3. Error Propagation
```
AppError (base)
├── WalletError (general wallet failures)
├── TransactionError (tx-specific issues)
├── NetworkError (connectivity issues)
└── Custom: MultiSigError, AAError, BridgeError, RecoveryError
```

---

## Implementation Examples

### Example 1: Multi-Sig Institutional Wallet with AA

```typescript
// Setup
const wallet = await createWallet({
  userSegment: UserSegment.INSTITUTIONAL,
  custodyModel: CustodyModel.SEMI_CUSTODY,
  walletType: WalletTypeEnum.INSTITUTIONAL_SUITE,
});

// Create Multi-Sig
const multiSigWallet = await createMultiSigWallet({
  threshold: '3-of-5',
  signers: [
    { address: cfo, role: SignerRole.FINANCIAL_OFFICER },
    { address: coo, role: SignerRole.APPROVER },
    { address: owner1, role: SignerRole.OWNER },
    { address: owner2, role: SignerRole.OWNER },
    { address: backup, role: SignerRole.BACKUP },
  ],
  custodyModel: CustodyModel.MULTI_SIG_3OF5,
});

// Setup Smart Account with Multi-Sig as owner
const smartAccount = await createSmartAccount({
  type: SmartAccountType.MULTI_OWNER,
  owners: [multiSigWallet.address],
  entryPoint: ENTRY_POINT_ADDRESS,
});

// Propose transaction through AA
const userOp = await createUserOperation({
  sender: smartAccount.address,
  callData: encodeFunctionCall(...),
});

// Collect multi-sig approvals
const proposal = await multiSigWallet.proposeTransaction(userOp.callData);
await collectSignatures(proposal); // Requires 3-of-5

// Execute through AA when signatures collected
await submitUserOperation(userOp);
```

### Example 2: Self-Custody with Session Keys and Recovery

```typescript
// Setup wallet
const wallet = await createWallet({
  userSegment: UserSegment.CRYPTO_NATIVE,
  custodyModel: CustodyModel.SELF_CUSTODY,
});

// Create session key for dapp with restrictions
const sessionKey = await createSessionKey({
  walletAddress: wallet.address,
  permissions: [SessionKeyPermission.SWAP, SessionKeyPermission.TRANSFER],
  durationSeconds: 3600, // 1 hour
  authorizationPolicies: [
    {
      type: AuthorizationPolicyType.VALUE_LIMIT,
      params: { maxValueUsd: 1000, scope: 'per_transaction' },
    },
    {
      type: AuthorizationPolicyType.WHITELIST,
      params: { allowedAddresses: [dappAddress], allowContracts: true },
    },
  ],
});

// Use session key for trading
const swap = await executeThroughSessionKey(sessionKey, {
  permission: SessionKeyPermission.SWAP,
  value: 500, // USD
  targetAddress: dappAddress,
});

// Setup recovery
const recoveryPolicy = await createRecoveryPolicy({
  walletAddress: wallet.address,
  policyType: RecoveryPolicyType.HYBRID,
  config: {
    methods: [
      {
        type: RecoveryPolicyType.SOCIAL_RECOVERY,
        guardians: [friend1, friend2, friend3],
        requiredApprovals: 2,
      },
      {
        type: RecoveryPolicyType.BACKUP_KEY,
        // ... backup key encrypted and stored
      },
    ],
  },
});
```

### Example 3: Cross-Chain Atomic Swap

```typescript
// Get bridge quote
const quote = await getBridgeQuote({
  sourceChain: ChainType.ETHEREUM,
  destinationChain: ChainType.POLYGON,
  tokenAddress: USDC_ADDRESS,
  inputAmount: '1000',
});

// Initiate atomic swap (bridge + swap)
const atomicSwap = await executeAtomicSwap({
  sourceChain: ChainType.ETHEREUM,
  destinationChain: ChainType.POLYGON,
  inputToken: USDC_ADDRESS,
  outputToken: USDT_ADDRESS, // Different stablecoin on dest
  inputAmount: quote.inputAmount,
  dexProvider: 'uniswap',
  settlement: 'instant',
});

// Can be controlled by:
// - Direct wallet signature
// - Multi-sig approval
// - Session key (if bridge permission granted)
// - Smart account through UserOperation
```

---

## Integration Points with Existing Code

### Compatibility Matrix

| Existing Type | New Type Integration | Notes |
|---|---|---|
| `Wallet` | All layers | Base entity, extended capabilities |
| `CustodyModel` | Multi-Sig, AA, Recovery | Determines signing flow |
| `WalletProfile` | Advanced Features | Controls feature access |
| `Transaction` | Bridge, Multi-Sig | Extended with custody data |
| `IKAMPCService` | Multi-Sig, Session Keys | Key share management |
| `DeFiProtocol` | Bridge Atomic Swaps | Available destination swaps |
| `ChainType` | Bridge, AA | Multi-chain support matrix |

### API Surface Additions

**wallet-core/services/**:
- `multisig.ts`: Multi-sig operations (already exists, types formalized)
- `account-abstraction.ts`: AA operations
- `advanced-features.ts`: Sessions, policies, recovery
- `bridge.ts`: Cross-chain operations

**Hooks** (wallet-core/hooks/):
- `useMultiSig()`: Multi-sig state + actions
- `useSmartAccount()`: AA state + operations
- `useSessionKey()`: Session key management
- `useRecovery()`: Recovery policy operations
- `useBridge()`: Bridge quote and execution

---

## Validation and Type Safety

### Type Definitions Included

| Module | Interfaces | Enums | Total |
|---|---|---|---|
| multi-sig.types | 13 | 7 | 20 |
| account-abstraction.types | 12 | 3 | 15 |
| advanced-features.types | 16 | 6 | 22 |
| bridge.types | 14 | 6 | 20 |
| **Total New** | **55** | **22** | **77** |
| Existing types | ~80 | ~15 | ~95 |
| **Grand Total** | **135** | **37** | **172** |

### Build Validation

All types validated through:
1. TypeScript strict mode (`tsconfig.json`)
2. ESLint type checking
3. Build-time compilation
4. Runtime serialization tests

```bash
# Commands to validate
pnpm build              # Compile all types
pnpm typecheck          # Full type check
pnpm test               # Runtime validation
```

---

## Backward Compatibility

### Breaking Changes: NONE

- All new types are in separate modules
- Existing types unchanged
- Optional feature adoption
- Gradual migration path

### Migration Path

1. **Existing wallets**: Continue working without changes
2. **New multi-sig**: Use `MultiSigWallet` types
3. **AA adoption**: Opt into `SmartAccount` types
4. **Session keys**: Use for new apps/features
5. **Cross-chain**: Use `Bridge` types for routes

---

## Future Extensions

### Planned Enhancements

1. **Threshold Cryptography**: Native Verifiable Threshold Signatures
2. **ZK Proofs**: Privacy-preserving operations
3. **DAO Governance**: Treasury management types
4. **Inscription Support**: Bitcoin/Ordinals integration
5. **Cross-Chain Liquidity**: Unified pool types

### Extension Points

- `AuthorizationPolicy` polymorphism: Add new policy types
- `RecoveryPolicyType`: Add new recovery mechanisms
- `BridgeProtocol`: Add new bridge protocols
- `SessionKeyPermission`: Add new operations
- `SmartAccountType`: Add new account implementations

---

## Summary

This unified architecture provides:

✅ **Type Safety**: Full TypeScript coverage across custody, signing, and bridging  
✅ **Extensibility**: Polymorphic types allow new features without breaking changes  
✅ **Interoperability**: Clear data flows between modules  
✅ **Backward Compatibility**: Optional adoption of new features  
✅ **Enterprise Ready**: Multi-sig, AA, recovery, and compliance-ready  
✅ **Multi-Chain**: All chains supported through unified interface  
✅ **Developer Experience**: JSDoc annotations, clear examples, IDE support  

---

## References

- **ERC-4337**: Account Abstraction (https://eips.ethereum.org/EIPS/eip-4337)
- **Safe Contracts**: Multi-sig Reference (https://safe.global)
- **Layerzero**: Cross-chain Protocol (https://layerzero.network)
- **Session Keys**: ERC-7739 (Draft)
- **Social Recovery**: Vitalik's Vision (https://ethresear.ch/)
