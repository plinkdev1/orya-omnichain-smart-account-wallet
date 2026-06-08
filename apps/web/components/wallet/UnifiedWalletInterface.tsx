'use client';

import { useOnboardingStore } from '@/lib/onboarding-store';
import { WalletRouter, WalletType } from '@/lib/wallet/wallet-router';
import { usePrivy } from '@privy-io/react-auth';
import { motion } from 'framer-motion';
import { Wallet, Settings, LogOut, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export function UnifiedWalletInterface() {
  const { selectedWalletType, walletAddress, displayName } = useOnboardingStore();
  const { logout, user } = usePrivy();
  const [copied, setCopied] = useState(false);

  if (!selectedWalletType) return null;

  const config = WalletRouter.getWalletConfig(selectedWalletType);
  const enabledFeatures = config.features.filter(f => f.enabled);

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const walletTypeDisplay = {
    [WalletType.NORMIE]: { label: 'Beginner', color: 'bg-blue-500/20 text-blue-400' },
    [WalletType.POWER_USER]: { label: 'Power User', color: 'bg-purple-500/20 text-purple-400' },
    [WalletType.EOA]: { label: 'Imported', color: 'bg-indigo-500/20 text-indigo-400' },
    [WalletType.INSTITUTIONAL]: { label: 'Enterprise', color: 'bg-emerald-500/20 text-emerald-400' },
  };

  const display = walletTypeDisplay[selectedWalletType];

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Wallet Card */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur rounded-2xl border border-purple-500/20 p-6 mb-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Your Wallet</h3>
            </div>
            <p className="text-sm text-purple-300/60">
              {displayName || user?.email?.address || 'Connected Wallet'}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${display.color}`}>
            {display.label}
          </span>
        </div>

        {/* Wallet Info */}
        {walletAddress && (
          <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
            <div className="text-xs text-purple-300/60 mb-2">Wallet Address</div>
            <div className="flex items-center gap-2">
              <code className="font-mono text-sm text-white truncate">
                {walletAddress.substring(0, 6)}...{walletAddress.substring(-4)}
              </code>
              <button
                onClick={handleCopyAddress}
                className="p-2 hover:bg-purple-500/20 rounded transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-purple-400" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mb-6">
          <div className="text-xs font-semibold text-purple-300 mb-3 uppercase">
            Enabled Features
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {enabledFeatures.map(feature => (
              <motion.div
                key={feature.id}
                className="px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-xs font-medium text-purple-300 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
              >
                {feature.name}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Provider Info */}
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-6">
          <div className="text-xs text-blue-300">
            <span className="font-semibold">Provider:</span> {config.provider === 'privy' ? 'Privy' : 'Dynamic.xyz'}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Wallet Type Details */}
      <motion.div
        className="bg-slate-800/30 backdrop-blur rounded-xl border border-purple-500/10 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="text-sm text-purple-300/70">
          <p className="font-semibold mb-2">Wallet Configuration</p>
          <ul className="space-y-1 text-xs">
            <li>• Type: <span className="text-purple-300">{selectedWalletType}</span></li>
            <li>• Provider: <span className="text-purple-300">{config.provider}</span></li>
            <li>• Multi-Chain: <span className="text-purple-300">{config.features.some(f => f.id === 'multichain') ? 'Yes' : 'No'}</span></li>
            <li>• MPC Enabled: <span className="text-purple-300">{config.enableMPC ? 'Yes' : 'No'}</span></li>
            <li>• Smart Accounts: <span className="text-purple-300">{config.enableSmartAccount ? 'Yes' : 'No'}</span></li>
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
}
