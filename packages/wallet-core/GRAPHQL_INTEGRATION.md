# GraphQL Integration - Task 2.9

## Overview

Frontend GraphQL Client implementation for communicating with the API Gateway GraphQL server.

## Components Implemented

### 1. Apollo Client Configuration
**File**: `src/services/apollo-client.ts`

```typescript
const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
    query: { fetchPolicy: 'cache-first' },
  },
});
```

**Features**:
- Automatic error handling
- Type-safe caching
- Configurable fetch policies
- Environment-based API URL

### 2. GraphQL Operations

#### Queries (src/graphql/queries.ts)
- `QUERY_USER` - Get user by ID
- `QUERY_USER_WALLETS_V2` - List user wallets
- `QUERY_WALLET_BALANCE_V2` - Get wallet balance

#### Mutations (src/graphql/mutations.ts)
- `MUTATION_REGISTER_USER` - Register new user
- `MUTATION_CREATE_WALLET_MPC` - Create MPC wallet
- `MUTATION_SIGN_TRANSACTION` - Sign transaction

### 3. Custom Hooks

**File**: `src/hooks/useWalletOperations.ts`

#### User Registration
```typescript
const { registerUser, loading, error } = useRegisterUser();
const user = await registerUser('user@example.com', 'firebase');
```

#### Wallet Creation
```typescript
const { createWallet, loading, error } = useCreateWallet();
const wallet = await createWallet('userId123', 'sui-mainnet', 'mpc');
```

#### Transaction Signing
```typescript
const { signTransaction, loading, error } = useSignTransaction();
const signature = await signTransaction('walletId', '0x...');
```

#### User Queries
```typescript
const { user, loading, error } = useUser('userId123');
const { wallets, loading, error, refetch } = useUserWallets('userId123');
const { balance, loading, error } = useWalletBalance('walletId123');
```

### 4. Provider Setup

#### Web App (apps/web/app/providers.tsx)
```typescript
<ApolloProvider client={apolloClient}>
  <Provider store={store}>
    <ThemeProvider>
      <AuthGate>
        {children}
      </AuthGate>
    </ThemeProvider>
  </Provider>
</ApolloProvider>
```

#### Mobile App (apps/mobile/app/providers-enhanced.tsx)
```typescript
<ApolloProvider client={apolloClient}>
  <GestureHandlerRootView>
    <SafeAreaProvider>
      <ReduxProvider store={store}>
        <AuthGate>{children}</AuthGate>
      </ReduxProvider>
    </SafeAreaProvider>
  </GestureHandlerRootView>
</ApolloProvider>
```

## Configuration

### Environment Variables

**Web (.env.development)**:
```
NEXT_PUBLIC_API_URL=http://localhost:3000/graphql
```

**Mobile (.env.example)**:
```
EXPO_PUBLIC_GRAPHQL_URL=http://localhost:3000/graphql
```

## Installation

Install dependencies in each package:

```bash
# Wallet Core
pnpm install @apollo/client graphql

# Web App
pnpm install @apollo/client graphql

# Mobile App
pnpm install @apollo/client graphql
```

## Usage Examples

### Register User
```typescript
import { useRegisterUser } from '@orya/wallet-core/hooks';

function RegisterForm() {
  const { registerUser, loading, error } = useRegisterUser();

  const handleRegister = async () => {
    try {
      const user = await registerUser('user@example.com', 'firebase');
      console.log('User registered:', user.id);
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  return (
    <button onClick={handleRegister} disabled={loading}>
      {loading ? 'Registering...' : 'Register'}
    </button>
  );
}
```

### Create Wallet
```typescript
import { useCreateWallet } from '@orya/wallet-core/hooks';

function WalletCreation() {
  const { createWallet, loading } = useCreateWallet();

  const handleCreateWallet = async () => {
    const wallet = await createWallet('userId123', 'sui-mainnet', 'mpc');
    console.log('Wallet created:', wallet.address);
    console.log('Recovery phrase:', wallet.recoveryPhrase);
  };

  return <button onClick={handleCreateWallet}>{loading ? '...' : 'Create Wallet'}</button>;
}
```

### Get User Wallets
```typescript
import { useUserWallets } from '@orya/wallet-core/hooks';

function WalletList() {
  const { wallets, loading, refetch } = useUserWallets('userId123');

  if (loading) return <div>Loading wallets...</div>;

  return (
    <div>
      {wallets.map(wallet => (
        <div key={wallet.id}>
          <p>{wallet.address}</p>
          <p>{wallet.chainId}</p>
        </div>
      ))}
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
```

### Monitor Wallet Balance
```typescript
import { useWalletBalance } from '@orya/wallet-core/hooks';

function BalanceDisplay() {
  const { balance, loading } = useWalletBalance('walletId123');

  if (loading) return <div>Loading balance...</div>;

  return (
    <div>
      <p>{balance?.amount} {balance?.symbol}</p>
      <p>USD: ${balance?.usdValue}</p>
    </div>
  );
}
```

## GraphQL Schema (Expected)

```graphql
type Query {
  health: String!
  user(userId: String!): User!
  wallets(userId: String!): [Wallet!]!
  walletBalance(walletId: String!): Balance!
}

type Mutation {
  register(email: String!, authProvider: String!): User!
  createWallet(userId: String!, chainId: String!, walletType: String!): CreateWalletResponse!
  signTransaction(walletId: String!, transaction: String!): String!
}

type User {
  id: String!
  email: String!
  kycStatus: String!
}

type Wallet {
  id: String!
  address: String!
  chainId: String!
  walletType: String!
}

type Balance {
  amount: String!
  symbol: String!
  usdValue: String!
}

type CreateWalletResponse {
  walletId: String!
  address: String!
  recoveryPhrase: [String!]
}
```

## Error Handling

All hooks include error handling:

```typescript
const { user, error } = useUser('userId123');

if (error) {
  console.error('Failed to fetch user:', error.message);
}
```

## Cache Management

Apollo Client automatically caches queries. Force refresh:

```typescript
const { refetch } = useUserWallets('userId123');

// Refetch from server
await refetch();
```

## Polling

Balance hook includes 30-second polling:

```typescript
const { balance, startPolling, stopPolling } = useWalletBalance('walletId');

// Control polling
startPolling(5000); // 5 seconds
stopPolling();
```

## TypeScript Support

All operations are fully typed:

```typescript
const { user } = useUser('userId'); // user: User | null
const { wallets } = useUserWallets('userId'); // wallets: Wallet[]
const { balance } = useWalletBalance('walletId'); // balance: Balance | null
```

## Integration with Redux

GraphQL state is separate from Redux. For unified state management:

```typescript
import { useUserWallets } from '@orya/wallet-core/hooks';
import { useAppDispatch } from '@orya/wallet-core/store';

function WalletSync() {
  const dispatch = useAppDispatch();
  const { wallets } = useUserWallets('userId123');

  useEffect(() => {
    if (wallets.length > 0) {
      dispatch(setWallets(wallets));
    }
  }, [wallets, dispatch]);
}
```

## Testing

```typescript
import { MockedProvider } from '@apollo/client/testing';
import { QUERY_USER } from '@orya/wallet-core/graphql/queries';

const mocks = [
  {
    request: {
      query: QUERY_USER,
      variables: { userId: '123' },
    },
    result: {
      data: {
        user: {
          id: '123',
          email: 'test@example.com',
          kycStatus: 'verified',
        },
      },
    },
  },
];

<MockedProvider mocks={mocks}>
  <YourComponent />
</MockedProvider>
```

## Troubleshooting

### Query Returns Null
- Check environment variable `NEXT_PUBLIC_API_URL`
- Verify API Gateway is running
- Check browser console for network errors

### Type Errors
- Ensure `@apollo/client` and `graphql` are installed
- Run `pnpm build` in wallet-core
- Check generated types in `dist/`

### Cache Issues
- Clear browser cache
- Reset Apollo cache: `apolloClient.cache.reset()`
- Check fetch policy (cache-first vs cache-and-network)

## Performance Tips

1. Use `cache-first` fetch policy for static data
2. Use `cache-and-network` for dynamic data
3. Implement pagination for large datasets
4. Use `skip` to prevent unnecessary queries

```typescript
const { wallets } = useUserWallets(userId, { 
  fetchPolicy: 'cache-and-network',
  skip: !userId,
});
```

## Next Steps

1. Implement pagination for wallet lists
2. Add subscription support for real-time updates
3. Implement optimistic mutations
4. Add request batching for performance
5. Set up Apollo DevTools for debugging

## Related Documentation

- [API Gateway Schema](../../services/api-gateway/SCHEMA.md)
- [Apollo Client Docs](https://www.apollographql.com/docs/react/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
