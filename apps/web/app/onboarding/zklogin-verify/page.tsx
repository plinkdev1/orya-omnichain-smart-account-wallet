'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { ProgressBar } from '@/components/onboarding/ProgressBar';
import { useSuiZkLogin } from '@orya/wallet-core/hooks';
import { useOnboardingStore } from '@/lib/onboardingStore';

interface TempZkLoginData {
  idToken: string;
  provider: 'google' | 'apple' | 'twitch';
  randomness: string;
}

export default function ZkLoginVerifyPage() {
  const router = useRouter();
  const { setStep, setAuthMethod, setFlow } = useOnboardingStore();
  const [tempData, setTempData] = useState<TempZkLoginData | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { handleZkLoginCallback } = useSuiZkLogin({
    clientId: process.env.NEXT_PUBLIC_ZKLOGIN_CLIENT_ID || '',
    redirectUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/onboarding/zklogin-callback`,
  });

  useEffect(() => {
    const verifyZkLogin = async () => {
      try {
        setIsVerifying(true);
        setError(null);

        const stored = sessionStorage.getItem('zklogin_temp');
        if (!stored) {
          setError('No zkLogin session found. Please try again.');
          setIsVerifying(false);
          return;
        }

        const data: TempZkLoginData = JSON.parse(stored);
        setTempData(data);

        const userAddress = `0x${data.randomness.substring(0, 32)}`;

        await handleZkLoginCallback(data.idToken, data.provider, userAddress);

        setAuthMethod('sui_zklogin' as any);
        setFlow('sui_zklogin' as any);
        setStep(4);

        sessionStorage.removeItem('zklogin_temp');

        setTimeout(() => {
          router.push('/onboarding/creating-wallet');
        }, 1500);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Verification failed';
        setError(message);
        setIsVerifying(false);
      }
    };

    verifyZkLogin();
  }, [handleZkLoginCallback, router, setAuthMethod, setFlow, setStep]);

  if (error) {
    return (
      <OnboardingContainer showBackButton onBack={() => router.back()}>
        <div className="min-h-screen py-8 px-4 flex items-center justify-center">
          <div className="max-w-md mx-auto">
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-red-700 dark:text-red-300 mb-2">
                Verification Error
              </h2>
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={() => router.push('/onboarding/auth-method')}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </OnboardingContainer>
    );
  }

  return (
    <OnboardingContainer showBackButton={false}>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-12">
            <ProgressBar currentStep={3} totalSteps={9} style="linear" />
          </div>

          <div className="min-h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full animate-pulse"></div>
                  <div className="absolute inset-2 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-deep-charcoal dark:text-bone-white mb-2">
                Verifying Your Identity
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Generating your Sui wallet with zkLogin security...
              </p>

              {tempData && (
                <div className="text-sm text-gray-500 dark:text-gray-500">
                  Provider: <span className="font-semibold text-gray-700 dark:text-gray-300 capitalize">{tempData.provider}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </OnboardingContainer>
  );
}
