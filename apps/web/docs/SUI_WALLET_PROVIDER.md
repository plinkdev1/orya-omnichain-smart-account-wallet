# SUI Wallet Standard Provider

This document describes the SUI Wallet Standard Provider implementation for the ORŸA Web application.

## Overview

The SUI Wallet Provider exposes the SUI Wallet Standard to frontend components, providing wallet state management and signing functions through React Context and custom hooks.

## Components

### SUIWalletProvider

The main provider component that wraps the application with wallet functionality.

**Location:** `apps/web/providers/SUIWalletProvider.tsx`

**Features:**
- Initializes and manages the Orÿa SUI Wallet instance
- Provides wallet connection state and account management
- Exposes signing functions (transaction and message signing)
- Handles errors and loading states

**Usage:**
```tsx
import { SUIWalletProvider } from '@/providers/SUIWalletProvider';

export default function RootLayout({ children }) {
  return (
    <SUIWalletProvider>
      {children}
    </SUIWalletProvider>
  );
}
```

## Hooks

### useSUIWallet

Main hook to access wallet functionality from any component.

**Location:** `apps/web/providers/SUIWalletProvider.tsx`

**Returns:**
```typescript
interface SUIWalletContextValue {
  wallet: OrysaSUIWallet | null;
  accounts: OryaSUIWalletAccount[];
  selectedAccount: OryaSUIWalletAccount | null;
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  selectAccount: (account: OryaSUIWalletAccount) => void;
  signTransactionBlock: (tx: Uint8Array) => Promise<Uint8Array>;
  signAndExecuteTransactionBlock: (tx: Uint8Array) => Promise<string>;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
}
```

**Example:**
```tsx
import { useSUIWallet } from '@/providers/SUIWalletProvider';

export function MyComponent() {
  const {
    selectedAccount,
    isConnected,
    signMessage,
    accounts,
    selectAccount
  } = useSUIWallet();

  if (!isConnected) {
    return <div>Wallet not connected</div>;
  }

  return (
    <div>
      <p>Account: {selectedAccount?.address}</p>
      {/* Component content */}
    </div>
  );
}
```

### useSUITransaction

Hook for managing transaction signing and execution.

**Location:** `apps/web/hooks/useSUITransaction.ts`

**Returns:**
```typescript
{
  execute: (txBlock: Uint8Array) => Promise<string>;
  reset: () => void;
  isLoading: boolean;
  error: Error | null;
  data: string | null;  // Transaction digest
}
```

**Example:**
```tsx
import { useSUITransaction } from '@/hooks/useSUITransaction';
import { TransactionBlock } from '@mysten/sui.js/transactions';

export function TransferComponent() {
  const { execute, isLoading, error, data } = useSUITransaction();

  const handleTransfer = async () => {
    try {
      const tx = new TransactionBlock();
      tx.transferObjects(
        [tx.object('0x...')],
        tx.pure('0x...recipient')
      );

      const txBytes = await tx.build({
        client: suiClient,
        onlyTransactionKind: false
      });

      const digest = await execute(txBytes);
      console.log('Transaction digest:', digest);
    } catch (err) {
      console.error('Transfer failed:', err);
    }
  };

  return (
    <button onClick={handleTransfer} disabled={isLoading}>
      {isLoading ? 'Processing...' : 'Transfer'}
    </button>
  );
}
```

## Components

### SUIWalletDisplay

Displays wallet connection status, available accounts, and account selection.

**Location:** `apps/web/components/SUIWalletDisplay.tsx`

**Features:**
- Shows connection status
- Lists all available accounts
- Allows account selection
- Displays loading and error states

**Example:**
```tsx
import { SUIWalletDisplay } from '@/components/SUIWalletDisplay';

export function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <SUIWalletDisplay />
    </div>
  );
}
```

### SUITransferButton

Example component demonstrating transaction signing and execution.

**Location:** `apps/web/components/SUITransferButton.tsx`

**Props:**
```typescript
interface SUITransferButtonProps {
  objectId?: string;
  recipientAddress?: string;
  amount?: string;
  onSuccess?: (digest: string) => void;
  onError?: (error: Error) => void;
}
```

**Example:**
```tsx
import { SUITransferButton } from '@/components/SUITransferButton';

export function TransferPage() {
  return (
    <SUITransferButton
      objectId="0x..."
      recipientAddress="0x..."
      amount="1000"
      onSuccess={(digest) => console.log('Success:', digest)}
      onError={(error) => console.error('Error:', error)}
    />
  );
}
```

### SUIWalletDemo

Complete demonstration of all wallet features.

**Location:** `apps/web/components/SUIWalletDemo.tsx`

**Features:**
- Wallet connection display
- Message signing demonstration
- Transfer example
- Integration code samples

## Integration Steps

1. **Install in Layout:**
   ```tsx
   import { SUIWalletProvider } from '@/providers/SUIWalletProvider';

   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           <SUIWalletProvider>
             {children}
           </SUIWalletProvider>
         </body>
       </html>
     );
   }
   ```

2. **Use in Components:**
   ```tsx
   import { useSUIWallet } from '@/providers/SUIWalletProvider';

   export function MyComponent() {
     const { selectedAccount, signMessage } = useSUIWallet();
     // Use wallet...
   }
   ```

3. **Handle Transactions:**
   ```tsx
   import { useSUITransaction } from '@/hooks/useSUITransaction';

   const { execute, isLoading } = useSUITransaction();
   const digest = await execute(txBytes);
   ```

## Error Handling

All functions throw errors that should be caught and handled:

```tsx
try {
  const signature = await signMessage(messageBytes);
} catch (error) {
  console.error('Signing failed:', error.message);
  // Handle error appropriately
}
```

## State Management

The provider manages:
- **Wallet instance**: The OrysaSUIWallet singleton
- **Accounts**: List of available SUI accounts
- **Selected account**: Currently active account for signing
- **Connection state**: Whether wallet is connected
- **Loading state**: During initialization or operations
- **Error state**: Last error that occurred

## Performance Considerations

1. The wallet initializes on mount and caches the instance
2. Account selection doesn't require re-initialization
3. Signing operations are async and non-blocking
4. Errors are caught and stored without throwing to parent

## Types

All types are imported from `@orya/wallet-core`:

```typescript
import type {
  OrysaSUIWallet,
  OryaSUIWalletAccount,
  SUIChain,
  SignTransactionBlockInput,
  SignTransactionBlockOutput,
  SignAndExecuteTransactionBlockInput,
  SignAndExecuteTransactionBlockOutput,
  SignMessageInput,
  SignMessageOutput
} from '@orya/wallet-core';
```

## Testing

Example test for a component using the wallet:

```tsx
import { renderHook, act } from '@testing-library/react';
import { useSUIWallet } from '@/providers/SUIWalletProvider';

describe('useSUIWallet', () => {
  it('should initialize wallet on mount', async () => {
    const { result } = renderHook(() => useSUIWallet(), {
      wrapper: SUIWalletProvider
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});
```

## Troubleshooting

### Wallet not connecting
- Ensure Privy service is properly initialized
- Check wallet configuration in SUIWalletProvider
- Verify network connectivity

### Signing fails
- Ensure selectedAccount is not null
- Check if wallet has the required signing functions
- Verify Privy service signing configuration

### No accounts found
- Ensure user has SUI wallets in Privy
- Check wallet filtering logic
- Verify chain configuration

## References

- [SUI Wallet Standard](https://docs.sui.io/standards/wallet-standard)
- [@mysten/sui.js Documentation](https://sdk.mysten.labs/typescript)
- [Orÿa Wallet Core](../../packages/wallet-core)
