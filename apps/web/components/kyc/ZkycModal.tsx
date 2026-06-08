'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Check,
  X,
  ExternalLink,
  AlertCircle,
  Loader,
  CheckCircle,
} from 'lucide-react';
import { ZkycClient } from '@/lib/kyc/zkyc';
import type { ZkycVerification } from '@/lib/kyc/zkyc';

interface ZkycModalProps {
  isOpen: boolean;
  onClose: () => void;
  address?: string;
  onVerified?: (verification: ZkycVerification) => void;
}

export function ZkycModal({ isOpen, onClose, address, onVerified }: ZkycModalProps) {
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState<ZkycVerification | null>(null);
  const [step, setStep] = useState<'info' | 'verifying' | 'result'>('info');
  const [error, setError] = useState<string | null>(null);

  const client = new ZkycClient();

  useEffect(() => {
    if (isOpen && address && step === 'info') {
      checkVerificationStatus();
    }
  }, [isOpen, address]);

  const checkVerificationStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await client.getVerificationStatus(address || 'user');
      setVerification(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check status');
    } finally {
      setLoading(false);
    }
  };

  const startKyc = async () => {
    if (!client.isConfigured()) {
      setError('zKYC not properly configured. Please contact support.');
      return;
    }

    setStep('verifying');
    setLoading(true);
    setError(null);

    try {
      const result = await client.initiateKycProcess(
        address || 'user',
        address || '0x',
        'sumsub'
      );

      setTimeout(() => {
        window.open(result.redirectUrl, '_blank');
      }, 1000);

      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate KYC');
      setStep('info');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'text-green-500';
      case 'rejected':
        return 'text-red-500';
      case 'pending':
        return 'text-yellow-500';
      default:
        return 'text-slate-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'verified':
        return '✓ Verified';
      case 'rejected':
        return '✗ Rejected';
      case 'pending':
        return '⏳ Pending';
      default:
        return '○ Not Started';
    }
  };

  const getLevelBadge = (level: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      none: { label: 'None', color: 'bg-slate-600' },
      basic: { label: 'Basic', color: 'bg-blue-600' },
      advanced: { label: 'Advanced', color: 'bg-purple-600' },
      professional: { label: 'Professional', color: 'bg-amber-600' },
    };
    return badges[level] || badges.none;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          className="w-full max-w-2xl bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Shield className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Regulatory KYC Verification</h2>
                <p className="text-sm text-slate-400">Get your Soulbound Token</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-500 font-medium">Error</p>
                  <p className="text-red-400 text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            {step === 'info' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <Loader className="w-10 h-10 text-amber-500 animate-spin" />
                    <p className="text-slate-300">Checking verification status...</p>
                  </div>
                ) : (
                  <>
                    {/* Current Status */}
                    {verification && (
                      <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wide">Status</p>
                            <p className={`text-lg font-bold mt-1 ${getStatusColor(verification.status)}`}>
                              {getStatusLabel(verification.status)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wide">Level</p>
                            <div className="mt-1">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-sm font-medium text-white ${getLevelBadge(verification.level).color}`}
                              >
                                {getLevelBadge(verification.level).label}
                              </span>
                            </div>
                          </div>
                          {verification.sbt_minted && (
                            <div className="col-span-2">
                              <p className="text-xs text-slate-400 uppercase tracking-wide">
                                Soulbound Token
                              </p>
                              <p className="text-green-500 font-mono text-sm mt-1">
                                {verification.sbt_id?.slice(0, 10)}...
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-blue-100 text-sm">
                        Complete a comprehensive KYC verification to receive a non-transferable
                        Soulbound Token (SBT) on the blockchain. This enables access to exclusive
                        features and institutional-grade trading.
                      </p>
                    </div>

                    {/* Features */}
                    <div className="mb-6">
                      <p className="text-sm font-semibold text-white mb-3">What you'll get:</p>
                      <ul className="space-y-2">
                        {[
                          'Non-transferable Soulbound Token (SBT)',
                          'Verified status on-chain',
                          'Access to institutional features',
                          'Higher transaction limits',
                        ].map((feature, idx) => (
                          <li key={idx} className="flex items-center space-x-2 text-sm text-slate-300">
                            <Check className="w-4 h-4 text-green-500" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA */}
                    {(!verification || verification.status !== 'verified') && (
                      <button
                        onClick={startKyc}
                        disabled={loading}
                        className="w-full px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-medium rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all active:scale-95 disabled:opacity-50"
                      >
                        Start KYC Verification
                      </button>
                    )}

                    {verification?.status === 'verified' && (
                      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-green-100 font-medium">Verification Complete</p>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {step === 'verifying' && (
              <motion.div
                className="flex flex-col items-center justify-center py-12 space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Loader className="w-12 h-12 text-amber-500 animate-spin" />
                <p className="text-slate-300">Opening verification portal...</p>
                <p className="text-xs text-slate-500">
                  Complete the process in the new window to proceed
                </p>
              </motion.div>
            )}

            {step === 'result' && (
              <motion.div
                className="flex flex-col items-center justify-center py-12 space-y-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <CheckCircle className="w-16 h-16 text-amber-500" />
                <div className="text-center">
                  <p className="text-lg font-semibold text-white">Verification Started</p>
                  <p className="text-sm text-slate-400 mt-2">
                    Please complete the KYC process in the verification window. Once approved,
                    your Soulbound Token will be automatically minted.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setStep('info');
                    checkVerificationStatus();
                  }}
                  className="mt-4 px-6 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Check Status
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
