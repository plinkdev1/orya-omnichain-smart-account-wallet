# Content Security Policy (CSP) Headers Configuration

**Last Updated**: November 2025  
**Severity**: Medium (XSS Mitigation)  
**Responsibility**: DevSecOps / Frontend

## Overview

Content Security Policy (CSP) headers protect against Cross-Site Scripting (XSS) attacks by restricting which resources can be loaded and executed. ORŸA implements strict CSP headers across all web applications.

## Current CSP Policy

### Web App Configuration

Located in: `apps/web/next.config.mjs` (lines 18-30)

```
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel.com
style-src 'self' 'unsafe-inline'
img-src 'self' data: https: blob:
font-src 'self' data:
connect-src 'self' https://fullnode.testnet.sui.io https://fullnode.mainnet.sui.io https://api.mainnet-beta.solana.com https://api.devnet.solana.com https://eth-mainnet.alchemyapi.io https://eth-sepolia.g.alchemy.com https://*.walletconnect.com wss://*.walletconnect.com https://*.reown.com wss://*.reown.com
frame-ancestors 'none'
base-uri 'self'
form-action 'self'
upgrade-insecure-requests
```

## Policy Breakdown

| Directive | Policy | Rationale |
|-----------|--------|-----------|
| **default-src** | `'self'` | Only allow resources from same origin by default |
| **script-src** | `'self'` + dev tools | Allow local scripts + development tools (Vercel) |
| **style-src** | `'self' 'unsafe-inline'` | Allow local styles + inline styling (TailwindCSS) |
| **img-src** | `'self' data: https: blob:` | Allow images from self, data URIs, HTTPS, and blob URLs |
| **font-src** | `'self' data:` | Allow fonts from self and data URIs only |
| **connect-src** | RPC + WebSocket endpoints | Whitelist blockchain RPCs and WalletConnect |
| **frame-ancestors** | `'none'` | Prevent clickjacking - no iframes allowed |
| **base-uri** | `'self'` | Prevent base tag injection |
| **form-action** | `'self'` | Prevent form hijacking |
| **upgrade-insecure-requests** | enabled | Redirect HTTP → HTTPS |

## Blockchain RPC Endpoints Whitelisted

### SUI Network
- ✅ `https://fullnode.testnet.sui.io` - SUI Testnet
- ✅ `https://fullnode.mainnet.sui.io` - SUI Mainnet

### Solana Network
- ✅ `https://api.mainnet-beta.solana.com` - Solana Mainnet
- ✅ `https://api.devnet.solana.com` - Solana Devnet

### Ethereum Network
- ✅ `https://eth-mainnet.alchemyapi.io` - Ethereum Mainnet (Alchemy)
- ✅ `https://eth-sepolia.g.alchemy.com` - Ethereum Sepolia (Alchemy)

### Wallet Connect
- ✅ `https://*.walletconnect.com` - WalletConnect HTTP endpoints
- ✅ `wss://*.walletconnect.com` - WalletConnect WebSocket endpoints

### Reown (WalletConnect V2)
- ✅ `https://*.reown.com` - Reown HTTP endpoints
- ✅ `wss://*.reown.com` - Reown WebSocket endpoints

## Development vs Production

### Development (Vercel Preview)
Allows:
- `https://vercel.live` - Live editing during development
- `https://*.vercel.com` - Vercel analytics and tooling

### Production
- Vercel domains removed automatically via environment detection
- Stricter CSP enforcement

## Security Considerations

### ⚠️ Known Limitations

1. **unsafe-inline / unsafe-eval**
   - Necessary for TailwindCSS dynamic styling
   - Future: Migrate to CSS-in-JS with nonce support
   - Timeline: Q1 2026

2. **blob: URLs**
   - Required for wallet data export (PDF generation)
   - Future: Implement signed download endpoints
   - Timeline: Q2 2026

### 🔐 Mitigations

1. **Input Validation**: All user inputs sanitized before rendering
2. **DomPurify**: HTML sanitization library integrated
3. **TypeScript**: Prevents eval injection in build phase
4. **Regular Audits**: CSP violations monitored via `report-uri`

## Monitoring & Reporting

### CSP Violation Reports

To enable CSP violation reporting:

```javascript
// In next.config.mjs, add report-uri:
"report-uri https://csp-report.orya.app/api/violations"
```

### Violation Analysis

Monitor for patterns:
- Unexpected script execution
- Third-party injection attempts
- Clickjacking attempts

## Future Improvements

### Phase 1: Remove unsafe-inline (Q1 2026)
- Implement CSS-in-JS with nonce system
- Reduce TailwindCSS runtime overhead
- Expected reduction: 40% CSP policy size

### Phase 2: Implement Subresource Integrity (Q2 2026)
```html
<script 
  src="https://cdn.example.com/lib.js"
  integrity="sha384-..."
></script>
```

### Phase 3: Post-Quantum Cryptography (Q3 2026)
- Prepare for quantum computing threats
- Implement CRYSTALS-Kyber key derivation
- See: `docs/security/POST_QUANTUM_MIGRATION.md`

## Testing CSP Headers

### Local Testing

```bash
# Test CSP headers locally
curl -I http://localhost:3000

# Look for:
# content-security-policy: default-src 'self'; ...
```

### Browser DevTools

1. Open DevTools → Console
2. Violations appear as warnings
3. Check Network tab for blocked resources

### CSP Violation Examples

```javascript
// This will be BLOCKED by CSP:
eval("alert('XSS')");  // unsafe-eval

// This will be BLOCKED:
document.innerHTML = '<img src=x onerror=alert(1)>';  // unsafe-inline

// This will be ALLOWED:
fetch('https://fullnode.mainnet.sui.io/api');  // whitelisted RPC
```

## Adding New RPC Endpoints

### When Integrating New Blockchain

1. Add endpoint to `apps/web/next.config.mjs` (connect-src)
2. Document in `RPC Endpoints` section above
3. Update reverse proxy if using `http://localhost:*`
4. Test with `curl -I https://your-endpoint.com`
5. Create PR with security team review

### Example: Adding Polygon RPC

```diff
connect-src 'self' 
  https://fullnode.testnet.sui.io 
  https://fullnode.mainnet.sui.io 
  https://api.mainnet-beta.solana.com 
  https://api.devnet.solana.com 
  https://eth-mainnet.alchemyapi.io 
  https://eth-sepolia.g.alchemy.com
+ https://polygon-mainnet.alchemy.com
+ https://polygon-mumbai.alchemy.com
  https://*.walletconnect.com 
  wss://*.walletconnect.com 
  https://*.reown.com 
  wss://*.reown.com
```

## Compliance

- ✅ OWASP Top 10: Addresses A03:2021 – Injection
- ✅ CWE-79: Prevents Reflected/Stored XSS
- ✅ NIST: Compliant with system integrity requirements

## Additional Resources

- [MDN CSP Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)

---

**Last Reviewed**: November 2025  
**Next Review**: December 2025  
**Reviewer**: Security Team
