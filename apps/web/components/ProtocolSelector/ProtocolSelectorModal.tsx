'use client';

import { X, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Protocol, FeatureType, ChainId } from '@orya/wallet-core';
import { useProtocolSelection } from '@orya/wallet-core';

interface ProtocolSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chainId: ChainId;
  feature: FeatureType;
  availableProtocols: Protocol[];
}

export default function ProtocolSelectorModal({
  open,
  onOpenChange,
  chainId,
  feature,
  availableProtocols,
}: ProtocolSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [compareMode, setCompareMode] = useState(false);

  const {
    selectedProtocol,
    selectProtocol,
    loading,
    error,
    setAvailableProtocols,
  } = useProtocolSelection(chainId, feature, availableProtocols);

  useEffect(() => {
    setAvailableProtocols(availableProtocols);
  }, [availableProtocols, setAvailableProtocols]);

  const filteredProtocols = useMemo(() => {
    if (!searchQuery.trim()) return availableProtocols;
    const query = searchQuery.toLowerCase();
    return availableProtocols.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
    );
  }, [searchQuery, availableProtocols]);

  const handleSelectProtocol = async (protocolId: string) => {
    try {
      await selectProtocol(protocolId);
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to select protocol:', err);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-slate-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Select Protocol</h2>
            <p className="text-slate-400 text-sm mt-1">
              Choose your preferred protocol for {feature} on {chainId}
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Compare Toggle */}
        <div className="p-4 border-b border-slate-700 space-y-4">
          <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search protocols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-slate-400 outline-none text-sm"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300 text-sm">Compare Mode</span>
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                compareMode
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {compareMode ? 'Exit Compare' : 'Compare Protocols'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-slate-700 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-400">Loading protocols...</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          ) : compareMode ? (
            <ProtocolComparisonTable
              protocols={filteredProtocols}
              selectedId={selectedProtocol?.id}
              onSelect={handleSelectProtocol}
            />
          ) : (
            <ProtocolCardList
              protocols={filteredProtocols}
              selectedId={selectedProtocol?.id}
              onSelect={handleSelectProtocol}
            />
          )}
        </div>
      </div>
    </div>
  );
}

interface ProtocolCardListProps {
  protocols: Protocol[];
  selectedId?: string;
  onSelect: (protocolId: string) => void;
}

function ProtocolCardList({ protocols, selectedId, onSelect }: ProtocolCardListProps) {
  return (
    <div className="p-6 space-y-4">
      {protocols.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 text-sm">No protocols found</p>
        </div>
      ) : (
        protocols.map((protocol) => (
          <div
            key={protocol.id}
            onClick={() => onSelect(protocol.id)}
            className={`p-5 rounded-xl transition-all cursor-pointer border-2 ${
              protocol.id === selectedId
                ? 'bg-purple-500/10 border-purple-500'
                : 'bg-slate-700/50 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {protocol.logo}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold text-lg">{protocol.name}</h3>
                    {protocol.isPreferred && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs rounded">
                        ⭐ Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-sm mb-3">{protocol.description}</p>
                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    {protocol.apy !== undefined && (
                      <div>
                        <span className="text-slate-400">APY:</span>
                        <span className="text-white ml-1 font-medium">{protocol.apy}%</span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-400">TVL:</span>
                      <span className="text-white ml-1 font-medium">{protocol.tvl}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Fee:</span>
                      <span className="text-white ml-1 font-medium">{protocol.fee}</span>
                    </div>
                    {protocol.isAudited && (
                      <div className="flex items-center gap-1">
                        <span className="text-green-400">✓</span>
                        <span className="text-slate-400 text-xs">
                          Audited by {protocol.auditors.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                {protocol.id === selectedId ? (
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                ) : (
                  <div className="w-6 h-6 border-2 border-slate-600 rounded-full" />
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

interface ProtocolComparisonTableProps {
  protocols: Protocol[];
  selectedId?: string;
  onSelect: (protocolId: string) => void;
}

function ProtocolComparisonTable({ protocols, selectedId, onSelect }: ProtocolComparisonTableProps) {
  return (
    <div className="p-6 overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left text-slate-400 text-sm font-medium pb-3">Protocol</th>
            {protocols[0]?.apy !== undefined && (
              <th className="text-center text-slate-400 text-sm font-medium pb-3">APY</th>
            )}
            <th className="text-center text-slate-400 text-sm font-medium pb-3">TVL</th>
            <th className="text-center text-slate-400 text-sm font-medium pb-3">Fee</th>
            <th className="text-center text-slate-400 text-sm font-medium pb-3">Security</th>
            <th className="text-center text-slate-400 text-sm font-medium pb-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {protocols.map((protocol) => (
            <tr
              key={protocol.id}
              className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
            >
              <td className="py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-xl">
                    {protocol.logo}
                  </div>
                  <div>
                    <div className="text-white font-medium">{protocol.name}</div>
                    <div className="text-slate-400 text-xs">{protocol.type}</div>
                  </div>
                </div>
              </td>
              {protocol.apy !== undefined && (
                <td className="text-center text-white">{protocol.apy}%</td>
              )}
              <td className="text-center text-white">{protocol.tvl}</td>
              <td className="text-center text-white">{protocol.fee}</td>
              <td className="text-center">
                <span className="text-white">{protocol.securityRating}</span>
                <span className="text-green-400 ml-1">✓</span>
              </td>
              <td className="text-center">
                <button
                  onClick={() => onSelect(protocol.id)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    protocol.id === selectedId
                      ? 'bg-green-500 text-white'
                      : 'bg-purple-500 hover:bg-purple-600 text-white'
                  }`}
                >
                  {protocol.id === selectedId ? 'Selected' : 'Select'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
