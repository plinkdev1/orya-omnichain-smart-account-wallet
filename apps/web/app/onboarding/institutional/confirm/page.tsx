'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useOnboardingStore } from '@/lib/onboardingStore';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { CheckCircle2, Lock, BarChart3, Users, ArrowRight } from 'lucide-react';

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

export default function InstitutionalConfirmPage() {
  const router = useRouter();
  const { completeStep, setUserSegment } = useOnboardingStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const features: Feature[] = [
    {
      icon: Lock,
      title: 'Multi-sig Treasury',
      description: 'Secure multi-signature approvals for all transactions',
    },
    {
      icon: BarChart3,
      title: 'Audit Logs',
      description: 'Complete transaction history and compliance reporting',
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Real-time portfolio and transaction analytics',
    },
    {
      icon: Users,
      title: 'Role-based Controls',
      description: 'Fine-grained permission management for team members',
    },
  ];

  const handleContinue = async () => {
    try {
      setIsProcessing(true);

      completeStep(4);
      setUserSegment('institutional');

      await new Promise((resolve) => setTimeout(resolve, 1000));

      router.push('/vault');
    } catch (err) {
      console.error('[InstitutionalConfirm] Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <OnboardingContainer showBackButton={false}>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-pale-gold/20 to-neon-gold/20 dark:from-neon-gold/20 dark:to-pale-gold/20 mb-6">
              <CheckCircle2 className="w-10 h-10 text-pale-gold dark:text-neon-gold" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-deep-charcoal dark:text-bone-white mb-3">
              Institutional Suite Activated
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Your KYB verification is complete and all features are now active
            </p>
          </div>

          <div className="mb-10">
            <h2 className="text-xl font-bold text-deep-charcoal dark:text-bone-white mb-4">
              Suite Features
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-950/50 hover:border-pale-gold dark:hover:border-neon-gold transition"
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pale-gold/20 to-neon-gold/20 dark:from-neon-gold/20 dark:to-pale-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-5 h-5 text-pale-gold dark:text-neon-gold" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-deep-charcoal dark:text-bone-white">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mb-8 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-300 mb-1">
                  Verification Approved
                </h3>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Your KYB information has been verified against regulatory databases. All institutional features are now active and ready to use.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <OnboardingButton
              label="Continue to Vault"
              onClick={handleContinue}
              variant="primary"
              size="lg"
              loading={isProcessing}
              disabled={isProcessing}
              icon={ArrowRight}
            />

            <OnboardingButton
              label="View Documentation"
              onClick={() => router.push('/atrium/curator')}
              variant="secondary"
              size="lg"
              disabled={isProcessing}
            />
          </div>
        </div>
      </div>
    </OnboardingContainer>
  );
}
