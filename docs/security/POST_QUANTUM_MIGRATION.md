# Post-Quantum Cryptography Migration Guide

**Last Updated**: November 2025  
**Severity**: High (Future-Proofing)  
**Responsibility**: Security / Cryptography Team

## Executive Summary

Quantum computers will break current elliptic curve cryptography (ECDSA, EdDSA) and RSA encryption within 10-20 years. ORŸA is preparing a **multi-year migration path** to post-quantum cryptographic algorithms to ensure long-term security.

### Timeline
- **2025 Q4**: Migration planning & feasibility study
- **2026 Q1-Q2**: Hybrid key generation & testing
- **2026 Q3-Q4**: Gradual rollout to new clients
- **2027-2028**: Deprecation of classical-only keys
- **2028+**: Full post-quantum infrastructure

## Current State: Pre-Migration

### Classical Cryptography Used

| Use Case | Current Algorithm | Key Size | Risk Window |
|----------|-------------------|----------|-------------|
| **Wallet Key Derivation** | BIP-32 (secp256k1) | 256-bit | 10-15 years |
| **Transaction Signing** | ECDSA (secp256k1) | 256-bit | 10-15 years |
| **API Authentication** | HMAC-SHA256 | 256-bit | Safe (hash-based) |
| **TLS Connections** | ECDHE (P-256) | 256-bit | 10-15 years |
| **Recovery Codes** | HMAC-SHA256 | - | Safe (symmetric) |

### Quantum Threat Timeline

```
2025: Research phase
2030: Cryptographically relevant quantum computers (CRQCs) theoretical
2035: CRQC may break current 256-bit keys (50% probability)
2045: High confidence: Current crypto is broken
2050+: Widespread quantum computing threatens all current wallets
```

## Post-Quantum Algorithm Selection

### NIST Standardization (2022-2024)

NIST selected algorithms for standardization in August 2022:

#### **Primary: ML-KEM (Kyber)** - Key Encapsulation Mechanism
```
Algorithm: CRYSTALS-Kyber
Standard: FIPS 203 (November 2024)
Use Case: Key exchange, encryption
Security Level: AES-128, AES-192, AES-256
Key Sizes: 768, 1024, 1536 bytes (compact compared to other PQC)
```

**Kyber Variants**:
| Variant | Security | Public Key | Ciphertext | Speed |
|---------|----------|-----------|-----------|-------|
| **Kyber512** | AES-128 | 800 B | 768 B | Fastest |
| **Kyber768** | AES-192 | 1184 B | 1088 B | **Recommended** |
| **Kyber1024** | AES-256 | 1568 B | 1568 B | Slower |

#### **Secondary: ML-DSA (Dilithium)** - Digital Signature Algorithm
```
Algorithm: CRYSTALS-Dilithium
Standard: FIPS 204 (November 2024)
Use Case: Digital signatures (transactions, certificates)
Security Level: AES-128, AES-192, AES-256
Key Sizes: 1184, 2044, 2882 bytes (public key)
Signature Size: 2420, 2044, 3309 bytes
```

**Dilithium Variants**:
| Variant | Security | Public Key | Signature | Speed |
|---------|----------|-----------|-----------|-------|
| **Dilithium2** | AES-128 | 1184 B | 2420 B | Fastest |
| **Dilithium3** | AES-192 | 2044 B | 2044 B | **Recommended** |
| **Dilithium5** | AES-256 | 2882 B | 3309 B | Slower |

#### **Backup: SLH-DSA (SPHINCS+)** - Stateless Hash-Based Signatures
```
Algorithm: SPHINCS+
Standard: FIPS 205 (November 2024)
Use Case: Backup long-term signatures (if Dilithium fails)
Security Level: AES-128, AES-192, AES-256
Key Sizes: Variable, 64-512 bytes
Advantage: Simple, mathematically proven (hash security)
Disadvantage: Larger signatures (7000-17000 bytes)
```

## Migration Phases

### Phase 0: Preparation (Q4 2025 - Q1 2026)

#### Infrastructure Setup
```rust
// Create PQC module structure
services/pqc-crypto/
├── src/
│   ├── lib.rs
│   ├── kyber/
│   │   ├── mod.rs          // ML-KEM (key exchange)
│   │   ├── keygen.rs       // Key generation
│   │   └── encap_decap.rs  // Encapsulation/decapsulation
│   ├── dilithium/
│   │   ├── mod.rs          // ML-DSA (signatures)
│   │   ├── keygen.rs       // Key generation
│   │   └── sign.rs         // Signing & verification
│   └── hybrid/
│       ├── mod.rs          // Hybrid classical + PQC
│       └── migrate.rs      // Migration utilities
```

#### Implementation Strategy
```toml
# services/pqc-crypto/Cargo.toml
[dependencies]
pqcrypto = "0.20"      # NIST-approved implementations
pqcrypto-kyber = "0.20"
pqcrypto-dilithium = "0.20"
serde = { version = "1.0", features = ["derive"] }
```

#### Testing Setup
```bash
# Create test suite
cargo test --package pqc-crypto --all

# Benchmark classical vs PQC
cargo bench --package pqc-crypto
```

### Phase 1: Hybrid Key Generation (Q1-Q2 2026)

#### Generate Hybrid Keys
```rust
// Hybrid key format: Classical + Post-Quantum
pub struct HybridPrivateKey {
    // Classical (current)
    classical: EcdsaPrivateKey,
    
    // Post-Quantum (future-proof)
    dilithium: DilithiumPrivateKey,
    
    // Generation metadata
    created_at: Timestamp,
    version: u8,  // For future algorithm updates
}

pub struct HybridPublicKey {
    classical: EcdsaPublicKey,
    dilithium: DilithiumPublicKey,
    version: u8,
}
```

#### Implementation
```rust
impl HybridPrivateKey {
    pub fn generate() -> Self {
        let classical = EcdsaPrivateKey::generate();
        let dilithium = DilithiumPrivateKey::generate();
        
        HybridPrivateKey {
            classical,
            dilithium,
            created_at: now(),
            version: 1,
        }
    }

    pub fn sign(&self, message: &[u8]) -> HybridSignature {
        HybridSignature {
            classical: self.classical.sign(message),
            dilithium: self.dilithium.sign(message),
        }
    }
}
```

#### Deployment
```yaml
# Gradual rollout: New wallets get hybrid keys
# Old wallets remain classical-only (for now)

# infrastructure/k8s/wallet-service-config.yaml
kind: ConfigMap
metadata:
  name: wallet-config
data:
  KEY_GENERATION_MODE: "hybrid"  # or "classical_only" for rollback
  SUPPORT_PQC_KEYS: "true"
```

### Phase 2: Hybrid Signing (Q2-Q3 2026)

#### All Transactions Signed with Both Algorithms
```rust
pub struct HybridSignature {
    classical: EcdsaSignature,    // 64 bytes
    dilithium: DilithiumSignature, // 2420 bytes (DIL2)
    algorithm_version: u8,
}

impl HybridSignature {
    pub fn to_bytes(&self) -> Vec<u8> {
        // Serialization: version (1) + classical (64) + dilithium (2420)
        let mut bytes = Vec::with_capacity(2485);
        bytes.push(self.algorithm_version);
        bytes.extend(self.classical.to_bytes());
        bytes.extend(self.dilithium.to_bytes());
        bytes
    }

    pub fn verify(&self, message: &[u8], pk: &HybridPublicKey) -> bool {
        // Both must verify for transaction to be valid
        let classical_valid = pk.classical.verify(&self.classical, message);
        let pqc_valid = pk.dilithium.verify(&self.dilithium, message);
        
        classical_valid && pqc_valid
    }
}
```

#### Transaction Format Change
```json
{
  "tx": {
    "from": "0x...",
    "to": "0x...",
    "amount": "100",
    "signature": {
      "version": 1,
      "classical": "0x...",
      "dilithium": "0x...",
      "hybrid": true
    }
  }
}
```

#### API Update
```graphql
mutation {
  signTransaction(tx: TransactionInput!) {
    signature: {
      version: Int!
      classical: String!
      dilithium: String!
      hybrid: Boolean!
    }
  }
}
```

### Phase 3: PQC-Primary Signing (Q3-Q4 2026)

#### Switch Primary Algorithm to Dilithium
```rust
// New transactions: Dilithium-primary, ECDSA-backup
pub struct TransitionSignature {
    dilithium: DilithiumSignature,    // Primary
    classical: EcdsaSignature,         // Backup
    primary_algorithm: &'static str,   // "dilithium"
}

impl TransitionSignature {
    pub fn verify(&self, message: &[u8], pk: &HybridPublicKey) -> bool {
        // Accept if either signature is valid during transition
        let dilithium_valid = pk.dilithium.verify(&self.dilithium, message);
        let classical_valid = pk.classical.verify(&self.classical, message);
        
        dilithium_valid || classical_valid  // OR logic during transition
    }
}
```

#### Configuration Toggle
```bash
# Environment variable to control migration phase
PQC_MIGRATION_PHASE=3         # 1=hybrid, 2=both_required, 3=pqc_primary, 4=pqc_only

# Gradual rollout by region/user segment
PQC_ROLLOUT_PERCENTAGE=50     # 50% of new users get PQC-primary
```

### Phase 4: Classical Deprecation (2027-2028)

#### Timeline
```
2027 Q1-Q2:  Stop accepting classical-only signatures
2027 Q3-Q4:  Require PQC for new transactions
2028 Q1+:    Classical key support removed
```

#### Final Format: PQC-Only
```rust
pub struct QuantumSafeSignature {
    dilithium: DilithiumSignature,
    sphincs: Option<SphincsSignature>,  // Backup if Dilithium broken
    version: u8,
}

impl QuantumSafeSignature {
    pub fn to_bytes(&self) -> Vec<u8> {
        // Serialization optimized for PQC era
        // Dilithium only: ~2500 bytes
        // With SPHINCS backup: ~12000 bytes
    }
}
```

## Storage Format Evolution

### V1: Classical (Current)
```json
{
  "key_type": "ecdsa",
  "public_key": "0x...",
  "private_key_encrypted": "0x...",
  "created": 1699999999
}
```

### V2: Hybrid (2026)
```json
{
  "key_type": "hybrid",
  "version": 2,
  "classical": {
    "type": "ecdsa",
    "public_key": "0x...",
    "private_key_encrypted": "0x..."
  },
  "pqc": {
    "type": "dilithium",
    "public_key": "0x...",
    "private_key_encrypted": "0x..."
  },
  "created": 1699999999,
  "migration_phase": 1
}
```

### V3: PQC-Primary (2027)
```json
{
  "key_type": "pqc",
  "version": 3,
  "primary": {
    "type": "dilithium",
    "public_key": "0x...",
    "private_key_encrypted": "0x..."
  },
  "backup": {
    "type": "sphincs",
    "public_key": "0x...",
    "private_key_encrypted": "0x..."
  },
  "created": 1699999999
}
```

## Risk Assessment

### "Harvest Now, Decrypt Later" (HNDL)

**Threat**: Attackers recording encrypted data today, decrypting with future quantum computers.

**High-Risk Assets**:
- Recovery codes (long-term value)
- Historical transaction ledgers
- Encrypted backups
- TLS session keys (if recorded)

**Mitigation - Crypto-Agility**:
```
Regularly re-encrypt historical data with PQC
Implement key rotation before quantum era
```

### Transition Risks

| Risk | Phase | Mitigation |
|------|-------|-----------|
| **Incompatibility** | 1-3 | Version bits in signatures, gradual rollout |
| **Performance degradation** | 1-3 | Optimize PQC libraries, consider hardware acceleration |
| **Algorithm failure** | 3-4 | Use Dilithium + SPHINCS backup pair |
| **Key material compromise** | All | Secure key storage, HSM integration |

## Implementation Checklist

### Q4 2025 - Preparation
- [ ] Research NIST-approved PQC algorithms
- [ ] Evaluate pqcrypto library
- [ ] Design hybrid key storage format
- [ ] Set up test infrastructure
- [ ] Plan database migrations

### Q1 2026 - Development
- [ ] Implement hybrid key generation
- [ ] Create serialization format
- [ ] Build key migration tools
- [ ] Develop verification logic
- [ ] Write comprehensive tests

### Q2 2026 - Staged Rollout
- [ ] Deploy to 1% of new wallets
- [ ] Monitor performance metrics
- [ ] Gather user feedback
- [ ] Scale to 25% → 50% → 100%

### Q3 2026 - Hybrid Enforcement
- [ ] Require hybrid keys for new users
- [ ] Migrate old wallets (optional)
- [ ] Update API documentation
- [ ] Train customer support

### Q4 2026 - PQC-Primary Transition
- [ ] Switch primary algorithm to Dilithium
- [ ] Update transaction format
- [ ] Deprecation notices for classical-only

### 2027 - Classical Deprecation
- [ ] Stop accepting classical-only transactions
- [ ] Enforce PQC for all operations
- [ ] Final migration deadline
- [ ] Legacy system shutdown

## Performance Benchmarks

### Expected Overhead

```
Operation         Classical  Hybrid      PQC-Only  Overhead
─────────────────────────────────────────────────────────
Key generation    0.1ms      0.5ms       0.3ms     +400%
Signing           0.2ms      0.8ms       0.5ms     +150%
Verification      0.1ms      0.6ms       0.4ms     +300%
Key size          32B        80B         1.2KB     +3600%
Signature size    64B        2.5KB       2.4KB     +3700%
```

### Optimization Strategies
1. **Parallel signing**: Compute both signatures concurrently
2. **Batch verification**: Group multiple signature checks
3. **Hardware acceleration**: FPGA/GPU for PQC operations
4. **Lazy verification**: Don't verify backup signatures if primary valid

## References & Resources

### NIST Standards
- [FIPS 203: ML-KEM](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.203.pdf)
- [FIPS 204: ML-DSA](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.204.pdf)
- [FIPS 205: SLH-DSA](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.205.pdf)

### Research & Implementation
- [PQClean - Clean implementations](https://github.com/PQClean/PQClean)
- [liboqs - Open Quantum Safe Library](https://github.com/open-quantum-safe/liboqs)
- [OQSPROVIDER - OpenSSL integration](https://github.com/open-quantum-safe/oqsprovider)

### Timeline References
- [NSA Post-Quantum Cryptography FAQ](https://www.nsa.gov/Cybersecurity/Quantum-Key-Distribution-QKD-and-Quantum-Networks-Vision-and-Strategy/)
- [Quantum Computing Threat Timeline](https://www.schneier.com/blog/archives/2021/07/quantum_computers.html)

## Future Considerations

### Lattice-Based Cryptography Advances
Monitor for:
- Kyber/Dilithium improvements or breaks
- New NIST-approved algorithms (every 3-5 years)
- Standardized hybrid schemes

### Blockchain Integration
- Bitcoin: Upgrade opcodes for PQC verification
- Ethereum: EVM precompiles for Dilithium
- Solana: Runtime integration of SPHINCS

### Compliance Requirements
- NIST SP 800-131B: Cryptographic standards
- PCI DSS 4.0: Key management requirements
- Industry-specific quantum-safe timelines

---

**Last Reviewed**: November 2025  
**Next Review**: January 2026  
**Lead**: Cryptography Team
