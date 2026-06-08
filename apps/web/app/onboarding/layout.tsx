'use client';

/**
 * Onboarding Layout
 * Provides consistent styling and structure for all onboarding screens
 */

import { useOnboardingStore } from '@/lib/onboardingStore';
import { ReactNode, useEffect } from 'react';

interface OnboardingLayoutProps {
  children: ReactNode;
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  const { reset } = useOnboardingStore();

  // Initialize store on mount (reset from any previous state)
  useEffect(() => {
    // Note: Only reset if coming from outside onboarding flow
    // This is handled at the splash screen level
  }, []);

  return (
    <div className="min-h-screen bg-bone-white dark:bg-deep-charcoal overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-pale-gold/5 dark:bg-neon-gold/5 rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pale-gold/5 dark:bg-neon-gold/5 rounded-full blur-3xl opacity-40" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}