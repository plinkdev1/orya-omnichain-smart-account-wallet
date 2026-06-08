# Request Signing & Verification Guide

**Last Updated**: November 2025  
**Severity**: Medium (Integrity & Authenticity)  
**Responsibility**: Frontend / SDK Developers

## Overview

Request signing provides **request integrity verification** and **offline signature validation** for ORŸA API calls. Clients cryptographically sign requests, allowing the server to verify that:
- Request hasn't been tampered with (integrity)
- Request came from expected client (authentication via shared secret)
- Request is recent (replay attack prevention)

## When to Use

✅ **Use Request Signing For**:
- Sensitive operations (transfers, withdrawals)
- Offline-signed transactions
- Cross-chain bridge operations
- High-value transactions

❌ **Not Required For**:
- Public portfolio queries
- Health checks
- Read-only operations

## Algorithm: HMAC-SHA256

```
Signature = HMAC-SHA256(
  Secret,
  METHOD\nPATH\nTIMESTAMP\nBODY_HASH
)
```

### Components

| Component | Example | Notes |
|-----------|---------|-------|
| **METHOD** | POST | HTTP method (uppercase) |
| **PATH** | /graphql | Request path |
| **TIMESTAMP** | 1699999999 | Unix seconds (UTC) |
| **BODY_HASH** | a1b2c3... | Hex-encoded SHA256(body) |

## Configuration

### Enable Request Signing

```bash
# .env or environment variables
REQUEST_SIGNING_ENABLED=true
REQUEST_SIGNING_SECRET=your-secret-key-here
REQUEST_SIGNING_TOLERANCE=300  # 5 minutes, in seconds
```

### Deployment

```yaml
# Kubernetes secret
apiVersion: v1
kind: Secret
metadata:
  name: api-signing-secret
type: Opaque
stringData:
  REQUEST_SIGNING_SECRET: "your-secure-random-secret-min-32-chars"

---
# Apply to API Gateway
apiVersion: v1
kind: Pod
spec:
  containers:
  - env:
    - name: REQUEST_SIGNING_ENABLED
      value: "true"
    - name: REQUEST_SIGNING_SECRET
      valueFrom:
        secretKeyRef:
          name: api-signing-secret
          key: REQUEST_SIGNING_SECRET
```

## Client Implementation

### JavaScript/TypeScript SDK

```typescript
import crypto from 'crypto';
import hmac from 'crypto';

class OryaApiClient {
  private signingSecret: string;

  constructor(signingSecret: string) {
    this.signingSecret = signingSecret;
  }

  private generateSignature(
    method: string,
    path: string,
    body: string,
    timestamp: string
  ): string {
    const bodyHash = crypto
      .createHash('sha256')
      .update(body)
      .digest('hex');

    const message = `${method}\n${path}\n${timestamp}\n${bodyHash}`;

    const signature = crypto
      .createHmac('sha256', this.signingSecret)
      .update(message)
      .digest('hex');

    return signature;
  }

  async signedRequest(
    method: string,
    path: string,
    body?: any
  ): Promise<Response> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const bodyString = body ? JSON.stringify(body) : '';

    const signature = this.generateSignature(
      method,
      path,
      bodyString,
      timestamp
    );

    const response = await fetch(path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Signature': signature,
        'X-Request-Timestamp': timestamp,
      },
      body: bodyString || undefined,
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.statusText}`);
    }

    return response;
  }

  async transfer(
    from: string,
    to: string,
    amount: string
  ): Promise<any> {
    const body = { from, to, amount };
    const response = await this.signedRequest(
      'POST',
      '/graphql',
      { query: 'mutation { transfer(...) }', variables: body }
    );
    return response.json();
  }
}

// Usage
const client = new OryaApiClient('your-secret-key');
await client.transfer('0xAlice', '0xBob', '100');
```

### Python SDK

```python
import hashlib
import hmac
import json
import time
from typing import Dict, Any

class OryaApiClient:
    def __init__(self, signing_secret: str):
        self.signing_secret = signing_secret

    def generate_signature(
        self,
        method: str,
        path: str,
        body: str,
        timestamp: str
    ) -> str:
        body_hash = hashlib.sha256(body.encode()).hexdigest()
        message = f"{method}\n{path}\n{timestamp}\n{body_hash}"
        
        signature = hmac.new(
            self.signing_secret.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return signature

    def signed_request(
        self,
        method: str,
        path: str,
        body: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        import requests
        
        timestamp = str(int(time.time()))
        body_string = json.dumps(body) if body else ""
        
        signature = self.generate_signature(
            method,
            path,
            body_string,
            timestamp
        )
        
        headers = {
            "Content-Type": "application/json",
            "X-Request-Signature": signature,
            "X-Request-Timestamp": timestamp,
        }
        
        response = requests.request(
            method=method,
            url=f"http://localhost:3000{path}",
            headers=headers,
            data=body_string or None
        )
        
        response.raise_for_status()
        return response.json()

    def transfer(self, from_addr: str, to_addr: str, amount: str) -> Dict:
        body = {
            "query": "mutation { transfer(from: $from, to: $to, amount: $amount) }",
            "variables": {
                "from": from_addr,
                "to": to_addr,
                "amount": amount
            }
        }
        return self.signed_request("POST", "/graphql", body)

# Usage
client = OryaApiClient("your-secret-key")
result = client.transfer("0xAlice", "0xBob", "100")
```

### Rust SDK

```rust
use hmac::{Hmac, Mac};
use sha2::Sha256;
use chrono::Utc;
use hex;

type HmacSha256 = Hmac<Sha256>;

pub struct OryaApiClient {
    signing_secret: String,
}

impl OryaApiClient {
    pub fn new(signing_secret: String) -> Self {
        OryaApiClient { signing_secret }
    }

    fn generate_signature(
        &self,
        method: &str,
        path: &str,
        body: &[u8],
        timestamp: &str,
    ) -> String {
        let body_hash = sha2::Sha256::digest(body);
        let message = format!(
            "{}\n{}\n{}\n{}",
            method,
            path,
            timestamp,
            hex::encode(body_hash)
        );

        let mut mac = HmacSha256::new_from_slice(
            self.signing_secret.as_bytes()
        ).expect("HMAC can take key of any size");
        
        mac.update(message.as_bytes());
        hex::encode(mac.finalize().into_bytes())
    }

    pub async fn signed_request(
        &self,
        method: &str,
        path: &str,
        body: &[u8],
    ) -> Result<String, Box<dyn std::error::Error>> {
        let timestamp = Utc::now().timestamp().to_string();
        let signature = self.generate_signature(method, path, body, &timestamp);

        let client = reqwest::Client::new();
        let response = client
            .request(method.parse()?, &format!("http://localhost:3000{}", path))
            .header("X-Request-Signature", signature)
            .header("X-Request-Timestamp", timestamp)
            .body(body.to_vec())
            .send()
            .await?;

        Ok(response.text().await?)
    }
}

// Usage
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = OryaApiClient::new("your-secret-key".to_string());
    let body = r#"{"query": "mutation { transfer(...) }"}"#;
    let result = client.signed_request("POST", "/graphql", body.as_bytes()).await?;
    println!("{}", result);
    Ok(())
}
```

## HTTP Request Example

### Request

```http
POST /graphql HTTP/1.1
Host: api.orya.app
Content-Type: application/json
X-Request-Signature: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z
X-Request-Timestamp: 1699999999

{
  "query": "mutation { transfer(from: \"0xAlice\", to: \"0xBob\", amount: \"100\") }"
}
```

### Response (Valid Signature)

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": {
    "transfer": {
      "txHash": "0x...",
      "status": "PENDING"
    }
  }
}
```

### Response (Invalid Signature)

```http
HTTP/1.1 401 Unauthorized
Content-Type: text/plain

Invalid request signature
```

### Response (Expired Timestamp)

```http
HTTP/1.1 401 Unauthorized
Content-Type: text/plain

Request timestamp too old (tolerance: 300 seconds)
```

## Replay Attack Prevention

Signatures include timestamp to prevent replay attacks:

1. **Client generates signature** with current timestamp
2. **Server validates timestamp** (default: within 5 minutes)
3. **Server rejects old timestamps** (automatic via tolerance)

### Example Attack Scenario

```
1. Attacker intercepts: POST /transfer with timestamp=1699999999
2. Attacker replays request 6 minutes later
3. Server rejects: "Request timestamp too old (tolerance: 300 seconds)"
```

### Timeout Configuration

```bash
# .env
REQUEST_SIGNING_TOLERANCE=300  # 5 minutes
REQUEST_SIGNING_TOLERANCE=600  # 10 minutes (more lenient)
```

## Secret Key Management

### ✅ Best Practices

1. **Generate Strong Keys** (minimum 32 characters):
   ```bash
   openssl rand -hex 32
   # Output: a7f8b2c4d6e8f0g2h4i6j8k0l2m4n6o8p0q2r4s6t8u0v2w4x6y8z0
   ```

2. **Store in Environment** (not source code):
   ```bash
   # .env (development only)
   REQUEST_SIGNING_SECRET=<generated-key>
   
   # Production: Use secret management
   # - Kubernetes Secrets
   # - AWS Secrets Manager
   # - HashiCorp Vault
   # - Heroku Config Vars
   ```

3. **Rotate Regularly**:
   - Every 90 days
   - When developer leaves
   - If key is exposed

4. **Use Different Keys Per Environment**:
   ```
   dev:  dev-key-abc123...
   staging: staging-key-def456...
   prod: prod-key-ghi789...
   ```

### ❌ Security Mistakes

```javascript
// ❌ DON'T: Hardcode secret in source code
const SECRET = "super-secret-key";

// ❌ DON'T: Commit .env to git
git add .env  // .gitignore should prevent this

// ❌ DON'T: Share secret in Slack/email
// ❌ DON'T: Use weak/obvious secret
const SECRET = "password123";
```

## Testing

### Unit Test Example (Jest)

```typescript
import { OryaApiClient } from './client';

describe('Request Signing', () => {
  const client = new OryaApiClient('test-secret-key');

  test('generates valid signature', () => {
    const signature = client['generateSignature'](
      'POST',
      '/graphql',
      '{"query":"test"}',
      '1699999999'
    );
    
    expect(signature).toHaveLength(64);
    expect(signature).toMatch(/^[0-9a-f]+$/);
  });

  test('rejects modified request', () => {
    const sig1 = client['generateSignature'](
      'POST',
      '/graphql',
      '{"query":"transfer"}',
      '1699999999'
    );
    
    const sig2 = client['generateSignature'](
      'POST',
      '/graphql',
      '{"query":"hack"}',  // Modified
      '1699999999'
    );
    
    expect(sig1).not.toEqual(sig2);
  });
});
```

## Monitoring

### Log Successful Signatures

```bash
# API Gateway logs
2025-01-15T10:30:45Z [INFO] Request signature verified
  client_ip: 192.168.1.100
  path: /graphql
  timestamp: 1705320645
```

### Alert on Failures

```yaml
# Prometheus alert
- alert: InvalidSignatureAttempts
  expr: rate(invalid_signatures_total[5m]) > 10
  annotations:
    summary: "High rate of invalid signatures"
```

## Future Enhancements

### Phase 1: Response Signing (Q1 2026)
Server signs responses for client verification:
```
X-Response-Signature: a1b2c3d4...
```

### Phase 2: Mutual TLS (Q2 2026)
Client and server both authenticate via certificates

### Phase 3: Key Rotation Protocol (Q3 2026)
Automatic key rotation without service disruption

### Phase 4: Chainable Signatures (Q4 2026)
Multiple parties sign same request (DAOs, multisig)

## Compliance

- ✅ Prevents tampering (request integrity)
- ✅ Authenticates client (shared secret)
- ✅ Prevents replay attacks (timestamp)
- ✅ OWASP A02:2021 – Cryptographic Failures (mitigation)

## Additional Resources

- [HMAC-SHA256 Specification](https://tools.ietf.org/html/rfc4868)
- [API Signing Best Practices](https://tools.ietf.org/html/draft-cavage-http-signatures)
- [Replay Attack Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#replay-attacks)

---

**Last Reviewed**: November 2025  
**Next Review**: December 2025  
**Reviewer**: Security Team
