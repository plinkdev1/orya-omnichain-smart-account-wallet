/**
 * Typography Components - Web
 * Semantic heading and text components with built-in styling
 */

import React from "react";

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "body_lg" | "body_base" | "body_sm" | "caption" | "label";
  as?: React.ElementType;
  color?: "primary" | "secondary" | "tertiary" | "inverse" | "success" | "error" | "warning";
}

/**
 * Typography Component
 * @example
 * <Typography variant="h1">Main Title</Typography>
 * <Typography variant="body_base" color="secondary">Body text</Typography>
 */
export const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  (
    {
      variant = "body_base",
      as,
      color = "primary",
      children,
      className = "",
      ...props
    },
    ref
  ) => {
    // TODO: Implement
    // - Map variant to typography tokens
    // - Support semantic HTML elements
    // - Apply color variants
    // - Read tokens for font-family, size, weight, line-height
    // - Support color variants (primary, secondary, tertiary, inverse, status colors)

    const variantStyles = {
      h1: "text-4xl font-bold tracking-tight",
      h2: "text-3xl font-bold tracking-tight",
      h3: "text-2xl font-semibold",
      h4: "text-xl font-semibold",
      h5: "text-lg font-semibold",
      body_lg: "text-lg",
      body_base: "text-base",
      body_sm: "text-sm",
      caption: "text-xs uppercase tracking-wide",
      label: "text-sm font-medium",
    };

    const colorStyles = {
      primary: "text-text-primary",
      secondary: "text-text-secondary",
      tertiary: "text-text-tertiary",
      inverse: "text-text-inverse",
      success: "text-success",
      error: "text-error",
      warning: "text-warning",
    };

    const componentMap: Record<string, React.ElementType> = {
      h1: "h1",
      h2: "h2",
      h3: "h3",
      h4: "h4",
      h5: "h5",
      body_lg: "p",
      body_base: "p",
      body_sm: "p",
      caption: "span",
      label: "label",
    };

    const Component = as || componentMap[variant] || "span";
    const classes = `${variantStyles[variant]} ${colorStyles[color]} ${className}`;

    return (
      <Component ref={ref} className={classes} {...props}>
        {children}
      </Component>
    );
  }
);

Typography.displayName = "Typography";

// Convenience exports for common variants
export const H1 = (props: TypographyProps) => <Typography {...props} variant="h1" as="h1" />;
export const H2 = (props: TypographyProps) => <Typography {...props} variant="h2" as="h2" />;
export const H3 = (props: TypographyProps) => <Typography {...props} variant="h3" as="h3" />;
export const H4 = (props: TypographyProps) => <Typography {...props} variant="h4" as="h4" />;
export const H5 = (props: TypographyProps) => <Typography {...props} variant="h5" as="h5" />;
export const Body = (props: TypographyProps) => <Typography {...props} variant="body_base" />;
export const Caption = (props: TypographyProps) => <Typography {...props} variant="caption" />;
export const Label = (props: TypographyProps) => <Typography {...props} variant="label" />;