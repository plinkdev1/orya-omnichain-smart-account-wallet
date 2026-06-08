'use client';

/**
 * Example: Swap Page with Protocol Selector
 * 
 * This example shows how to integrate the ProtocolSelector component
 * into a feature page like Swap, Staking, or Yields.
 * 
 * Key patterns:
 * 1. Import the ProtocolSelectorButton component
 * 2. Use the component to let users select protocols
 * 3. Store the selected protocol in your feature state
 * 4. Pass available protocols specific to that feature/chain
 */

import { useState } from 'react';
import type { Protocol, ChainId, FeatureType } from '@orya/wallet-core';
import { ProtocolSelectorButton } from '../ProtocolSelector';

// Mock data - replace with actual protocol data from your API
const SWAP_PROTOCOLS: Protocol[] = [
  {
    id: 'sui-aftermath-swap',
    name: 'Aftermath Finance',
    logo: '🌊',
    apy: 8.5,
    tvl: '$3.5M',
    fee: '0.3%',
    isAudited: true,
    auditors: ['CertiK', 'MoveBit'],
    securityRating: 92,
    isPreferred: true,
    type: 'aggregator',
    description: 'DEX aggregator with best price routing',
    chain: 'sui' as ChainId,
    features: ['swap'],
  },
  {
    id: 'sui-cetus-swap',
    name: 'Cetus Protocol',
    logo: '🐋',
    apy: 9.2,
    tvl: '$7.0M',
    fee: '0.35%',
    isAudited: true,
    auditors: ['MoveBit', 'OtterSec'],
    securityRating: 90,
    isPreferred: false,
    type: 'dex',
    description: 'Concentrated liquidity DEX on SUI',
    chain: 'sui' as ChainId,
    features: ['swap'],
  },
  {
    id: 'sui-deepbook-swap',
    name: 'DeepBook',
    logo: '📖',
    apy: 7.8,
    tvl: '$5.2M',
    fee: '0.25%',
    isAudited: true,
    auditors: ['Trail of Bits'],
    securityRating: 88,
    isPreferred: false,
    type: 'orderbook',
    description: 'Native SUI orderbook protocol',
    chain: 'sui' as ChainId,
    features: ['swap'],
  },
];

export default function SwapWithProtocolSelector() {
  const [selectedProtocolId, setSelectedProtocolId] = useState<string | undefined>(
    SWAP_PROTOCOLS[0]?.id
  );
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');

  const chainId = 'sui' as ChainId;
  const feature = 'swap' as FeatureType;

  const selectedProtocol = SWAP_PROTOCOLS.find((p) => p.id === selectedProtocolId);

  const handleSwap = async () => {
    if (!fromAmount || !toAmount || !selectedProtocol) {
      alert('Please fill in all fields');
      return;
    }

    console.log('Executing swap with protocol:', {
      protocol: selectedProtocol.name,
      from: fromAmount,
      to: toAmount,
    });

    try {
      // Execute swap using the selected protocol
      // This would call your actual swap service
      alert(`Swap executed using ${selectedProtocol.name}`);
    } catch (error) {
      console.error('Swap failed:', error);
      alert('Swap failed. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Swap</h1>
          <p className="text-slate-400">Exchange tokens across supported protocols</p>
        </div>

        {/* Protocol Selector - Integrated at top of form */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <ProtocolSelectorButton
            chainId={chainId}
            feature={feature}
            availableProtocols={SWAP_PROTOCOLS}
            label="Swap Protocol"
            onSelect={setSelectedProtocolId}
            showAdvancedButton={true}
            onAdvancedClick={() => {
              console.log('Open advanced settings');
            }}
          />

          {selectedProtocol && (
            <div className="mt-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Fee</p>
                  <p className="text-lg font-semibold text-white">{selectedProtocol.fee}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Security Rating</p>
                  <p className="text-lg font-semibold text-green-400">
                    {selectedProtocol.securityRating}/100
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Swap Form */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">From</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
              <select className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500">
                <option>SUI</option>
                <option>USDC</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">To</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={toAmount}
                onChange={(e) => setToAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
              <select className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500">
                <option>USDC</option>
                <option>SUI</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSwap}
            className="w-full px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition-colors"
          >
            Swap with {selectedProtocol?.name || 'Protocol'}
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <p className="text-blue-300 text-sm">
            <span className="font-semibold">💡 Tip:</span> Click the settings icon next to the protocol selector to access advanced options including auto-signing preferences for this protocol.
          </p>
        </div>
      </div>
    </div>
  );
}
