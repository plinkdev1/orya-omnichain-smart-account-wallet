'use client';

/**
 * Auth Method Button Component
 * For selecting authentication or wallet connection methods
 * Shows icon, title, and description
 */

import { ChevronRight } from 'lucide-react';

interface AuthMethodButtonProps {
  icon: string | React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
  testID?: string;
}

export const AuthMethodButton = ({
  icon,
  label,
  description,
  onClick,
  selected = false,
  disabled = false,
  className = '',
  testID,
}: AuthMethodButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={testID}
      className={`
        w-full p-4 rounded-2xl border-2 transition-all duration-200
        flex items-center gap-4 mb-3 text-left
        ${
          selected
            ? 'border-pale-gold dark:border-neon-gold bg-pale-gold/5 dark:bg-neon-gold/5'
            : 'border-gray-200 dark:border-gray-700 hover:border-pale-gold/40 dark:hover:border-neon-gold/40'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {/* Icon */}
      <div className="flex-shrink-0 text-2xl w-10 h-10 flex items-center justify-center">
        {typeof icon === 'string' ? icon : icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-deep-charcoal dark:text-bone-white mb-1 truncate">
          {label}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {description}
        </p>
      </div>

      {/* Chevron */}
      <div className="flex-shrink-0">
        <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-pale-gold dark:group-hover:text-neon-gold transition-colors" />
      </div>
    </button>
  );
};