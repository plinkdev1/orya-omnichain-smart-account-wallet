'use client';

/**
 * Progress Bar Component
 * Step indicator for onboarding flow
 * Supports both dots style and linear percentage bar
 */

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  style?: 'dots' | 'linear';
  className?: string;
  testID?: string;
}

export const ProgressBar = ({
  currentStep,
  totalSteps,
  style = 'dots',
  className = '',
  testID,
}: ProgressBarProps) => {
  const percentage = ((currentStep + 1) / totalSteps) * 100;

  if (style === 'linear') {
    return (
      <div
        className={`w-full mb-6 ${className}`}
        data-testid={testID}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            {Math.round(percentage)}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pale-gold to-pale-gold/80 dark:from-neon-gold dark:to-neon-gold/80 transition-all duration-300 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }

  // Dots style (default)
  return (
    <div
      className={`flex justify-center gap-2 mb-8 ${className}`}
      data-testid={testID}
    >
      {Array.from({ length: totalSteps }).map((_, index) => (
        <button
          key={index}
          className={`
            rounded-full transition-all duration-200
            ${index <= currentStep
              ? 'w-2.5 h-2.5 bg-pale-gold dark:bg-neon-gold'
              : 'w-2 h-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
            }
          `}
          disabled
          aria-label={`Step ${index + 1}`}
        />
      ))}
    </div>
  );
};