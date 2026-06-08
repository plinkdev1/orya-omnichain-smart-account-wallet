'use client';

/**
 * Onboarding Screen: Success / Completion
 * Celebrates wallet creation/import completion
 * Requires Terms of Service acceptance before allowing entry to app
 * Shows Passkey prompt after successful wallet creation
 * Shows optional KYC card to encourage verification
 */

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { OptionalKYCCard } from '@/components/onboarding/OptionalKYCCard';
import { PasskeyPrompt } from '@/components/PasskeyPrompt';
import { useOnboardingStore } from '@/lib/onboardingStore';
import { setStorageItem } from '@orya/shared-utils';
import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SuccessScreen() {
  const router = useRouter();
  const { currentFlow, walletAddress, userId, setTermsAccepted, setStep } = useOnboardingStore();

  const [termsChecked, setTermsChecked] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showPasskeyPrompt, setShowPasskeyPrompt] = useState(currentFlow === 'standard');
  const [showKYCCard, setShowKYCCard] = useState(true);
  const [kycCompleted, setKycCompleted] = useState(false);

  const flowTitles = {
    standard: 'Welcome to ORŸA!',
    import: 'Wallet Imported!',
    'connect-external': 'Connected Successfully!',
  };

  const flowSubtitles = {
    standard: 'Your new wallet is ready to explore the world of digital assets.',
    import: 'Your existing wallet has been successfully imported to ORŸA.',
    'connect-external': 'Your external wallet has been connected to ORŸA.',
  };

  const handleKYCComplete = () => {
    setKycCompleted(true);
    setShowKYCCard(false);
  };

  const handleSkipKYC = () => {
    setShowKYCCard(false);
  };

  const handleGetStarted = async () => {
    if (!termsChecked) {
      alert('Please agree to the Terms of Service to continue.');
      return;
    }

    try {
      setIsNavigating(true);

      // Update store
      setTermsAccepted(true);
      setStep(8);

      // Persist completion flags using storage abstraction
      await setStorageItem('onboarding_complete', 'true');
      await setStorageItem('terms_accepted', 'true');

      // Navigate to home/vault screen
      router.push('/vault');
    } catch (error) {
      console.error('[SuccessScreen] Navigation error:', error);
      alert('Failed to complete onboarding. Please try again.');
      setIsNavigating(false);
    }
  };

  return (
    <OnboardingContainer showBackButton={false}>
      {showPasskeyPrompt && walletAddress && userId && (
        <PasskeyPrompt
          userId={userId}
          walletAddress={walletAddress}
          onComplete={() => setShowPasskeyPrompt(false)}
          onSkip={() => setShowPasskeyPrompt(false)}
        />
      )}
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Celebration Section */}
          <div className="text-center mb-12 py-12">
            <div className="mb-8 text-center">
              <div className="text-8xl mb-4 animate-bounce">🎉</div>
              <div className="text-6xl mb-4 animate-pulse">✨</div>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-deep-charcoal dark:text-bone-white mb-3">
              {flowTitles[currentFlow]}
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              {flowSubtitles[currentFlow]}
            </p>
          </div>

          {/* Success Badges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 text-center">
              <div className="text-4xl mb-2">🔐</div>
              <h3 className="font-semibold text-deep-charcoal dark:text-bone-white">
                {currentFlow === 'standard' ? 'Secured' : 'Protected'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {currentFlow === 'standard'
                  ? 'Recovery phrase saved'
                  : 'Wallet connected safely'}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 text-center">
              <div className="text-4xl mb-2">🌐</div>
              <h3 className="font-semibold text-deep-charcoal dark:text-bone-white">
                Multi-Chain
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Ready to explore
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 text-center">
              <div className="text-4xl mb-2">💎</div>
              <h3 className="font-semibold text-deep-charcoal dark:text-bone-white">
                Luxury Ready
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Premium experience
              </p>
            </div>
          </div>

          {/* Optional KYC Card */}
          {showKYCCard && (
            <div className="mb-8">
              <OptionalKYCCard
                onComplete={handleKYCComplete}
                onSkip={handleSkipKYC}
              />
            </div>
          )}

          {/* KYC Completion Status */}
          {kycCompleted && !showKYCCard && (
            <div className="mb-8 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-2">
              <span className="text-lg">✅</span>
              <p className="text-sm text-green-700 dark:text-green-300">
                KYC verification complete! You can now access premium features.
              </p>
            </div>
          )}

          {/* Terms Acceptance */}
          <div className="mb-8 p-6 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="mb-4">
              <label className="flex items-start gap-4 cursor-pointer group">
                <div className="flex-shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={termsChecked}
                    onChange={(e) => setTermsChecked(e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-pale-gold dark:border-neon-gold accent-pale-gold dark:accent-neon-gold cursor-pointer"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-deep-charcoal dark:text-bone-white group-hover:text-pale-gold dark:group-hover:text-neon-gold transition-colors">
                    I agree to ORŸA's{' '}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pale-gold dark:text-neon-gold hover:underline"
                    >
                      Terms of Service
                    </a>
                    {' '}and{' '}
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pale-gold dark:text-neon-gold hover:underline"
                    >
                      Privacy Policy
                    </a>
                  </p>
                </div>
              </label>
            </div>

            {!termsChecked && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  You must accept the Terms of Service to continue.
                </p>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <OnboardingButton
            label={isNavigating ? 'Getting Started...' : 'Get Started'}
            onClick={handleGetStarted}
            variant="primary"
            size="lg"
            disabled={!termsChecked || isNavigating}
          />

          {/* Footer Info */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your funds are secured with industry-leading encryption and security practices. You can always update your preferences in Settings.
            </p>
          </div>
        </div>
      </div>
    </OnboardingContainer>
  );
}