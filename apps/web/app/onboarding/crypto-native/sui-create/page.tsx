'use client';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { useOnboardingStore } from '@/lib/onboardingStore';
import { AlertCircle, CheckCircle2, Copy, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
}

export default function SUICreateScreen() {
  const router = useRouter();
  const { setWalletAddress, setStep } = useOnboardingStore();

  const getInitialSteps = (): ProgressStep[] => [
    { id: 'generate', label: 'Generating Key Shares', status: 'in-progress' },
    { id: '2pc', label: 'Setting Up 2PC Signing', status: 'pending' },
    { id: 'threshold', label: 'Configuring Threshold Signatures', status: 'pending' },
    { id: 'secure', label: 'Securing Wallet', status: 'pending' },
    { id: 'finalize', label: 'Finalizing Setup', status: 'pending' },
  ];

  const [steps, setSteps] = useState<ProgressStep[]>(getInitialSteps());
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [walletAddress, setLocalWalletAddress] = useState<string | null>(null);
  const [showPasskeyPrompt, setShowPasskeyPrompt] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const simulateWalletCreation = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        updateStep(0, 'completed');
        updateStep(1, 'in-progress');

        await new Promise((resolve) => setTimeout(resolve, 3000));
        updateStep(1, 'completed');
        updateStep(2, 'in-progress');

        await new Promise((resolve) => setTimeout(resolve, 3000));
        updateStep(2, 'completed');
        updateStep(3, 'in-progress');

        await new Promise((resolve) => setTimeout(resolve, 2000));
        updateStep(3, 'completed');
        updateStep(4, 'in-progress');

        await new Promise((resolve) => setTimeout(resolve, 2000));
        updateStep(4, 'completed');

        const mockWalletAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
        setLocalWalletAddress(mockWalletAddress);
        setWalletAddress(mockWalletAddress);
        
        try {
          await AsyncStorage.setItem('sui_wallet_address', mockWalletAddress);
        } catch (err) {
          console.warn('AsyncStorage not available in web context');
        }

        setStep(3);
        setIsComplete(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setShowPasskeyPrompt(true);
      } catch (err) {
        console.error('[SUICreate] Error:', err);
        setError('Failed to create wallet. Please try again.');
        updateStep(steps.findIndex((s) => s.status === 'in-progress'), 'error');
      }
    };

    simulateWalletCreation();
  }, []);

  const updateStep = (index: number, status: ProgressStep['status']) => {
    setSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, status } : step))
    );
  };

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRetry = () => {
    setError(null);
    setSteps(getInitialSteps());
    setIsComplete(false);
    setShowPasskeyPrompt(false);
    router.push('/onboarding/crypto-native/sui-create');
  };

  const handleSkipPasskey = () => {
    setShowPasskeyPrompt(false);
    setStep(4);
    router.push('/vault');
  };

  const handleAddPasskey = () => {
    setShowPasskeyPrompt(false);
    setStep(4);
    router.push('/vault');
  };

  const getStepIcon = (status: ProgressStep['status']): React.ReactNode => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case 'in-progress':
        return (
          <div className="w-6 h-6 rounded-full border-3 border-pale-gold dark:border-neon-gold border-t-transparent animate-spin" />
        );
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600" />;
    }
  };

  return (
    <OnboardingContainer showBackButton={false}>
      <div className="min-h-screen py-8 px-4 flex items-center justify-center">
        <div className="max-w-md mx-auto w-full">
          {error ? (
            <>
              {/* Error State */}
              <div className="text-center">
                <div className="mb-6">
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-deep-charcoal dark:text-bone-white mb-3">
                  Creation Failed
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mb-8">
                  {error}
                </p>

                <div className="space-y-3">
                  <OnboardingButton
                    label="Try Again"
                    onClick={handleRetry}
                    variant="primary"
                    size="lg"
                  />
                  <button
                    onClick={() => {
                      setStep(1);
                      router.push('/onboarding/crypto-native/sui-choice');
                    }}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-deep-charcoal dark:text-bone-white hover:border-pale-gold dark:hover:border-neon-gold transition-colors"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Success State or Loading State */}
              <div className="text-center">
                {isComplete && showPasskeyPrompt ? (
                  <>
                    <div className="mb-6">
                      <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto animate-bounce" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-deep-charcoal dark:text-bone-white mb-3">
                      Wallet Created!
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">
                      Your SUI wallet is ready to use.
                    </p>

                    {walletAddress && (
                      <div className="mb-8 p-4 rounded-2xl bg-orya-sea-blue/10 dark:bg-orya-sea-blue/20 border border-orya-sea-blue/30">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          Wallet Address
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono text-deep-charcoal dark:text-bone-white break-all flex-1">
                            {walletAddress}
                          </code>
                          <button
                            onClick={handleCopyAddress}
                            className="p-2 hover:bg-orya-sea-blue/10 rounded-lg transition-colors"
                          >
                            {copied ? (
                              <Check className="w-5 h-5 text-green-500" />
                            ) : (
                              <Copy className="w-5 h-5 text-orya-sea-blue" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="mb-8 p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                      <p className="text-sm text-blue-900 dark:text-blue-200">
                        <span className="font-semibold">🔐 Secure with passkey?</span>
                        <br className="mt-2" />
                        Add an optional passkey for enhanced security. You can set this up later in settings.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <OnboardingButton
                        label="Add Passkey"
                        onClick={handleAddPasskey}
                        variant="primary"
                        size="lg"
                      />
                      <button
                        onClick={handleSkipPasskey}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-deep-charcoal dark:text-bone-white hover:border-pale-gold dark:hover:border-neon-gold transition-colors font-medium"
                      >
                        Skip for Now
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-2">
                      <h1 className="text-2xl md:text-3xl font-bold text-deep-charcoal dark:text-bone-white">
                        Creating Your
                      </h1>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <span className="text-2xl md:text-3xl font-bold text-pale-gold dark:text-neon-gold">
                          SUI
                        </span>
                        <span className="text-2xl md:text-3xl font-bold text-deep-charcoal dark:text-bone-white">
                          Wallet
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">
                      This may take a moment...
                    </p>

                    {/* Progress Steps */}
                    <div className="space-y-4 mb-8">
                      {steps.map((step, index) => (
                        <div
                          key={step.id}
                          className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
                            step.status === 'completed'
                              ? 'bg-green-50 dark:bg-green-900/20'
                              : step.status === 'error'
                              ? 'bg-red-50 dark:bg-red-900/20'
                              : step.status === 'in-progress'
                              ? 'bg-pale-gold/10 dark:bg-neon-gold/10 border border-pale-gold dark:border-neon-gold'
                              : 'bg-gray-50 dark:bg-gray-800'
                          }`}
                        >
                          <div>{getStepIcon(step.status)}</div>
                          <span
                            className={`flex-1 text-left font-medium ${
                              step.status === 'completed'
                                ? 'text-green-700 dark:text-green-300'
                                : step.status === 'error'
                                ? 'text-red-700 dark:text-red-300'
                                : step.status === 'in-progress'
                                ? 'text-pale-gold dark:text-neon-gold'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Info Message */}
                    <div className="p-4 rounded-xl border border-neon-gold/30 bg-neon-gold/10 dark:bg-neon-gold/10">
                      <p className="text-sm text-deep-charcoal dark:text-bone-white">
                        🛡️ Setting up enterprise-grade security with 2PC-MPC. Please don't close this tab or refresh the page.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </OnboardingContainer>
  );
}
