'use client';

import { useState } from 'react';
import { useSUIWallet } from '@/providers/SUIWalletProvider';
import { useSUITransaction } from '@/hooks/useSUITransaction';

interface SUITransferButtonProps {
  objectId?: string;
  recipientAddress?: string;
  amount?: string;
  onSuccess?: (digest: string) => void;
  onError?: (error: Error) => void;
}

export function SUITransferButton({
  objectId,
  recipientAddress,
  amount,
  onSuccess,
  onError,
}: SUITransferButtonProps) {
  const { selectedAccount, isConnected } = useSUIWallet();
  const { execute, isLoading, error, data } = useSUITransaction();
  const [showDetails, setShowDetails] = useState(false);

  const handleTransfer = async () => {
    if (!selectedAccount) {
      const err = new Error('No account selected');
      onError?.(err);
      return;
    }

    if (!objectId || !recipientAddress) {
      const err = new Error('Missing required transfer parameters');
      onError?.(err);
      return;
    }

    try {
      const txBlockBytes = new Uint8Array([
        // This is a placeholder. In real usage, you would:
        // 1. Create a TransactionBlock using @mysten/sui.js
        // 2. Build it to get the bytes
        // 3. Pass those bytes to execute()
        // Example:
        // import { TransactionBlock } from '@mysten/sui.js/transactions';
        // const tx = new TransactionBlock();
        // tx.transferObjects([tx.object(objectId)], tx.pure(recipientAddress));
        // const txBytes = await tx.build({ client: suiClient });
        // await execute(txBytes);
      ]);

      const digest = await execute(txBlockBytes);
      onSuccess?.(digest);
      setShowDetails(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      onError?.(error);
    }
  };

  if (!isConnected) {
    return (
      <button disabled className="px-4 py-2 bg-gray-300 text-gray-600 rounded cursor-not-allowed">
        Wallet Not Connected
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleTransfer}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Signing & Executing...' : 'Transfer'}
      </button>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
          Error: {error.message}
        </div>
      )}

      {data && (
        <div className="p-3 bg-green-100 text-green-700 rounded text-sm">
          <div className="font-semibold mb-1">Transaction Successful!</div>
          <div className="break-all text-xs">Digest: {data}</div>
        </div>
      )}

      {selectedAccount && (
        <div className="text-xs text-gray-600">
          Account: {selectedAccount.address.slice(0, 10)}...{selectedAccount.address.slice(-6)}
        </div>
      )}

      {showDetails && (
        <div className="p-3 bg-blue-50 rounded text-xs text-gray-700 border border-blue-200">
          <div className="font-semibold mb-2">Transaction Details:</div>
          <div>Object: {objectId?.slice(0, 10)}...</div>
          <div>Recipient: {recipientAddress?.slice(0, 10)}...</div>
          <div>Amount: {amount || 'N/A'}</div>
        </div>
      )}
    </div>
  );
}
