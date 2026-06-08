# Redux Store Foundation - Implementation Guide

## Overview

The Redux Store Foundation for ORYA Wallet provides centralized state management for both web and mobile applications. It uses Redux Toolkit with two main slices: **Auth** and **Wallet**.

## Architecture

### Store Structure

```
Redux Store
├── Auth Slice (authentication, user, session)
└── Wallet Slice (wallets, balances, connections)
```

## Core Files

### 1. **store.ts** - Store Configuration
Creates and exports the Redux store with middleware configuration.

```typescript
import { createAppStore, store, RootState, AppDispatch } from '@orya/wallet-core/store';

// Use the default store instance
store.dispatch(setUser(userData));

// Or create a custom store for testing
const testStore = createAppStore(preloadedState);
```

**Key Exports:**
- `createAppStore(preloadedState?)` - Factory function to create a store
- `store` - Default store instance
- `RootState` - Type for the entire state tree
- `AppDispatch` - Type for the dispatch function

### 2. **auth.slice.ts** - Authentication State

Manages user authentication, sessions, and tokens.

**State Structure:**
```typescript
{
  user: User | null,           // Current logged-in user
  session: AuthSession | null, // Full session object
  isAuthenticated: boolean,    // Auth status
  loading: boolean,            // Loading state
  error: string | null,        // Error messages
  token: string | null,        // Access token
  refreshToken: string | null, // Refresh token
  sessionExpiry: number | null // Session expiry timestamp
}
```

**Available Actions:**
```typescript
import { setUser, setSession, logout, setToken, setLoading, setError } from '@orya/wallet-core/store';

// Set user
dispatch(setUser(userData));

// Set full session
dispatch(setSession(sessionData));

// Logout
dispatch(logout());

// Manage loading state
dispatch(setLoading(true));
dispatch(setLoading(false));

// Handle errors
dispatch(setError('Authentication failed'));
dispatch(setError(null)); // Clear error
```

### 3. **wallet.slice.ts** - Wallet State

Manages wallet connections, selections, and balances.

**State Structure:**
```typescript
{
  wallets: Wallet[],           // Array of connected wallets
  selectedWalletId: string | null, // ID of selected wallet
  balances: Record<string, Balance[]>, // Wallets' balances by ID
  loading: boolean,            // Loading state
  error: string | null         // Error messages
}
```

**Available Actions:**
```typescript
import { setWallets, addWallet, removeWallet, selectWallet, setWalletLoading, setWalletError } from '@orya/wallet-core/store';

// Set all wallets
dispatch(setWallets([wallet1, wallet2]));

// Add single wallet
dispatch(addWallet(newWallet));

// Remove wallet
dispatch(removeWallet(walletId));

// Select active wallet
dispatch(selectWallet(walletId));

// Manage loading
dispatch(setWalletLoading(true));

// Handle errors
dispatch(setWalletError('Connection failed'));
```

### 4. **hooks.ts** - React Hooks

Provides typed hooks for accessing state and dispatching actions.

**Basic Hooks:**
```typescript
import { useAppDispatch, useAppSelector } from '@orya/wallet-core/store';

// Basic dispatch and selector
const dispatch = useAppDispatch();
const state = useAppSelector((state) => state.auth);

// Dispatch actions
dispatch(setUser(userData));
```

**Auth Hooks:**
```typescript
import { 
  useAuth,
  useIsAuthenticated,
  useAuthUser,
  useAuthSession,
  useAuthLoading,
  useAuthError
} from '@orya/wallet-core/store';

// Get full auth state
const auth = useAuth();

// Get specific auth properties
const isAuthenticated = useIsAuthenticated();
const user = useAuthUser();
const session = useAuthSession();
const loading = useAuthLoading();
const error = useAuthError();
```

**Wallet Hooks:**
```typescript
import { 
  useWallet,
  useWallets,
  useSelectedWalletId,
  useSelectedWallet,
  useWalletBalances,
  useWalletLoading,
  useWalletError
} from '@orya/wallet-core/store';

// Get full wallet state
const wallet = useWallet();

// Get specific wallet properties
const wallets = useWallets();
const selectedId = useSelectedWalletId();
const selectedWallet = useSelectedWallet();
const balances = useWalletBalances();
const loading = useWalletLoading();
const error = useWalletError();
```

## Usage Examples

### Example 1: Login Flow

```typescript
import { useAppDispatch, useAuthLoading, useAuthError, useIsAuthenticated } from '@orya/wallet-core/store';
import { setUser, setLoading, setError } from '@orya/wallet-core/store';

export function LoginComponent() {
  const dispatch = useAppDispatch();
  const loading = useAuthLoading();
  const error = useAuthError();
  const isAuthenticated = useIsAuthenticated();

  const handleLogin = async (email: string, password: string) => {
    dispatch(setLoading(true));
    try {
      const response = await loginApi(email, password);
      dispatch(setUser(response.user));
      dispatch(setError(null));
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {isAuthenticated && <p>Welcome!</p>}
      <button onClick={() => handleLogin('user@example.com', 'password')}>
        Login
      </button>
    </div>
  );
}
```

### Example 2: Wallet Management

```typescript
import { useWallets, useSelectedWallet } from '@orya/wallet-core/store';
import { setWallets, selectWallet } from '@orya/wallet-core/store';

export function WalletManager() {
  const dispatch = useAppDispatch();
  const wallets = useWallets();
  const selected = useSelectedWallet();

  const handleSelectWallet = (walletId: string) => {
    dispatch(selectWallet(walletId));
  };

  const handleAddWallets = async () => {
    const newWallets = await fetchWallets();
    dispatch(setWallets(newWallets));
  };

  return (
    <div>
      <h2>Wallets</h2>
      <ul>
        {wallets.map((wallet) => (
          <li 
            key={wallet.id} 
            onClick={() => handleSelectWallet(wallet.id)}
            style={{ fontWeight: selected?.id === wallet.id ? 'bold' : 'normal' }}
          >
            {wallet.name} ({wallet.address})
          </li>
        ))}
      </ul>
      <button onClick={handleAddWallets}>Refresh Wallets</button>
    </div>
  );
}
```

### Example 3: Protected Route with Auth

```typescript
import { useIsAuthenticated, useAuthLoading } from '@orya/wallet-core/store';

export function ProtectedRoute({ children }) {
  const isAuthenticated = useIsAuthenticated();
  const loading = useAuthLoading();

  if (loading) return <div>Loading...</div>;

  return isAuthenticated ? children : <div>Please login first</div>;
}
```

## Acceptance Criteria - Verification

- ✅ Store configuration creates Redux store with auth and wallet slices
- ✅ Auth slice manages user/session state with proper type definitions
- ✅ Wallet slice manages wallets array, selectedWalletId, balances
- ✅ Typed hooks exported (useAppDispatch, useAppSelector)
- ✅ Auth-specific hooks available (useAuth, useAuthUser, useIsAuthenticated, etc.)
- ✅ Wallet-specific hooks available (useWallet, useWallets, useSelectedWallet, etc.)
- ✅ No TypeScript errors with proper imports from @orya/shared-types
- ✅ Can dispatch actions: `dispatch(setUser(user))`, `dispatch(selectWallet(id))`, etc.

## Type Safety

The Redux store is fully type-safe:

```typescript
// RootState - Type-safe state access
type RootState = {
  auth: AuthState;
  wallet: WalletState;
};

// AppDispatch - Type-safe dispatch
type AppDispatch = typeof store.dispatch;

// All actions are properly typed
dispatch(setUser(user)); // ✅ Type-checked
dispatch(selectWallet(id)); // ✅ Type-checked
```

## Middleware Configuration

The store is configured with:

1. **Redux Toolkit defaults** - Including immutability checks and serialization warnings
2. **Serialization check bypass** - Ignores Redux persist actions
3. **No additional custom middleware** - Can be added as needed

To add custom middleware:

```typescript
import { createAppStore } from '@orya/wallet-core/store';

const customStore = createAppStore();
// Store is configured with all defaults ready to use
```

## Best Practices

1. **Always use typed hooks** - Never use plain useSelector/useDispatch
2. **Keep actions lightweight** - Use thunks/sagas for async logic
3. **Memoize selectors** - Prevent unnecessary re-renders
4. **Use preloadedState for testing** - Create fresh stores for each test
5. **Handle loading states** - Show loading indicators during async operations
6. **Validate data** - Always validate API responses before dispatching

## Integration with React

Use in React components:

```typescript
import React from 'react';
import { Provider } from 'react-redux';
import { store } from '@orya/wallet-core/store';
import App from './App';

export default function RootComponent() {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
}
```

## Testing

```typescript
import { createAppStore, setUser, selectWallet } from '@orya/wallet-core/store';

describe('Store Integration', () => {
  it('should handle auth and wallet state', () => {
    const testStore = createAppStore();
    
    testStore.dispatch(setUser(mockUser));
    testStore.dispatch(selectWallet(walletId));
    
    const state = testStore.getState();
    expect(state.auth.user).toEqual(mockUser);
    expect(state.wallet.selectedWalletId).toBe(walletId);
  });
});
```

## Troubleshooting

### Issue: "Cannot find module '@orya/shared-types'"
**Solution:** Ensure shared-types package is built: `pnpm build`

### Issue: TypeScript errors with PayloadAction
**Solution:** Ensure Redux Toolkit is installed: `pnpm add @reduxjs/toolkit`

### Issue: State not updating in component
**Solution:** Use the typed hooks, not plain useSelector/useDispatch

## Next Steps

1. ✅ Redux Store Foundation is complete
2. 📋 Add authentication thunks (async login/logout)
3. 📋 Add wallet connection thunks
4. 📋 Integrate with API services
5. 📋 Add persistence with Redux Persist
6. 📋 Add Redux DevTools for debugging

---

**Last Updated:** 2024
**Status:** ✅ Production Ready