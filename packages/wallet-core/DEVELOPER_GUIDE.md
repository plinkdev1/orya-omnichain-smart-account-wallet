# Wallet-Core Developer Guide

A comprehensive guide to integrating and using `@orya/wallet-core` across web (React/Next.js) and mobile (React Native/Expo) platforms.

**Status:** Production-ready | **Last Updated:** 2025-01-XX | **Platform Coverage:** Web + Mobile

---

## Table of Contents

1. [Overview](#overview)
2. [Installation & Setup](#installation--setup)
3. [Core Concepts](#core-concepts)
4. [Hooks API Reference](#hooks-api-reference)
5. [Web Integration Examples](#web-integration-examples)
6. [Mobile Integration Examples](#mobile-integration-examples)
7. [Advanced Patterns](#advanced-patterns)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## Overview

`@orya/wallet-core` is a **platform-agnostic** wallet management library providing:

- 🔐 **Multi-chain wallet generation** (SUI, Ethereum, Solana, Aptos)
- 🔑 **Authentication management** (Firebase, Google, Biometric)
- 💸 **Transaction handling** (creation, signing, broadcasting)
- 🎨 **Theme management** (light/dark modes)
- 📊 **Portfolio aggregation** (balances, holdings across chains)
- 📱 **Offline-first architecture** (works with and without connectivity)
- 🔄 **Redux-based state management** (predictable state mutations)

### Key Features

| Feature | Web | Mobile | Notes |
|---------|-----|--------|-------|
| Wallet Generation | ✅ | ✅ | Multi-chain support |
| Firebase Auth | ✅ | ✅ | SDKs auto-detected |
| Transaction Signing | ✅ | ✅ | Chain-specific adapters |
| Offline Mode | ✅ | ✅ | AsyncStorage/LocalStorage |
| Theme Management | ✅ | ✅ | Context + Redux |
| Portfolio Sync | ✅ | ✅ | Background sync on mobile |

---

## Installation & Setup

### 1. Install Package

```bash
# Using pnpm (recommended for monorepo)
pnpm install @orya/wallet-core

# Or npm
npm install @orya/wallet-core

# Or yarn
yarn add @orya/wallet-core
```

### 2. Environment Setup

Create `.env` file in your project root:

```env
# Required: GraphQL API Endpoint
REACT_APP_GRAPHQL_ENDPOINT=https://api.example.com/graphql

# Optional: Chain RPC Endpoints
REACT_APP_SUI_RPC=https://fullnode.testnet.sui.io
REACT_APP_ETH_RPC=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
REACT_APP_SOLANA_RPC=https://api.testnet.solana.com

# Optional: Privy SDK (for embedded wallets)
REACT_APP_PRIVY_APP_ID=your-privy-app-id

# Optional: Firebase (for authentication)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_API_KEY=your-api-key
```

### 3. Platform-Specific Configuration

#### For Web (React/Next.js)

```tsx
// app.tsx or _app.tsx (Next.js)
import { Provider } from 'react-redux';
import { store } from '@orya/wallet-core/store';

export default function App() {
  return (
    <Provider store={store}>
      <YourApp />
    </Provider>
  );
}
```

#### For Mobile (React Native/Expo)

```tsx
// App.tsx
import { Provider } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageFactory } from '@orya/wallet-core/storage';
import { store } from '@orya/wallet-core/store';

// Initialize platform-specific storage
StorageFactory.setAdapter(new AsyncStorageAdapter());

export default function App() {
  return (
    <Provider store={store}>
      <YourApp />
    </Provider>
  );
}
```

---

## Core Concepts

### 1. State Management (Redux)

Wallet-core uses Redux for centralized state management:

```
┌─────────────────────────────────────┐
│        Redux Store                  │
├─────────────────────────────────────┤
│  wallet.slice     → Wallets state   │
│  auth.slice       → Auth state      │
│  transactions.slice → TX state      │
│  portfolio.slice  → Portfolio state │
└─────────────────────────────────────┘
         ↑              ↓
    Hooks consume  Slices dispatch
    & subscribe    actions
```

### 2. Hooks Pattern

All hooks follow this pattern:

```typescript
// Returns Redux state + helper functions
const {
  data,           // Current state
  loading,        // Loading indicator
  error,          // Error if any
  actions...      // Helper methods
} = useYourHook();
```

### 3. Multi-Chain Support

Wallet-core auto-detects which blockchain SDKs are installed:

```typescript
// If ethers is installed → Ethereum wallet generation works
// If @mysten/sui.js is installed → SUI wallet generation works
// If not installed → Graceful error message

const generator = new WalletGenerator();
try {
  const ethWallet = generator.generateEthereumWallet(seed);
} catch (e) {
  console.log('ethers SDK not installed');
}
```

### 4. Platform-Agnostic Design

The library works identically on web and mobile:

```typescript
// Same code works on both platforms
import { useWallet } from '@orya/wallet-core/hooks';

export function MyComponent() {
  const { activeWallet } = useWallet();
  // Works on web (React) and mobile (React Native)
}
```

---

## Hooks API Reference

### useWallet()

Manage wallet lifecycle and multi-chain support.

**Signature:**
```typescript
const {
  wallets: Wallet[],
  activeWallet: Wallet | null,
  addWallet: (wallet: Wallet) => void,
  setActive: (walletId: string) => void,
  removeWallet: (walletId: string) => void,
} = useWallet();
```

**Wallet Type:**
```typescript
interface Wallet {
  id: string;
  address: string;
  chainType: BlockchainType;  // SUI | ETH | SOLANA | APTOS
  label: string;
  isActive: boolean;
  createdAt: string;
}
```

**Returns:**
- `wallets` - Array of all user wallets
- `activeWallet` - Currently selected wallet (or null)
- `addWallet()` - Add new wallet to store
- `setActive()` - Switch active wallet
- `removeWallet()` - Delete wallet

---

### useTransaction()

Handle individual transaction lifecycle.

**Signature:**
```typescript
const {
  pendingTx: Transaction | null,
  isProcessing: boolean,
  submitTx: (tx: Transaction) => Promise<string>,
  cancelTx: (txId: string) => void,
  signTx: (txData: any) => Promise<string>,
} = useTransaction();
```

**Returns:**
- `pendingTx` - Transaction currently being processed
- `isProcessing` - Boolean loading state
- `submitTx()` - Submit transaction to blockchain
- `cancelTx()` - Cancel pending transaction
- `signTx()` - Sign transaction locally

---

### useTransactions()

Query and filter transaction history.

**Signature:**
```typescript
const {
  transactions: Transaction[],
  loading: boolean,
  filter: TransactionFilter,
  setFilter: (filter: TransactionFilter) => void,
  getTransactionById: (id: string) => Transaction | undefined,
} = useTransactions();
```

**Filter Options:**
```typescript
interface TransactionFilter {
  chainType?: BlockchainType;
  walletId?: string;
  status?: TransactionStatus;
  type?: 'SEND' | 'RECEIVE' | 'SWAP';
  dateRange?: { from: Date; to: Date };
}
```

**Returns:**
- `transactions` - Array of filtered transactions
- `loading` - Loading state
- `filter` - Current filter object
- `setFilter()` - Update filter criteria
- `getTransactionById()` - Find transaction by ID

---

### useAuth()

Manage authentication and user lifecycle.

**Signature:**
```typescript
const {
  status: AuthStatus,
  user: User | null,
  loading: boolean,
  error: string | null,
  login: (credentials: LoginCredentials) => Promise<User>,
  logout: () => Promise<void>,
  isAuthenticated: boolean,
} = useAuth();
```

**AuthStatus:**
```typescript
enum AuthStatus {
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  AUTHENTICATING = 'AUTHENTICATING',
  AUTHENTICATED = 'AUTHENTICATED',
  REAUTHENTICATING = 'REAUTHENTICATING',
}
```

**Returns:**
- `status` - Current authentication state
- `user` - Authenticated user object (or null)
- `loading` - Boolean loading state
- `error` - Error message if auth failed
- `login()` - Authenticate user
- `logout()` - Sign out user
- `isAuthenticated` - Convenience boolean

---

### useTheme()

Manage application theme (light/dark mode).

**Signature:**
```typescript
const {
  mode: 'light' | 'dark',
  theme: Theme,
  toggleTheme: () => void,
  setTheme: (mode: ThemeMode) => void,
  isLight: boolean,
  isDark: boolean,
} = useTheme();
```

**Theme Object:**
```typescript
interface Theme {
  colors: {
    primary: string;
    background: string;
    text: string;
    border: string;
  };
  spacing: Record<string, number>;
  typography: Record<string, any>;
}
```

**Returns:**
- `mode` - Current theme mode ('light' or 'dark')
- `theme` - Full theme object
- `toggleTheme()` - Switch between light/dark
- `setTheme()` - Set specific theme
- `isLight` / `isDark` - Convenience booleans

---

### usePortfolio()

Aggregate portfolio data across chains.

**Signature:**
```typescript
const {
  portfolio: Portfolio,
  totalValue: string,
  loading: boolean,
  refresh: () => Promise<void>,
  getChainHoldings: (chainType: BlockchainType) => Holding[],
} = usePortfolio();
```

**Portfolio Type:**
```typescript
interface Portfolio {
  totalUsdValue: string;
  totalAssets: Asset[];
  byChain: Record<BlockchainType, ChainPortfolio>;
  lastUpdated: string;
}
```

**Returns:**
- `portfolio` - Aggregated portfolio data
- `totalValue` - Total USD value of all assets
- `loading` - Sync loading state
- `refresh()` - Manually refresh portfolio data
- `getChainHoldings()` - Get holdings for specific chain

---

### useWalletGeneration()

Generate new wallets for any supported blockchain.

**Signature:**
```typescript
const {
  generate: (params: GenerationParams) => Promise<Wallet>,
  generateMulti: (chains: BlockchainType[]) => Promise<Wallet[]>,
  loading: boolean,
  error: string | null,
} = useWalletGeneration();
```

**GenerationParams:**
```typescript
interface GenerationParams {
  chainType: BlockchainType;
  mnemonic?: string;  // Use existing seed
  derivationPath?: string;  // Custom derivation path
  label?: string;
}
```

**Returns:**
- `generate()` - Generate wallet for single chain
- `generateMulti()` - Generate wallets for multiple chains
- `loading` - Generation in progress
- `error` - Generation error message

---

## Web Integration Examples

### Example 1: Complete Wallet Setup (React)

```tsx
// pages/wallet-setup.tsx
import React, { useState } from 'react';
import { useWallet } from '@orya/wallet-core/hooks';
import { useWalletGeneration } from '@orya/wallet-core/hooks';
import { BlockchainType } from '@orya/wallet-core/domain';

export default function WalletSetup() {
  const { wallets, setActive } = useWallet();
  const { generate, generateMulti, loading } = useWalletGeneration();
  const [selectedChains, setSelectedChains] = useState<BlockchainType[]>([
    BlockchainType.SUI,
  ]);

  const handleGenerateMulti = async () => {
    try {
      const newWallets = await generateMulti(selectedChains);
      console.log('Generated wallets:', newWallets);
      // Auto-activate first wallet
      if (newWallets.length > 0) {
        setActive(newWallets[0].id);
      }
    } catch (error) {
      console.error('Generation failed:', error);
    }
  };

  return (
    <div>
      <h1>Wallet Setup</h1>

      {/* Blockchain Selection */}
      <div>
        <h2>Select Blockchains</h2>
        {[BlockchainType.SUI, BlockchainType.ETH, BlockchainType.SOLANA].map(
          (chain) => (
            <label key={chain}>
              <input
                type="checkbox"
                checked={selectedChains.includes(chain)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedChains([...selectedChains, chain]);
                  } else {
                    setSelectedChains(
                      selectedChains.filter((c) => c !== chain)
                    );
                  }
                }}
              />
              {chain}
            </label>
          )
        )}
      </div>

      {/* Generate Button */}
      <button onClick={handleGenerateMulti} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Wallets'}
      </button>

      {/* Display Wallets */}
      <div>
        <h2>Your Wallets ({wallets.length})</h2>
        {wallets.map((wallet) => (
          <div key={wallet.id}>
            <strong>{wallet.label}</strong>
            <p>Chain: {wallet.chainType}</p>
            <p>Address: {wallet.address.substring(0, 10)}...</p>
            <button onClick={() => setActive(wallet.id)}>
              {wallet.isActive ? '✓ Active' : 'Activate'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Example 2: Transaction Management (Next.js)

```tsx
// components/TransactionPanel.tsx
'use client';

import React, { useState } from 'react';
import { useTransaction } from '@orya/wallet-core/hooks';
import { useTransactions } from '@orya/wallet-core/hooks';
import { useWallet } from '@orya/wallet-core/hooks';
import { TransactionStatus, BlockchainType } from '@orya/wallet-core/domain';

export function TransactionPanel() {
  const { activeWallet } = useWallet();
  const { pendingTx, isProcessing, submitTx } = useTransaction();
  const { transactions, setFilter } = useTransactions();
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');

  const handleSend = async () => {
    if (!activeWallet || !toAddress || !amount) return;

    const tx = {
      id: `tx-${Date.now()}`,
      walletId: activeWallet.id,
      type: 'SEND' as const,
      status: TransactionStatus.PENDING,
      chainType: activeWallet.chainType,
      amount,
      token: 'SUI', // Adjust based on chain
      fromAddress: activeWallet.address,
      toAddress,
      timestamp: new Date().toISOString(),
      txHash: '',
    };

    try {
      const txHash = await submitTx(tx);
      console.log('Transaction submitted:', txHash);
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  return (
    <div>
      <h2>Send Transaction</h2>

      {pendingTx && (
        <div style={{ padding: '10px', backgroundColor: '#f0f0f0' }}>
          <p>Processing: {pendingTx.id}</p>
          <p>Amount: {pendingTx.amount} {pendingTx.token}</p>
          <p>Status: {pendingTx.status}</p>
        </div>
      )}

      <input
        type="text"
        placeholder="Recipient Address"
        value={toAddress}
        onChange={(e) => setToAddress(e.target.value)}
      />

      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button onClick={handleSend} disabled={isProcessing}>
        {isProcessing ? 'Sending...' : 'Send'}
      </button>

      {/* Transaction History */}
      <h3>Recent Transactions</h3>
      <ul>
        {transactions.slice(0, 5).map((tx) => (
          <li key={tx.id}>
            {tx.type} - {tx.amount} {tx.token} ({tx.status})
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Example 3: Theme Management

```tsx
// hooks/useThemeSwitch.ts
import { useTheme } from '@orya/wallet-core/hooks';
import { useEffect } from 'react';

/**
 * Platform-agnostic theme switcher
 * Works on both web and mobile
 */
export function useThemeSwitch() {
  const { mode, toggleTheme, theme } = useTheme();

  // Apply theme to document (web only)
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const html = document.documentElement;
    html.style.backgroundColor = theme.colors.background;
    html.style.color = theme.colors.text;

    if (mode === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [mode, theme]);

  return { mode, toggleTheme, theme };
}
```

---

## Mobile Integration Examples

### Example 1: Complete Wallet Setup (React Native)

```tsx
// screens/WalletSetupScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useWallet } from '@orya/wallet-core/hooks';
import { useWalletGeneration } from '@orya/wallet-core/hooks';
import { BlockchainType } from '@orya/wallet-core/domain';
import CheckBox from '@react-native-community/checkbox';

export function WalletSetupScreen() {
  const { wallets, setActive } = useWallet();
  const { generateMulti, loading } = useWalletGeneration();
  const [selectedChains, setSelectedChains] = useState<BlockchainType[]>([
    BlockchainType.SUI,
  ]);

  const chains = [BlockchainType.SUI, BlockchainType.ETH, BlockchainType.SOLANA];

  const handleGenerateMulti = async () => {
    try {
      const newWallets = await generateMulti(selectedChains);
      if (newWallets.length > 0) {
        setActive(newWallets[0].id);
      }
    } catch (error) {
      console.error('Generation failed:', error);
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
        Wallet Setup
      </Text>

      {/* Blockchain Selection */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
          Select Blockchains
        </Text>
        {chains.map((chain) => (
          <View
            key={chain}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
          >
            <CheckBox
              value={selectedChains.includes(chain)}
              onValueChange={(value) => {
                if (value) {
                  setSelectedChains([...selectedChains, chain]);
                } else {
                  setSelectedChains(
                    selectedChains.filter((c) => c !== chain)
                  );
                }
              }}
            />
            <Text style={{ marginLeft: 8 }}>{chain}</Text>
          </View>
        ))}
      </View>

      {/* Generate Button */}
      <TouchableOpacity
        onPress={handleGenerateMulti}
        disabled={loading}
        style={{
          backgroundColor: loading ? '#ccc' : '#007AFF',
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          {loading ? 'Generating...' : 'Generate Wallets'}
        </Text>
      </TouchableOpacity>

      {/* Display Wallets */}
      <View>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
          Your Wallets ({wallets.length})
        </Text>
        {wallets.map((wallet) => (
          <View
            key={wallet.id}
            style={{
              borderWidth: 1,
              borderColor: '#ddd',
              padding: 12,
              marginBottom: 8,
              borderRadius: 8,
              backgroundColor: wallet.isActive ? '#f0f8ff' : 'white',
            }}
          >
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>
              {wallet.label}
            </Text>
            <Text style={{ marginBottom: 4 }}>Chain: {wallet.chainType}</Text>
            <Text style={{ marginBottom: 8 }}>
              Address: {wallet.address.substring(0, 10)}...
            </Text>
            <TouchableOpacity
              onPress={() => setActive(wallet.id)}
              style={{
                backgroundColor: wallet.isActive ? '#4CAF50' : '#2196F3',
                padding: 8,
                borderRadius: 4,
              }}
            >
              <Text style={{ color: 'white', textAlign: 'center' }}>
                {wallet.isActive ? '✓ Active' : 'Activate'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
```

### Example 2: Transaction with Offline Support (React Native)

```tsx
// screens/SendScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTransaction } from '@orya/wallet-core/hooks';
import { useWallet } from '@orya/wallet-core/hooks';
import { useNetworkStatus } from '../hooks/useNetworkStatus'; // Custom hook
import AsyncStorage from '@react-native-async-storage/async-storage';

export function SendScreen() {
  const { activeWallet } = useWallet();
  const { submitTx, isProcessing } = useTransaction();
  const isOnline = useNetworkStatus();
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('ready');

  const handleSend = async () => {
    if (!activeWallet || !toAddress || !amount) return;

    setStatus('sending');

    const tx = {
      id: `tx-${Date.now()}`,
      walletId: activeWallet.id,
      type: 'SEND' as const,
      status: 'PENDING' as const,
      chainType: activeWallet.chainType,
      amount,
      token: 'SUI',
      fromAddress: activeWallet.address,
      toAddress,
      timestamp: new Date().toISOString(),
      txHash: '',
    };

    try {
      if (isOnline) {
        // Online: Submit immediately
        const txHash = await submitTx(tx);
        setStatus('sent');
        setTimeout(() => {
          setToAddress('');
          setAmount('');
          setStatus('ready');
        }, 2000);
      } else {
        // Offline: Queue transaction
        const pending = await AsyncStorage.getItem('pendingTx');
        const queue = pending ? JSON.parse(pending) : [];
        queue.push(tx);
        await AsyncStorage.setItem('pendingTx', JSON.stringify(queue));
        setStatus('queued');
      }
    } catch (error) {
      setStatus('error');
      console.error('Send failed:', error);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
        Send {activeWallet?.label}
      </Text>

      {/* Network Status */}
      <View
        style={{
          padding: 12,
          marginBottom: 16,
          backgroundColor: isOnline ? '#e8f5e9' : '#fff3e0',
          borderRadius: 8,
        }}
      >
        <Text style={{ color: isOnline ? '#2e7d32' : '#e65100' }}>
          {isOnline ? '✓ Online' : '⚠ Offline - Transactions will be queued'}
        </Text>
      </View>

      {/* Transaction Form */}
      <TextInput
        placeholder="Recipient Address"
        value={toAddress}
        onChangeText={setToAddress}
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          padding: 12,
          marginBottom: 12,
          borderRadius: 8,
        }}
      />

      <TextInput
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          padding: 12,
          marginBottom: 16,
          borderRadius: 8,
        }}
      />

      {/* Send Button */}
      <TouchableOpacity
        onPress={handleSend}
        disabled={isProcessing || status === 'sending'}
        style={{
          backgroundColor: isProcessing ? '#ccc' : '#007AFF',
          padding: 12,
          borderRadius: 8,
        }}
      >
        {isProcessing ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            Send
          </Text>
        )}
      </TouchableOpacity>

      {/* Status Message */}
      {status !== 'ready' && (
        <View style={{ marginTop: 16, padding: 12, backgroundColor: '#f0f0f0' }}>
          <Text>
            {status === 'sending' && 'Sending transaction...'}
            {status === 'sent' && '✓ Transaction sent successfully!'}
            {status === 'queued' && '⏱ Transaction queued for when online'}
            {status === 'error' && '✗ Transaction failed'}
          </Text>
        </View>
      )}
    </View>
  );
}
```

### Example 3: Theme Toggle (React Native)

```tsx
// components/ThemeToggle.tsx
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '@orya/wallet-core/hooks';

export function ThemeToggle() {
  const { mode, toggleTheme } = useTheme();

  return (
    <View style={{ padding: 16 }}>
      <TouchableOpacity
        onPress={toggleTheme}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
          backgroundColor: mode === 'dark' ? '#333' : '#f0f0f0',
          borderRadius: 8,
        }}
      >
        <Text style={{ marginRight: 8 }}>
          {mode === 'dark' ? '🌙' : '☀️'}
        </Text>
        <Text style={{ color: mode === 'dark' ? 'white' : 'black' }}>
          {mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## Advanced Patterns

### Pattern 1: Multi-Chain Transaction Aggregation

```typescript
// hooks/useMultiChainTransactions.ts
import { useTransactions } from '@orya/wallet-core/hooks';
import { BlockchainType } from '@orya/wallet-core/domain';
import { useMemo } from 'react';

export function useMultiChainTransactions() {
  const { transactions } = useTransactions();

  const grouped = useMemo(() => {
    const result: Record<BlockchainType, any[]> = {
      [BlockchainType.SUI]: [],
      [BlockchainType.ETH]: [],
      [BlockchainType.SOLANA]: [],
      [BlockchainType.APTOS]: [],
    };

    transactions.forEach((tx) => {
      result[tx.chainType].push(tx);
    });

    return result;
  }, [transactions]);

  return grouped;
}
```

### Pattern 2: Conditional Authentication

```typescript
// HOC/withAuth.tsx
import { useAuth } from '@orya/wallet-core/hooks';
import { AuthStatus } from '@orya/wallet-core/domain';
import { ReactNode } from 'react';

export function withAuth(Component: React.ComponentType<any>) {
  return function AuthenticatedComponent(props: any) {
    const { status, loading } = useAuth();

    if (loading) {
      return <div>Loading...</div>;
    }

    if (status !== AuthStatus.AUTHENTICATED) {
      return <div>Please authenticate to continue</div>;
    }

    return <Component {...props} />;
  };
}
```

### Pattern 3: Wallet Generation Wizard

```typescript
// hooks/useWalletWizard.ts
import { useState, useCallback } from 'react';
import { useWalletGeneration } from '@orya/wallet-core/hooks';
import { useWallet } from '@orya/wallet-core/hooks';
import { BlockchainType } from '@orya/wallet-core/domain';

export function useWalletWizard() {
  const [step, setStep] = useState(0);
  const [selectedChains, setSelectedChains] = useState<BlockchainType[]>([]);
  const { generateMulti, loading } = useWalletGeneration();
  const { setActive } = useWallet();

  const proceed = useCallback(async () => {
    if (step === 0) {
      // Selection step
      setStep(1);
    } else if (step === 1) {
      // Generation step
      const wallets = await generateMulti(selectedChains);
      if (wallets.length > 0) {
        setActive(wallets[0].id);
        setStep(2); // Complete
      }
    }
  }, [step, selectedChains, generateMulti, setActive]);

  return { step, selectedChains, setSelectedChains, proceed, loading };
}
```

---

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Writing Tests

```typescript
// __tests__/useWallet.test.ts
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { useWallet } from '../hooks/useWallet';
import { createTestStore } from './setup';

describe('useWallet', () => {
  it('should add wallet', () => {
    const store = createTestStore();
    const wrapper = ({ children }) =>
      <Provider store={store}>{children}</Provider>;

    const { result } = renderHook(() => useWallet(), { wrapper });

    act(() => {
      // dispatch action
    });

    expect(result.current.wallets).toHaveLength(1);
  });
});
```

---

## Troubleshooting

### Q: "Module not found" for blockchain SDKs

**Solution:** Install the specific blockchain SDK:
```bash
npm install ethers @mysten/sui.js @solana/web3.js aptos
```

### Q: Hooks not updating state

**Solution:** Ensure Redux Provider wraps your component:
```tsx
<Provider store={store}>
  <YourComponent />
</Provider>
```

### Q: Theme changes not applying

**Solution:** Use `useThemeSwitch()` hook or apply theme manually in useEffect.

### Q: Transactions not persisting

**Solution:** Ensure storage adapter is initialized (mobile):
```tsx
import { StorageFactory } from '@orya/wallet-core/storage';
StorageFactory.setAdapter(new AsyncStorageAdapter());
```

### Q: Authentication state not persisting after reload

**Solution:** Implement token refresh logic in your auth middleware.

---

## API Compatibility

### Supported Platforms

| Platform | Min Version | Status |
|----------|-------------|--------|
| React | 16.8+ | ✅ Tested |
| React Native | 0.60+ | ✅ Tested |
| Next.js | 12+ | ✅ Tested |
| Expo | 45+ | ✅ Tested |

### Supported Blockchains

| Chain | Support | Notes |
|-------|---------|-------|
| SUI | ✅ Full | Primary chain |
| Ethereum | ✅ Full | EVM compatible |
| Solana | ✅ Full | Experimental |
| Aptos | ✅ Full | Experimental |
| BTCfi | ⏳ Q1 2025 | Planned |

---

## Performance Tips

1. **Memoize Selectors** - Use Redux selectors to prevent unnecessary re-renders
2. **Lazy Load Wallets** - Only load active wallet details, not all wallets
3. **Batch Transactions** - Group transaction queries by date range
4. **Debounce Filters** - Debounce filter changes to reduce store updates

---

## Support & Resources

- **GitHub Issues:** [Report bugs](https://github.com/orya-wallet/orya-wallet/issues)
- **Discussions:** [Ask questions](https://github.com/orya-wallet/orya-wallet/discussions)
- **Examples:** [See examples directory](./examples/)
- **API Reference:** [Detailed API docs](./API_REFERENCE.md)

---

**Last Updated:** 2025-01-XX | **Version:** 0.1.0 | **Status:** Production-Ready