'use client';

/**
 * Onboarding Screen 4: Recovery Phrase Display (Standard Flow)
 * Shows 12-word recovery phrase for new wallet
 * Users must copy/write down before proceeding
 */

import { CheckBox } from '@/components/onboarding/CheckBox';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { ProgressBar } from '@/components/onboarding/ProgressBar';
import { useRecoveryPhraseGenerator } from '@/hooks/useRecoveryPhraseGenerator';
import { useOnboardingStore } from '@/lib/onboardingStore';
import { AlertTriangle, CheckCircle, Copy, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RecoveryPhraseDisplayScreen() {
  const router = useRouter();
  const { setStep, setRecoveryPhrase, recoveryPhrase } = useOnboardingStore();
  const { generatePhrase } = useRecoveryPhraseGenerator();
  const [phrase, setPhrase] = useState<string | null>(recoveryPhrase);
  const [words, setWords] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [showPhrase, setShowPhrase] = useState(false);

  // Generate phrase on first load
  useEffect(() => {
    if (!phrase) {
      const generated = generatePhrase();
      setPhrase(generated.phrase);
      setWords(generated.words);
      setRecoveryPhrase(generated.phrase);
    } else {
      setWords(phrase.split(' '));
    }
  }, []);

  const handleCopyPhrase = async () => {
    if (phrase) {
      await navigator.clipboard.writeText(phrase);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleProceed = () => {
    setStep(5);
    router.push('/onboarding/recovery-phrase-verify');
  };

  return (
    <OnboardingContainer
      showBackButton={false}
      onBack={() => {
        setStep(3);
        router.push('/onboarding/biometric-setup');
      }}
    >
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="mb-12">
            <ProgressBar currentStep={4} totalSteps={9} style="linear" />
          </div>

          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-deep-charcoal dark:text-bone-white mb-3">
              Your Recovery Phrase
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Save these 12 words in a safe place. You'll need them to recover your wallet.
            </p>
          </div>

          {/* Security Warning */}
          <div className="mb-8 p-6 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex gap-4">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1">
                Keep This Secret
              </h3>
              <p className="text-sm text-red-800 dark:text-red-300">
                Never share your recovery phrase with anyone. Anyone with these words can access your wallet.
              </p>
            </div>
          </div>

          {/* Phrase Display */}
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-deep-charcoal dark:text-bone-white">
                Secret Recovery Phrase
              </h3>
              <button
                onClick={() => setShowPhrase(!showPhrase)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-semibold text-pale-gold dark:text-neon-gold"
              >
                {showPhrase ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span>Reveal</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              {/* Blur overlay when hidden */}
              {!showPhrase && (
                <div className="absolute inset-0 backdrop-blur-sm bg-deep-charcoal/20 dark:bg-bone-white/5 rounded-2xl flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="text-2xl text-gray-400 dark:text-gray-500 mb-2 font-mono tracking-wider">
                      •••••••• •••••••• •••••••• •••••••• •••••••• ••••••••
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Click "Reveal" to view your recovery phrase
                    </p>
                  </div>
                </div>
              )}

              {/* Phrase Grid */}
              <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
                {showPhrase ? (
                  <div className="grid grid-cols-3 gap-3">
                    {words.map((word, index) => (
                      <div
                        key={index}
                        className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center gap-2"
                      >
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 min-w-fit">
                          {index + 1}.
                        </div>
                        <div className="font-mono text-sm font-semibold text-deep-charcoal dark:text-bone-white">
                          {word}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {Array.from({ length: 12 }).map((_, index) => (
                      <div
                        key={index}
                        className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 h-16 flex items-center justify-center"
                      >
                        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Copy Button - Only show when phrase is revealed */}
          {showPhrase && (
            <div className="mb-8">
              <button
                onClick={handleCopyPhrase}
                className={`
                  w-full p-4 rounded-2xl border-2 transition-all duration-200
                  flex items-center justify-center gap-2 font-semibold
                  ${
                    copied
                      ? 'border-green-500/50 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                      : 'border-pale-gold/30 dark:border-neon-gold/30 text-deep-charcoal dark:text-bone-white hover:border-pale-gold dark:hover:border-neon-gold'
                  }
                `}
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>✓ Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span>Copy to Clipboard</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Acknowledgment Checkbox */}
          <div className="mb-8">
            <CheckBox
              id="backed-up"
              label="I have safely backed up my recovery phrase"
              checked={acknowledged}
              onChange={setAcknowledged}
              required
              description="You'll need to verify these words on the next step"
            />
          </div>

          {/* CTA Button */}
          <OnboardingButton
            label="Continue"
            onClick={handleProceed}
            variant="primary"
            size="lg"
            disabled={!acknowledged}
          />
        </div>
      </div>
    </OnboardingContainer>
  );
}