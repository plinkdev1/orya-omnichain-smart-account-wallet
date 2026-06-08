'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { Protocol, FeatureType, ChainId } from '@orya/wallet-core';
import { useProtocolSelection } from '@orya/wallet-core';
import ProtocolSelectorModal from './ProtocolSelectorModal';

interface ProtocolSelectorButtonProps {
  chainId: ChainId;
  feature: FeatureType;
  availableProtocols: Protocol[];
  label?: string;
  compact?: boolean;
  showAdvancedButton?: boolean;
  onAdvancedClick?: () => void;
}

export default function ProtocolSelectorButton({
  chainId,
  feature,
  availableProtocols,
  label = 'Protocol',
  compact = false,
  showAdvancedButton = false,
  onAdvancedClick,
}: ProtocolSelectorButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { selectedProtocol } = useProtocolSelection(
    chainId,
    feature,
    availableProtocols
  );

  if (compact) {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          title={selectedProtocol?.name || 'Select Protocol'}
        >
          <span className="text-lg">{selectedProtocol?.logo || '⚙️'}</span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>
        <ProtocolSelectorModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          chainId={chainId}
          feature={feature}
          availableProtocols={availableProtocols}
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 flex items-center gap-3 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors group"
          >
            {selectedProtocol ? (
              <>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                  {selectedProtocol.logo}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-white font-medium text-sm">
                    {selectedProtocol.name}
                  </div>
                  <div className="text-slate-400 text-xs">
                    {selectedProtocol.type}
                  </div>
                </div>
              </>
            ) : (
              <span className="text-slate-400 text-sm">Select a protocol</span>
            )}
            <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-300 transition-colors flex-shrink-0" />
          </button>

          {showAdvancedButton && (
            <button
              onClick={onAdvancedClick}
              className="px-3 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
              title="Advanced Options"
            >
              ⚙️
            </button>
          )}
        </div>

        {selectedProtocol && (
          <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
            <div>
              {selectedProtocol.apy !== undefined && (
                <span>
                  APY: <span className="text-white font-medium">{selectedProtocol.apy}%</span>
                </span>
              )}
            </div>
            <div>
              TVL: <span className="text-white font-medium">{selectedProtocol.tvl}</span>
            </div>
            <div>
              Fee: <span className="text-white font-medium">{selectedProtocol.fee}</span>
            </div>
            {selectedProtocol.isAudited && (
              <div className="flex items-center gap-1">
                <span className="text-green-400">✓</span>
                <span>Audited</span>
              </div>
            )}
          </div>
        )}
      </div>

      <ProtocolSelectorModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        chainId={chainId}
        feature={feature}
        availableProtocols={availableProtocols}
      />
    </>
  );
}
