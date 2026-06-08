'use client';

/**
 * Chain Option Component
 * Radio button selection for blockchain chains
 * Shows chain icon, name, and description
 */

import { Circle, CircleDot } from 'lucide-react';
import { ReactNode } from 'react';

interface ChainOptionProps {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon?: ReactNode;
  color?: string;
  selected?: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  testID?: string;
}

export const ChainOption = ({
  id,
  name,
  shortName,
  description,
  icon,
  color,
  selected = false,
  onClick,
  disabled = false,
  className = '',
  testID,
}: ChainOptionProps) => {
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
      {/* Radio Button */}
      <div className="flex-shrink-0 text-pale-gold dark:text-neon-gold">
        {selected ? (
          <CircleDot className="w-6 h-6" strokeWidth={2} />
        ) : (
          <Circle className="w-6 h-6" strokeWidth={2} />
        )}
      </div>

      {/* Icon */}
      {icon && (
        <div className="flex-shrink-0 text-2xl w-8 h-8 flex items-center justify-center">
          {icon}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-deep-charcoal dark:text-bone-white">
            {name}
          </h3>
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
            {shortName}
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {description}
        </p>
      </div>

      {/* Color Indicator (optional) */}
      {color && (
        <div
          className="flex-shrink-0 w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      )}
    </button>
  );
};