'use client';

import { useState } from 'react';
import { useSUIWallet } from '@/providers/SUIWalletProvider';
import { SUIWalletDisplay } from './SUIWalletDisplay';
import { SUITransferButton } from './SUITransferButton';

export function SUIWalletDemo() {
  const { selectedAccount, signMessage } = useSUIWallet();
  const [messageToSign, setMessageToSign] = useState('');
  const [signedMessage, setSignedMessage] = useState<{
    message: string;
    signature: string;
  } | null>(null);
  const [isSigningMessage, setIsSigningMessage] = useState(false);
  const [signError, setSignError] = useState<Error | null>(null);

  const handleSignMessage = async () => {
    if (!messageToSign.trim()) {
      setSignError(new Error('Please enter a message to sign'));
      return;
    }

    if (!selectedAccount) {
      setSignError(new Error('No account selected'));
      return;
    }

    try {
      setIsSigningMessage(true);
      setSignError(null);

      const messageBytes = new TextEncoder().encode(messageToSign);
      const signature = await signMessage(messageBytes);

      setSignedMessage({
        message: messageToSign,
        signature: Buffer.from(signature).toString('hex'),
      });

      setMessageToSign('');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setSignError(error);
    } finally {
      setIsSigningMessage(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">SUI Wallet Demo</h1>
        <p className="text-gray-600 text-sm">
          Test the SUI Wallet Standard Provider integration
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Wallet Connection</h2>
        <SUIWalletDisplay />
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sign Message</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message to Sign
            </label>
            <textarea
              value={messageToSign}
              onChange={(e) => setMessageToSign(e.target.value)}
              placeholder="Enter a message to sign..."
              className="w-full p-3 border border-gray-300 rounded text-sm font-mono"
              rows={3}
              disabled={!selectedAccount}
            />
          </div>

          <button
            onClick={handleSignMessage}
            disabled={isSigningMessage || !selectedAccount}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {isSigningMessage ? 'Signing...' : 'Sign Message'}
          </button>

          {signError && (
            <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
              Error: {signError.message}
            </div>
          )}

          {signedMessage && (
            <div className="p-4 bg-green-50 rounded border border-green-200">
              <div className="text-sm font-semibold text-green-700 mb-2">Signature Generated</div>
              <div className="text-xs text-gray-700 mb-2">
                <div className="font-medium mb-1">Message:</div>
                <div className="bg-white p-2 rounded font-mono break-all text-xs">
                  {signedMessage.message}
                </div>
              </div>
              <div className="text-xs text-gray-700">
                <div className="font-medium mb-1">Signature:</div>
                <div className="bg-white p-2 rounded font-mono break-all text-xs">
                  {signedMessage.signature}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Transfer (Example)</h2>
        <div className="p-4 bg-blue-50 rounded border border-blue-200 mb-4">
          <p className="text-sm text-blue-700">
            The transfer button below is a demonstration. To use it, you would need to:
          </p>
          <ul className="list-disc list-inside text-sm text-blue-700 mt-2 space-y-1">
            <li>Create a TransactionBlock using @mysten/sui.js</li>
            <li>Build the transaction to get the bytes</li>
            <li>Pass the bytes to the execute function</li>
          </ul>
        </div>
        <SUITransferButton
          objectId="0x..."
          recipientAddress="0x..."
          amount="1000"
        />
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Integration Guide</h2>
        <div className="space-y-3 text-sm text-gray-700">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Using the Provider:</h3>
            <pre className="bg-gray-100 p-3 rounded text-xs font-mono overflow-auto">
{`import { useSUIWallet } from '@/providers/SUIWalletProvider';

export function MyComponent() {
  const {
    selectedAccount,
    isConnected,
    signMessage,
    signAndExecuteTransactionBlock
  } = useSUIWallet();
  
  // Use the wallet functions...
}`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Using the Transaction Hook:</h3>
            <pre className="bg-gray-100 p-3 rounded text-xs font-mono overflow-auto">
{`import { useSUITransaction } from '@/hooks/useSUITransaction';

export function MyComponent() {
  const { execute, isLoading, error, data } = useSUITransaction();
  
  const handleTransaction = async (txBlock) => {
    try {
      const digest = await execute(txBlock);
      // Handle success
    } catch (err) {
      // Handle error
    }
  };
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
