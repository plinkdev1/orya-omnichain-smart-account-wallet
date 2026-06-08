# Redux Store - Quick Reference

## Import Statements

```typescript
// Store & Types
import { store, createAppStore, RootState, AppDispatch } from '@orya/wallet-core/store';

// Auth Actions
import { setUser, setSession, logout, setLoading, setError } from '@orya/wallet-core/store';

// Wallet Actions
import { setWallets, addWallet, selectWallet, removeWallet } from '@orya/wallet-core/store';

// Hooks (Most Common)
import { 
  useAppDispatch,
  useAppSelector,
  useIsAuthenticated,
  useAuthUser,
  useWallets,
  useSelectedWallet
} from '@orya/wallet-core/store';
```

## Common Patterns

### 1. Get User Info
```typescript
const user = useAuthUser();
if (user) {
  console.log(user.displayName);
}
```

### 2. Check if Authenticated
```typescript
const isAuth = useIsAuthenticated();
if (!isAuth) {
  return <LoginPage />;
}
```

### 3. Get Selected Wallet
```typescript
const selectedWallet = useSelectedWallet();
console.log(selectedWallet?.address);
```

### 4. Get All Wallets
```typescript
const wallets = useWallets();
wallets.forEach(w => console.log(w.name));
```

### 5. Dispatch Login
```typescript
const dispatch = useAppDispatch();

// After successful API call
dispatch(setUser(userData));
dispatch(setSession(sessionData)); // Optional
```

### 6. Dispatch Logout
```typescript
const dispatch = useAppDispatch();
dispatch(logout());
```

### 7. Add New Wallet
```typescript
const dispatch = useAppDispatch();
dispatch(addWallet(newWalletData));
```

### 8. Select Wallet
```typescript
const dispatch = useAppDispatch();
dispatch(selectWallet(walletId));
```

### 9. Handle Loading
```typescript
const loading = useAuthLoading();
return loading ? <Spinner /> : <Content />;
```

### 10. Handle Errors
```typescript
const error = useAuthError();
if (error) {
  return <ErrorAlert message={error} />;
}
```

## Hook Reference

### Auth Hooks
| Hook | Returns | Use Case |
|------|---------|----------|
| `useAuth()` | `AuthState` | Full auth state |
| `useIsAuthenticated()` | `boolean` | Check login status |
| `useAuthUser()` | `User \| null` | Get current user |
| `useAuthSession()` | `AuthSession \| null` | Get full session |
| `useAuthLoading()` | `boolean` | Show loading state |
| `useAuthError()` | `string \| null` | Display errors |

### Wallet Hooks
| Hook | Returns | Use Case |
|------|---------|----------|
| `useWallet()` | `WalletState` | Full wallet state |
| `useWallets()` | `Wallet[]` | Get all wallets |
| `useSelectedWalletId()` | `string \| null` | Get selected ID |
| `useSelectedWallet()` | `Wallet \| null` | Get selected wallet |
| `useWalletBalances()` | `Record<string, Balance[]>` | Get all balances |
| `useWalletLoading()` | `boolean` | Show loading state |
| `useWalletError()` | `string \| null` | Display errors |

## Action Reference

### Auth Actions
```typescript
// User Management
setUser(user: User)
setSession(session: AuthSession)
logout()

// Token Management
setToken({ token, refreshToken?, expiresIn? })
clearToken()

// State Management
setLoading(boolean)
setError(string | null)
setSessionExpiry(timestamp)
```

### Wallet Actions
```typescript
// Wallet Management
setWallets(wallets: Wallet[])
addWallet(wallet: Wallet)
removeWallet(id: string)
selectWallet(id: string)
clearWallets()

// Balance Management
setBalances({ walletId, balances })
updateBalance({ walletId, balance })

// State Management
setLoading(boolean)
setError(string | null)
```

## Complete Example Component

```typescript
import React, { useEffect } from 'react';
import { useAppDispatch, useIsAuthenticated, useWallets } from '@orya/wallet-core/store';
import { setUser, setWallets } from '@orya/wallet-core/store';

export function AppComponent() {
  const dispatch = useAppDispatch();
  const isAuth = useIsAuthenticated();
  const wallets = useWallets();

  useEffect(() => {
    // Initialize auth on mount
    const initAuth = async () => {
      try {
        const userData = await fetchUser();
        dispatch(setUser(userData));
        
        const walletsData = await fetchWallets();
        dispatch(setWallets(walletsData));
      } catch (error) {
        console.error('Init failed:', error);
      }
    };

    initAuth();
  }, [dispatch]);

  if (!isAuth) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h1>Welcome</h1>
      <p>Wallets: {wallets.length}</p>
    </div>
  );
}
```

## TypeScript Type Helpers

```typescript
import type { RootState, AppDispatch, AuthState, WalletState } from '@orya/wallet-core/store';

// Type a component's props
interface Props {
  state: RootState;
  dispatch: AppDispatch;
}

// Type a selector
const selectUser = (state: RootState) => state.auth.user;

// Type state in reducer
type AuthSliceState = AuthState;
```

## Testing

```typescript
import { createAppStore } from '@orya/wallet-core/store';

// Create test store
const store = createAppStore({
  auth: {
    user: mockUser,
    isAuthenticated: true,
    // ... other fields
  },
  wallet: {
    wallets: [mockWallet],
    // ... other fields
  }
});

// Dispatch and test
store.dispatch(selectWallet(walletId));
expect(store.getState().wallet.selectedWalletId).toBe(walletId);
```

## Key Points to Remember

1. ✅ Always use `useAppDispatch` and `useAppSelector` (not plain hooks)
2. ✅ Check `useAuthLoading()` when making async calls
3. ✅ Handle errors with `useAuthError()` and `useWalletError()`
4. ✅ Use `useIsAuthenticated()` to protect routes
5. ✅ Use `useSelectedWallet()` to get current wallet
6. ✅ Dispatch actions immediately after API success
7. ✅ Clear errors when user navigates away
8. ✅ Test with `createAppStore(preloadedState)`

## Troubleshooting

**Q: My component isn't re-rendering on state change?**  
A: Make sure you're using the typed hooks, not plain `useSelector`

**Q: "Cannot find module '@orya/wallet-core/store'"?**  
A: Ensure the package is built: `pnpm build`

**Q: Actions aren't being dispatched?**  
A: Check that component is wrapped in Redux `<Provider store={store}>`

**Q: TypeScript errors with action payloads?**  
A: Use the action creators exported from the store, not manual objects

## Quick Copy-Paste

### Minimal Setup
```typescript
import { Provider } from 'react-redux';
import { store } from '@orya/wallet-core/store';
import App from './App';

export default function Root() {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
}
```

### Minimal Component
```typescript
import { useAppDispatch, useIsAuthenticated } from '@orya/wallet-core/store';
import { logout } from '@orya/wallet-core/store';

export function Header() {
  const dispatch = useAppDispatch();
  const isAuth = useIsAuthenticated();

  return (
    <header>
      {isAuth && (
        <button onClick={() => dispatch(logout())}>
          Logout
        </button>
      )}
    </header>
  );
}
```

---

**Last Updated:** 2024  
**For detailed docs:** See `REDUX_STORE_GUIDE.md`