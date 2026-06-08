'use client';

/**
 * Onboarding Screen 6: Chain Selection
 * Users select their primary blockchain (SUI, Ethereum, Solana, etc.)
 */

import { ChainOption } from '@/components/onboarding/ChainOption';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { ProgressBar } from '@/components/onboarding/ProgressBar';
import { useOnboardingStore } from '@/lib/onboardingStore';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Chain {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  color: string;
}

const CHAINS: Chain[] = [
  {
    id: 'sui',
    name: 'Sui Network',
    shortName: 'SUI',
    description: 'High-speed, low-cost transactions with instant finality',
    icon: '🌊',
    color: '#0066FF',
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    shortName: 'ETH',
    description: 'Most secure and widely used blockchain network',
    icon: '◆',
    color: '#627EEA',
  },
  {
    id: 'solana',
    name: 'Solana',
    shortName: 'SOL',
    description: 'Ultra-fast transactions with minimal fees',
    icon: '◎',
    color: '#14F195',
  },
  {
    id: 'aptos',
    name: 'Aptos',
    shortName: 'APT',
    description: 'Next-generation Layer 1 with Move language',
    icon: '▲',
    color: '#000000',
  },
];

export default function ChainSelectionScreen() {
  const router = useRouter();
  const { setStep, setSelectedChain, selectedChain } = useOnboardingStore();
  const [selected, setSelected] = useState<string>(selectedChain || 'sui');

  const handleChainSelect = (chainId: string) => {
    setSelected(chainId);
  };

  const handleProceed = () => {
    setSelectedChain(selected);
    setStep(5);
    router.push('/onboarding/creating-wallet');
  };

  return (
    <OnboardingContainer
      showBackButton
      onBack={() => {
        setStep(5);
        router.push('/onboarding/recovery-phrase-verify');
      }}
    >
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="mb-12">
            <ProgressBar currentStep={6} totalSteps={9} style="linear" />
          </div>

          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-deep-charcoal dark:text-bone-white mb-3">
              Select Your Primary Chain
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Choose your preferred blockchain network. You can add more chains later.
            </p>
          </div>

          {/* Chain Options */}
          <div className="space-y-4 mb-12">
            {CHAINS.map((chain) => (
              <ChainOption
                key={chain.id}
                id={chain.id}
                name={chain.name}
                shortName={chain.shortName}
                description={chain.description}
                icon={chain.icon}
                color={chain.color}
                selected={selected === chain.id}
                onClick={() => handleChainSelect(chain.id)}
                testID={`chain-option-${chain.id}`}
              />
            ))}
          </div>

          {/* Info Box */}
          <div className="mb-8 p-6 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <span className="font-semibold">💡 Tip:</span> You can add and switch between multiple chains after onboarding. This is your primary chain for wallet creation.
            </p>
          </div>

          {/* CTA Button */}
          <OnboardingButton
            label="Continue"
            onClick={handleProceed}
            variant="primary"
            size="lg"
          />
        </div>
      </div>
    </OnboardingContainer>
  );
}