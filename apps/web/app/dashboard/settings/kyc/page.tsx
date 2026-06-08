'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { UnifiedKycManager } from '@/components/kyc';

export default function KycSettingsPage() {
  const [address, setAddress] = useState<string | undefined>();

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

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link href="/dashboard/settings" className="flex items-center space-x-2 text-slate-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Settings</span>
        </Link>

        {/* Header */}
        <motion.div className="mb-8" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Shield className="w-8 h-8 text-purple-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Identity Verification</h1>
              <p className="text-slate-400 mt-1">
                Build trust with zero-knowledge proofs
              </p>
            </div>
          </div>
        </motion.div>

        {/* KYC Manager */}
        <motion.div
          className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <UnifiedKycManager address={address} />
        </motion.div>

        {/* Info Section */}
        <motion.div
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm font-semibold text-blue-100 mb-2">🔐 Privacy</p>
            <p className="text-xs text-blue-100/70">
              Your personal data is encrypted and never shared with third parties.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-sm font-semibold text-green-100 mb-2">✓ Security</p>
            <p className="text-xs text-green-100/70">
              All verifications use blockchain-secured, zero-knowledge proofs.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <p className="text-sm font-semibold text-purple-100 mb-2">🎯 Benefits</p>
            <p className="text-xs text-purple-100/70">
              Unlock premium features and higher transaction limits.
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
