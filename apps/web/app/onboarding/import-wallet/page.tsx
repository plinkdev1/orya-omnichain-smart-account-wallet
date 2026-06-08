'use client';

/**
 * Onboarding Screen: Import Wallet
 * Allows users to import existing wallets using seed phrase, private key, or keystore file
 */

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { ProgressBar } from '@/components/onboarding/ProgressBar';
import { useOnboardingStore } from '@/lib/onboardingStore';
import { validatePrivateKey, validateRecoveryPhrase } from '@orya/shared-utils';
import { AlertCircle, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type ImportMethod = 'seed' | 'private-key' | 'keystore' | null;

interface ImportMethodOption {
  id: ImportMethod;
  label: string;
  description: string;
  icon: string;
  placeholder: string;
}

const IMPORT_METHODS: ImportMethodOption[] = [
  {
    id: 'seed',
    label: 'Seed Phrase',
    description: 'Import using 12 or 24-word recovery phrase',
    icon: '📝',
    placeholder: 'Enter your seed phrase (12 or 24 words, space-separated)',
  },
  {
    id: 'private-key',
    label: 'Private Key',
    description: 'Import using hex-encoded private key',
    icon: '🔑',
    placeholder: '0x...',
  },
  {
    id: 'keystore',
    label: 'Keystore File',
    description: 'Import from JSON keystore file',
    icon: '📁',
    placeholder: 'Upload or paste JSON content',
  },
];

export default function ImportWalletScreen() {
  const router = useRouter();
  const { setFlow, setAuthMethod, setWalletAddress, setStep } = useOnboardingStore();

  const [step, setLocalStep] = useState<'select-method' | 'input' | 'confirming'>(
    'select-method'
  );
  const [selectedMethod, setSelectedMethod] = useState<ImportMethod>(null);
  const [inputValue, setInputValue] = useState('');
  const [derivationPath, setDerivationPath] = useState("m/44'/784'/0'/0'/0'"); // SUI default
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectMethod = (method: ImportMethod) => {
    setSelectedMethod(method);
    setLocalStep('input');
    setError(null);
    setInputValue('');
  };

  const validateInput = (): boolean => {
    if (!inputValue.trim()) {
      setError('Please enter wallet information');
      return false;
    }

    if (selectedMethod === 'seed') {
      // Use shared-utils validation for recovery phrase
      if (!validateRecoveryPhrase(inputValue)) {
        setError('Seed phrase must contain exactly 12, 15, 18, 21, or 24 words');
        return false;
      }
    } else if (selectedMethod === 'private-key') {
      // Use shared-utils validation for private key
      if (!validatePrivateKey(inputValue)) {
        setError('Private key must be a valid 256-bit hex string (0x + 64 characters)');
        return false;
      }
    } else if (selectedMethod === 'keystore') {
      try {
        JSON.parse(inputValue);
      } catch (e) {
        setError('Invalid JSON format for keystore file');
        return false;
      }
      if (!password.trim()) {
        setError('Password is required for keystore files');
        return false;
      }
    }

    return true;
  };

  const handleImport = async () => {
    if (!validateInput()) return;

    try {
      setIsProcessing(true);
      setLocalStep('confirming');
      setError(null);

      // Simulate wallet import (2 seconds)
      // TODO: Replace with actual wallet SDK integration
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock wallet address
      const mockWalletAddress = `0x${Math.random().toString(16).substr(2, 40)}`;

      // Update store
      setWalletAddress(mockWalletAddress);
      setAuthMethod('import');
      setFlow('import');
      setStep(3); // Move to biometric setup

      // Navigate to biometric setup
      router.push('/onboarding/biometric-setup');
    } catch (err) {
      console.error('[ImportWallet] Error:', err);
      setError('Failed to import wallet. Please check your input and try again.');
      setLocalStep('input');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    if (step === 'input') {
      setLocalStep('select-method');
      setSelectedMethod(null);
      setInputValue('');
      setError(null);
    } else {
      setStep(2);
      router.push('/onboarding/auth-method');
    }
  };

  const currentMethod = IMPORT_METHODS.find((m) => m.id === selectedMethod);

  return (
    <OnboardingContainer
      showBackButton
      onBack={handleBack}
    >
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="mb-12">
            <ProgressBar currentStep={3} totalSteps={9} style="linear" />
          </div>

          {step === 'select-method' ? (
            <>
              {/* Header */}
              <div className="mb-12 text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-deep-charcoal dark:text-bone-white mb-3">
                  Import Your Wallet
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Choose how you'd like to import your existing wallet
                </p>
              </div>

              {/* Method Selection */}
              <div className="space-y-4 mb-8">
                {IMPORT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => handleSelectMethod(method.id)}
                    className="w-full p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-pale-gold dark:hover:border-neon-gold transition-all duration-200 hover:shadow-lg text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-4xl">{method.icon}</span>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-deep-charcoal dark:text-bone-white mb-1 group-hover:text-pale-gold dark:group-hover:text-neon-gold transition-colors">
                          {method.label}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {method.description}
                        </p>
                      </div>
                      <div className="text-pale-gold dark:text-neon-gold opacity-0 group-hover:opacity-100 transition-opacity">
                        →
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Security Warning */}
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Never share your seed phrase or private key. ORŸA will never ask for these credentials.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Input Step */}
              <div className="mb-12 text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-deep-charcoal dark:text-bone-white mb-3">
                  {currentMethod?.label}
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  {currentMethod?.description}
                </p>
              </div>

              {/* Security Banner */}
              <div className="mb-8 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex gap-3">
                  <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Your wallet information is encrypted and never leaves your device.
                  </p>
                </div>
              </div>

              {/* Input Area */}
              <div className="mb-8">
                <textarea
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setError(null);
                  }}
                  placeholder={currentMethod?.placeholder}
                  className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-deep-charcoal dark:text-bone-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-pale-gold dark:focus:border-neon-gold transition-colors resize-none"
                  rows={6}
                  disabled={isProcessing}
                />
              </div>

              {/* Derivation Path for Seed Phrase */}
              {selectedMethod === 'seed' && (
                <div className="mb-8">
                  <label className="block text-sm font-semibold text-deep-charcoal dark:text-bone-white mb-2">
                    Derivation Path (Optional)
                  </label>
                  <input
                    type="text"
                    value={derivationPath}
                    onChange={(e) => setDerivationPath(e.target.value)}
                    placeholder="m/44'/784'/0'/0'/0'"
                    className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-deep-charcoal dark:text-bone-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-pale-gold dark:focus:border-neon-gold transition-colors text-sm"
                    disabled={isProcessing}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    SUI default path is shown. Leave empty to use default.
                  </p>
                </div>
              )}

              {/* Password for Keystore */}
              {selectedMethod === 'keystore' && (
                <div className="mb-8">
                  <label className="block text-sm font-semibold text-deep-charcoal dark:text-bone-white mb-2">
                    Keystore Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="Enter your keystore password"
                    className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-deep-charcoal dark:text-bone-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-pale-gold dark:focus:border-neon-gold transition-colors"
                    disabled={isProcessing}
                  />
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-8 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-4">
                <OnboardingButton
                  label={isProcessing ? 'Importing...' : 'Import Wallet'}
                  onClick={handleImport}
                  variant="primary"
                  size="lg"
                  disabled={isProcessing}
                />
                <button
                  onClick={() => {
                    setLocalStep('select-method');
                    setSelectedMethod(null);
                    setInputValue('');
                    setError(null);
                  }}
                  disabled={isProcessing}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-deep-charcoal dark:text-bone-white hover:border-pale-gold dark:hover:border-neon-gold transition-colors disabled:opacity-50"
                >
                  Choose Different Method
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </OnboardingContainer>
  );
}