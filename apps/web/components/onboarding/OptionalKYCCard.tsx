'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { OnboardingButton } from './OnboardingButton';

interface OptionalKYCCardProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function OptionalKYCCard({ onComplete, onSkip }: OptionalKYCCardProps) {
  const [loading, setLoading] = useState(false);

  const handleStartKYC = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      onComplete();
    } catch (error) {
      console.error('KYC failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-pale-gold/5 to-pale-gold/10 dark:from-neon-gold/5 dark:to-neon-gold/10 border border-pale-gold/20 dark:border-neon-gold/20 rounded-2xl p-6">
      <div className="flex items-start gap-4">
        <div className="text-4xl flex-shrink-0">🛡️</div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-deep-charcoal dark:text-bone-white mb-2">
            Complete KYC Verification (Optional)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Unlock premium features like fiat on-ramps, virtual cards, and stock
            investing. You can complete this anytime from Settings.
          </p>

          <div className="space-y-3">
            <div className="text-sm">
              <strong className="text-deep-charcoal dark:text-bone-white">
                With KYC you get:
              </strong>
              <ul className="mt-2 space-y-1 ml-4">
                <li className="text-gray-600 dark:text-gray-400">
                  ✓ Buy crypto with credit/debit card
                </li>
                <li className="text-gray-600 dark:text-gray-400">
                  ✓ Create virtual cards
                </li>
                <li className="text-gray-600 dark:text-gray-400">
                  ✓ Invest in stocks & ETFs
                </li>
                <li className="text-gray-600 dark:text-gray-400">
                  ✓ Higher transaction limits
                </li>
              </ul>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400">
              Takes ~2-3 minutes
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleStartKYC}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-pale-gold dark:bg-neon-gold text-deep-charcoal dark:text-slate-950 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Complete KYC Now'
                )}
              </button>
              <button
                onClick={onSkip}
                disabled={loading}
                className="flex-1 px-4 py-3 border-2 border-pale-gold/20 dark:border-neon-gold/20 text-deep-charcoal dark:text-bone-white rounded-lg font-semibold hover:border-pale-gold/40 dark:hover:border-neon-gold/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Skip for Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
