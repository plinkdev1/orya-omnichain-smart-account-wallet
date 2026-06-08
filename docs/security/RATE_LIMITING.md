# Rate Limiting Configuration Guide

**Last Updated**: November 2025  
**Severity**: Low-Medium (DoS Protection)  
**Responsibility**: DevOps / Backend Engineers

## Overview

Rate limiting protects the ORŸA API Gateway from denial-of-service (DoS) attacks and resource exhaustion. The API Gateway implements a token bucket algorithm with per-client rate limiting.

## Current Implementation

**Location**: `services/api-gateway/src/middleware/rate_limit.rs`

### Algorithm: Token Bucket
- Clients receive tokens at configurable rate (default: 100 req/s)
- Burst capacity allows temporary spikes (default: 200 tokens)
- Tokens consumed per request (1 token = 1 request)
- Rate limiting applied per client IP (via `x-forwarded-for` header)

### Default Configuration
```rust
requests_per_second: 100  // Refill rate
burst_size: 200           // Maximum tokens per bucket
enabled: true             // Feature toggle
```

## Environment Variables

Configure rate limiting via environment variables (no restart required for most):

```bash
# Requests per second per client
RATE_LIMIT_RPS=100

# Burst size (temporary spike allowance)
RATE_LIMIT_BURST=200

# Enable/disable rate limiting
RATE_LIMIT_ENABLED=true
```

### Default Values

| Variable | Default | Min | Max | Notes |
|----------|---------|-----|-----|-------|
| `RATE_LIMIT_RPS` | 100 | 1 | 10000 | Sustained rate per IP |
| `RATE_LIMIT_BURST` | 200 | 1 | 50000 | Spike allowance |
| `RATE_LIMIT_ENABLED` | true | - | - | "true" or "false" |

## Rate Limit Tiers

### Public API (Unauthenticated)
```bash
RATE_LIMIT_RPS=50        # 50 requests/second
RATE_LIMIT_BURST=100     # Burst of 100
```

### Authenticated Users
```bash
RATE_LIMIT_RPS=100       # 100 requests/second
RATE_LIMIT_BURST=200     # Burst of 200
```

### Premium Tier (Future)
```bash
RATE_LIMIT_RPS=500       # 500 requests/second
RATE_LIMIT_BURST=1000    # Burst of 1000
```

## HTTP Responses

### Rate Limit Exceeded

```
HTTP/1.1 429 Too Many Requests
Content-Type: text/plain

Rate limit exceeded. See X-RateLimit headers.
```

### Rate Limit Headers (Future Implementation)

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1699999999
X-RateLimit-RetryAfter: 5
```

## Docker Compose Setup

### Development Environment

```yaml
# infrastructure/docker-compose.yml
services:
  api-gateway:
    environment:
      - RATE_LIMIT_RPS=100
      - RATE_LIMIT_BURST=200
      - RATE_LIMIT_ENABLED=true
```

### Production Environment

```yaml
services:
  api-gateway:
    environment:
      - RATE_LIMIT_RPS=1000    # Higher capacity
      - RATE_LIMIT_BURST=2000
      - RATE_LIMIT_ENABLED=true
```

## Kubernetes ConfigMap

```yaml
# infrastructure/kubernetes/api-gateway-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-gateway-config
  namespace: default
data:
  RATE_LIMIT_RPS: "100"
  RATE_LIMIT_BURST: "200"
  RATE_LIMIT_ENABLED: "true"

---
apiVersion: v1
kind: Pod
metadata:
  name: api-gateway
spec:
  containers:
  - name: api-gateway
    image: api-gateway:latest
    envFrom:
    - configMapRef:
        name: api-gateway-config
```

## Client IP Detection

Rate limiting is applied per client IP using header precedence:

1. `x-forwarded-for` (Proxy headers - **RECOMMENDED**)
2. `x-real-ip` (Nginx reverse proxy)
3. Connection socket address (Direct connection)

### Nginx Proxy Configuration

```nginx
# /etc/nginx/sites-available/api-gateway.conf
server {
    listen 80;
    server_name api.orya.app;

    location / {
        proxy_pass http://api-gateway:3000;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Host $host;
    }
}
```

### HAProxy Configuration

```
# /etc/haproxy/haproxy.cfg
backend api_gateway
    balance roundrobin
    option http-server-close
    http-reuse safe
    server api-gateway-1 api-gateway:3000 check
    
    # Forward client IP
    option forwardfor
```

## Monitoring & Alerts

### Prometheus Metrics (Planned)

```prometheus
# Current implementation only logs
# Future: Export these metrics
api_gateway_rate_limit_hits_total{client_ip="x.x.x.x"} 150
api_gateway_rate_limit_rejections_total{client_ip="x.x.x.x"} 5
```

### Logging

Monitor for rate limit rejections in API Gateway logs:

```bash
# View logs
docker logs api-gateway | grep "Rate limit exceeded"

# Or with Kubernetes
kubectl logs -f deployment/api-gateway --tail=100 | grep "429"
```

### Alert Rules

```yaml
# Prometheus alert rule
- alert: APIGatewayRateLimitHigh
  expr: rate(api_gateway_rate_limit_rejections_total[5m]) > 10
  for: 5m
  annotations:
    summary: "High rate limit rejection rate"
```

## Testing Rate Limits

### Local Testing

```bash
# Install Apache Bench
apt-get install apache2-utils

# Test with 10 concurrent requests, 200 total requests
ab -n 200 -c 10 http://localhost:3000/graphql

# Expected: Some requests return 429 Too Many Requests
```

### Using curl

```bash
# Simulate rapid requests
for i in {1..150}; do
  curl -X POST http://localhost:3000/graphql \
    -H "Content-Type: application/json" \
    -d '{"query":"{ health }"}'
  sleep 0.01
done

# Check for 429 responses
```

### Using wrk (Advanced Load Testing)

```bash
# Install: https://github.com/wg/wrk

# Test with 4 threads, 100 connections, 30 second duration
wrk -t 4 -c 100 -d 30s http://localhost:3000/graphql

# 429 responses indicate rate limit triggering
```

## Troubleshooting

### Problem: All clients getting rate limited
**Solution**: Check if rate limiting is enabled and configuration is correct
```bash
# Verify in logs:
# "Rate limit: 100 req/s, 200 burst"

# Disable temporarily
RATE_LIMIT_ENABLED=false
```

### Problem: Specific IP is always rate limited
**Solution**: May be legitimate traffic spike or misconfigured load balancer
```bash
# Verify x-forwarded-for header is passed correctly
curl -v -H "X-Forwarded-For: 192.168.1.1" http://localhost:3000/health

# Check if same real IP is sending all requests
```

### Problem: Rate limits too restrictive
**Solution**: Adjust configuration for legitimate traffic patterns
```bash
# Increase RPS for high-volume clients
RATE_LIMIT_RPS=500
RATE_LIMIT_BURST=1000
```

## Future Enhancements

### Phase 1: Response Headers (Q1 2026)
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1699999999
```

### Phase 2: Redis-backed Distribution (Q2 2026)
- Multi-instance rate limit coordination
- Distributed token bucket via Redis
- Horizontal scaling support

### Phase 3: Granular Rate Limiting (Q3 2026)
```
/graphql:                    100 req/s
/graphql { query: mutation }: 50 req/s  (stricter for mutations)
/health:                      1000 req/s (health checks exempt)
```

### Phase 4: User-based Rate Limits (Q4 2026)
- Authenticated user tiers
- Per-user quotas
- Rate limit increase via API credits

## Configuration Migration

### v1 → v2 (Planned)

```bash
# Old: Hard-coded values
# New: Environment variables
RATE_LIMIT_RPS=100
RATE_LIMIT_BURST=200

# Migration path: Deploy with new env vars first
```

## Compliance

- ✅ Prevents application-layer DoS
- ✅ Fair resource allocation across clients
- ✅ Configurable thresholds per environment
- ⏳ OWASP A22:2021 (Denial of Service) - Mitigation

## Security Considerations

### ⚠️ Limitations

1. **Per-IP limiting**: Cannot prevent distributed attacks (DDoS)
   - Mitigation: Use CDN/WAF (e.g., Cloudflare, AWS Shield)

2. **Shared proxies**: Multiple users behind same IP
   - Mitigation: Add user-based rate limiting (future)

3. **Header spoofing**: `x-forwarded-for` can be forged
   - Mitigation: Validate header from trusted proxies only

## Additional Resources

- [OWASP Rate Limiting](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)
- [Token Bucket Algorithm](https://en.wikipedia.org/wiki/Token_bucket)
- [Nginx Rate Limiting](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html)

---

**Last Reviewed**: November 2025  
**Next Review**: December 2025  
**Reviewer**: Security Team
