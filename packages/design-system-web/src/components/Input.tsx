/**
 * Input Component - Web
 * Text input field with validation, states, and icons
 * Supports: error state, disabled, loading, icon
 */

import React from "react";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * Input Component
 * @example
 * <Input label="Email" placeholder="user@example.com" error="Invalid email" />
 * <Input icon={<SearchIcon />} placeholder="Search..." />
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      icon,
      iconPosition = "left",
      fullWidth = false,
      size = "md",
      className = "",
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    // TODO: Implement
    // - Support label with htmlFor binding
    // - Display error and hint text
    // - Apply focus ring for accessibility
    // - Support icon rendering (left/right)
    // - Apply theme-specific colors
    // - Support different sizes
    // - Implement error state styling

    const containerClasses = `flex flex-col gap-1 ${fullWidth ? "w-full" : ""}`;

    const inputClasses = `
      px-3 py-2 rounded-lg border border-neutral-300
      bg-white text-text-primary placeholder-text-tertiary
      focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0
      disabled:bg-neutral-100 disabled:cursor-not-allowed disabled:text-text-disabled
      transition-all duration-200
      ${error ? "border-error ring-1 ring-error" : ""}
      ${className}
    `;

    return (
      <div className={containerClasses}>
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && iconPosition === "left" && (
            <span className="absolute left-3 text-text-tertiary">{icon}</span>
          )}
          <input
            ref={ref}
            id={id}
            disabled={disabled}
            className={`${inputClasses} ${icon ? (iconPosition === "left" ? "pl-10" : "pr-10") : ""}`}
            {...props}
          />
          {icon && iconPosition === "right" && (
            <span className="absolute right-3 text-text-tertiary">{icon}</span>
          )}
        </div>
        {error && <p className="text-xs text-error">{error}</p>}
        {hint && !error && <p className="text-xs text-text-tertiary">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";