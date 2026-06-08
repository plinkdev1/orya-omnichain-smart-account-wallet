# ReOwn AppKit Integration for ORYA Wallet

**Project ID**: `fd2291f21ccf9b6aef6b4f5c91e1af2f` ✅

Complete ReOwn wallet integration providing secure session management, multi-chain support, and analytics.

## 📚 Documentation

| Document | Purpose | Read Time |
|----------|---------|-----------|
| **[QUICKSTART.md](./QUICKSTART.md)** | Get started in 5 minutes | 5 min |
| **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** | Complete integration examples | 20 min |
| **[../../REOWN_PHASE1_IMPLEMENTATION.md](../../REOWN_PHASE1_IMPLEMENTATION.md)** | Architecture & design | 30 min |
| **[../../REOWN_MIGRATION_COMPLETE.md](../../REOWN_MIGRATION_COMPLETE.md)** | Project overview | 15 min |

## 🚀 Quick Start

```tsx
// 1. Wrap app
import { ReOwnProvider } from '@orya/wallet-core/connectivity';

<ReOwnProvider>
  <App />
</ReOwnProvider>

// 2. Use in component
import { useReOwnApprovals, ApprovalModal } from '@orya/wallet-core/connectivity';

const { pendingSessions, approveSession, rejectSession } = useReOwnApprovals();

<ApprovalModal
  isOpen={pendingSessions.length > 0}
  type="session"
  data={pendingSessions[0]}
  onApprove={() => approveSession(pendingSessions[0].id)}
  onReject={() => rejectSession(pendingSessions[0].id)}
/>
```

## 📦 Module Overview

### Core Modules

```
ReOwnWalletManager (Orchestrator)
├── SessionManager → Session lifecycle
├── SigningQueue → Request management
├── ChainAdapter → Multi-chain support
├── Analytics → Event tracking
└── sessionStore → State (Zustand)
```

### Integration Tools

```
ReOwnProvider (React Context)
├── useReOwnManager (Hook)
├── useReOwnApprovals (Hook)
└── ApprovalModal (Component)
```

## 📋 File Structure

### Core Implementation

| File | Lines | Purpose |
|------|-------|---------|
| `ReOwnWalletManager.ts` | 314 | Main orchestrator & event system |
| `SessionManager.ts` | 189 | Session lifecycle management |
| `SigningQueue.ts` | 186 | Signing request queue |
| `ChainAdapter.ts` | 223 | Multi-chain support |
| `Analytics.ts` | 254 | Event tracking & metrics |
| `sessionStore.ts` | 204 | Zustand state management |
| `ReOwnConfig.ts` | 127 | Configuration manager |

### React Integration

| File | Lines | Purpose |
|------|-------|---------|
| `ReOwnProvider.tsx` | 60 | Context provider |
| `useReOwnApprovals.ts` | 142 | Approvals hook |
| `ApprovalModal.tsx` | 211 | Modal UI component |
| `ApprovalModal.module.css` | 326 | Styling |

### Configuration & Docs

| File | Purpose |
|------|---------|
| `config.example.ts` | Configuration with Project ID |
| `index.ts` | Module exports |
| `QUICKSTART.md` | 5-minute guide |
| `INTEGRATION_GUIDE.md` | Complete integration guide |
| `README.md` | This file |

## 🔧 API Reference

### Manager

```typescript
const manager = useReOwnManager();

// Sessions
await manager.createSessionRequest(topic, metadata, chainId, namespace, accounts)
manager.approveSession(sessionId) → boolean
manager.rejectSession(sessionId) → boolean
manager.getAllSessions() → WalletSession[]
manager.getActiveSessions() → WalletSession[]
manager.getPendingApprovals() → WalletSession[]
manager.switchToSession(sessionId) → boolean

// Signing
await manager.createSigningRequest(sessionId, method, params, chainId) → SigningRequest
manager.approveSigningRequest(requestId, signature) → boolean
manager.rejectSigningRequest(requestId, reason?) → boolean
manager.getPendingSigningRequests() → SigningRequest[]

// Events
manager.on(event, handler) → unsubscribe
manager.off(event, handler)

// Sub-modules
manager.getAnalytics() → Analytics
manager.getSessionManager() → SessionManager
manager.getSigningQueue() → SigningQueue
manager.getChainAdapter() → ChainAdapter
```

### Hook: useReOwnApprovals

```typescript
const {
  // State
  pendingSessions: WalletSession[],
  pendingRequests: SigningRequest[],
  isLoading: boolean,
  error: Error | null,
  
  // Methods
  approveSession: (sessionId: string) => void,
  rejectSession: (sessionId: string) => void,
  approveRequest: (requestId: string, signature: string) => void,
  rejectRequest: (requestId: string, reason?: string) => void,
  refresh: () => void
} = useReOwnApprovals();
```

### Hook: useReOwnManager

```typescript
const manager: ReOwnWalletManager = useReOwnManager();
```

### Hook: useReOwn

```typescript
const {
  manager: ReOwnWalletManager | null,
  isReady: boolean,
  error: Error | null
} = useReOwn();
```

## 🎯 Key Features

### Session Management
- ✅ Modal-based explicit approvals
- ✅ Auto-cleanup of expired sessions (24-hour TTL default)
- ✅ Max session limits (10 default)
- ✅ Session switching & tracking

### Signing Queue
- ✅ Request timeout handling (5 minutes)
- ✅ Status tracking (pending → signed/rejected)
- ✅ Queue statistics
- ✅ Method validation per chain

### Multi-Chain Support
- ✅ EVM (Ethereum, Polygon, Arbitrum, Optimism)
- ✅ Solana
- ✅ Cosmos
- ✅ SUI
- ✅ Custom chain registration

### Analytics
- ✅ Event tracking (sessions, signings, errors)
- ✅ Metrics calculation
- ✅ Event filtering
- ✅ Event listeners & wildcard support

### UI Components
- ✅ Session approval modal
- ✅ Signing request modal
- ✅ Two-step confirmation
- ✅ Responsive design
- ✅ Loading states

## 🔐 Security Features

- 🔒 No auto-approval
- 🔒 Explicit user confirmation required
- 🔒 Request timeouts
- 🔒 Session expiration
- 🔒 Type-safe operations
- 🔒 localStorage isolation

## 📊 Event Types

```typescript
'session_created'     // New session pending approval
'session_approved'    // Session approved by user
'session_rejected'    // Session rejected by user
'signing_request'     // New signing request
'signing_approved'    // Signing request approved
'signing_rejected'    // Signing request rejected
'error'              // Error occurred
```

## 🧪 Testing Example

```typescript
import { SessionManager } from './SessionManager';
import { ReOwnConfigManager } from './ReOwnConfig';

describe('SessionManager', () => {
  it('should create and approve session', () => {
    const config = ReOwnConfigManager.initialize({
      projectId: 'test-id',
      name: 'Test',
      description: 'Test',
      url: 'http://localhost',
      icons: []
    });

    const manager = SessionManager.initialize(config);
    const session = manager.createSession(
      'topic',
      { name: 'Dapp' },
      'eip155:1',
      'eip155',
      ['0x123']
    );

    expect(session.isApproved).toBe(false);
    
    const approved = manager.approveSession(session.id);
    expect(approved).toBe(true);
    
    const updated = manager.getSession(session.id);
    expect(updated?.isApproved).toBe(true);
  });
});
```

## 🔧 Configuration

Project ID is pre-configured:

```typescript
const PROJECT_ID = 'fd2291f21ccf9b6aef6b4f5c91e1af2f';

const config = {
  reown: {
    projectId: PROJECT_ID,
    name: 'ORYA Wallet',
    description: 'Multi-chain wallet',
    url: 'https://oryawallet.com',
    icons: ['https://oryawallet.com/icon.png']
  },
  session: {
    ttl: 86400000,              // 24 hours
    maxSessions: 10,
    autoCleanup: true,
    cleanupInterval: 3600000    // 1 hour
  },
  signingQueue: {
    maxQueueSize: 50,
    requestTimeout: 300000,     // 5 minutes
    batchSize: 10
  }
};
```

## 📦 Dependencies

All included:
- `@reown/appkit` ^4.0.0
- `@reown/appkit-core` ^4.0.0
- `@reown/appkit-networks` ^4.0.0
- `zustand` ^4.4.0
- `wagmi` ^2.5.0
- `viem` ^2.5.0

## 🚦 Status

| Component | Status | Notes |
|-----------|--------|-------|
| Core modules | ✅ Complete | Production ready |
| React integration | ✅ Complete | Hooks & provider |
| Documentation | ✅ Complete | Comprehensive |
| Project ID | ✅ Configured | `fd2291f...` |
| Unit tests | ⏳ Pending | Phase 2 |
| E2E tests | ⏳ Pending | Phase 2 |
| Deployment | ⏳ Pending | Ready for Phase 2 |

## 📚 Learn More

- **Quick Start**: [QUICKSTART.md](./QUICKSTART.md)
- **Integration**: [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- **Architecture**: [REOWN_PHASE1_IMPLEMENTATION.md](../../REOWN_PHASE1_IMPLEMENTATION.md)
- **Project**: [REOWN_MIGRATION_COMPLETE.md](../../REOWN_MIGRATION_COMPLETE.md)

## 🆘 Troubleshooting

### Manager not initialized
**Error**: `useReOwn must be used within ReOwnProvider`  
**Solution**: Wrap your app with `<ReOwnProvider>`

### Sessions not persisting
**Error**: Sessions lost on page reload  
**Solution**: Check localStorage is enabled  
**Debug**: `localStorage.getItem('orya-wallet-sessions')`

### Project ID not working
**Error**: Invalid ReOwn configuration  
**Solution**: Verify Project ID in config.example.ts  
**Current**: `fd2291f21ccf9b6aef6b4f5c91e1af2f`

## 📞 Support

For issues:
1. Check documentation (especially INTEGRATION_GUIDE.md)
2. Review example code in QUICKSTART.md
3. Check console for detailed errors
4. Enable debug: `localStorage.setItem('debug', 'orya:*')`

## 📝 License

Same as ORYA Wallet main repository

---

**Ready to integrate? Start with [QUICKSTART.md](./QUICKSTART.md)** 🚀
