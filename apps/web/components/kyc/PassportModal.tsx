'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Check, X, ExternalLink, AlertCircle, Loader } from 'lucide-react';
import { HumanPassportClient } from '@/lib/kyc/human-passport';

interface PassportModalProps {
  isOpen: boolean;
  onClose: () => void;
  address?: string;
  onVerified?: (score: number) => void;
}

export function PassportModal({ isOpen, onClose, address, onVerified }: PassportModalProps) {
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState<number>(0);
  const [status, setStatus] = useState<'DONE' | 'PROCESSING' | 'ERROR'>('DONE');
  const [stampCount, setStampCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const client = new HumanPassportClient();

  useEffect(() => {
    if (isOpen && address) {
      loadPassportData();
    }
  }, [isOpen, address]);

  const loadPassportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const scoreData = await client.getScore(address!);
      setScore(scoreData.score);
      setStatus(scoreData.status);
      setStampCount(scoreData.stamps?.length || 0);
      onVerified?.(scoreData.score);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load passport data');
      console.error('Failed to load passport:', err);
    } finally {
      setLoading(false);
    }
  };

  const openPassportApp = () => {
    window.open('https://passport.gitcoin.co', '_blank');
  };

  const getScoreBadgeClass = () => {
    if (score >= 50) return 'bg-green-500/20 text-green-600 border-green-200';
    if (score >= 20) return 'bg-yellow-500/20 text-yellow-600 border-yellow-200';
    return 'bg-red-500/20 text-red-600 border-red-200';
  };

  const getScoreLabel = () => {
    if (score >= 50) return 'High Trust';
    if (score >= 20) return 'Medium Trust';
    return 'Low Trust';
  };

  const getScoreIcon = () => {
    if (score >= 50) return '🟢';
    if (score >= 20) return '🟡';
    return '🔴';
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
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Shield className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Human Network Passport</h2>
                <p className="text-sm text-slate-400">Proof of Humanity Score</p>
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
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader className="w-12 h-12 text-purple-500 animate-spin" />
                <p className="text-slate-400">Loading your passport data...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-500 font-medium">Error Loading Passport</p>
                  <p className="text-red-400 text-sm mt-1">{error}</p>
                </div>
              </div>
            ) : (
              <>
                {/* Score Display */}
                <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-xl mb-6">
                  <div className="text-center">
                    <p className="text-sm text-slate-400 mb-2">Your Humanity Score</p>
                    <div className="flex items-center justify-center space-x-4 mb-4">
                      <div className={`inline-flex items-center justify-center rounded-full border-2 p-4 ${getScoreBadgeClass()}`}>
                        <span className="text-4xl font-bold">{score}</span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-2xl">{getScoreIcon()}</span>
                          <span className="text-lg font-semibold text-white">{getScoreLabel()}</span>
                        </div>
                        <p className="text-sm text-slate-400">{stampCount} stamps collected</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Info */}
                <div className="mb-6 p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
                  <p className="text-sm text-slate-300">
                    {score >= 50 && (
                      <>
                        <Check className="w-4 h-4 inline text-green-500 mr-2" />
                        Your passport meets high trust standards
                      </>
                    )}
                    {score >= 20 && score < 50 && (
                      <>
                        <AlertCircle className="w-4 h-4 inline text-yellow-500 mr-2" />
                        Add more stamps to increase your score
                      </>
                    )}
                    {score < 20 && (
                      <>
                        <AlertCircle className="w-4 h-4 inline text-red-500 mr-2" />
                        Start collecting stamps to build your passport
                      </>
                    )}
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-center">
                    <p className="text-sm text-slate-400">Stamps</p>
                    <p className="text-2xl font-bold text-white mt-1">{stampCount}</p>
                  </div>
                  <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-center">
                    <p className="text-sm text-slate-400">Score</p>
                    <p className="text-2xl font-bold text-purple-500 mt-1">{score}</p>
                  </div>
                  <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-center">
                    <p className="text-sm text-slate-400">Status</p>
                    <p className="text-xs font-bold text-blue-500 mt-1 uppercase">{status}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-3">
                  <button
                    onClick={openPassportApp}
                    className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all active:scale-95"
                  >
                    <span>Add More Stamps</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={loadPassportData}
                    className="px-4 py-2 border border-slate-600 text-slate-300 font-medium rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    Refresh Score
                  </button>
                </div>

                {/* Info */}
                <p className="text-xs text-slate-500 mt-4 text-center">
                  Visit Gitcoin Passport to collect social and web3 stamps
                </p>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
