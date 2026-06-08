/**
 * Button Component - Web
 * Primary interactive element for actions
 * Supports variants: primary, secondary, ghost, danger
 * Sizes: sm, md, lg
 * States: default, hover, active, disabled, loading
 */

import React from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

/**
 * Button Component
 * @example
 * <Button variant="primary" size="md">Click me</Button>
 * <Button variant="danger" loading>Loading...</Button>
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      icon,
      iconPosition = "left",
      children,
      disabled,
      className = "",
      ...props
    },
    ref
  ) => {
    // TODO: Implement
    // - Generate CSS classes based on variant, size
    // - Read tokens for padding, border-radius, colors
    // - Apply theme-specific colors (light/dark)
    // - Handle focus ring for accessibility
    // - Implement loading spinner
    // - Support icon rendering with proper spacing
    // - Support aria-busy for loading state

    const baseStyles = `
      inline-flex items-center justify-center
      font-medium rounded-lg transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      ${fullWidth ? "w-full" : ""}
      ${loading ? "opacity-75 cursor-wait" : ""}
    `;

    const variantStyles = {
      primary: "bg-primary text-white hover:shadow-md active:shadow-lg",
      secondary: "bg-neutral-200 text-text-primary hover:bg-neutral-300",
      ghost: "text-primary hover:bg-primary/10 active:bg-primary/20",
      danger: "bg-error text-white hover:shadow-md active:shadow-lg",
    };

    const sizeStyles = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    };

    const classes = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={classes}
        aria-busy={loading}
        {...props}
      >
        {icon && iconPosition === "left" && <span className="mr-2">{icon}</span>}
        {children}
        {icon && iconPosition === "right" && <span className="ml-2">{icon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";