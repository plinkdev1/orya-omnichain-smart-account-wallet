'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useOnboardingStore } from '@/lib/onboardingStore';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { ProgressBar } from '@/components/onboarding/ProgressBar';
import { Globe, Zap, CreditCard, ChevronRight } from 'lucide-react';

export default function NormieCardSetupPage() {
  const router = useRouter();
  const { setStep, completeStep } = useOnboardingStore();
  const [setupLoading, setSetupLoading] = useState(false);

  const handleCardSetup = async () => {
    try {
      setSetupLoading(true);
      setStep(3);

      await new Promise((resolve) => setTimeout(resolve, 800));

      completeStep(3);
      router.push('/onboarding/biometric-setup');
    } catch (err) {
      console.error('Card setup error:', err);
      setSetupLoading(false);
    }
  };

  const handleSkip = () => {
    setStep(3);
    completeStep(3);
    router.push('/onboarding/biometric-setup');
  };

  return (
    <OnboardingContainer showBackButton onBack={() => router.back()}>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-12">
            <ProgressBar currentStep={3} totalSteps={9} style="linear" />
          </div>

          <div className="mb-8">
            <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-pale-gold/20 to-neon-gold/20 flex items-center justify-center mb-6">
              <CreditCard className="w-10 h-10 text-pale-gold dark:text-neon-gold" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-deep-charcoal dark:text-bone-white mb-3">
              Ready to spend?
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Set up your ORŸA card for instant payments anywhere
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-950/50">
              <div className="flex items-center gap-3 mb-2">
                <Globe className="w-5 h-5 text-pale-gold dark:text-neon-gold" />
                <h3 className="font-semibold text-deep-charcoal dark:text-bone-white">
                  30+ Countries
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 ml-8">
                Spend in any currency, anywhere in the world
              </p>
            </div>

            <div className="p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-950/50">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-deep-charcoal dark:text-bone-white">
                  Instant Issuance
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 ml-8">
                Virtual card ready to use immediately after setup
              </p>
            </div>

            <div className="p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-950/50">
              <div className="flex items-center gap-3 mb-2">
                <CreditCard className="w-5 h-5 text-emerald-500" />
                <h3 className="font-semibold text-deep-charcoal dark:text-bone-white">
                  No Annual Fees
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 ml-8">
                Completely free to create and manage your card
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-8">
            <OnboardingButton
              label="Set up card now"
              onClick={handleCardSetup}
              variant="primary"
              size="lg"
              disabled={setupLoading}
            />
            <button
              type="button"
              onClick={handleSkip}
              disabled={setupLoading}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-deep-charcoal dark:text-bone-white hover:border-pale-gold dark:hover:border-neon-gold transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              I'll set up later
            </button>
          </div>

          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-900 dark:text-amber-200 text-center">
              💡 Card setup is optional. You can use your wallet and transfer funds without a card.
            </p>
          </div>
        </div>
      </div>
    </OnboardingContainer>
  );
}
