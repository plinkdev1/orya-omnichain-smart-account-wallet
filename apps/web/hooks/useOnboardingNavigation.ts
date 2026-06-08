/**
 * Onboarding Navigation Hook
 * Manages navigation between onboarding screens
 */

import { useOnboardingStore } from '@/lib/onboardingStore';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';

interface NavigationOptions {
  preventBackNavigation?: boolean;
  resetOnExit?: boolean;
}

export const useOnboardingNavigation = (options: NavigationOptions = {}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { currentStep, setStep, reset } = useOnboardingStore();

  /**
   * Navigate to a specific onboarding step
   */
  const navigateToStep = useCallback(
    (step: number, screenPath: string) => {
      setStep(step);
      router.push(screenPath);
    },
    [setStep, router]
  );

  /**
   * Go to the next screen
   */
  const goNext = useCallback(
    (screenPath: string) => {
      navigateToStep(currentStep + 1, screenPath);
    },
    [currentStep, navigateToStep]
  );

  /**
   * Go to the previous screen
   */
  const goBack = useCallback(() => {
    if (options.preventBackNavigation) {
      return;
    }

    if (currentStep > 0) {
      setStep(currentStep - 1);
      router.back();
    } else {
      // At splash, go back to login
      router.push('/login');
    }
  }, [currentStep, setStep, router, options.preventBackNavigation]);

  /**
   * Exit onboarding and reset state
   */
  const exitOnboarding = useCallback(() => {
    if (options.resetOnExit) {
      reset();
    }
    router.push('/');
  }, [router, reset, options.resetOnExit]);

  /**
   * Check if on a specific screen
   */
  const isOnScreen = useCallback(
    (screenName: string): boolean => {
      return pathname?.includes(screenName) ?? false;
    },
    [pathname]
  );

  return {
    navigateToStep,
    goNext,
    goBack,
    exitOnboarding,
    isOnScreen,
    currentStep,
  };
};