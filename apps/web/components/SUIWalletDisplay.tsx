'use client';

import { useSUIWallet } from '@/providers/SUIWalletProvider';

export function SUIWalletDisplay() {
  const {
    isConnected,
    isLoading,
    error,
    accounts,
    selectedAccount,
    selectAccount,
  } = useSUIWallet();

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-100 rounded">
        <div className="text-sm text-gray-600">Loading wallet...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded border border-red-200">
        <div className="text-sm font-semibold text-red-700 mb-1">Wallet Error</div>
        <div className="text-sm text-red-600">{error.message}</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded border border-gray-200">
      <div className="mb-4">
        <div className="text-sm font-semibold text-gray-700 mb-2">
          Connection Status: {isConnected ? (
            <span className="text-green-600">Connected</span>
          ) : (
            <span className="text-yellow-600">Not Connected</span>
          )}
        </div>

        {selectedAccount && (
          <div className="text-sm text-gray-600">
            Selected Account: <span className="font-mono text-xs">{selectedAccount.address}</span>
          </div>
        )}
      </div>

      {accounts.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-semibold text-gray-700 mb-2">Available Accounts:</div>
          <div className="space-y-2">
            {accounts.map((account) => (
              <button
                key={account.address}
                onClick={() => selectAccount(account)}
                className={`w-full p-2 text-left text-xs rounded border transition-colors ${
                  selectedAccount?.address === account.address
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="font-mono truncate">{account.address}</div>
                {account.label && (
                  <div className="text-xs text-gray-500 mt-1">{account.label}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {accounts.length === 0 && isConnected && (
        <div className="text-sm text-gray-600">No SUI accounts found</div>
      )}
    </div>
  );
}
