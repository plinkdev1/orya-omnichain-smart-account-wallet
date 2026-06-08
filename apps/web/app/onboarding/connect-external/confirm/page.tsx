'use client';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { useOnboardingStore } from '@/lib/onboardingStore';
import { Check, Copy, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ExternalWalletConfirmScreen() {
  const router = useRouter();
  const { walletAddress, setLoading, completeStep } = useOnboardingStore();
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!walletAddress) {
      router.back();
    }
  }, [walletAddress, router]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleContinue = async () => {
    try {
      setIsProcessing(true);
      setLoading(true);

      completeStep(3);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      router.push('/vault');
    } catch (err) {
      console.error('[ExternalWalletConfirm] Error:', err);
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }
  };

  const displayAddress = walletAddress
    ? `${walletAddress.slice(0, 10)}...${walletAddress.slice(-8)}`
    : '';

  return (
    <OnboardingContainer showBackButton={false}>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-12 text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pale-gold/20 to-neon-gold/20 dark:from-neon-gold/20 dark:to-pale-gold/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-pale-gold dark:text-neon-gold" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-deep-charcoal dark:text-bone-white mb-3">
              Wallet Connected
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Your external wallet has been successfully connected to ORŸA
            </p>
          </div>

          <div className="mb-8 p-6 rounded-2xl border-2 border-pale-gold dark:border-neon-gold bg-gradient-to-r from-pale-gold/5 to-pale-gold/5 dark:from-neon-gold/5 dark:to-neon-gold/5">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pale-gold/30 to-neon-gold/30 dark:from-neon-gold/30 dark:to-pale-gold/30 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-pale-gold dark:text-neon-gold" />
              </div>
              <h3 className="text-lg font-bold text-deep-charcoal dark:text-bone-white mb-3">
                Connected Wallet
              </h3>
              <p className="text-sm font-mono text-gray-700 dark:text-gray-300 mb-1 break-all">
                {walletAddress}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                {displayAddress}
              </p>
              <button
                onClick={() => copyToClipboard(walletAddress || '')}
                className="inline-flex items-center gap-2 text-sm text-pale-gold dark:text-neon-gold hover:underline transition-colors"
              >
                {copiedToClipboard ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Address
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mb-8 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex gap-3">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-900 dark:text-green-200 mb-1">
                  Connection Verified
                </p>
                <p className="text-sm text-green-800 dark:text-green-300">
                  Your wallet is now connected and ready to use with ORŸA. You can access the vault and manage your assets.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <OnboardingButton
              label={isProcessing ? 'Continuing...' : 'Go to Vault'}
              onClick={handleContinue}
              variant="primary"
              size="lg"
              disabled={isProcessing}
            />
            <button
              onClick={() => router.push('/onboarding/connect-external/wallet-connect')}
              disabled={isProcessing}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-deep-charcoal dark:text-bone-white hover:border-pale-gold dark:hover:border-neon-gold transition-colors disabled:opacity-50"
            >
              Connect Another
            </button>
          </div>
        </div>
      </div>
    </OnboardingContainer>
  );
}
