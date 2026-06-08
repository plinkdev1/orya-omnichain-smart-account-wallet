'use client';

/**
 * Onboarding Screen 3: Biometric Setup (Standard Flow)
 * Users can set up biometric authentication (Face ID, Touch ID, etc.)
 * For Normie users, this is optional and routes to Success page
 */

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { ProgressBar } from '@/components/onboarding/ProgressBar';
import { BiometricType, useBiometricCapabilities } from '@/hooks/useBiometricCapabilities';
import { useOnboardingStore, UserSegment } from '@/lib/onboardingStore';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function BiometricSetupScreen() {
  const router = useRouter();
  const { currentFlow, userSegment, setStep, setBiometricEnabled, setBiometricType, completeStep } = useOnboardingStore();
  const { capabilities, isLoading } = useBiometricCapabilities();
  const [selectedType, setSelectedType] = useState<BiometricType | null>(null);
  const [isSkipping, setIsSkipping] = useState(false);

  const isNormieUser = userSegment === 'normie';
  const progressStep = isNormieUser ? 4 : 3;

  useEffect(() => {
    // Auto-select first available type if only one is available
    if (
      !isLoading &&
      capabilities.types.length === 1 &&
      !selectedType
    ) {
      setSelectedType(capabilities.types[0]);
    }
  }, [isLoading, capabilities.types, selectedType]);

  const handleBiometricSelect = (type: BiometricType) => {
    setSelectedType(type);
  };

  const handleEnable = async () => {
    if (selectedType) {
      setBiometricEnabled(true);
      setBiometricType(selectedType);
      
      // Route based on flow type and user segment
      if (isNormieUser) {
        // Normie users go directly to success after biometric setup
        setStep(5);
        completeStep(4);
        router.push('/onboarding/success');
      } else if (currentFlow === 'standard') {
        setStep(4);
        router.push('/onboarding/chain-selection');
      } else {
        // import or connect-external flow goes to success
        setStep(8);
        router.push('/onboarding/success');
      }
    }
  };

  const handleSkip = () => {
    setIsSkipping(true);
    setBiometricEnabled(false);
    setBiometricType('none');
    
    // Route based on user segment and flow type
    if (isNormieUser) {
      // Normie users skip biometric and go to success
      setStep(5);
      completeStep(4);
      router.push('/onboarding/success');
    } else if (currentFlow === 'standard') {
      setStep(4);
      router.push('/onboarding/chain-selection');
    } else {
      // import or connect-external flow goes to success
      setStep(8);
      router.push('/onboarding/success');
    }
  };

  const biometricLabels: Record<BiometricType, string> = {
    faceId: 'Face ID',
    touchId: 'Touch ID',
    fingerprint: 'Fingerprint',
    windowsHello: 'Windows Hello',
    securityKey: 'Security Key',
    none: 'None',
  };

  return (
    <OnboardingContainer
      showBackButton
      onBack={() => {
        setStep(2);
        router.push('/onboarding/auth-method');
      }}
    >
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="mb-12">
            <ProgressBar currentStep={progressStep} totalSteps={9} style="linear" />
          </div>

          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-deep-charcoal dark:text-bone-white mb-3">
              Secure Your Account
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Add biometric authentication for faster, safer access
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-2 border-pale-gold dark:border-neon-gold border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Checking your device...
              </p>
            </div>
          ) : capabilities.available ? (
            <div>
              {/* Available Options */}
              <div className="space-y-3 mb-8">
                {capabilities.types.map((type) => (
                  <button
                    key={type}
                    onClick={() => handleBiometricSelect(type)}
                    className={`
                      w-full p-4 rounded-2xl border-2 transition-all duration-200
                      flex items-center gap-3 text-left
                      ${
                        selectedType === type
                          ? 'border-pale-gold dark:border-neon-gold bg-pale-gold/5 dark:bg-neon-gold/5'
                          : 'border-gray-200 dark:border-gray-700 hover:border-pale-gold/40 dark:hover:border-neon-gold/40'
                      }
                    `}
                  >
                    <div className="flex-shrink-0">
                      {selectedType === type ? (
                        <CheckCircle className="w-6 h-6 text-pale-gold dark:text-neon-gold" />
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-deep-charcoal dark:text-bone-white">
                        {biometricLabels[type]}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Fast and secure authentication
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <OnboardingButton
                  label={`Enable ${selectedType ? biometricLabels[selectedType] : 'Biometric'}`}
                  onClick={handleEnable}
                  variant="primary"
                  size="lg"
                  disabled={!selectedType}
                />
                <OnboardingButton
                  label="Skip for Now"
                  onClick={handleSkip}
                  variant="secondary"
                  size="lg"
                />
              </div>
            </div>
          ) : (
            <div>
              {/* No Biometric Available */}
              <div className="mb-8 p-6 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex gap-4">
                  <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
                      Biometric Not Available
                    </h3>
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      Your device doesn't support biometric authentication. You can set it up later in settings.
                    </p>
                  </div>
                </div>
              </div>

              <OnboardingButton
                label="Continue with Password"
                onClick={handleSkip}
                variant="primary"
                size="lg"
              />
            </div>
          )}

          {/* Info Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Biometric data is stored securely on your device and never shared with ORŸA
            </p>
          </div>
        </div>
      </div>
    </OnboardingContainer>
  );
}