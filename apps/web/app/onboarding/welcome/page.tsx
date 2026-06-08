'use client';

/**
 * Onboarding Screen 1: Welcome Carousel
 * 5-slide carousel introducing ORŸA features
 * Users can navigate through slides and proceed to auth method selection
 */

import { Carousel, CarouselSlide } from '@/components/onboarding/Carousel';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { useOnboardingStore } from '@/lib/onboardingStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const WELCOME_SLIDES: CarouselSlide[] = [
  {
    id: 'multi-chain',
    title: 'Multi-Chain Mastery',
    description: 'Seamlessly manage assets across SUI, Ethereum, Solana, and more from one elegant interface.',
    icon: '🔗',
    color: 'blue',
  },
  {
    id: 'non-custodial',
    title: 'Non-Custodial Control',
    description: 'Your keys, your assets. Complete ownership with zero intermediaries.',
    icon: '🔐',
    color: 'gold',
  },
  {
    id: 'fiat-integration',
    title: 'Fiat On-Ramps',
    description: 'Convert fiat to crypto instantly with integrated payment providers.',
    icon: '💳',
    color: 'green',
  },
  {
    id: 'defi-yield',
    title: 'DeFi Opportunities',
    description: 'Earn yield and access premium DeFi protocols with advanced analytics.',
    icon: '📈',
    color: 'purple',
  },
  {
    id: 'luxury-experience',
    title: 'Luxury by Design',
    description: 'Premium experience crafted for discerning digital asset managers.',
    icon: '✨',
    color: 'rose',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { setStep, currentFlow } = useOnboardingStore();

  const handleGetStarted = () => {
    setStep(2);
    router.push('/onboarding/auth-method');
  };

  const handleAlreadyHaveAccount = () => {
    router.push('/login');
  };

  return (
    <OnboardingContainer>
      <div className="min-h-screen flex flex-col items-center justify-center py-8 px-4">
        {/* Header */}
        <div className="mb-12 text-center max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold text-deep-charcoal dark:text-bone-white mb-4 leading-tight">
            Welcome to ORŸA
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Discover a new standard in digital asset management
          </p>
        </div>

        {/* Carousel */}
        <div className="mb-12 w-full max-w-2xl">
          <Carousel
            slides={WELCOME_SLIDES}
            testID="welcome-carousel"
            className="mb-8"
          />
        </div>

        {/* CTA Buttons */}
        <div className="w-full max-w-md space-y-4">
          <OnboardingButton
            label="Get Started"
            onClick={handleGetStarted}
            variant="primary"
            size="lg"
            testID="get-started-button"
          />

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Already have an account?
            </p>
            <button
              onClick={handleAlreadyHaveAccount}
              className="text-pale-gold dark:text-neon-gold hover:underline font-semibold transition-colors"
              type="button"
            >
              Sign in
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 max-w-md w-full text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            By continuing, you agree to our{' '}
            <Link
              href="/terms"
              className="text-pale-gold dark:text-neon-gold hover:underline"
            >
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link
              href="/privacy"
              className="text-pale-gold dark:text-neon-gold hover:underline"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </OnboardingContainer>
  );
}