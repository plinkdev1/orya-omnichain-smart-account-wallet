'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';

export default function ZkLoginCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const idToken = searchParams.get('id_token');
        const state = searchParams.get('state');
        const errorCode = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (errorCode) {
          setError(`${errorCode}: ${errorDescription || 'Unknown error'}`);
          setIsProcessing(false);
          return;
        }

        if (!idToken || !state) {
          setError('Missing required parameters from OAuth provider');
          setIsProcessing(false);
          return;
        }

        const stateObj = JSON.parse(state);
        const { provider, randomness } = stateObj;

        // Store credentials temporarily for verification page
        sessionStorage.setItem('zklogin_temp', JSON.stringify({
          idToken,
          provider,
          randomness,
        }));

        // Redirect to verification page
        router.push('/onboarding/zklogin-verify');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setError(message);
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [searchParams, router]);

  if (error) {
    return (
      <OnboardingContainer showBackButton onBack={() => router.back()}>
        <div className="min-h-screen py-8 px-4 flex items-center justify-center">
          <div className="max-w-md mx-auto">
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-red-700 dark:text-red-300 mb-2">
                Authentication Error
              </h2>
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={() => router.push('/onboarding/auth-method')}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </OnboardingContainer>
    );
  }

  return (
    <OnboardingContainer showBackButton={false}>
      <div className="min-h-screen py-8 px-4 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="animate-pulse mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mx-auto mb-4"></div>
          </div>
          <h2 className="text-xl font-bold text-deep-charcoal dark:text-bone-white mb-2">
            Completing Sign In
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Verifying your credentials and setting up your Sui wallet...
          </p>
        </div>
      </div>
    </OnboardingContainer>
  );
}
