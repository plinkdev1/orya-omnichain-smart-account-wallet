'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';
import { WalletType, WalletRouter } from '@/lib/wallet/wallet-router';
import { ChevronRight, ChevronLeft, CheckCircle, Loader2, Shield, Zap, Lock, Layers, Award } from 'lucide-react';

type Step = 'welcome' | 'features' | 'wallet' | 'security' | 'complete';

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  recommended?: boolean;
}

const features: FeatureCard[] = [
  {
    id: 'mpc',
    title: 'MPC Security',
    description: 'Multi-party computation for enhanced security',
    icon: <Shield className="w-6 h-6" />,
    recommended: true,
  },
  {
    id: 'smart_account',
    title: 'Smart Account',
    description: 'ERC-4337 smart contract wallet',
    icon: <Zap className="w-6 h-6" />,
    recommended: true,
  },
  {
    id: 'hardware_wallet',
    title: 'Hardware Wallet',
    description: 'Support for Ledger & Trezor',
    icon: <Lock className="w-6 h-6" />,
  },
  {
    id: 'zklogin',
    title: 'zkLogin',
    description: 'Zero-knowledge login',
    icon: <Award className="w-6 h-6" />,
  },
];

export default function PowerUserOnboarding() {
  const router = useRouter();
  const { selectedWalletType, setFeature, setStep: setOnboardingStep, setWalletCreated, setAuthenticated } = useOnboardingStore();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['mpc', 'smart_account']);
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    if (selectedWalletType !== WalletType.POWER_USER) {
      router.push('/onboarding/wallet-type');
    }
  }, [selectedWalletType, router]);

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(prev =>
      prev.includes(featureId)
        ? prev.filter(f => f !== featureId)
        : [...prev, featureId]
    );
  };

  const handleNext = async () => {
    if (currentStep === 'welcome') {
      setCurrentStep('features');
    } else if (currentStep === 'features') {
      selectedFeatures.forEach(f => setFeature(f, true));
      setCurrentStep('wallet');
    } else if (currentStep === 'wallet') {
      setIsLoading(true);
      await new Promise(r => setTimeout(r, 2000));
      setWalletAddress('0x' + '0'.repeat(40));
      setIsLoading(false);
      setCurrentStep('security');
    } else if (currentStep === 'security') {
      setCurrentStep('complete');
      setWalletCreated(true);
      setAuthenticated(true, 'dynamic');
      setOnboardingStep(5);
      setTimeout(() => router.push('/dashboard'), 2000);
    }
  };

  const handleBack = () => {
    if (currentStep === 'welcome') return;
    const steps: Step[] = ['welcome', 'features', 'wallet', 'security', 'complete'];
    const currentIdx = steps.indexOf(currentStep);
    if (currentIdx > 0) {
      setCurrentStep(steps[currentIdx - 1]);
    }
  };

  const stepConfig = {
    welcome: { number: 1, title: 'Welcome', subtitle: 'Power User Setup' },
    features: { number: 2, title: 'Features', subtitle: 'Select Advanced Features' },
    wallet: { number: 3, title: 'Wallet', subtitle: 'Create Your Wallet' },
    security: { number: 4, title: 'Security', subtitle: 'Set Up Security' },
    complete: { number: 5, title: 'Complete', subtitle: 'All Set!' },
  };

  const config = stepConfig[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4, 5].map((num, idx) => (
              <motion.div key={num} className="flex items-center flex-1">
                <motion.div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    num < config.number
                      ? 'bg-green-500 text-white'
                      : num === config.number
                      ? 'bg-purple-500 text-white ring-2 ring-purple-400'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                >
                  {num < config.number ? <CheckCircle className="w-5 h-5" /> : num}
                </motion.div>
                {idx < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-colors ${
                      num < config.number ? 'bg-green-500' : 'bg-slate-700'
                    }`}
                  />
                )}
              </motion.div>
            ))}
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">{config.title}</h2>
            <p className="text-purple-300 text-sm">{config.subtitle}</p>
          </div>
        </motion.div>

        {/* Welcome Step */}
        {currentStep === 'welcome' && (
          <motion.div
            className="bg-slate-900/50 backdrop-blur rounded-2xl border border-purple-500/20 p-12 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Layers className="w-16 h-16 text-purple-400 mx-auto mb-6" />
            <h3 className="text-3xl font-bold text-white mb-4">Welcome, Power User</h3>
            <p className="text-lg text-purple-300 mb-8 max-w-md mx-auto">
              You're about to access advanced features including multi-chain support, MPC security, and smart accounts.
            </p>
            <div className="grid grid-cols-3 gap-4 my-12">
              {[
                { label: '9 Chains', icon: '🔗' },
                { label: 'MPC Security', icon: '🔐' },
                { label: 'Smart Accounts', icon: '⚡' },
              ].map((feature, i) => (
                <div key={i} className="p-4 bg-purple-500/10 rounded-lg">
                  <div className="text-3xl mb-2">{feature.icon}</div>
                  <div className="text-sm text-purple-300">{feature.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Features Step */}
        {currentStep === 'features' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {features.map((feature, idx) => (
                <motion.button
                  key={feature.id}
                  onClick={() => toggleFeature(feature.id)}
                  className={`relative group p-6 rounded-xl border-2 transition-all ${
                    selectedFeatures.includes(feature.id)
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-purple-500/30 bg-slate-900/50'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-purple-400">{feature.icon}</div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-white">{feature.title}</h4>
                        {feature.recommended && (
                          <span className="text-xs bg-purple-600/50 text-purple-200 px-2 py-1 rounded">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-purple-300/70">{feature.description}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedFeatures.includes(feature.id)}
                      onChange={() => {}}
                      className="w-5 h-5 rounded border-purple-500 text-purple-600 focus:ring-purple-500"
                    />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Wallet Creation Step */}
        {currentStep === 'wallet' && (
          <motion.div
            className="bg-slate-900/50 backdrop-blur rounded-2xl border border-purple-500/20 p-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {!walletAddress ? (
              <>
                <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-2">Creating Your Wallet</h3>
                <p className="text-purple-300">This will only take a moment...</p>
              </>
            ) : (
              <>
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-2">Wallet Created!</h3>
                <div className="bg-slate-800/50 rounded-lg p-4 mt-6 font-mono text-sm text-purple-300 break-all">
                  {walletAddress}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Security Step */}
        {currentStep === 'security' && (
          <motion.div
            className="bg-slate-900/50 backdrop-blur rounded-2xl border border-purple-500/20 p-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h3 className="text-2xl font-bold text-white mb-6">Security Setup</h3>
            <div className="space-y-4">
              {[
                { title: 'Recovery Phrase', desc: 'Save your 12-word recovery phrase in a secure location' },
                { title: 'Biometric Auth', desc: 'Enable fingerprint or face recognition' },
                { title: 'Backup Wallet', desc: 'Create a backup for account recovery' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="p-4 bg-purple-500/10 rounded-lg flex items-start gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold text-white">{item.title}</div>
                    <div className="text-sm text-purple-300/70">{item.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Complete Step */}
        {currentStep === 'complete' && (
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
            <h3 className="text-3xl font-bold text-white mb-3">All Set!</h3>
            <p className="text-purple-300 mb-4">Your power user wallet is ready to explore the full potential of Web3</p>
            <p className="text-sm text-purple-300/60">Redirecting to dashboard...</p>
          </motion.div>
        )}

        {/* Navigation */}
        <motion.div
          className="flex items-center justify-between mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={handleBack}
            disabled={currentStep === 'welcome'}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-purple-300 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Next <ChevronRight className="w-5 h-5" /></>}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
