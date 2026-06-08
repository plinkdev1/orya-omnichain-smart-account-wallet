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
import { ZkPassClient } from '@/lib/kyc/zkpass';

interface ZkPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  address?: string;
  onVerified?: (verified: boolean) => void;
}

export function ZkPassModal({ isOpen, onClose, address, onVerified }: ZkPassModalProps) {
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [step, setStep] = useState<'options' | 'verifying' | 'result'>('options');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const client = new ZkPassClient();

  const verificationTypes = [
    {
      id: 'age',
      label: 'Age Verification',
      description: 'Prove you are 18+ without revealing your exact age',
      icon: '📅',
    },
    {
      id: 'income',
      label: 'Income Verification',
      description: 'Verify income level without revealing specific amount',
      icon: '💰',
    },
    {
      id: 'creditScore',
      label: 'Credit Score',
      description: 'Prove creditworthiness without revealing exact score',
      icon: '📊',
    },
    {
      id: 'education',
      label: 'Education Credentials',
      description: 'Verify degrees and certifications privately',
      icon: '🎓',
    },
    {
      id: 'employment',
      label: 'Employment Status',
      description: 'Prove employment without revealing employer details',
      icon: '💼',
    },
  ];

  const startVerification = async (type: string) => {
    if (!client.validateAppId()) {
      setError('zkPass not properly configured. Please check API keys.');
      return;
    }

    setSelectedType(type);
    setStep('verifying');
    setLoading(true);
    setError(null);

    try {
      const result = await client.initiateVerification(
        address || 'user',
        `schema_${type}`
      );
      console.log('Verification initiated:', result);
      setStep('result');
      setVerified(true);
      onVerified?.(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      setStep('options');
    } finally {
      setLoading(false);
    }
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
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Shield className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Zero-Knowledge Verification</h2>
                <p className="text-sm text-slate-400">zkPass - Verify without revealing data</p>
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

            {step === 'options' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-slate-300 mb-6">
                  Choose what you'd like to verify. Your personal data remains completely private.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {verificationTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => startVerification(type.id)}
                      disabled={loading}
                      className="p-4 border border-slate-700 rounded-lg hover:border-blue-500 hover:bg-slate-800/50 transition-all text-left group disabled:opacity-50"
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{type.icon}</span>
                        <div className="flex-1">
                          <p className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                            {type.label}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">{type.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <p className="text-xs text-slate-500 mt-6 text-center">
                  Powered by zkPass - Zero-Knowledge Proof Technology
                </p>
              </motion.div>
            )}

            {step === 'verifying' && (
              <motion.div
                className="flex flex-col items-center justify-center py-12 space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Loader className="w-12 h-12 text-blue-500 animate-spin" />
                <p className="text-slate-300">Initiating verification...</p>
                <p className="text-xs text-slate-500">
                  You will be redirected to complete the verification process
                </p>
              </motion.div>
            )}

            {step === 'result' && verified && (
              <motion.div
                className="flex flex-col items-center justify-center py-12 space-y-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <CheckCircle className="w-16 h-16 text-green-500" />
                <div className="text-center">
                  <p className="text-lg font-semibold text-white">Verification Started</p>
                  <p className="text-sm text-slate-400 mt-2">
                    Complete the verification process in the new window. Your proof will be
                    stored securely.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setStep('options');
                    setVerified(false);
                    setSelectedType(null);
                  }}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Back to Options
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
