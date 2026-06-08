'use client';

import { IntroScreens } from '@/components/onboarding/IntroScreens';
import { useOnboardingStore } from '@/lib/onboardingStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function IntroPage() {
  const router = useRouter();
  const { setStep } = useOnboardingStore();

  useEffect(() => {
    setStep(1);
  }, [setStep]);

  const handleComplete = () => {
    setStep(2);
    router.push('/onboarding/identity');
  };

  const handleSkip = () => {
    setStep(2);
    router.push('/onboarding/identity');
  };

  return <IntroScreens onComplete={handleComplete} onSkip={handleSkip} />;
}
