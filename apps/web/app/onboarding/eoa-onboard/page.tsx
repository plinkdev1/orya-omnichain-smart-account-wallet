'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';
import { Link2, CheckCircle, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

type ImportStep = 'connect' | 'upgrade' | 'success';

export default function EOAOnboarding() {
  const router = useRouter();
  const { setWalletAddress, setWalletCreated, setStep, setAuthenticated } = useOnboardingStore();
  const [importStep, setImportStep] = useState<ImportStep>('connect');
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [selectedUpgrades, setSelectedUpgrades] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const upgradeOptions = [
    {
      id: 'smart_account',
      title: 'Smart Account',
      description: 'Upgrade to ERC-4337 smart account',
      benefits: ['Gasless transactions', 'Sponsored transactions', 'Batch operations'],
    },
    {
      id: 'mpc_upgrade',
      title: 'MPC Security',
      description: 'Add multi-party computation security',
      benefits: ['Enhanced security', 'Key recovery', 'Threshold signing'],
    },
  ];

  const handleConnect = async () => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    const mockAddress = '0x' + Math.random().toString(16).slice(2, 42);
    setConnectedAddress(mockAddress);
    setWalletAddress(mockAddress);
    setImportStep('upgrade');
    setIsLoading(false);
  };

  const toggleUpgrade = (id: string) => {
    setSelectedUpgrades(prev =>
      prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
    );
  };

  const handleContinue = async () => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setWalletCreated(true);
    setAuthenticated(true, 'dynamic');
    setStep(4);
    setImportStep('success');
    setTimeout(() => router.push('/dashboard'), 2000);
    setIsLoading(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-6">
            <Link2 className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            Import Your Wallet
          </h1>
          <p className="text-lg text-purple-300">
            Connect your existing wallet and unlock enhanced features
          </p>
        </motion.div>

        {/* Connect Step */}
        {importStep === 'connect' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-slate-900/50 backdrop-blur rounded-2xl border border-purple-500/20 p-8 mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">Choose Connection Method</h2>

              <motion.div
                className="space-y-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {[
                  { name: 'MetaMask', icon: '🦊', desc: 'Popular Ethereum wallet' },
                  { name: 'WalletConnect', icon: '🔌', desc: 'Connect any wallet' },
                  { name: 'Coinbase Wallet', icon: '⚛️', desc: 'Coinbase wallet' },
                  { name: 'Ledger', icon: '🔐', desc: 'Hardware wallet' },
                ].map((wallet, idx) => (
                  <motion.button
                    key={wallet.name}
                    variants={itemVariants}
                    onClick={handleConnect}
                    className="w-full p-4 bg-slate-800/50 hover:bg-slate-800 border border-purple-500/20 hover:border-purple-400/50 rounded-lg flex items-center gap-4 transition-all group"
                  >
                    <span className="text-4xl">{wallet.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-white group-hover:text-purple-200">
                        {wallet.name}
                      </div>
                      <div className="text-sm text-purple-300/60">{wallet.desc}</div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                ))}
              </motion.div>

              {/* Loading */}
              {isLoading && (
                <motion.div
                  className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-center gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                  <span className="text-purple-300">Connecting wallet...</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Upgrade Step */}
        {importStep === 'upgrade' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="bg-slate-900/50 backdrop-blur rounded-2xl border border-purple-500/20 p-8 mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Connected!</h2>
              <p className="text-purple-300 mb-6">
                Address: <span className="font-mono text-sm text-purple-400">{connectedAddress}</span>
              </p>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-8 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-300">
                  Your wallet has been imported. Consider upgrading for enhanced features and security.
                </div>
              </div>

              <h3 className="text-lg font-semibold text-white mb-4">Optional Upgrades</h3>

              <motion.div
                className="space-y-4 mb-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {upgradeOptions.map((upgrade, idx) => (
                  <motion.button
                    key={upgrade.id}
                    variants={itemVariants}
                    onClick={() => toggleUpgrade(upgrade.id)}
                    className={`relative group w-full p-6 rounded-xl border-2 transition-all text-left ${
                      selectedUpgrades.includes(upgrade.id)
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-purple-500/30 bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-white mb-1">{upgrade.title}</h4>
                        <p className="text-sm text-purple-300/70 mb-3">{upgrade.description}</p>
                        <ul className="space-y-1">
                          {upgrade.benefits.map((benefit, i) => (
                            <li key={i} className="text-xs text-purple-300/60 flex items-center gap-2">
                              <span className="w-1 h-1 bg-purple-400 rounded-full" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedUpgrades.includes(upgrade.id)}
                        onChange={() => {}}
                        className="w-5 h-5 rounded border-purple-500 text-purple-600"
                      />
                    </div>
                  </motion.button>
                ))}
              </motion.div>

              <p className="text-sm text-purple-300/60 text-center">
                You can enable these features anytime from your settings
              </p>
            </div>
          </motion.div>
        )}

        {/* Success Step */}
        {importStep === 'success' && (
          <motion.div
            className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur rounded-2xl border border-purple-500/30 p-12 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div
              className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <CheckCircle className="w-8 h-8 text-green-400" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-3">Wallet Imported!</h2>
            <p className="text-purple-300 mb-4">
              Your wallet is now enhanced with ORŸA features
            </p>
            <p className="text-sm text-purple-300/60">Redirecting to dashboard...</p>
          </motion.div>
        )}

        {/* Navigation */}
        {importStep !== 'success' && (
          <motion.div
            className="flex items-center justify-between mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={() => {
                if (importStep === 'upgrade') {
                  setImportStep('connect');
                }
              }}
              className="px-6 py-3 bg-slate-800 text-purple-300 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleContinue}
              disabled={!connectedAddress || isLoading}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Continue</>
              )}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
