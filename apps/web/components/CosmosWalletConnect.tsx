'use client';

import React, { useState, useEffect } from 'react';
import { getProviderRegistry } from '@orya/wallet-core';
import type { CosmosStandardAdapter } from '@orya/wallet-core/src/standards/cosmos-standard';

interface CosmosWalletConnectProps {
  onConnect?: (account: any) => void;
  onError?: (error: Error) => void;
  chain?: string;
}

export const CosmosWalletConnect: React.FC<CosmosWalletConnectProps> = ({
  onConnect,
  onError,
  chain = 'cosmoshub-4',
}) => {
  const [connected, setConnected] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [adapter, setAdapter] = useState<CosmosStandardAdapter | null>(null);

  useEffect(() => {
    initializeProvider();
  }, []);

  const initializeProvider = async () => {
    try {
      const registry = getProviderRegistry();
      const provider = registry.getProvider('cosmos');
      
      if (provider) {
        setAdapter(provider.instance);
      }
    } catch (error) {
      onError?.(error as Error);
    }
  };

  const wallets = [
    { name: 'Keplr', icon: '🔑', type: 'keplr' },
    { name: 'Leap', icon: '🦘', type: 'leap' },
    { name: 'Cosmostation', icon: '🌌', type: 'cosmostation' },
    { name: 'Wallet Connect', icon: '🔗', type: 'walletconnect' },
    { name: 'ORYA Native', icon: '⚡', type: 'orya' },
  ];

  const connectWallet = async (walletType: string) => {
    if (!adapter) return;

    setLoading(true);
    try {
      const connection = await adapter.connect();
      setConnected(true);
      setSelectedAccount(adapter.account);
      setShowModal(false);
      
      onConnect?.(adapter.account);
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    if (!adapter) return;

    try {
      await adapter.disconnect();
      setConnected(false);
      setSelectedAccount(null);
    } catch (error) {
      onError?.(error as Error);
    }
  };

  if (connected && selectedAccount) {
    return (
      <div className="p-4 border-2 border-blue-500 rounded-lg bg-blue-50">
        <p className="text-sm font-semibold text-blue-700 mb-2">Connected to Cosmos</p>
        <p className="text-xs font-mono text-gray-600 mb-4 truncate">
          {selectedAccount.address}
        </p>
        <button
          onClick={disconnect}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50"
      >
        {loading ? 'Connecting...' : 'Connect Cosmos Wallet'}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Select Wallet</h2>

            <div className="space-y-3 mb-6">
              {wallets.map((wallet) => (
                <button
                  key={wallet.type}
                  onClick={() => connectWallet(wallet.type)}
                  disabled={loading}
                  className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition disabled:opacity-50"
                >
                  <span className="text-3xl">{wallet.icon}</span>
                  <span className="font-semibold text-gray-900">{wallet.name}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
