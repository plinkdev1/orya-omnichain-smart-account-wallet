'use client';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { useOnboardingStore, UserSegment } from '@/lib/onboardingStore';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

export default function IdentityPage() {
  const router = useRouter();
  const { userSegment, setUserSegment, setStep } = useOnboardingStore();
  const [selected, setSelected] = useState<UserSegment | null>(userSegment);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const identityOptions = [
    {
      segment: 'normie' as UserSegment,
      emoji: '💳',
      title: 'Simple Wallet',
      description: 'Perfect for payments & everyday use',
      features: [
        'Social login (Google, Apple, Email)',
        'Custodial (we protect your keys)',
        'Card payments ready',
        'Upgrade to Web3 anytime',
      ],
    },
    {
      segment: 'crypto-native' as UserSegment,
      emoji: '🚀',
      title: 'Web3 Power User',
      description: 'Full control with advanced features',
      features: [
        'SUI-native self-custody wallet',
        'MPC security (you own your keys)',
        'Full DeFi & NFT access',
        'Passkeys & ZK Login',
      ],
    },
    {
      segment: 'external' as UserSegment,
      emoji: '🔗',
      title: 'Existing Wallet',
      description: 'Connect your wallet (Phantom, MetaMask, etc)',
      features: [
        'WalletConnect integration',
        'Your wallet, your keys',
        'Read-only or sign transactions',
        'Zero migration needed',
      ],
    },
    {
      segment: 'institutional' as UserSegment,
      emoji: '🏢',
      title: 'Company or DAO',
      description: 'Multi-sig, compliance & team access',
      features: [
        'KYB verification required',
        'Multi-sig support',
        'Role-based approvals',
        'Audit logs & analytics',
      ],
    },
  ];

  const handleContinue = () => {
    if (selected) {
      setUserSegment(selected);
      setStep(2);
      router.push('/onboarding/auth-method');
    }
  };

  const handleBack = () => {
    setStep(0);
    router.push('/onboarding/intro');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const options = identityOptions;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => {
        const next = prev === null ? 0 : Math.min(prev + 1, options.length - 1);
        setSelected(options[next].segment);
        return next;
      });
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => {
        const next = prev === null ? 0 : Math.max(prev - 1, 0);
        setSelected(options[next].segment);
        return next;
      });
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (selected) {
        handleContinue();
      }
    }
  };

  useEffect(() => {
    if (focusedIndex !== null) {
      const cards = document.querySelectorAll('[data-identity-card]');
      (cards[focusedIndex] as HTMLElement)?.focus();
    }
  }, [focusedIndex]);

  return (
    <OnboardingContainer showBackButton={true} onBack={handleBack}>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-deep-charcoal dark:text-bone-white mb-3">
              How would you like to use ORŸA?
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Choose the option that matches your needs. You can always upgrade later.
            </p>
          </div>

          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8"
            onKeyDown={handleKeyDown}
            role="group"
            aria-label="Identity selection"
          >
            {identityOptions.map((option, index) => (
              <Card
                key={option.segment}
                data-identity-card
                tabIndex={0}
                onClick={() => {
                  setSelected(option.segment);
                  setFocusedIndex(index);
                }}
                onFocus={() => setFocusedIndex(index)}
                className={`p-6 md:p-8 cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  selected === option.segment
                    ? 'border-2 border-pale-gold dark:border-neon-gold bg-pale-gold/5 dark:bg-neon-gold/5 scale-105 shadow-lg'
                    : 'border-2 border-gray-200 dark:border-gray-700 hover:border-pale-gold dark:hover:border-neon-gold'
                } focus:ring-pale-gold dark:focus:ring-neon-gold focus:ring-offset-bone-white dark:focus:ring-offset-deep-charcoal`}
                role="radio"
                aria-checked={selected === option.segment}
                aria-label={`${option.title}: ${option.description}`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="text-5xl md:text-6xl">{option.emoji}</div>
                    {selected === option.segment && (
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-pale-gold dark:bg-neon-gold flex-shrink-0">
                        <span className="text-deep-charcoal dark:text-slate-950 text-sm font-bold">
                          ✓
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-deep-charcoal dark:text-bone-white mb-1">
                      {option.title}
                    </h3>
                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                      {option.description}
                    </p>
                  </div>

                  <ul className="space-y-2">
                    {option.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="text-sm md:text-base text-gray-700 dark:text-gray-300 flex items-start gap-2"
                      >
                        <span className="text-pale-gold dark:text-neon-gold flex-shrink-0 mt-0.5">
                          ✓
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>

          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 mb-8">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              💡 <strong>Tip:</strong> Use arrow keys to navigate, Enter to select. All paths lead to
              a secure wallet — pick what feels right for you.
            </p>
          </div>

          <div className="space-y-3">
            <OnboardingButton
              label="Continue"
              onClick={handleContinue}
              variant="primary"
              size="lg"
              disabled={!selected}
            />
            <button
              onClick={handleBack}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-deep-charcoal dark:text-bone-white hover:border-pale-gold dark:hover:border-neon-gold transition-colors font-medium"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </OnboardingContainer>
  );
}
