/**
 * Card Component - Web
 * Container for grouped content with elevation
 * Supports: hover effect, clickable, variants (flat, elevated, outlined)
 */

import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "flat" | "elevated" | "outlined";
  interactive?: boolean;
  onClick?: () => void;
  padding?: "sm" | "md" | "lg";
}

/**
 * Card Component
 * @example
 * <Card variant="elevated">
 *   <h3>Card Title</h3>
 *   <p>Card content</p>
 * </Card>
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = "elevated",
      interactive = false,
      padding = "md",
      children,
      className = "",
      onClick,
      ...props
    },
    ref
  ) => {
    // TODO: Implement
    // - Apply variant styles (shadow, border, background)
    // - Support interactive hover effect
    // - Read tokens for spacing, radius, shadows
    // - Apply theme-specific colors
    // - Support different padding sizes
    // - Smooth transitions on hover

    const paddingMap = {
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
    };

    const variantStyles = {
      flat: "bg-surface border border-neutral-200",
      elevated: "bg-surface shadow-md hover:shadow-lg",
      outlined: "bg-transparent border border-neutral-300 hover:border-primary",
    };

    const classes = `
      rounded-lg transition-all duration-300
      ${paddingMap[padding]}
      ${variantStyles[variant]}
      ${interactive ? "cursor-pointer" : ""}
      ${className}
    `;

    return (
      <div ref={ref} className={classes} onClick={onClick} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";