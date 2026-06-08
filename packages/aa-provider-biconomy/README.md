# Biconomy Account Abstraction Provider

Complete implementation of Biconomy Account Abstraction integration for ORŸA Wallet, including NEXUS smart accounts, Supertransactions, Paymaster, and MEE (Modular Execution Environment).

## Features

✅ **NEXUS Smart Accounts** - ERC-4337 compliant smart account management
✅ **Supertransactions** - Single-chain and multi-chain atomic operations
✅ **Paymaster Integration** - Gas sponsorship and ERC-20 payment support
✅ **MEE Support** - Modular execution with custom hooks and policies
✅ **Session Keys** - Managed session key lifecycle
✅ **Gas Estimation** - Accurate gas cost calculation
✅ **Multi-Chain Support** - 6+ supported blockchain networks
✅ **Error Handling** - Comprehensive error types and recovery

## Installation

```bash
pnpm install @orya/aa-provider-biconomy
```

### Dependencies

- `ethers`: ^6.0.0
- `axios`: ^1.6.0
- `@biconomy/smart-accounts`: ^4.9.0
- `@biconomy/bundler`: ^4.0.0
- `@biconomy/paymaster`: ^4.0.0

## Environment Configuration

Add these to your `.env` file:

```env
# Biconomy API Configuration
BICONOMY_API_KEY=mee_Puvvpjy7FwBtPicffxNGS4
BICONOMY_API_ID=f4d49c3c-1702-4d37-b6c4-af98619639fc
BICONOMY_BUNDLER_ID=your_bundler_id

# RPC Configuration (example for Ethereum)
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY

# Paymaster Address (optional - uses default if not provided)
BICONOMY_PAYMASTER_ADDRESS=0x...
```

## Quick Start

### 1. Basic Initialization

```typescript
import { BiconomyService } from '@orya/aa-provider-biconomy';

const service = new BiconomyService();

await service.initialize({
  apiKey: process.env.BICONOMY_API_KEY,
  apiId: process.env.BICONOMY_API_ID,
  rpcUrl: process.env.ETHEREUM_RPC_URL,
  chainId: 1, // Ethereum mainnet
});
```

### 2. Create a Smart Account

```typescript
import type { Address } from '@orya/shared-types';

const userAddress = '0x...' as Address;
const smartAccount = await service.createSmartAccount(userAddress);

console.log('Smart Account:', smartAccount.address);
console.log('Is Deployed:', smartAccount.isDeployed);
```

### 3. Execute a Supertransaction

```typescript
const result = await service.executeSupertransaction({
  operations: [
    {
      chainId: 1,
      target: '0x...',
      value: '0',
      data: '0x...',
    },
  ],
  deadline: Math.floor(Date.now() / 1000) + 3600,
});

console.log('Transaction Hash:', result.transactionHash);
console.log('Status:', result.status);
```

### 4. Track Transaction Status

```typescript
const status = await service.getTransactionStatus(result.transactionHash);

console.log('Status:', status.status);
console.log('Confirmations:', status.confirmations);
```

## React Integration

### useBiconomy Hook

Main hook for Biconomy integration:

```typescript
import { useBiconomy } from '@orya/wallet-core';

function MyComponent() {
  const { service, isReady, error, initialize } = useBiconomy();

  useEffect(() => {
    initialize({
      apiKey: process.env.REACT_APP_BICONOMY_KEY,
      rpcUrl: process.env.REACT_APP_RPC_URL,
      chainId: 1,
    });
  }, []);

  if (!isReady) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>Biconomy Ready!</div>;
}
```

### useNexusSmartAccount Hook

Manage smart account lifecycle:

```typescript
import { useNexusSmartAccount } from '@orya/wallet-core';

function AccountComponent() {
  const { account, isCreating, create } = useNexusSmartAccount(service);

  const handleCreateAccount = async () => {
    await create('0x...');
  };

  return (
    <div>
      <button onClick={handleCreateAccount} disabled={isCreating}>
        Create Account
      </button>
      {account && <p>Account: {account.address}</p>}
    </div>
  );
}
```

### useSupertransaction Hook

Execute transactions:

```typescript
import { useSupertransaction } from '@orya/wallet-core';

function TransactionComponent() {
  const { result, isExecuting, error, execute } = useSupertransaction(service);

  const handleExecute = async () => {
    await execute({
      operations: [
        {
          chainId: 1,
          target: '0x...',
          data: '0x...',
        },
      ],
    });
  };

  return (
    <div>
      <button onClick={handleExecute} disabled={isExecuting}>
        Execute Transaction
      </button>
      {result && <p>Hash: {result.transactionHash}</p>}
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

### useGasEstimate Hook

Estimate gas and check sponsorship:

```typescript
import { useGasEstimate } from '@orya/wallet-core';

function GasComponent() {
  const { estimate, isEstimating, estimateGas, checkSponsorship } = useGasEstimate(service);

  const handleEstimate = async () => {
    const gas = await estimateGas({
      operations: [...],
    });
    
    const isSponsored = await checkSponsorship('0x...', 50);
  };

  return (
    <div>
      {estimate && (
        <div>
          <p>Call Gas: {estimate.callGasLimit}</p>
          <p>Verification Gas: {estimate.verificationGasLimit}</p>
          <p>Total: {estimate.totalEstimatedGas}</p>
        </div>
      )}
    </div>
  );
}
```

## Core Components

### BiconomyAAProvider

Implements `IAccountAbstractionProvider` interface:

```typescript
import { BiconomyAAProvider } from '@orya/aa-provider-biconomy';

const provider = new BiconomyAAProvider();

await provider.initialize({
  biconomyApiKey: 'your_key',
  rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY',
  chainId: 1,
});

const smartAccount = await provider.createSmartAccount({
  ownerAddress: '0x...',
  accountType: 'simple_account',
  chainId: 1,
});
```

### SupertransactionClient

API client for Biconomy Supertransaction API:

```typescript
import { SupertransactionClient, BiconomyConfig } from '@orya/aa-provider-biconomy';

const config = new BiconomyConfig({
  apiKey: 'your_key',
  rpcUrl: 'https://...',
  chainId: 1,
});

const client = new SupertransactionClient(config);

const result = await client.executeSupertransaction({
  operations: [...],
});
```

### NexusAccountManager

Smart account lifecycle management:

```typescript
import { NexusAccountManager, BiconomyConfig } from '@orya/aa-provider-biconomy';

const manager = new NexusAccountManager(config);

// Compute account address
const address = await manager.computeAccountAddress(ownerAddress, factoryAddress);

// Check if deployed
const deployed = await manager.isAccountDeployed(address);

// Get nonce for UserOperation
const nonce = await manager.getAccountNonce(address);
```

### PaymasterService

Gas sponsorship management:

```typescript
import { PaymasterService } from '@orya/aa-provider-biconomy';

const paymaster = new PaymasterService(config);

// Get sponsorship data
const data = await paymaster.getSponsorshipData({
  userOperation: userOp,
  paymasterAddress: '0x...',
  mode: 'sponsored',
});

// Check sponsorship eligibility
const eligible = await paymaster.validateSponsorship('0x...', 50);

// Get quota
const quota = await paymaster.getQuota(userAddress);
```

### MEEExecutor

Custom execution modules and policies:

```typescript
import { MEEExecutor } from '@orya/aa-provider-biconomy';

const mee = new MEEExecutor();

// Register module
mee.registerModule({
  address: '0x...',
  name: 'MyModule',
  enabled: true,
});

// Add policy
mee.addPolicy({
  id: 'whitelist',
  type: 'whitelist',
  target: '0x...',
  enabled: true,
});

// Validate execution
const valid = await mee.validateExecution(context);
```

## Supported Networks

| Chain | Chain ID | Supported |
|-------|----------|-----------|
| Ethereum | 1 | ✅ |
| Polygon | 137 | ✅ |
| Arbitrum | 42161 | ✅ |
| Optimism | 10 | ✅ |
| Base | 8453 | ✅ |
| Avalanche | 43114 | ✅ |

## Error Handling

```typescript
import {
  BiconomyError,
  BiconomyNotInitializedError,
  BiconomySmartAccountError,
  BiconomyPaymasterError,
  BiconomyGasEstimationError,
  BiconomyTransactionError,
} from '@orya/aa-provider-biconomy';

try {
  await service.executeSupertransaction(params);
} catch (error) {
  if (error instanceof BiconomyPaymasterError) {
    console.error('Paymaster error:', error.message);
  } else if (error instanceof BiconomyGasEstimationError) {
    console.error('Gas estimation failed:', error.message);
  } else if (error instanceof BiconomyError) {
    console.error('Biconomy error:', error.code, error.message);
  }
}
```

## Advanced Features

### Multi-Chain Operations

```typescript
const result = await service.executeMultiChainSupertransaction({
  operations: [
    {
      chainId: 1,
      target: '0x...',
      data: '0x...',
    },
    {
      chainId: 137,
      target: '0x...',
      data: '0x...',
    },
  ],
});
```

### Custom Sponsorship Policies

```typescript
const paymaster = service.getPaymasterService();

paymaster.registerPolicy('custom', {
  maxUsdPerTransaction: 100,
  maxDailyBudgetUsd: 10000,
  minUserBalanceUsd: 50,
  maxSponsorshipPercentage: 100,
  eligibleTokens: ['0x...', '0x...'],
  whitelistedAddresses: ['0x...'],
});
```

### Custom Execution Modules

```typescript
const mee = service.getMEEExecutor();

mee.registerModule({
  address: '0x...',
  name: 'CustomValidator',
  enabled: true,
  config: { threshold: 2 },
});

mee.addPreExecutionHook({
  type: 'pre',
  module: '0x...',
  data: '0x...',
});
```

## Testing

```bash
cd packages/aa-provider-biconomy
pnpm test
```

## Troubleshooting

### "API key is required"

Ensure `BICONOMY_API_KEY` is set in your environment.

### "Unsupported chain ID"

Check that your chain ID is in the BICONOMY_NETWORKS map. Currently supports: 1, 10, 8453, 42161, 137, 43114.

### "Biconomy service not initialized"

Make sure to call `initialize()` before using the service.

### "Gas estimation failed"

Verify RPC URL is correct and network is supported. Check account nonce.

## API Reference

### BiconomyService Methods

- `initialize(config)` - Initialize service
- `isReady()` - Check if initialized
- `createSmartAccount(owner, factory?)` - Create account
- `executeSupertransaction(params, options?)` - Execute transaction
- `executeMultiChainSupertransaction(params)` - Multi-chain execution
- `getTransactionStatus(hash)` - Get status
- `cancelTransaction(hash)` - Cancel pending
- `speedUpTransaction(hash, maxFee, maxPriorityFee)` - Speed up
- `getSupportedChains()` - Get chains
- `getPaymasterService()` - Get paymaster
- `getAccountManager()` - Get account manager
- `getMEEExecutor()` - Get MEE executor
- `getConfig()` - Get configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## License

MIT
