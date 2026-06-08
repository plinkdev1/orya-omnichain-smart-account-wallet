'use client';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { useOnboardingStore } from '@/lib/onboardingStore';
import { useRouter } from 'next/navigation';
import { Wallet, Plus } from 'lucide-react';

export default function SUIChoiceScreen() {
  const router = useRouter();
  const { setAuthMethod, setStep, setUserSegment } = useOnboardingStore();

  const handleExistingWallet = () => {
    setAuthMethod('connect');
    setUserSegment('crypto-native');
    setStep(1);
    router.push('/onboarding/crypto-native/sui-connect');
  };

  const handleCreateWallet = () => {
    setAuthMethod('create-wallet');
    setUserSegment('crypto-native');
    setStep(2);
    router.push('/onboarding/crypto-native/sui-create');
  };

  return (
    <OnboardingContainer showBackButton>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orya-sea-blue/20 to-orya-neon-gold/20 flex items-center justify-center">
                <Wallet className="w-12 h-12 text-orya-sea-blue" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-deep-charcoal dark:text-bone-white mb-3">
              Do you have a SUI wallet?
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Connect to sync assets OR create new for full control
            </p>
          </div>

          {/* Options */}
          <div className="space-y-4 mb-12">
            {/* Existing Wallet Option */}
            <button
              onClick={handleExistingWallet}
              className="w-full p-6 rounded-2xl border-2 border-transparent bg-gradient-to-r from-orya-sea-blue to-orya-sea-blue/80 text-white hover:shadow-lg transition-all duration-200 flex items-center gap-4 group"
            >
              <Wallet className="w-6 h-6 flex-shrink-0" />
              <div className="text-left flex-1">
                <h3 className="font-bold text-lg">I have an existing wallet</h3>
                <p className="text-sm text-white/80">Connect via Suiet or WalletConnect</p>
              </div>
              <Plus className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Create New Wallet Option */}
            <button
              onClick={handleCreateWallet}
              className="w-full p-6 rounded-2xl border-2 border-orya-neon-gold/40 bg-gradient-to-r from-orya-neon-gold/10 to-orya-neon-gold/5 text-orya-neon-gold hover:border-orya-neon-gold/60 hover:shadow-lg transition-all duration-200 flex items-center gap-4 group"
            >
              <Plus className="w-6 h-6 flex-shrink-0" />
              <div className="text-left flex-1">
                <h3 className="font-bold text-lg">Create a new SUI wallet</h3>
                <p className="text-sm text-orya-neon-gold/80">Generate with MPC for full control</p>
              </div>
              <Wallet className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          {/* Info Box */}
          <div className="p-6 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 mb-8">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <span className="font-semibold">💡 Tip:</span> Both options support multiple chains. You'll be able to add Ethereum, Solana, and other networks after wallet setup.
            </p>
          </div>

          {/* CTA Button */}
          <div className="space-y-3">
            <OnboardingButton
              label="Back"
              onClick={() => router.back()}
              variant="outline"
              size="lg"
            />
          </div>
        </div>
      </div>
    </OnboardingContainer>
  );
}
