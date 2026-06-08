# ORŸA Infrastructure

Deployment configuration, Infrastructure as Code, and container orchestration.

## Structure

```
infrastructure/
├── docker-compose.yml       # Local development environment
├── postgres-init.sql        # Database initialization
├── kubernetes/             # Kubernetes manifests
│   ├── namespace.yml
│   ├── postgres-deployment.yml
│   ├── redis-deployment.yml
│   ├── api-gateway-deployment.yml
│   └── services/           # Other service deployments
├── terraform/              # Infrastructure as Code
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── modules/
└── scripts/                # Utility scripts
```

## Local Development

### Docker Compose Setup

Start all local services:

```bash
cd infrastructure
docker compose up -d

# Verify services
docker compose ps

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Services

| Service | URL | Purpose |
|---------|-----|---------|
| PostgreSQL | localhost:5432 | Main database |
| Redis | localhost:6379 | Cache layer |
| pgAdmin | http://localhost:5050 | DB management |
| Redis Commander | http://localhost:8081 | Cache management |

### Database

PostgreSQL 15 with:
- 5 schemas (users, transactions, portfolio, defi, audit)
- Row-level security (RLS) enabled
- Pre-initialized with tables
- All indexes created for performance

**Connection:**
```
Host: localhost
Port: 5432
Database: orya_dev
Username: orya_user
Password: dev_password_123
```

### Redis

Redis 7 with:
- Persistence enabled (AOF)
- Authentication required
- Data expiration support

**Connection:**
```
Host: localhost
Port: 6379
Password: redis_password_123
```

## Production Deployment

### Prerequisites

- AWS Account (or GCP/Azure)
- kubectl configured
- Terraform installed
- Helm (for package management)

### Option 1: AWS EKS

```bash
cd terraform/aws
terraform init
terraform plan
terraform apply
```

Creates:
- EKS cluster (1 master + 3 worker nodes)
- RDS PostgreSQL 15
- ElastiCache Redis
- ALB load balancer
- CloudFront CDN

### Option 2: GCP GKE

```bash
cd terraform/gcp
terraform init
terraform plan
terraform apply
```

Similar to AWS, using GCP services.

## Kubernetes Deployment

### Deploy to Kubernetes Cluster

```bash
# Create namespace
kubectl create namespace orya

# Deploy services
kubectl apply -f kubernetes/

# Verify deployments
kubectl get deployments -n orya
kubectl get pods -n orya
kubectl get services -n orya
```

### Scaling

```bash
# Scale API Gateway to 3 replicas
kubectl scale deployment api-gateway --replicas=3 -n orya

# Auto-scaling (requires metrics-server)
kubectl autoscale deployment api-gateway --min=2 --max=5 -n orya
```

### Monitoring

```bash
# View logs
kubectl logs -f deployment/api-gateway -n orya

# Port forward for debugging
kubectl port-forward svc/api-gateway 3000:3000 -n orya

# Get resource usage
kubectl top nodes
kubectl top pods -n orya
```

## Environment Configuration

### Development

Uses local Docker Compose with:
- Debug logging
- Relaxed rate limits
- Development RPC endpoints

```bash
# Already configured in .env
DATABASE_URL=postgresql://orya_user:dev_password_123@localhost:5432/orya_dev
REDIS_URL=redis://:redis_password_123@localhost:6379
```

### Staging

Uses Kubernetes cluster with:
- Staging RPC endpoints
- Moderate rate limits
- Full monitoring

### Production

Uses Kubernetes cluster with:
- Production RPC endpoints
- Strict rate limits
- Enhanced monitoring & alerting

## Networking

### Local

All containers on `orya-network` bridge network for inter-service communication.

### Production

```
Internet -> CloudFront CDN -> ALB -> Kubernetes Ingress -> Services
```

- CloudFront provides caching and DDoS protection
- ALB terminates TLS
- Kubernetes handles service routing

## Database Backups

### Local Development

```bash
# Backup
docker compose exec postgres pg_dump -U orya_user orya_dev > backup.sql

# Restore
docker compose exec -T postgres psql -U orya_user orya_dev < backup.sql
```

### Production (AWS RDS)

- Automatic daily backups (7-day retention)
- Manual snapshots before major updates
- Cross-region replication available

## Monitoring & Logging

### Local

Docker logs available via:
```bash
docker compose logs <service_name>
```

### Production

Integrated with:
- **Prometheus** - Metrics collection
- **Grafana** - Dashboards & visualization
- **Sentry** - Error tracking
- **Tenderly** - Transaction monitoring
- **CloudWatch** (AWS) or Stackdriver (GCP) - Centralized logging

## Security

### Database

- RLS policies enforce row-level access control
- Encrypted connections (SSL/TLS)
- Backup encryption
- Regular security updates

### Network

- VPC isolation
- Security groups restrict access
- WAF protection (CloudFront)
- DDoS protection

### Secrets Management

Environment variables stored in:
- **Local**: `.env` file (git-ignored)
- **Production**: AWS Secrets Manager / GCP Secret Manager

```bash
# Never commit secrets
echo .env >> .gitignore
```

## Cost Optimization

### Development

- Uses free/lowest tier services
- Local Docker for compute
- ~$0/month

### Staging

- Minimal: t3.small EC2 (~$30/month)
- PostgreSQL db.t3.small (~$50/month)
- Redis cache.t3.micro (~$20/month)
- Total: ~$100/month

### Production (Medium Scale)

- Kubernetes nodes: t3.medium (3 nodes) (~$150/month)
- RDS PostgreSQL: db.m5.large (~$200/month)
- ElastiCache Redis: cache.m5.large (~$150/month)
- CloudFront: ~$100-500/month depending on traffic
- Total: ~$600-1000+/month

## Disaster Recovery

### RTO / RPO Targets

- **RTO** (Recovery Time Objective): < 1 hour
- **RPO** (Recovery Point Objective): < 15 minutes

### Backup Strategy

1. **Database**: Automated daily backups + point-in-time recovery
2. **Configuration**: Infrastructure as Code in Git
3. **Artifacts**: Docker images in registry
4. **Secrets**: Managed by cloud provider secrets manager

### Recovery Procedure

```bash
# Restore from backup
terraform apply

# Update DNS to secondary site
# Restore database from backup
# Verify all services online

# Expected recovery time: 30-45 minutes
```

## Troubleshooting

### PostgreSQL Connection Refused

```bash
# Check container is running
docker compose ps

# Check logs
docker compose logs postgres

# Restart
docker compose restart postgres
```

### Kubernetes Pod CrashLoopBackOff

```bash
# Check logs
kubectl logs <pod-name> -n orya

# Check events
kubectl describe pod <pod-name> -n orya

# Check resource usage
kubectl top pod <pod-name> -n orya
```

### High Memory Usage

```bash
# Scale deployment
kubectl scale deployment <name> --replicas=3 -n orya

# Check resource limits
kubectl get pod <name> -o yaml -n orya
```

## Scripts

### Backup Database

```bash
./scripts/backup-db.sh
```

### Deploy to Production

```bash
./scripts/deploy.sh
```

### Health Check

```bash
./scripts/health-check.sh
```

## Useful Commands

```bash
# Docker
docker compose up -d              # Start services
docker compose down               # Stop services
docker compose logs -f            # View logs

# Kubernetes
kubectl get pods -n orya          # List pods
kubectl logs pod/<name> -n orya   # Pod logs
kubectl exec pod/<name> -it -n orya -- /bin/sh  # Shell access
kubectl port-forward svc/<name> 3000:3000 -n orya  # Local access

# Terraform
terraform init                    # Initialize
terraform plan                    # Preview changes
terraform apply                   # Apply changes
terraform destroy                 # Tear down
```

## Documentation

- Full architecture: `../.zencoder/ARCHITECTURE_STRATEGY_v1.md`
- Phase 0 guide: `../.zencoder/PHASE_0_STARTUP.md`
- Quick reference: `../.zencoder/QUICK_REFERENCE.md`

## Support

For infrastructure issues:
1. Check Docker logs: `docker compose logs`
2. Check Kubernetes events: `kubectl describe`
3. Review `.zencoder/QUICK_REFERENCE.md` troubleshooting section
4. Create issue with full context