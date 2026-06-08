'use client';

/**
 * Onboarding Screen 2: Auth Method Selection
 * Users choose between:
 * - Sui zkLogin (Google, Apple, Twitch) - Sui-first web3 onboarding
 * - Social Auth (Google, Apple, Email, Phone) - for Normie users
 * - Crypto Methods (Create New, Import, Connect External) - for Crypto-Native users
 */

import { AuthMethodButton } from '@/components/onboarding/AuthMethodButton';
import { SuiZkLoginButton } from '@/components/onboarding/SuiZkLoginButton';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { ProgressBar } from '@/components/onboarding/ProgressBar';
import { useOnboardingStore, UserSegment } from '@/lib/onboardingStore';
import { useRouter } from 'next/navigation';

export default function AuthMethodScreen() {
  const router = useRouter();
  const { setStep, setFlow, setAuthMethod, userSegment } = useOnboardingStore();

  const isNormieUser = userSegment === 'normie';

  const handleAuthMethodSelect = (method: string, flow: string) => {
    setAuthMethod(method as any);
    setFlow(flow as any);
    setStep(3);

    // Route based on user segment and flow
    if (isNormieUser) {
      // Normie users use social login flow
      if (method === 'google' || method === 'apple' || method === 'email' || method === 'phone') {
        router.push('/onboarding/normie/social-login');
      }
    } else {
      // Crypto-native and other users use traditional wallet flows
      if (flow === 'standard') {
        router.push('/onboarding/biometric-setup');
      } else if (flow === 'import') {
        router.push('/onboarding/import-wallet');
      } else if (flow === 'connect-external') {
        router.push('/onboarding/connect-external');
      }
    }
  };

  const clientId = process.env.NEXT_PUBLIC_ZKLOGIN_CLIENT_ID || '';
  const redirectUrl = process.env.NEXT_PUBLIC_ZKLOGIN_REDIRECT_URL || `${typeof window !== 'undefined' ? window.location.origin : ''}/onboarding/zklogin-callback`;

  const handleZkLoginSuccess = (credential: any) => {
    setAuthMethod('sui_zklogin');
    setFlow('sui_zklogin');
    setStep(3);
    router.push('/onboarding/zklogin-verify');
  };

  const handleZkLoginError = (error: Error) => {
    console.error('zkLogin error:', error);
  };

  return (
    <OnboardingContainer showBackButton onBack={() => router.back()}>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="mb-12">
            <ProgressBar currentStep={2} totalSteps={9} style="linear" />
          </div>

          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-deep-charcoal dark:text-bone-white mb-3">
              {isNormieUser ? 'Choose your sign-in method' : 'How would you like to begin?'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {isNormieUser
                ? 'Fast and secure sign-up with your preferred account'
                : 'Choose your preferred method to set up your wallet'}
            </p>
          </div>

          {/* Sui zkLogin Section (Featured) */}
          <div className="mb-12 p-6 rounded-3xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 border-2 border-blue-200 dark:border-blue-800">
            <h2 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-4 px-1">
              🚀 SUI-FIRST WEB3 ONBOARDING
            </h2>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
              Sign in with your social account and instantly get a Sui wallet powered by zkLogin
            </p>
            <div className="space-y-2">
              <SuiZkLoginButton
                clientId={clientId}
                redirectUrl={redirectUrl}
                provider="google"
                onSuccess={handleZkLoginSuccess}
                onError={handleZkLoginError}
              />
              <SuiZkLoginButton
                clientId={clientId}
                redirectUrl={redirectUrl}
                provider="apple"
                onSuccess={handleZkLoginSuccess}
                onError={handleZkLoginError}
              />
              <SuiZkLoginButton
                clientId={clientId}
                redirectUrl={redirectUrl}
                provider="twitch"
                onSuccess={handleZkLoginSuccess}
                onError={handleZkLoginError}
              />
            </div>
          </div>

          {!isNormieUser && (
            <>
              {/* Crypto Options (for non-Normie users) */}
              <div className="mb-12">
                <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4 px-1">
                  WALLET OPTIONS
                </h2>
                <div className="space-y-3">
                  <AuthMethodButton
                    id="create-wallet"
                    method="create-wallet"
                    title="Create New Wallet"
                    description="Set up a new wallet with a secure recovery phrase"
                    icon="➕"
                    onClick={() => handleAuthMethodSelect('create-wallet', 'standard')}
                  />
                  <AuthMethodButton
                    id="import-wallet"
                    method="import-wallet"
                    title="Import Existing Wallet"
                    description="Import a wallet using your recovery phrase"
                    icon="📥"
                    onClick={() => handleAuthMethodSelect('import', 'import')}
                  />
                  <AuthMethodButton
                    id="connect-external"
                    method="connect-external"
                    title="Connect External Wallet"
                    description="Connect MetaMask, Phantom, or other wallets"
                    icon="🔗"
                    onClick={() => handleAuthMethodSelect('connect', 'connect-external')}
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">OR</span>
                <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
              </div>
            </>
          )}

          {/* Social/Email Options */}
          <div>
            {!isNormieUser && (
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4 px-1">
                SIGN IN WITH
              </h2>
            )}
            <div className="space-y-3">
              <AuthMethodButton
                id="google"
                method="google"
                title="Google"
                description={isNormieUser ? 'Sign up with your Google account' : 'Quick sign-up with your Google account'}
                icon="🔵"
                onClick={() => handleAuthMethodSelect('google', 'standard')}
              />
              <AuthMethodButton
                id="apple"
                method="apple"
                title="Apple"
                description={isNormieUser ? 'Sign up with your Apple ID' : 'Quick sign-up with your Apple ID'}
                icon="🍎"
                onClick={() => handleAuthMethodSelect('apple', 'standard')}
              />
              {isNormieUser && (
                <>
                  <AuthMethodButton
                    id="email"
                    method="email"
                    title="Email"
                    description="Sign up with your email address"
                    icon="✉️"
                    onClick={() => handleAuthMethodSelect('email', 'standard')}
                  />
                  <AuthMethodButton
                    id="phone"
                    method="phone"
                    title="Phone"
                    description="Sign up with your phone number"
                    icon="📱"
                    onClick={() => handleAuthMethodSelect('phone', 'standard')}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </OnboardingContainer>
  );
}