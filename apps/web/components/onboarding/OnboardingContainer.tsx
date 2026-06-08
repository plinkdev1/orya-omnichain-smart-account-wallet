'use client';

/**
 * Onboarding Container Component
 * Wrapper for all onboarding screens with consistent styling and layout
 */

import { ReactNode } from 'react';

interface OnboardingContainerProps {
  children: ReactNode;
  showHeader?: boolean;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  scrollable?: boolean;
  className?: string;
  testID?: string;
}

export const OnboardingContainer = ({
  children,
  showHeader = true,
  headerLeft,
  headerRight,
  scrollable = true,
  className = '',
  testID,
}: OnboardingContainerProps) => {
  const containerClass = scrollable
    ? 'overflow-y-auto'
    : '';

  const contentClass = scrollable
    ? 'max-h-[calc(100vh-80px)]'
    : '';

  return (
    <div
      className={`
        min-h-screen bg-bone-white dark:bg-slate-950
        ${className}
      `}
      data-testid={testID}
    >
      {/* Header */}
      {showHeader && (
        <div className="sticky top-0 z-40 border-b border-pale-gold/20 dark:border-neon-gold/20 bg-bone-white dark:bg-slate-950/95 backdrop-blur-sm">
          <div className="px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex-1">
              {headerLeft}
            </div>
            <div className="flex-1 text-right">
              {headerRight}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`
        px-6 py-8 max-w-4xl mx-auto w-full
        ${contentClass}
        ${containerClass}
      `}>
        {children}
      </div>
    </div>
  );
};