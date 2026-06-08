# Prisma Cloud Setup Guide

**Purpose**: Production monitoring, schema versioning, and deployment tracking  
**Time to Setup**: ~5 minutes  
**Cost**: Free tier available (paid for production)

---

## 🎯 What Prisma Cloud Provides

✅ **Schema Versioning** - Track all database schema changes  
✅ **Deployment Tracking** - Monitor when migrations are deployed  
✅ **Error Tracking** - Production query errors and issues  
✅ **Performance Insights** - Query performance monitoring  
✅ **Team Collaboration** - Share projects with team members  
✅ **Audit Logs** - Complete migration history  
✅ **Alerts** - Notifications for schema changes or errors  

---

## 🚀 Step 1: Create Prisma Cloud Account

### 1a. Go to Prisma Cloud
```
https://cloud.prisma.io
```

### 1b. Sign Up with GitHub (Recommended)
- Click "Continue with GitHub"
- Authorize Prisma
- Creates account linked to your GitHub

### Alternative: Email Sign-Up
- Enter email and password
- Verify email address
- Create account

---

## 🔗 Step 2: Link Your Project

### 2a. From Project Root

```bash
cd /path/to/orya-wallet-repo/packages/database
pnpm prisma link
```

### 2b. Authentication Flow

```
? Which authentication method would you like to use?
> GitHub (recommended)
  Email

# If GitHub selected:
# - Opens browser window
# - Sign in to GitHub if needed
# - Authorize Prisma
# - Returns to terminal

# If Email selected:
# - Enter email
# - Check email for verification link
# - Click verification link
# - Continue in terminal
```

### 2c. Create/Select Workspace

```
? Create a new workspace or use an existing one?
> Create new workspace
  Use existing workspace

# Name your workspace (e.g., "Orya Wallet")
? Workspace name: Orya Wallet
```

### 2d. Link Project

```
? How would you like to name your project?
> orya-wallet-database

# Confirms linking
✓ Workspace created
✓ Project created
✓ Project linked to your workspace
```

---

## ⚙️ Step 3: Configure Schema

### 3a. Update schema.prisma

Add this to the top of `packages/database/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator studio {
  provider = "prisma-studio"
}

// Add this block for Prisma Cloud
// (automatically added during `pnpm prisma link`)
```

### 3b. Verify Link Configuration

After running `pnpm prisma link`, check for `.env.production.local`:

```bash
ls -la .env.production.local
# Should show: (file exists)
```

Or check that Prisma created `.env` entries:

```bash
cat .env
# Should contain: PRISMA_API_KEY=... (auto-added by link)
```

---

## ✅ Step 4: Verify Connection

### 4a. Check Link Status

```bash
pnpm prisma studio --version
# Shows Prisma Studio version

pnpm prisma version
# Shows all Prisma versions
```

### 4b. Check Cloud Dashboard

Go to: `https://cloud.prisma.io`

You should see:
- ✅ Workspace: "Orya Wallet"
- ✅ Project: "orya-wallet-database"
- ✅ Connection Status: "Connected"

---

## 🔄 Step 5: First Deployment Tracking

### 5a. Create a Deployment Record

When you run migrations:

```bash
pnpm db:migrate:dev --name init
```

This automatically:
- ✅ Records migration in Prisma Cloud
- ✅ Shows in deployment history
- ✅ Tracks timestamp and author

### 5b. View in Cloud Dashboard

```
https://cloud.prisma.io/yourworkspace/orya-wallet-database
  → Migrations tab
  → Shows all deployments with timestamps
```

---

## 📊 Step 6: Monitor Production (Optional)

### 6a. Set Environment Variables

For **production environment** (staging/prod servers):

```bash
# .env.production (or export)
DATABASE_URL=postgresql://user:pass@prod-db:5432/orya_prod
PRISMA_API_KEY=<copied from cloud dashboard>
```

### 6b. Deploy with Tracking

```bash
# On production server
pnpm db:migrate:deploy

# Automatically sends to Prisma Cloud:
# - Deployment timestamp
# - Server information
# - Migration status
# - Any errors
```

### 6c. View Production Deployments

```
Cloud Dashboard → Deployments tab
  → Shows prod, staging, dev deployments
  → Color-coded success/failure
  → Timestamps for each deployment
```

---

## 🎯 Common Workflows

### Workflow 1: Local Development (Untracked)
```bash
# Your local changes don't auto-report to cloud
pnpm db:migrate:dev --name new_feature

# To manually create deployment record:
# (usually not needed for local dev)
```

### Workflow 2: Staging Deployment (Tracked)
```bash
# On staging server
export PRISMA_API_KEY=<from cloud>
pnpm db:migrate:deploy

# Auto-reports to cloud as "staging" deployment
```

### Workflow 3: Production Deployment (Tracked)
```bash
# On production server
export PRISMA_API_KEY=<from cloud>
pnpm db:migrate:deploy

# Auto-reports to cloud as "production" deployment
# Team gets notified
# Audit log created
```

---

## 📍 Where to Find Your API Key

### In Prisma Cloud Dashboard

```
https://cloud.prisma.io
  → Your Workspace (top left)
  → Settings → API Keys
  → Copy your API Key
```

### In Environment

```bash
# After linking, Prisma creates:
cat packages/database/.env.production.local

# Should show:
# PRISMA_API_KEY=clz123abc456def...
```

### Use in CI/CD

```bash
# GitHub Actions example
env:
  PRISMA_API_KEY: ${{ secrets.PRISMA_API_KEY }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## 🔐 Security Best Practices

✅ **Never commit API keys**
```bash
# Already in .gitignore:
.env.production.local
```

✅ **Use GitHub Secrets**
```yaml
# .github/workflows/deploy.yml
env:
  PRISMA_API_KEY: ${{ secrets.PRISMA_API_KEY }}
```

✅ **Rotate keys regularly**
```
Cloud Dashboard → Settings → API Keys → Rotate
```

✅ **Limit workspace access**
```
Cloud Dashboard → Team → Invite members with specific roles
```

---

## 🚨 Troubleshooting

### Issue: "Not linked" Error

```bash
pnpm prisma studio
# Error: Project not linked

# Solution:
pnpm prisma link
```

### Issue: "API Key Invalid"

```bash
# Check if key exists:
echo $PRISMA_API_KEY

# If empty:
export PRISMA_API_KEY=<copy from cloud dashboard>

# Or add to .env:
cat >> .env.production.local << EOF
PRISMA_API_KEY=<your-key>
EOF
```

### Issue: "Deployment Not Tracking"

```bash
# Verify API key is set:
echo $PRISMA_API_KEY  # Should not be empty

# Check logs:
pnpm db:migrate:deploy --verbose

# If still failing:
pnpm prisma link    # Re-link project
```

### Issue: Can't Log Into Prisma Cloud

```bash
# Try a different browser
# Or use GitHub login instead of email
# Or contact: support@prisma.io
```

---

## 📈 Production Monitoring Dashboard

### Accessible at:
```
https://cloud.prisma.io/yourworkspace/orya-wallet-database
```

### Key Sections:

**1. Overview**
- Project status
- Last deployment
- Connected environments

**2. Migrations**
- All migrations history
- Timestamps
- Author information
- Status (success/failed)

**3. Deployments**
- Production deployments
- Staging deployments
- Dev deployments
- Deployment history with timestamps

**4. Settings**
- API keys
- Team members
- Webhook integrations
- Integration settings

**5. Audit Logs**
- All changes to project
- Who made changes
- When changes occurred
- What was changed

---

## 🔔 Webhook Integrations (Advanced)

### Send Deployment Alerts to Slack

```
Cloud Dashboard → Settings → Integrations → Slack
  → Connect Slack workspace
  → Select channel for notifications
  → Configure events (migrations, deployments)
```

### Send to Discord/Teams

```
Settings → Webhooks
  → Add custom webhook URL
  → Configure which events trigger notification
```

---

## 📚 Next Steps

### For Development
1. ✅ Link project with `pnpm prisma link`
2. ✅ View in cloud dashboard
3. ✅ Continue development (local changes auto-tracked after deployment)

### For Staging/Production
1. ✅ Set PRISMA_API_KEY environment variable
2. ✅ Run: `pnpm db:migrate:deploy`
3. ✅ Check cloud dashboard for deployment record

### For Team Collaboration
1. ✅ Go to workspace settings
2. ✅ Invite team members
3. ✅ Set roles (Admin, Developer, Viewer)
4. ✅ Share project dashboard link

---

## ✨ Benefits You'll Get

✅ **Visibility**: See all migrations and deployments in one place  
✅ **Auditing**: Complete history of schema changes  
✅ **Team Coordination**: Prevent conflicting migrations  
✅ **Error Tracking**: Know when deployments fail  
✅ **Production Safety**: Deployment confirmations and rollback capability  
✅ **Performance Insights**: Query performance monitoring (paid tier)  

---

## 📞 Support

**Prisma Cloud Docs**:
```
https://www.prisma.io/docs/orm/prisma-cloud/overview
```

**Getting Help**:
```
Cloud Dashboard → Help → Contact Support
Or: support@prisma.io
```

---

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| Link project | `pnpm prisma link` |
| View migrations | `https://cloud.prisma.io` → Migrations |
| Deploy with tracking | `pnpm db:migrate:deploy` |
| Check API key | `echo $PRISMA_API_KEY` |
| Update project name | Cloud Dashboard → Settings |

---

**Status**: Ready for Prisma Cloud setup

**Next**: Run `pnpm prisma link` to connect to cloud
