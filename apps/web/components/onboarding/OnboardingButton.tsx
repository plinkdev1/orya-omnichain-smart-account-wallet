'use client';

/**
 * Onboarding Button Component
 * Primary, secondary, and tertiary action buttons for onboarding flows
 */

import { Loader2 } from 'lucide-react';
import { ReactNode } from 'react';

interface OnboardingButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  className?: string;
  testID?: string;
}

/**
 * OnboardingButton Component
 * Supports multiple variants and sizes for flexible use
 */
export const OnboardingButton = ({
  label,
  onClick,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
  className = '',
  testID,
}: OnboardingButtonProps) => {
  const variantStyles = {
    primary:
      'bg-pale-gold dark:bg-neon-gold text-deep-charcoal dark:text-slate-950 hover:opacity-90 active:opacity-75',
    secondary:
      'border-2 border-pale-gold dark:border-neon-gold text-deep-charcoal dark:text-bone-white hover:bg-pale-gold/10 dark:hover:bg-neon-gold/10 active:bg-pale-gold/20 dark:active:bg-neon-gold/20',
    tertiary:
      'text-pale-gold dark:text-neon-gold hover:text-pale-gold/80 dark:hover:text-neon-gold/80 active:text-pale-gold dark:active:text-neon-gold',
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      data-testid={testID}
      className={`
        rounded-2xl font-semibold transition-all duration-200
        flex items-center justify-center gap-2
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${variant === 'primary' && !isDisabled ? 'shadow-lg hover:shadow-xl' : ''}
        ${className}
      `}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span>{label}</span>
        </>
      )}
    </button>
  );
};