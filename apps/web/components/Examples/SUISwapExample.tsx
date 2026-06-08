'use client';

import { useState } from 'react';
import type { Protocol, FeatureType, ChainId } from '@orya/wallet-core';
import { getSUIProtocolsByFeature, getDefaultSUIProtocol } from '@orya/wallet-core/data/sui-protocols';
import { ProtocolSelectorButton } from '@/components/ProtocolSelector';

interface SUISwapExampleProps {
  defaultChainId?: ChainId;
  defaultFeature?: FeatureType;
}

export default function SUISwapExample({
  defaultChainId = 'sui',
  defaultFeature = 'swap',
}: SUISwapExampleProps) {
  const [selectedProtocolId, setSelectedProtocolId] = useState<string>();
  const [fromAmount, setFromAmount] = useState('1');
  const [toAmount, setToAmount] = useState('');

  const availableProtocols = getSUIProtocolsByFeature(defaultFeature);
  const defaultProtocol = getDefaultSUIProtocol(defaultFeature);
  const selectedProtocol = availableProtocols.find(
    p => p.id === (selectedProtocolId || defaultProtocol?.id)
  );

  const handleSwap = async () => {
    if (!selectedProtocol) return;
    
    console.log(`Swapping ${fromAmount} SUI using ${selectedProtocol.name}`);
    
    setTimeout(() => {
      const mockOutput = parseFloat(fromAmount) * 2.5;
      setToAmount(mockOutput.toFixed(6));
    }, 1000);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 space-y-6">
        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold text-white">Swap on SUI</h2>
          <p className="text-slate-400 text-sm mt-1">
            Exchange tokens using your preferred protocol
          </p>
        </div>

        {/* Protocol Selector */}
        <ProtocolSelectorButton
          chainId={defaultChainId}
          feature={defaultFeature}
          availableProtocols={availableProtocols}
          label="Swap Protocol"
          onSelect={setSelectedProtocolId}
        />

        {/* Protocol Details */}
        {selectedProtocol && (
          <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Provider</span>
              <span className="text-white font-medium">{selectedProtocol.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Fee</span>
              <span className="text-white font-medium">{selectedProtocol.fee}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Security Rating</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">{selectedProtocol.securityRating}/100</span>
                {selectedProtocol.isAudited && (
                  <span className="text-green-400 text-xs">Audited</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Swap Form */}
        <div className="space-y-4">
          {/* From */}
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-2">
              From
            </label>
            <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-4 py-3 border border-slate-600">
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent text-white placeholder-slate-400 outline-none text-lg"
              />
              <span className="text-slate-400 font-medium">SUI</span>
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                setFromAmount(toAmount);
                setToAmount(fromAmount);
              }}
              className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center text-white transition-colors"
            >
              ⇅
            </button>
          </div>

          {/* To */}
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-2">
              To (Estimated)
            </label>
            <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-4 py-3 border border-slate-600">
              <input
                type="number"
                value={toAmount}
                onChange={(e) => setToAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent text-white placeholder-slate-400 outline-none text-lg"
                readOnly
              />
              <span className="text-slate-400 font-medium">USDC</span>
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!selectedProtocol || !fromAmount}
          className="w-full py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-lg transition-colors"
        >
          {selectedProtocol ? 'Swap' : 'Select Protocol'}
        </button>

        {/* Info Footer */}
        <div className="text-xs text-slate-400 text-center">
          <p>
            This example demonstrates protocol selection with {availableProtocols.length} SUI protocols
          </p>
        </div>
      </div>
    </div>
  );
}
