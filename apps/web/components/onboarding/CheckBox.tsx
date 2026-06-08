'use client';

/**
 * CheckBox Component
 * Custom styled checkbox for onboarding acceptance confirmations
 */

import { Check } from 'lucide-react';

interface CheckBoxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string | React.ReactNode;
  description?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
  testID?: string;
}

export const CheckBox = ({
  checked,
  onChange,
  label,
  description,
  required = false,
  error,
  disabled = false,
  className = '',
  testID,
}: CheckBoxProps) => {
  return (
    <div className={`flex gap-3 ${className}`} data-testid={testID}>
      {/* Checkbox Input */}
      <button
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`
          flex-shrink-0 mt-1 w-5 h-5 rounded-lg border-2
          transition-all duration-200 flex items-center justify-center
          ${
            checked
              ? 'bg-pale-gold dark:bg-neon-gold border-pale-gold dark:border-neon-gold'
              : 'border-pale-gold/40 dark:border-neon-gold/40 hover:border-pale-gold dark:hover:border-neon-gold'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${error ? 'border-red-500 dark:border-red-400' : ''}
        `}
        aria-label={`Checkbox for ${typeof label === 'string' ? label : 'confirmation'}`}
      >
        {checked && (
          <Check className="w-3.5 h-3.5 text-deep-charcoal dark:text-slate-950" strokeWidth={3} />
        )}
      </button>

      {/* Label Section */}
      <div className="flex-1 min-w-0">
        <label
          className={`
            text-sm font-medium cursor-pointer
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${error ? 'text-red-600 dark:text-red-400' : 'text-deep-charcoal dark:text-bone-white'}
          `}
          onClick={() => !disabled && onChange(!checked)}
        >
          {label}
          {required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
        </label>

        {description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};