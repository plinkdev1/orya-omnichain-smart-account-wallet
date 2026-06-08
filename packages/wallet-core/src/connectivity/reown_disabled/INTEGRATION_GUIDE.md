# ReOwn AppKit Integration Guide

**Project ID**: `fd2291f21ccf9b6aef6b4f5c91e1af2f` ✅

This guide shows how to integrate the ReOwn Wallet Manager into your ORYA Wallet application.

## 1. Setup at App Root

### Step 1: Wrap with ReOwnProvider

```tsx
// apps/web/src/App.tsx or main.tsx
import React from 'react';
import { ReOwnProvider } from '@orya/wallet-core/connectivity';
import MainApp from './MainApp';

function App() {
  return (
    <ReOwnProvider
      onReady={() => console.log('ReOwn ready!')}
      onError={(error) => console.error('ReOwn error:', error)}
    >
      <MainApp />
    </ReOwnProvider>
  );
}

export default App;
```

### Step 2: Access Manager in Components

```tsx
// components/WalletApprovals.tsx
import { useReOwnApprovals, ApprovalModal } from '@orya/wallet-core/connectivity';

export function WalletApprovals() {
  const [activeApproval, setActiveApproval] = React.useState<'session' | 'signing' | null>(null);
  const [selectedData, setSelectedData] = React.useState(null);
  
  const {
    pendingSessions,
    pendingRequests,
    isLoading,
    approveSession,
    rejectSession,
    approveRequest,
    rejectRequest
  } = useReOwnApprovals();

  const handleApprovePending = () => {
    if (pendingSessions.length > 0) {
      setActiveApproval('session');
      setSelectedData(pendingSessions[0]);
    }
  };

  const handleApproveSession = () => {
    if (selectedData && activeApproval === 'session') {
      approveSession(selectedData.id);
      setActiveApproval(null);
    }
  };

  const handleRejectSession = () => {
    if (selectedData && activeApproval === 'session') {
      rejectSession(selectedData.id);
      setActiveApproval(null);
    }
  };

  return (
    <div>
      <div className="approvals-summary">
        <p>Pending Sessions: {pendingSessions.length}</p>
        <p>Pending Requests: {pendingRequests.length}</p>
      </div>

      {pendingSessions.length > 0 && (
        <button onClick={handleApprovePending}>
          Review Session Approval
        </button>
      )}

      <ApprovalModal
        isOpen={activeApproval === 'session' && selectedData !== null}
        type="session"
        data={selectedData}
        onApprove={handleApproveSession}
        onReject={handleRejectSession}
        isLoading={isLoading}
      />
    </div>
  );
}
```

## 2. Creating Sessions

### From WalletConnect Bridge

```tsx
// When receiving a session_proposal event from ReOwn Bridge
import { useReOwnManager } from '@orya/wallet-core/connectivity';

export function SessionHandler() {
  const manager = useReOwnManager();

  React.useEffect(() => {
    const unsubscribe = manager.on('session_created', async (session) => {
      console.log('New session created:', session.id);
      console.log('Peer:', session.peerMetadata.name);
      console.log('Chain:', session.chainId);
      console.log('Accounts:', session.accounts);
      
      // Show UI notification that approval is needed
      showNotification('New connection request from ' + session.peerMetadata.name);
    });

    return unsubscribe;
  }, [manager]);

  return null;
}
```

### Manually Creating Session

```typescript
const manager = useReOwnManager();

await manager.createSessionRequest(
  topic: 'wc_xxx',
  peerMetadata: {
    name: 'Dapp Name',
    description: 'Your dapp description',
    url: 'https://dapp.com',
    icons: ['https://dapp.com/icon.png']
  },
  chainId: 'eip155:1', // Ethereum mainnet
  chainNamespace: 'eip155',
  accounts: ['0x1234...']
);
```

## 3. Handling Signing Requests

### Listen for Signing Requests

```tsx
import { useReOwnManager, ApprovalModal } from '@orya/wallet-core/connectivity';

export function SigningRequestHandler() {
  const [signingData, setSigningData] = React.useState(null);
  const manager = useReOwnManager();

  React.useEffect(() => {
    const unsubscribe = manager.on('signing_request', (request) => {
      console.log('Sign request:', request.method);
      console.log('Chain:', request.chainId);
      setSigningData(request);
    });

    return unsubscribe;
  }, [manager]);

  const handleApprove = async () => {
    // Perform signing here
    const signature = await signTransaction(signingData);
    manager.approveSigningRequest(signingData.id, signature);
  };

  const handleReject = () => {
    manager.rejectSigningRequest(signingData.id, 'User rejected');
  };

  return (
    <ApprovalModal
      isOpen={signingData !== null}
      type="signing"
      data={signingData}
      onApprove={handleApprove}
      onReject={handleReject}
    />
  );
}
```

## 4. Analytics & Monitoring

### Track Events

```typescript
const manager = useReOwnManager();
const analytics = manager.getAnalytics();

// Get metrics
const metrics = analytics.getMetrics();
console.log(`Sessions: ${metrics.totalSessions}`);
console.log(`Successful requests: ${metrics.successfulRequests}`);
console.log(`Avg response time: ${metrics.averageResponseTime}ms`);

// Listen to specific events
analytics.on('session_approved', (event) => {
  console.log('Session approved at', new Date(event.timestamp));
});

analytics.on('signing_request_approved', (event) => {
  console.log(`${event.method} signed on ${event.chainId}`);
});

// Get filtered events
const recentEvents = analytics.getEvents({
  status: 'success',
  timeRange: {
    start: Date.now() - 3600000, // Last hour
    end: Date.now()
  }
});
```

### Send Analytics to Backend

```typescript
analytics.on('flush', async (event) => {
  // Called every minute
  const metrics = analytics.getMetrics();
  
  await fetch('/api/analytics/metrics', {
    method: 'POST',
    body: JSON.stringify({
      timestamp: new Date(),
      metrics
    })
  });
});
```

## 5. Session Management

### Get All Sessions

```typescript
const manager = useReOwnManager();

const allSessions = manager.getAllSessions();
const activeSessions = manager.getActiveSessions();
const pendingApprovals = manager.getPendingApprovals();

// Switch active session
manager.switchToSession(sessionId);

// Get specific session
const session = manager.getSession(sessionId);
console.log(session.accounts);
console.log(session.chainId);
console.log(session.isApproved);
```

### Session Lifecycle

```
1. createSessionRequest() → session created (pending approval)
2. requestApproval() → added to pending approvals queue
3. approveSession() → session marked as approved & active
4. switchToSession() → set as active for signing
5. Session expires or rejectSession() → session removed
```

## 6. Multi-Chain Support

### Register Additional Chains

```typescript
import { mainnet, polygonMainnet } from '@reown/appkit-networks/evm';
import { solanaMainnet } from '@reown/appkit-networks/solana';

const manager = useReOwnManager();

manager.registerChains([
  mainnet,
  polygonMainnet,
  solanaMainnet
]);

// Check supported methods
const adapter = manager.getChainAdapter();
const methods = adapter.getSupportedMethods('eip155');
// Returns: ['personal_sign', 'eth_sign', 'eth_signTransaction', 'eth_signTypedData', 'eth_sendTransaction']

const solidoMethods = adapter.getSupportedMethods('solana');
// Returns: ['signMessage', 'signTransaction', 'signAllTransactions']
```

## 7. Event Listeners

### Full Event System

```typescript
const manager = useReOwnManager();

manager.on('session_created', (session) => {
  console.log('New session pending approval:', session.id);
});

manager.on('session_approved', (session) => {
  console.log('Session approved:', session.id);
  connectToChain(session.chainId);
});

manager.on('session_rejected', (event) => {
  console.log('Session rejected:', event.sessionId);
});

manager.on('signing_request', (request) => {
  console.log('Sign request:', request.method);
  showSigningUI(request);
});

manager.on('signing_approved', (request) => {
  console.log('Signing approved:', request.id);
});

manager.on('signing_rejected', (request) => {
  console.log('Signing rejected:', request.id);
});

manager.on('error', (error) => {
  console.error('ReOwn error:', error);
  showErrorUI(error.message);
});
```

## 8. Error Handling

### Comprehensive Error Handling

```typescript
const manager = useReOwnManager();

try {
  // Validate before operations
  if (!manager.validateConfiguration()) {
    throw new Error('ReOwn not properly configured');
  }

  // Create session with error handling
  const session = await manager.createSessionRequest(
    topic,
    metadata,
    chainId,
    namespace,
    accounts
  );
} catch (error) {
  if (error instanceof Error) {
    console.error('Error:', error.message);
    
    if (error.message.includes('not found')) {
      // Session not found
    } else if (error.message.includes('not supported')) {
      // Chain/method not supported
    }
  }
}

// Listen for all errors
manager.on('error', ({ message, timestamp }) => {
  logger.error('ReOwn error:', message, { timestamp });
  sentry.captureException(new Error(message));
});
```

## 9. Configuration Options

### Full Configuration Example

```typescript
import { reownConfig } from '@orya/wallet-core/connectivity';

// View current config
console.log(reownConfig);
// Output:
// {
//   reown: {
//     projectId: 'fd2291f21ccf9b6aef6b4f5c91e1af2f',
//     name: 'ORYA Wallet',
//     description: 'Multi-chain wallet supporting...',
//     url: 'https://oryawallet.com',
//     icons: ['https://oryawallet.com/icon.png']
//   },
//   session: {
//     ttl: 86400000,           // 24 hours
//     maxSessions: 10,
//     autoCleanup: true,
//     cleanupInterval: 3600000 // 1 hour
//   },
//   signingQueue: {
//     maxQueueSize: 50,
//     requestTimeout: 300000,  // 5 minutes
//     batchSize: 10
//   }
// }
```

### Custom Configuration

```typescript
import { ReOwnWalletManager } from '@orya/wallet-core/connectivity';

const customManager = ReOwnWalletManager.initialize({
  reown: {
    projectId: 'fd2291f21ccf9b6aef6b4f5c91e1af2f',
    name: 'Custom Wallet',
    description: 'Custom description',
    url: 'https://custom.com',
    icons: ['https://custom.com/icon.png']
  },
  session: {
    ttl: 172800000, // 48 hours
    maxSessions: 20,
    autoCleanup: true,
    cleanupInterval: 1800000 // 30 minutes
  },
  signingQueue: {
    maxQueueSize: 100,
    requestTimeout: 600000, // 10 minutes
    batchSize: 20
  }
});
```

## 10. Testing

### Unit Testing Example

```typescript
import { SessionManager } from '@orya/wallet-core/connectivity';
import { ReOwnConfigManager } from '@orya/wallet-core/connectivity';

describe('SessionManager', () => {
  let manager: SessionManager;
  let config: ReOwnConfigManager;

  beforeEach(() => {
    config = ReOwnConfigManager.initialize({
      projectId: 'test-id',
      name: 'Test',
      description: 'Test',
      url: 'http://localhost',
      icons: []
    });

    manager = SessionManager.initialize(config);
  });

  it('should create a session', () => {
    const session = manager.createSession(
      'topic',
      { name: 'Dapp' },
      'eip155:1',
      'eip155',
      ['0x123']
    );

    expect(session.isApproved).toBe(false);
    expect(session.isActive).toBe(false);
  });

  it('should approve session', () => {
    const session = manager.createSession(
      'topic',
      { name: 'Dapp' },
      'eip155:1',
      'eip155',
      ['0x123']
    );

    const approved = manager.approveSession(session.id);
    expect(approved).toBe(true);

    const updated = manager.getSession(session.id);
    expect(updated?.isApproved).toBe(true);
  });
});
```

## Environment Variables

Add to `.env` files:

```bash
# .env.local / .env.production
REACT_APP_REOWN_PROJECT_ID=fd2291f21ccf9b6aef6b4f5c91e1af2f
REACT_APP_WALLET_URL=https://oryawallet.com
REACT_APP_WALLET_ICON=https://oryawallet.com/logo.png
```

## Migration Checklist

- [ ] Add ReOwnProvider to app root
- [ ] Import ReOwn components where needed
- [ ] Connect ApprovalModal to UI layer
- [ ] Setup event listeners for sessions and signing
- [ ] Implement signing logic in approval handlers
- [ ] Setup analytics event tracking
- [ ] Test with ReOwn Bridge
- [ ] Deploy to staging
- [ ] Monitor metrics for issues
- [ ] Deploy to production

## Troubleshooting

### Manager not initialized
```tsx
// Error: useReOwn must be used within ReOwnProvider
// Solution: Wrap component tree with <ReOwnProvider>
```

### Project ID issues
```typescript
// Error: Invalid ReOwn configuration
// Solution: Verify PROJECT_ID in config.example.ts matches dashboard
console.log(PROJECT_ID); // Should be: fd2291f21ccf9b6aef6b4f5c91e1af2f
```

### Sessions not persisting
```typescript
// Sessions are persisted to localStorage by default
// Check localStorage.getItem('orya-wallet-sessions')
// If empty, localStorage may be disabled or full
```

### Slow approval modal
```typescript
// Caused by large parameter objects
// Solution: Implement virtualization for parameter display
// Current: JSON.stringify with 200px height limit
```

## Support

For issues or questions:
- Check REOWN_PHASE1_IMPLEMENTATION.md for architecture details
- Review module source code for API details
- Check console for detailed error messages
- Enable debug logging: `localStorage.setItem('debug', 'orya:*')`
