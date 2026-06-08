'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UnifiedKycManager } from '@/components/kyc';

export default function OnboardingKycPage() {
  const router = useRouter();
  const [address, setAddress] = useState<string | undefined>();
  const [kycStatus, setKycStatus] = useState<any>(null);

  useEffect(() => {
    const getAddress = async () => {
      try {
        const addressFromStorage = localStorage.getItem('walletAddress');
        if (addressFromStorage) {
          setAddress(addressFromStorage);
        }
      } catch (error) {
        console.error('Failed to get address:', error);
      }
    };

    getAddress();
  }, []);

  const handleSkip = () => {
    router.push('/dashboard');
  };

  const handleComplete = () => {
    if (kycStatus?.passport?.verified || kycStatus?.zkyc?.verified) {
      router.push('/dashboard');
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 p-6 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="w-full max-w-3xl">
        {/* Skip Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={handleSkip}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <motion.div variants={container} initial="hidden" animate="show">
          {/* Header */}
          <motion.div variants={item} className="mb-8">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500/20 rounded-lg">
                <Shield className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Verify Your Identity</h1>
                <p className="text-slate-400 mt-2">
                  Build trust with zero-knowledge proofs (optional)
                </p>
              </div>
            </div>
          </motion.div>

          {/* Benefits */}
          <motion.div variants={item} className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: '🔐',
                title: 'Privacy Protected',
                description: 'Zero personal data shared',
              },
              {
                icon: '⚡',
                title: 'Advanced Features',
                description: 'Unlock premium capabilities',
              },
              {
                icon: '🌐',
                title: 'Multi-Chain',
                description: 'Use your proof anywhere',
              },
            ].map((benefit, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 transition-colors"
              >
                <p className="text-2xl mb-2">{benefit.icon}</p>
                <p className="font-semibold text-white text-sm">{benefit.title}</p>
                <p className="text-xs text-slate-400 mt-1">{benefit.description}</p>
              </div>
            ))}
          </motion.div>

          {/* KYC Manager */}
          <motion.div
            variants={item}
            className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 mb-8"
          >
            <UnifiedKycManager
              address={address}
              onStatusChange={(status) => setKycStatus(status)}
            />
          </motion.div>

          {/* Actions */}
          <motion.div variants={item} className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleComplete}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all active:scale-95 flex items-center justify-center space-x-2"
            >
              <span>Continue to Dashboard</span>
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={handleSkip}
              className="px-6 py-3 border border-slate-600 text-slate-300 font-medium rounded-lg hover:bg-slate-800 transition-colors"
            >
              Skip for Now
            </button>
          </motion.div>

          {/* Footer */}
          <motion.p variants={item} className="text-center text-xs text-slate-500 mt-6">
            You can verify your identity anytime in Settings
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
}
