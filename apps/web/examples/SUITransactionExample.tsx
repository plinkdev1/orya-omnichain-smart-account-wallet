'use client';

/**
 * Example: Complete SUI Transaction Flow
 * 
 * This example demonstrates how to:
 * 1. Build a transaction using @mysten/sui.js
 * 2. Sign and execute it using the SUI Wallet Provider
 * 3. Handle success and error states
 */

import { useState } from 'react';
import { useSUIWallet } from '@/providers/SUIWalletProvider';
import { useSUITransaction } from '@/hooks/useSUITransaction';

interface TransactionConfig {
  recipientAddress: string;
  amount: string;
  objectId: string;
}

export function SUITransactionExample() {
  const { selectedAccount, isConnected } = useSUIWallet();
  const { execute, isLoading, error, data } = useSUITransaction();

  const [transactionConfig, setTransactionConfig] = useState<TransactionConfig>({
    recipientAddress: '0x',
    amount: '1000',
    objectId: '0x',
  });

  const [txResult, setTxResult] = useState<{
    digest: string;
    timestamp: string;
  } | null>(null);

  const handleExecuteTransaction = async () => {
    if (!selectedAccount) {
      console.error('No account selected');
      return;
    }

    try {
      // Example: Create and build a transaction
      // In real usage, import from @mysten/sui.js:
      // import { TransactionBlock } from '@mysten/sui.js/transactions';
      // import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

      // const suiClient = new SuiClient({ url: getFullnodeUrl('mainnet') });
      // const tx = new TransactionBlock();

      // Add transaction commands
      // tx.transferObjects(
      //   [tx.object(transactionConfig.objectId)],
      //   tx.pure(transactionConfig.recipientAddress)
      // );

      // Build the transaction
      // const txBytes = await tx.build({
      //   client: suiClient,
      //   onlyTransactionKind: false
      // });

      // For this example, we'll create dummy bytes
      const dummyTxBytes = new Uint8Array([0, 0, 0, 0]);

      // Execute the transaction
      const digest = await execute(dummyTxBytes);

      setTxResult({
        digest,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Transaction execution failed:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">SUI Transaction Example</h1>

      {/* Connection Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">Connection Status</h2>
        <div className="text-sm text-gray-600">
          {isConnected ? (
            <>
              <p className="text-green-600 font-medium">✓ Wallet Connected</p>
              {selectedAccount && (
                <p className="mt-1">
                  Account: <span className="font-mono text-xs">{selectedAccount.address}</span>
                </p>
              )}
            </>
          ) : (
            <p className="text-yellow-600 font-medium">⚠ Wallet Not Connected</p>
          )}
        </div>
      </div>

      {/* Transaction Configuration */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Address
            </label>
            <input
              type="text"
              value={transactionConfig.recipientAddress}
              onChange={(e) =>
                setTransactionConfig({
                  ...transactionConfig,
                  recipientAddress: e.target.value,
                })
              }
              placeholder="0x..."
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono"
              disabled={!isConnected}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (SUI)
            </label>
            <input
              type="text"
              value={transactionConfig.amount}
              onChange={(e) =>
                setTransactionConfig({
                  ...transactionConfig,
                  amount: e.target.value,
                })
              }
              placeholder="1000"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              disabled={!isConnected}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Object ID
            </label>
            <input
              type="text"
              value={transactionConfig.objectId}
              onChange={(e) =>
                setTransactionConfig({
                  ...transactionConfig,
                  objectId: e.target.value,
                })
              }
              placeholder="0x..."
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono"
              disabled={!isConnected}
            />
          </div>
        </div>
      </div>

      {/* Execute Button */}
      <button
        onClick={handleExecuteTransaction}
        disabled={!isConnected || isLoading}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-6"
      >
        {isLoading ? '⏳ Executing Transaction...' : '► Execute Transaction'}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 rounded border border-red-200">
          <h3 className="text-sm font-semibold text-red-900 mb-2">Error</h3>
          <p className="text-sm text-red-700">{error.message}</p>
        </div>
      )}

      {/* Success Display */}
      {txResult && (
        <div className="mb-6 p-4 bg-green-50 rounded border border-green-200">
          <h3 className="text-sm font-semibold text-green-900 mb-3">✓ Transaction Successful</h3>
          <div className="space-y-2 text-sm text-green-800">
            <div>
              <span className="font-medium">Digest:</span>
              <div className="font-mono text-xs mt-1 p-2 bg-white rounded break-all">
                {txResult.digest}
              </div>
            </div>
            <div>
              <span className="font-medium">Timestamp:</span>
              <p className="mt-1">{new Date(txResult.timestamp).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Result from useSUITransaction hook */}
      {data && (
        <div className="p-4 bg-blue-50 rounded border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Latest Transaction</h3>
          <p className="text-sm text-blue-800 font-mono break-all">{data}</p>
        </div>
      )}

      {/* Code Example */}
      <div className="mt-8 p-4 bg-gray-900 text-gray-100 rounded font-mono text-xs overflow-auto">
        <pre>{`// Complete example with @mysten/sui.js
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

const suiClient = new SuiClient({ 
  url: getFullnodeUrl('mainnet') 
});

// Build transaction
const tx = new TransactionBlock();
tx.transferObjects(
  [tx.object(objectId)],
  tx.pure(recipientAddress)
);

// Convert to bytes
const txBytes = await tx.build({
  client: suiClient,
  onlyTransactionKind: false
});

// Sign and execute
const digest = await execute(txBytes);`}</pre>
      </div>
    </div>
  );
}
