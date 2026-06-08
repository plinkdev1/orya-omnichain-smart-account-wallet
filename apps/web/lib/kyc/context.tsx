'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { KycStatus } from '@/components/kyc/UnifiedKycManager';
import { HumanPassportClient } from './human-passport';
import { ZkycClient } from './zkyc';

interface KycContextType {
  address: string | null;
  kycStatus: KycStatus | null;
  loading: boolean;
  error: string | null;
  setAddress: (address: string) => void;
  refreshKycStatus: () => Promise<void>;
  isVerified: boolean;
  verificationLevel: 'anonymous' | 'verified' | 'trusted' | 'institutional';
}

const KycContext = createContext<KycContextType | undefined>(undefined);

export function KycProvider({ children, initialAddress }: { children: React.ReactNode; initialAddress?: string }) {
  const [address, setAddress] = useState<string | null>(initialAddress || null);
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passportClient = new HumanPassportClient();
  const zkycClient = new ZkycClient();

  const determineVerificationLevel = useCallback((status: KycStatus) => {
    if (status.zkyc.level === 'professional') {
      return 'institutional' as const;
    }
    if (status.zkyc.level === 'advanced' && status.passport.score >= 50) {
      return 'trusted' as const;
    }
    if (status.passport.score >= 20) {
      return 'verified' as const;
    }
    return 'anonymous' as const;
  }, []);

  const refreshKycStatus = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    setError(null);

    try {
      const [passportScore, zkycStatus] = await Promise.all([
        passportClient.getScore(address),
        zkycClient.getVerificationStatus(address),
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

      setKycStatus(newStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh KYC status');
    } finally {
      setLoading(false);
    }
  }, [address, passportClient, zkycClient]);

  useEffect(() => {
    if (address && !kycStatus) {
      refreshKycStatus();
    }
  }, [address, kycStatus, refreshKycStatus]);

  const isVerified = kycStatus ? kycStatus.passport.score >= 20 || kycStatus.zkyc.verified : false;
  const verificationLevel = kycStatus ? determineVerificationLevel(kycStatus) : 'anonymous';

  const value: KycContextType = {
    address,
    kycStatus,
    loading,
    error,
    setAddress,
    refreshKycStatus,
    isVerified,
    verificationLevel,
  };

  return <KycContext.Provider value={value}>{children}</KycContext.Provider>;
}

export function useKyc() {
  const context = useContext(KycContext);
  if (context === undefined) {
    throw new Error('useKyc must be used within KycProvider');
  }
  return context;
}
