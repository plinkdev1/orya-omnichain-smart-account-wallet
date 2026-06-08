# Cosmos Blockchain Integration Guide

Complete guide for integrating COSMOS blockchain support into ORŸA wallet applications.

## Overview

The COSMOS integration provides:
- **Cosmos Standard Adapter**: Wallet standard implementation for dApp discovery
- **CosmosStandardAdapter**: Account management, signing, and transaction handling
- **Provider Registry**: Unified provider discovery and registration
- **Cosmos Wallet Support**: Integration with Keplr, Leap, Cosmostation, and WalletConnect

## Architecture

### Components

1. **cosmos-standard.ts** - Wallet standard implementation
   - Account management
   - Message signing
   - Transaction signing
   - Chain switching

2. **ProviderRegistry** - Provider registration and discovery
   - Register COSMOS providers
   - Query supported wallets
   - Manage wallet lifecycle

3. **cosmos-adapter** (Rust backend)
   - Key derivation (BIP39/BIP32)
   - Balance queries
   - Transaction broadcasting
   - RPC interaction

## Usage Guide

### 1. Register COSMOS Provider

```typescript
import { getProviderRegistry } from '@orya/wallet-core';

const registry = getProviderRegistry();

// Register with accounts
const cosmosProvider = registry.registerCosmosProvider(
  [
    {
      address: 'cosmos1...',
      publicKey: 'A0ew8...',
      label: 'Account 1'
    }
  ],
  {
    chainId: 'cosmoshub-4',
    chainName: 'Cosmos Hub',
    rpcUrl: 'https://rpc.cosmos.directory/cosmoshub',
    rest: 'https://lcd.cosmos.directory/cosmoshub',
    prefix: 'cosmos',
    bip44: { coinType: 118 }
  }
);
```

### 2. Connect Wallet

```typescript
async function connectCosmosWallet() {
  const registry = getProviderRegistry();
  const provider = registry.getProvider('cosmos');
  
  if (!provider) {
    console.error('COSMOS provider not registered');
    return;
  }

  const adapter = provider.instance as CosmosStandardAdapter;
  
  try {
    const { publicKey, accounts } = await adapter.connect();
    console.log('Connected:', publicKey);
    console.log('Accounts:', accounts);
  } catch (error) {
    console.error('Connection failed:', error);
  }
}
```

### 3. Sign Message

```typescript
async function signMessage(message: string) {
  const registry = getProviderRegistry();
  const provider = registry.getProvider('cosmos');
  const adapter = provider.instance as CosmosStandardAdapter;

  if (!adapter.connected) {
    throw new Error('Wallet not connected');
  }

  const result = await adapter.signMessage(message);
  return result;
}
```

### 4. Send Transaction

```typescript
async function sendTransaction(
  toAddress: string,
  amount: string,
  denom: string
) {
  const registry = getProviderRegistry();
  const provider = registry.getProvider('cosmos');
  const adapter = provider.instance as CosmosStandardAdapter;

  const result = await adapter.sendTransaction({
    chainId: 'cosmoshub-4',
    signerAddress: adapter.account!.address,
    aminoMsgs: [
      {
        type: 'cosmos-sdk/MsgSend',
        value: {
          from_address: adapter.account!.address,
          to_address: toAddress,
          amount: [{ denom, amount }]
        }
      }
    ],
    fee: {
      amount: '5000',
      denom: 'uatom'
    }
  });

  return result;
}
```

### 5. Switch Chains

```typescript
function switchCosmosChain(chainId: string) {
  const registry = getProviderRegistry();
  const provider = registry.getProvider('cosmos');
  const adapter = provider.instance as CosmosStandardAdapter;

  // Define chain configurations
  const chains: Record<string, CosmosChainInfo> = {
    'cosmoshub-4': {
      chainId: 'cosmoshub-4',
      chainName: 'Cosmos Hub',
      rpcUrl: 'https://rpc.cosmos.directory/cosmoshub',
      rest: 'https://lcd.cosmos.directory/cosmoshub',
      prefix: 'cosmos',
      bip44: { coinType: 118 }
    },
    'osmosis-1': {
      chainId: 'osmosis-1',
      chainName: 'Osmosis',
      rpcUrl: 'https://rpc.osmosis.zone',
      rest: 'https://lcd.osmosis.zone',
      prefix: 'osmo',
      bip44: { coinType: 118 }
    }
  };

  const chain = chains[chainId];
  if (chain) {
    adapter.setChain(chain);
  }
}
```

## Hooks Integration

### useCosmosWallet Hook

```typescript
import { useWallet } from '@orya/wallet-core';

function MyComponent() {
  const { 
    account,
    signMessage,
    sendTransaction,
    connect,
    disconnect
  } = useWallet('cosmos');

  return (
    <div>
      {account ? (
        <>
          <p>Connected: {account.address}</p>
          <button onClick={disconnect}>Disconnect</button>
        </>
      ) : (
        <button onClick={connect}>Connect</button>
      )}
    </div>
  );
}
```

## Supported Wallets

### External Wallets (via Cosmos Kit / WalletConnect)
- **Keplr** - Browser extension + Mobile
- **Leap** - Modern UI Cosmos wallet
- **Cosmostation** - Multi-chain support
- **Trust Wallet** - Mobile + Browser
- **Ledger** - Hardware wallet support
- **WalletConnect** - Protocol-based connection

### Native ORYA Wallet
- Native COSMOS key management
- MPC-based signing (optional)
- Passkey/WebAuthn support

## Configuration

### Environment Variables

```env
# Chain Configuration
COSMOS_CHAIN_ID=cosmoshub-4
COSMOS_DENOM=uatom
COSMOS_PREFIX=cosmos

# Network Endpoints
COSMOS_RPC_URL=https://rpc.cosmos.directory/cosmoshub
COSMOS_REST_URL=https://lcd.cosmos.directory/cosmoshub

# Derivation Path
COSMOS_DERIVATION_PATH=m/44'/118'/0'/0/0

# Gas Settings
COSMOS_GAS_PRICE=0.0025
COSMOS_GAS_ADJUSTMENT=1.3

# Wallet Connect
WALLET_CONNECT_PROJECT_ID=your_project_id
```

### Multi-Chain Support

```typescript
const chainConfigs: Record<string, CosmosChainInfo> = {
  'cosmoshub-4': { /* Cosmos Hub */ },
  'osmosis-1': { /* Osmosis */ },
  'juno-1': { /* Juno */ },
  'stargaze-1': { /* Stargaze */ },
  // Add more chains...
};
```

## Event Handling

```typescript
const adapter = cosmosProvider as CosmosStandardAdapter;

// Listen to connection events
adapter.on('connect', ({ publicKey, accounts }) => {
  console.log('Connected');
});

adapter.on('disconnect', () => {
  console.log('Disconnected');
});

adapter.on('accountsChanged', (accounts) => {
  console.log('Accounts changed', accounts);
});

adapter.on('chainChanged', (chain) => {
  console.log('Chain changed', chain);
});

adapter.on('signMessage', ({ message, account }) => {
  console.log('Message signed', message);
});

adapter.on('sendTransaction', ({ input, account }) => {
  console.log('Transaction sent', input);
});
```

## Type Definitions

```typescript
interface CosmosAccount {
  address: string;
  publicKey?: string;
  label?: string;
  chainId?: string;
}

interface CosmosChainInfo {
  chainId: string;
  chainName: string;
  rpcUrl?: string;
  rest?: string;
  bip44?: { coinType: number };
  prefix?: string;
}

interface CosmosWalletCapabilities {
  'cosmos:signMessage': { version: '1.0.0' };
  'cosmos:signTransaction': { version: '1.0.0' };
  'cosmos:sendTransaction': { version: '1.0.0' };
}
```

## Error Handling

```typescript
import { CosmosStandardAdapter } from '@orya/wallet-core';

async function handleCosmosOperation() {
  try {
    const adapter = cosmosProvider as CosmosStandardAdapter;
    
    if (!adapter.connected) {
      throw new Error('Wallet not connected');
    }

    if (!adapter.hasCapability('cosmos:signMessage')) {
      throw new Error('Signing not supported');
    }

    // Perform operation
  } catch (error) {
    if (error instanceof Error) {
      console.error('COSMOS error:', error.message);
    }
  }
}
```

## Testing

```typescript
import { getProviderRegistry } from '@orya/wallet-core';

describe('CosmosStandardAdapter', () => {
  it('should register provider', () => {
    const registry = getProviderRegistry();
    const provider = registry.registerCosmosProvider([
      { address: 'cosmos1test...' }
    ]);
    
    expect(provider).toBeDefined();
    expect(provider.chains).toContain('cosmoshub-4');
  });

  it('should connect to wallet', async () => {
    const registry = getProviderRegistry();
    const provider = registry.getProvider('cosmos');
    
    const result = await provider?.instance.connect();
    expect(result).toHaveProperty('publicKey');
    expect(result).toHaveProperty('accounts');
  });
});
```

## Backend Integration

The wallet-service and transaction-service provide backend support:

### Wallet Service
- Account creation and derivation
- Key management (MPC/Passkey)
- Account metadata storage

### Transaction Service
- Transaction history
- Status tracking
- Fee estimation

### Portfolio Service
- Balance aggregation
- Asset tracking
- Price feeds

## Troubleshooting

### Connection Issues
- Ensure RPC/REST endpoints are accessible
- Check firewall/CORS settings
- Verify chain configuration matches testnet/mainnet

### Signing Issues
- Verify account has sufficient balance for gas
- Check transaction message validity
- Ensure wallet is fully connected

### Chain Switching
- Verify target chain configuration exists
- Check chain support in wallet
- Clear wallet cache if needed

## Best Practices

1. **Always check wallet connection status before operations**
   ```typescript
   if (!adapter.connected) {
     await adapter.connect();
   }
   ```

2. **Handle capability checking**
   ```typescript
   if (!adapter.hasCapability('cosmos:signMessage')) {
     // Use fallback method
   }
   ```

3. **Implement proper error handling**
   ```typescript
   try {
     await adapter.sendTransaction(tx);
   } catch (error) {
     // Handle specific errors
   }
   ```

4. **Clean up listeners**
   ```typescript
   const unsubscribe = adapter.on('connect', handler);
   // Later
   unsubscribe();
   ```

5. **Disconnect on logout**
   ```typescript
   await adapter.disconnect();
   ```

## Related Documentation

- [Cosmos SDK Docs](https://docs.cosmos.network/)
- [Cosmos Kit Documentation](https://docs.cosmoskit.com/)
- [CosmJS Reference](https://docs.cosmjs.dev/)
- [Wallet Connect Spec](https://specs.walletconnect.com/2.0/)
