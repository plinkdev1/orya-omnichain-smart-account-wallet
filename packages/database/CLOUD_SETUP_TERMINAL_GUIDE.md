# Prisma Cloud Setup - Terminal Guide with Output Examples

This guide shows exactly what you'll see in your terminal and what to do at each step.

---

## 🎯 Command 1: Run Link Command

### Type This:
```bash
cd packages/database
pnpm prisma link
```

### Expected Output:
```
? Which authentication method would you like to use? (Use arrow keys)
❯ GitHub
  Email
```

---

## 🔓 Step 1: Choose Authentication

### Action: Press Enter (GitHub is default)

### Output:
```
✓ GitHub selected
→ Opening browser window for authentication...
```

### In Browser:
- GitHub login page appears
- Sign in if needed
- Authorize "Prisma" access
- Browser shows: "✓ Authorization successful"
- Terminal continues automatically

### Back in Terminal:
```
✓ Authenticated successfully
```

---

## 📦 Step 2: Create Workspace

### Output:
```
? Create a new workspace or use an existing one?
❯ Create new workspace
  Use existing workspace
```

### Action: Press Enter (Create new is default)

### Output:
```
? What would you like to name your workspace?
```

### Type:
```
Orya Wallet
```

### Output:
```
✓ Workspace "Orya Wallet" created
```

---

## 🏗️ Step 3: Create Project

### Output:
```
? What would you like to name your project?
```

### Type:
```
orya-wallet-database
```

### Output:
```
✓ Project "orya-wallet-database" created
```

---

## 🔗 Step 4: Link Project

### Output:
```
? Are you currently developing your Prisma schema?
❯ Yes, I am
  No, I'm not
```

### Action: Press Enter (Yes is default)

### Output:
```
✓ Fetching your project details...
✓ Validating your schema...

┌─ SUCCESS ────────────────────────────────────┐
│                                              │
│  Your project has been linked to Prisma     │
│  Cloud.                                      │
│                                              │
│  Workspace: Orya Wallet                      │
│  Project:   orya-wallet-database             │
│                                              │
│  API Key: clz1a2b3c4d5e6f7g8h9i0j...        │
│                                              │
│  Your API key has been saved to:             │
│  .env.production.local                       │
│                                              │
│  Next steps:                                 │
│  1. Run: pnpm db:migrate:dev                 │
│  2. Visit: https://cloud.prisma.io           │
│                                              │
└──────────────────────────────────────────────┘
```

---

## ✅ Success Indicators

### Check 1: File Created

```bash
# Should show the API key file
ls -la .env.production.local

# Output:
# -rw-r--r--  1 user  group  123 Nov 18 16:45 .env.production.local
```

### Check 2: API Key Saved

```bash
# View your API key (don't share!)
cat .env.production.local

# Output:
# PRISMA_API_KEY=clz1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t
```

### Check 3: Online Dashboard

Visit: `https://cloud.prisma.io`

You should see:
- Your workspace: **"Orya Wallet"** ✓
- Your project: **"orya-wallet-database"** ✓
- Status: **"Connected"** ✓

---

## 🚀 Step 5: Run First Migration

Now that you're linked, migrations auto-track:

```bash
pnpm db:migrate:dev --name init
```

### Output (same as before, but now tracked):
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database at "localhost:5432"

✓ Created database
✓ Ran migrations

✓ Generated Prisma Client (X.X.X)

Prisma Cloud has recorded this migration
→ View at: https://cloud.prisma.io/workspace/orya-wallet-database
```

---

## 📊 Step 6: Check Cloud Dashboard

### Visit:
```
https://cloud.prisma.io
```

### You'll See:

#### Overview Tab
```
Project Status: Active
Environment: Development
Last Deployment: Just now
Connected Environments: 1
```

#### Migrations Tab
```
Migration Name          | Status | Timestamp
─────────────────────────────────────────────
init                    | ✓ OK   | 16:47 UTC
```

#### Deployments Tab
```
Environment | Deployment | Status | Time
─────────────────────────────────────────
dev         | init       | ✓ OK   | 16:47 UTC
```

---

## 🌐 Complete Workspace Setup

Your workspace now has:

```
Orya Wallet (Workspace)
├── orya-wallet-database (Project)
│   ├── Migrations
│   │   └── init (recorded)
│   ├── Deployments
│   │   └── dev: init (recorded)
│   ├── Settings
│   │   └── API Keys (your key visible here)
│   └── Team (invite members)
```

---

## 💾 Save Your API Key Securely

### For Production Servers

Your local key is in:
```bash
cat .env.production.local
# PRISMA_API_KEY=clz1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t
```

**Store this safely:**
- 🔐 GitHub Secrets (for CI/CD)
- 🔐 Environment variable on production server
- 🔐 Secret management tool (Vault, LastPass, etc.)
- ❌ DO NOT commit to git
- ❌ DO NOT share publicly

---

## 🔄 Production Deployment Example

When you deploy to production later:

```bash
# On production server, set API key
export PRISMA_API_KEY=clz1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t

# Deploy migrations
pnpm db:migrate:deploy

# Output:
✓ Fetching migrations
✓ Validating database
✓ Running migrations
✓ Recorded deployment to Prisma Cloud
```

Then check dashboard:
```
https://cloud.prisma.io/workspace/orya-wallet-database/deployments
→ Shows production deployment with timestamp
→ Team can see what's deployed where
```

---

## 🎯 Common Outputs & What They Mean

### ✓ Success
```
✓ Authenticated successfully
✓ Project linked
✓ Migration recorded
```
**Meaning**: Everything working perfectly

### ⚠️ Warning
```
⚠️ API key will expire in 30 days
→ Go to Cloud Dashboard → Settings → Rotate key
```
**Action**: Rotate your API key if warned

### ❌ Error
```
Error: PRISMA_API_KEY not set or invalid
```
**Action**: Check `echo $PRISMA_API_KEY` or re-link with `pnpm prisma link`

---

## 🆘 Troubleshooting Terminal Output

### If Browser Doesn't Open

```bash
# Manually go to:
https://cloud.prisma.io

# Sign in
# Return to terminal and continue
```

### If You See "Not Linked"

```bash
# Re-run link command
pnpm prisma link

# Follow steps again
```

### If Migration Doesn't Record

```bash
# Verify API key is set
echo $PRISMA_API_KEY

# Should show long string starting with "clz"
# If empty, re-link:
pnpm prisma link
```

---

## 📋 Checklist: Verify Everything Works

- [ ] Ran `pnpm prisma link`
- [ ] Saw "SUCCESS" message
- [ ] `.env.production.local` file created
- [ ] Can see API key with `cat .env.production.local`
- [ ] Visited `https://cloud.prisma.io`
- [ ] See workspace "Orya Wallet" listed
- [ ] See project "orya-wallet-database" listed
- [ ] Status shows "Connected"
- [ ] Ran migration with `pnpm db:migrate:dev --name init`
- [ ] Migration appears in Cloud Dashboard → Migrations tab

---

## 🎉 You're Done!

You now have:
```
✓ Project linked to Prisma Cloud
✓ API key saved securely
✓ First migration recorded
✓ Production-ready for deployment tracking
✓ Team collaboration ready
```

All future migrations and deployments will automatically track in the cloud!

---

## 📚 Next Actions

### Immediate (Done)
- ✅ Link project
- ✅ Verify in dashboard
- ✅ Record first migration

### For Production
- ⏭️ Set `PRISMA_API_KEY` env var
- ⏭️ Run `pnpm db:migrate:deploy`
- ⏭️ Check dashboard for deployment record

### Optional: Team Collaboration
- ⏭️ Go to Cloud Dashboard → Settings → Team
- ⏭️ Invite team members
- ⏭️ Set roles (Admin/Developer/Viewer)

---

## 🔗 Quick Links

- **Dashboard**: https://cloud.prisma.io
- **Docs**: https://www.prisma.io/docs/orm/prisma-cloud/overview
- **API Key Location**: `packages/database/.env.production.local`

---

**Status**: ✅ Ready to execute `pnpm prisma link`

**Next**: Follow the terminal prompts exactly as shown above
