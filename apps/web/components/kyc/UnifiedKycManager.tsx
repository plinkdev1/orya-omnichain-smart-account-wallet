'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Lock, 
  Award, 
  ChevronRight, 
  AlertCircle 
} from 'lucide-react';
import { PassportModal } from './PassportModal';
import { ZkPassModal } from './ZkPassModal';
import { ZkycModal } from './ZkycModal';
import { HumanPassportClient } from '@/lib/kyc/human-passport';
import { ZkPassClient } from '@/lib/kyc/zkpass';
import { ZkycClient } from '@/lib/kyc/zkyc';
import type { ZkycVerification } from '@/lib/kyc/zkyc';

interface KycStatus {
  passport: {
    verified: boolean;
    score: number;
    label: string;
  };
  zkpass: {
    verified: boolean;
    types: string[];
  };
  zkyc: {
    verified: boolean;
    level: string;
    sbt_minted: boolean;
  };
}

interface UnifiedKycManagerProps {
  address?: string;
  onStatusChange?: (status: KycStatus) => void;
}

export function UnifiedKycManager({ address, onStatusChange }: UnifiedKycManagerProps) {
  const [status, setStatus] = useState<KycStatus>({
    passport: { verified: false, score: 0, label: 'Unverified' },
    zkpass: { verified: false, types: [] },
    zkyc: { verified: false, level: 'none', sbt_minted: false },
  });

  const [activeModal, setActiveModal] = useState<'passport' | 'zkpass' | 'zkyc' | null>(null);
  const [loading, setLoading] = useState(true);

  const passportClient = new HumanPassportClient();
  const zkpassClient = new ZkPassClient();
  const zkycClient = new ZkycClient();

  useEffect(() => {
    if (address) {
      loadAllStatuses();
    }
  }, [address]);

  const loadAllStatuses = async () => {
    setLoading(true);
    try {
      const [passportScore, zkycStatus] = await Promise.all([
        passportClient.getScore(address || 'user'),
        zkycClient.getVerificationStatus(address || 'user'),
      ]);

      const newStatus: KycStatus = {
        passport: {
          verified: passportScore.score >= 20,
          score: passportScore.score,
          label: passportClient.getScoreLabel(passportScore.score),
        },
        zkpass: {
          verified: false,
          types: [],
        },
        zkyc: {
          verified: zkycStatus.verified,
          level: zkycStatus.level,
          sbt_minted: zkycStatus.sbt_minted,
        },
      };

      setStatus(newStatus);
      onStatusChange?.(newStatus);
    } catch (error) {
      console.error('Failed to load KYC statuses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePassportVerified = (score: number) => {
    setStatus((prev) => ({
      ...prev,
      passport: {
        verified: score >= 20,
        score,
        label: passportClient.getScoreLabel(score),
      },
    }));
  };

  const handleZkycVerified = (verification: ZkycVerification) => {
    setStatus((prev) => ({
      ...prev,
      zkyc: {
        verified: verification.verified,
        level: verification.level,
        sbt_minted: verification.sbt_minted,
      },
    }));
  };

  const KycCard = ({
    icon: Icon,
    title,
    description,
    status: cardStatus,
    onClick,
    badge,
  }: {
    icon: React.ComponentType<any>;
    title: string;
    description: string;
    status: boolean;
    onClick: () => void;
    badge?: string;
  }) => (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -4 }}
      className="w-full p-6 rounded-lg border border-slate-700 bg-gradient-to-br from-slate-800/50 to-slate-900/50 hover:border-slate-600 transition-all text-left group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 bg-slate-700 rounded-lg group-hover:bg-slate-600 transition-colors">
          <Icon className="w-6 h-6 text-slate-300 group-hover:text-white transition-colors" />
        </div>
        <div className="flex items-center space-x-2">
          {cardStatus && <div className="w-2 h-2 bg-green-500 rounded-full" />}
          {badge && (
            <span className="px-2 py-1 text-xs font-medium bg-amber-500/20 text-amber-200 rounded-full">
              {badge}
            </span>
          )}
        </div>
      </div>

      <div className="mb-3">
        <h3 className="font-semibold text-white text-lg">{title}</h3>
        <p className="text-sm text-slate-400 mt-1">{description}</p>
      </div>

      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium uppercase ${cardStatus ? 'text-green-500' : 'text-slate-400'}`}>
          {cardStatus ? '✓ Verified' : '○ Not Verified'}
        </span>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-300 transition-colors" />
      </div>
    </motion.button>
  );

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-white">Identity Verification</h2>
          </div>
          <p className="text-sm text-slate-400">
            Choose one or more verification methods to unlock features and build trust
          </p>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Human Passport</p>
            <div className="mt-2 flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{status.passport.score}</p>
                <p className={`text-xs mt-1 ${status.passport.verified ? 'text-green-500' : 'text-slate-400'}`}>
                  {status.passport.label}
                </p>
              </div>
              {status.passport.verified && (
                <Award className="w-5 h-5 text-green-500" />
              )}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700">
            <p className="text-xs text-slate-400 uppercase tracking-wide">zkPass</p>
            <div className="mt-2 flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{status.zkpass.types.length}</p>
                <p className="text-xs text-slate-400 mt-1">Verifications</p>
              </div>
              {status.zkpass.verified && (
                <Lock className="w-5 h-5 text-blue-500" />
              )}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700">
            <p className="text-xs text-slate-400 uppercase tracking-wide">zKYC</p>
            <div className="mt-2 flex items-end justify-between">
              <div>
                <p className="text-sm font-bold text-white capitalize">{status.zkyc.level}</p>
                <p className={`text-xs mt-1 ${status.zkyc.sbt_minted ? 'text-purple-500' : 'text-slate-400'}`}>
                  {status.zkyc.sbt_minted ? 'SBT Minted' : 'Unverified'}
                </p>
              </div>
              {status.zkyc.sbt_minted && (
                <Award className="w-5 h-5 text-purple-500" />
              )}
            </div>
          </div>
        </div>

        {/* KYC Cards */}
        <div className="space-y-3">
          <KycCard
            icon={Shield}
            title="Human Network Passport"
            description="Prove your humanity with social and web3 stamps"
            status={status.passport.verified}
            onClick={() => setActiveModal('passport')}
            badge={status.passport.score >= 50 ? 'High Trust' : undefined}
          />

          <KycCard
            icon={Lock}
            title="Zero-Knowledge Verification"
            description="Verify credentials privately using zkPass proofs"
            status={status.zkpass.verified}
            onClick={() => setActiveModal('zkpass')}
          />

          <KycCard
            icon={Award}
            title="Regulatory KYC"
            description="Get verified with regulatory compliance and receive an SBT"
            status={status.zkyc.verified}
            onClick={() => setActiveModal('zkyc')}
            badge={status.zkyc.sbt_minted ? 'SBT' : undefined}
          />
        </div>

        {/* Info Box */}
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-100">
            <p className="font-medium">Privacy First</p>
            <p className="mt-1">
              All verifications use zero-knowledge proofs. Your personal data is never shared with us
              or third parties.
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700 text-center">
            <div className="inline-block w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" />
            <p className="text-sm text-slate-400 mt-2">Loading verification status...</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <PassportModal
        isOpen={activeModal === 'passport'}
        onClose={() => setActiveModal(null)}
        address={address}
        onVerified={handlePassportVerified}
      />

      <ZkPassModal
        isOpen={activeModal === 'zkpass'}
        onClose={() => setActiveModal(null)}
        address={address}
        onVerified={() => setStatus((prev) => ({ ...prev, zkpass: { ...prev.zkpass, verified: true } }))}
      />

      <ZkycModal
        isOpen={activeModal === 'zkyc'}
        onClose={() => setActiveModal(null)}
        address={address}
        onVerified={handleZkycVerified}
      />
    </>
  );
}
