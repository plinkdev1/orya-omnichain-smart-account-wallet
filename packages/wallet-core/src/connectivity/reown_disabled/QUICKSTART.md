# ReOwn Wallet Manager - Quick Start (5 minutes)

## The TL;DR

Your ReOwn Project ID is already configured: `fd2291f21ccf9b6aef6b4f5c91e1af2f` ✅

All modules are ready to use. Just integrate them into your app.

## 3-Step Setup

### Step 1: Wrap Your App

```tsx
// app.tsx or main.tsx
import { ReOwnProvider } from '@orya/wallet-core/connectivity';

<ReOwnProvider>
  <YourApp />
</ReOwnProvider>
```

### Step 2: Add Approval UI

```tsx
import { useReOwnApprovals, ApprovalModal } from '@orya/wallet-core/connectivity';

export function ApprovalCenter() {
  const { 
    pendingSessions, 
    pendingRequests,
    approveSession,
    rejectSession 
  } = useReOwnApprovals();

  const [approval, setApproval] = React.useState(null);

  return (
    <>
      <div>
        <p>Sessions: {pendingSessions.length}</p>
        <p>Requests: {pendingRequests.length}</p>
      </div>

      {pendingSessions.length > 0 && (
        <ApprovalModal
          isOpen={true}
          type="session"
          data={pendingSessions[0]}
          onApprove={() => approveSession(pendingSessions[0].id)}
          onReject={() => rejectSession(pendingSessions[0].id)}
        />
      )}
    </>
  );
}
```

### Step 3: Handle Events

```tsx
import { useReOwnManager } from '@orya/wallet-core/connectivity';

export function WalletListener() {
  const manager = useReOwnManager();

  React.useEffect(() => {
    manager.on('session_created', (session) => {
      console.log('New session:', session.peerMetadata.name);
    });

    manager.on('signing_request', (request) => {
      console.log('Sign request:', request.method);
      // Handle signing...
    });
  }, [manager]);

  return null;
}
```

## What You Get

✅ Session management (no more auto-approval!)  
✅ Signing request queue  
✅ Multi-chain support (EVM, Solana, Cosmos, SUI)  
✅ Built-in analytics  
✅ Persistent localStorage  
✅ Event-driven architecture  
✅ Type-safe operations  

## API Cheat Sheet

```typescript
const manager = useReOwnManager();

// Sessions
manager.createSessionRequest(topic, metadata, chainId, namespace, accounts)
manager.approveSession(sessionId)
manager.rejectSession(sessionId)
manager.getAllSessions()
manager.getActiveSessions()
manager.getPendingApprovals()

// Signing
manager.createSigningRequest(sessionId, method, params, chainId)
manager.approveSigningRequest(requestId, signature)
manager.rejectSigningRequest(requestId, reason)
manager.getPendingSigningRequests()

// Events
manager.on('session_created', handler)
manager.on('signing_request', handler)
manager.on('error', handler)

// Analytics
manager.getAnalytics().getMetrics()
manager.getAnalytics().on('*', handler)
```

## Hooks

```typescript
// Get manager instance
const manager = useReOwnManager();

// Get all pending approvals + methods to handle them
const { 
  pendingSessions, 
  pendingRequests, 
  approveSession, 
  rejectSession, 
  approveRequest, 
  rejectRequest,
  isLoading 
} = useReOwnApprovals();

// Context check
const { manager, isReady, error } = useReOwn();
```

## File Structure

```
reown/
├── ReOwnWalletManager.ts      ← Use this
├── ReOwnProvider.tsx           ← Wrap app with this
├── useReOwnApprovals.ts        ← Use this hook
├── ApprovalModal.tsx           ← Use this component
├── config.example.ts           ← Project ID here
├── SessionManager.ts
├── SigningQueue.ts
├── ChainAdapter.ts
├── Analytics.ts
└── sessionStore.ts
```

## Run in Your App Now

```bash
# 1. The imports already exist
import { 
  ReOwnProvider,           # Wrap app
  useReOwnManager,         # Get manager
  useReOwnApprovals,       # Get state + handlers
  ApprovalModal            # Show modal
} from '@orya/wallet-core/connectivity'

# 2. Wrap your root component
<ReOwnProvider>
  <App />
</ReOwnProvider>

# 3. Use in any child component
const { pendingSessions, approveSession } = useReOwnApprovals();
```

## Common Patterns

### Show pending approvals
```tsx
const { pendingSessions } = useReOwnApprovals();
return <div>{pendingSessions.length} waiting for approval</div>;
```

### Handle signing
```tsx
const manager = useReOwnManager();

manager.on('signing_request', async (request) => {
  const signature = await wallet.sign(request.params);
  manager.approveSigningRequest(request.id, signature);
});
```

### Get metrics
```tsx
const manager = useReOwnManager();
const metrics = manager.getAnalytics().getMetrics();

console.log(`${metrics.successfulRequests} successful requests`);
console.log(`Avg response: ${metrics.averageResponseTime}ms`);
```

## That's It!

The complex orchestration is hidden. Just use the hooks and components.

See `INTEGRATION_GUIDE.md` for complete documentation.

---

## Project ID Reference

Currently configured with: **`fd2291f21ccf9b6aef6b4f5c91e1af2f`**

Chains enabled: **Ethereum, Polygon, Arbitrum, Optimism, Solana**

Stored in: `packages/wallet-core/src/connectivity/reown/config.example.ts`
