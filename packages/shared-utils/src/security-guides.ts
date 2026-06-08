export interface SecurityGuide {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  category: "recovery" | "keys" | "2fa" | "storage" | "general";
  content: string;
  actionItems: string[];
  risks: string[];
  references?: string[];
  learnMore?: string;
}

export const SECURITY_GUIDES: Record<string, SecurityGuide> = {
  recovery_code_storage: {
    id: "recovery_code_storage",
    title: "Recovery Code Storage",
    description: "Best practices for securely storing your recovery codes",
    severity: "critical",
    category: "recovery",
    content: `
Recovery codes are your lifeline if you lose access to your primary authentication factors.
They MUST be stored securely and offline.

## Critical Rules
- NEVER store recovery codes in the ORŸA app or cloud sync
- NEVER screenshot or photograph codes
- NEVER email, message, or text codes
- NEVER share with anyone, including ORŸA support

## Recommended Storage Methods

### 1. Paper in Safe Deposit Box (Most Secure)
- Print codes on archival-quality paper
- Store in waterproof, sealed envelope
- Place in bank safe deposit box
- Keep duplicate at different location

### 2. Hardware Wallet Backup
- Use recovery codes as backup to hardware wallet
- Store hardware seed in one location
- Store recovery code passphrase in different location
- Requires both for account recovery

### 3. Professional Custody
- Use Coinbase Custody, Fidelity Digital, or similar
- Professional-grade security and insurance
- Additional cost but eliminates personal storage risk

### 4. Encrypted External Drive
- Encrypt with AES-256 encryption
- Store on external USB drive
- Use strong passphrase (32+ characters)
- Keep in safe deposit box or home safe
    `,
    actionItems: [
      "Generate recovery codes in Settings → Security",
      "Print codes immediately (don't save PDF)",
      "Place in waterproof envelope",
      "Store in safe deposit box",
      "Document secondary location",
      "Verify access within 48 hours",
    ],
    risks: [
      "Account lockout if all codes are lost",
      "Permanent loss of wallet if 2FA factors compromised",
      "No recovery path without codes",
    ],
    references: [
      "docs/security/RECOVERY_CODE_STORAGE.md",
    ],
    learnMore: "/security/recovery-codes",
  },

  csp_security: {
    id: "csp_security",
    title: "Content Security Policy",
    description: "How your browser protects you from cross-site scripting attacks",
    severity: "high",
    category: "general",
    content: `
ORŸA uses Content Security Policy (CSP) to protect you from malicious scripts and XSS attacks.

## How It Works
CSP headers tell your browser which resources are safe to load:
- Scripts only from trusted sources
- No inline code execution
- No data from unauthorized domains
- Protection against clickjacking

## What This Means for You
✓ Extra protection against account takeover
✓ Prevention of malicious script injection
✓ Safe navigation between legitimate sites

If you see "CSP violation" in browser console, it means an attacker tried to inject code.
This is normal and GOOD - it means you were protected.

## Browser Developer Tools
You can check CSP headers:
1. Open DevTools (F12)
2. Go to Network tab
3. Click on HTML response
4. Look for "content-security-policy" header
    `,
    actionItems: [
      "Check browser console for any CSP violations",
      "Report suspicious violations to support",
      "Enable browser extensions for security monitoring",
    ],
    risks: [
      "Older browsers may not support CSP",
      "Some features may be blocked",
    ],
    learnMore: "/security/csp",
  },

  rate_limiting: {
    id: "rate_limiting",
    title: "Rate Limiting Protection",
    description: "How API rate limiting protects against abuse",
    severity: "medium",
    category: "general",
    content: `
ORŸA API Gateway implements rate limiting to protect the service from abuse and DoS attacks.

## Rate Limits
- **Public API**: 50 requests/second
- **Authenticated**: 100 requests/second
- **Premium Tier**: 500 requests/second (future)

## When You Might Hit Rate Limits
- Performing many transactions rapidly
- Bulk data exports
- Integration testing without proper delays
- Unusual API access patterns

## What Happens When Limit is Exceeded
You'll receive HTTP 429 response:
\`\`\`
HTTP/1.1 429 Too Many Requests
Rate limit exceeded. See X-RateLimit headers.
\`\`\`

## Recovery
Rate limits reset after a short period. Simply:
1. Wait a few seconds
2. Retry your request
3. Add delays between requests

## Best Practices
- Use exponential backoff in integrations
- Cache frequently accessed data
- Batch operations when possible
- Monitor your API usage
    `,
    actionItems: [
      "Implement retry logic in integrations",
      "Add delays between rapid requests",
      "Monitor API response headers",
      "Contact support for higher limits",
    ],
    risks: [
      "Service disruption if rate limit too low",
      "Legitimate traffic may be blocked",
    ],
    learnMore: "/security/rate-limiting",
  },

  request_signing: {
    id: "request_signing",
    title: "Request Signing",
    description: "Cryptographic signing for sensitive operations",
    severity: "high",
    category: "general",
    content: `
Request signing provides cryptographic verification that API requests are legitimate and haven't been tampered with.

## When Signing is Used
- High-value transactions
- Offline-signed operations
- Cross-chain bridge operations
- Sensitive account changes

## How It Works
1. Client creates timestamp (current Unix time)
2. Client signs request with private key
3. Server receives request and signature
4. Server verifies signature matches
5. Server checks timestamp isn't too old (replay prevention)
6. Request is processed only if all checks pass

## Security Benefits
✓ Ensures request came from expected client
✓ Prevents man-in-the-middle attacks
✓ Prevents replay attacks (old requests can't be reused)
✓ Detects tampering with request data

## For Developers
Use the official ORŸA SDK which handles signing automatically:
- JavaScript/TypeScript SDK
- Python SDK
- Rust SDK
- Go SDK

## Manual Implementation
If implementing custom clients, follow HMAC-SHA256 standard:
\`\`\`
Signature = HMAC-SHA256(
  Secret,
  METHOD\\nPATH\\nTIMESTAMP\\nBODY_HASH
)
\`\`\`
    `,
    actionItems: [
      "Use official ORŸA SDK (recommended)",
      "Never hardcode signing secrets",
      "Rotate secrets regularly (every 90 days)",
      "Use different secrets per environment",
    ],
    risks: [
      "Secret key compromise = account takeover",
      "Incorrect implementation = rejected requests",
      "Timestamp skew can cause request failures",
    ],
    learnMore: "/security/request-signing",
  },

  post_quantum: {
    id: "post_quantum",
    title: "Post-Quantum Cryptography",
    description: "How ORŸA is preparing for the quantum computing era",
    severity: "medium",
    category: "general",
    content: `
Quantum computers will break current encryption within 10-20 years. ORŸA is preparing now.

## The Quantum Threat
- Quantum computers will break ECDSA (current signature method)
- Bitcoin, Ethereum, and most crypto will become vulnerable
- Encrypted data recorded today can be decrypted tomorrow

## ORŸA's Response
We're implementing post-quantum cryptography NOW:
- 2025-2026: Generate hybrid classical + quantum-safe keys
- 2026-2027: All transactions use both signature types
- 2027-2028: Transition to quantum-safe only

## What This Means for Users
✓ Your recovery codes are already quantum-safe (hash-based)
✓ New wallets will use quantum-safe keys
✓ Old wallets can be migrated without losing funds
✓ No action required from you (automatic upgrade)

## Timeline
- **Q4 2025**: Preparation & research
- **Q1-Q2 2026**: Hybrid key generation begins
- **Q2-Q3 2026**: All new wallets get quantum-safe keys
- **2027-2028**: Full migration to post-quantum
- **2028+**: Legacy keys deprecated

## Technical Details
Algorithms selected by NIST:
- **ML-KEM (Kyber)**: For key exchange
- **ML-DSA (Dilithium)**: For signatures
- **SLH-DSA (SPHINCS)**: For backup

Your recovery codes remain safe throughout.
    `,
    actionItems: [
      "No immediate action required",
      "Understand the migration timeline",
      "Check wallet settings for PQC status (future)",
      "Stay updated on security announcements",
    ],
    risks: [
      "Current crypto will break in 10-20 years",
      "Transition may cause temporary complexity",
      "New algorithms might have undiscovered flaws",
    ],
    references: [
      "docs/security/POST_QUANTUM_MIGRATION.md",
    ],
    learnMore: "/security/post-quantum",
  },

  two_factor_auth: {
    id: "two_factor_auth",
    title: "Two-Factor Authentication",
    description: "Why you need 2FA and how to set it up",
    severity: "critical",
    category: "2fa",
    content: `
Two-factor authentication (2FA) adds an extra security layer beyond your password.

## Why 2FA is Essential
- Passwords can be compromised
- 2FA makes account takeover much harder
- Even if password is stolen, account stays safe

## ORŸA's 2FA Methods
1. **Authenticator App** (recommended)
   - Use Google Authenticator, Authy, or Microsoft Authenticator
   - Time-based codes change every 30 seconds
   - Works offline

2. **SMS/Text Message**
   - Less secure but convenient
   - Requires phone number
   - Vulnerable to SIM swap attacks

3. **Recovery Codes**
   - Backup method if 2FA device is lost
   - Store safely (see recovery codes guide)
   - One-time use only

## Setting Up 2FA
1. Go to Settings → Security → Two-Factor Auth
2. Choose your 2FA method
3. Follow setup instructions
4. Save recovery codes immediately
5. Test 2FA before leaving settings

## Best Practices
✓ Use authenticator app instead of SMS
✓ Save recovery codes in safe place
✓ Don't scan QR codes with untrusted devices
✓ Backup your authenticator to cloud
✓ Test 2FA recovery process
    `,
    actionItems: [
      "Enable 2FA immediately if not already done",
      "Use authenticator app (not SMS)",
      "Save recovery codes",
      "Backup authenticator to cloud",
      "Test recovery process",
    ],
    risks: [
      "Account takeover without 2FA",
      "Lost phone = account lockout",
      "SMS can be intercepted",
    ],
    learnMore: "/security/2fa",
  },

  key_management: {
    id: "key_management",
    title: "Private Key Management",
    description: "Protecting your wallet's private keys",
    severity: "critical",
    category: "keys",
    content: `
Your private key is the master key to all your funds. Losing it or letting it be stolen is catastrophic.

## Never Share Your Private Key
- Not with ORŸA support
- Not with anyone on the internet
- Not via email or messaging
- Not in screenshots or photos

ORŸA will NEVER ask for your private key.

## Private Key Storage
Your private keys are:
- Encrypted locally on your device
- Never sent to ORŸA servers
- Protected by your password
- Recoverable only with recovery codes

## Backup Your Keys
1. Use recovery codes (see recovery codes guide)
2. Don't store unencrypted keys anywhere
3. Don't store keys on cloud without encryption
4. Never email keys to yourself

## Accessing Your Keys
To export keys for use elsewhere:
1. Settings → Advanced → Export Keys
2. Authenticate with password + 2FA
3. Keys are AES-256 encrypted
4. Decrypt with strong passphrase

## If Keys Are Compromised
1. Move all funds to new wallet immediately
2. Contact ORŸA support
3. Document the loss
4. Consider it a total loss (funds cannot be recovered)
    `,
    actionItems: [
      "Never share private key",
      "Store recovery codes safely",
      "Use strong password",
      "Enable 2FA for all wallet access",
      "Test recovery process",
    ],
    risks: [
      "Permanent loss of funds if key is stolen",
      "No recovery if key is lost",
      "Malware can steal unencrypted keys",
    ],
    learnMore: "/security/key-management",
  },
};

export function getGuideById(id: string): SecurityGuide | undefined {
  return SECURITY_GUIDES[id];
}

export function getGuidesByCategory(
  category: SecurityGuide["category"]
): SecurityGuide[] {
  return Object.values(SECURITY_GUIDES).filter(
    (guide) => guide.category === category
  );
}

export function getGuidesBySeverity(
  severity: SecurityGuide["severity"]
): SecurityGuide[] {
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return Object.values(SECURITY_GUIDES)
    .filter((guide) => guide.severity === severity)
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

export function getAllCriticalGuides(): SecurityGuide[] {
  return getGuidesBySeverity("critical");
}

export function getAllGuides(): SecurityGuide[] {
  return Object.values(SECURITY_GUIDES).sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}
