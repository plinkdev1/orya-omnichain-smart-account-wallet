// @ts-nocheck
/**
 * Typography Components - React Native
 * Semantic text components with built-in styling
 */

import { lightTheme } from "@orya/design-tokens";
import React from "react";
import { StyleSheet, Text } from "react-native";

export interface TypographyProps {
  variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "body_lg" | "body_base" | "body_sm" | "caption" | "label";
  color?: "primary" | "secondary" | "tertiary" | "inverse" | "success" | "error" | "warning";
  children: string | React.ReactNode;
  testID?: string;
}

/**
 * Typography Component - React Native
 * @example
 * <Typography variant="h1">Main Title</Typography>
 * <Typography variant="body_base" color="secondary">Body text</Typography>
 */
export const Typography: React.FC<TypographyProps> = ({
  variant = "body_base",
  color = "primary",
  children,
  testID,
}) => {
  // TODO: Implement
  // - Map variant to typography tokens
  // - Apply color variants
  // - Use RN font scaling (allowFontScaling)
  // - Support accessibility text sizes

  const theme = lightTheme;

  const variantStyles = {
    h1: { fontSize: 32, fontWeight: "700" as const },
    h2: { fontSize: 24, fontWeight: "700" as const },
    h3: { fontSize: 20, fontWeight: "600" as const },
    h4: { fontSize: 18, fontWeight: "600" as const },
    h5: { fontSize: 16, fontWeight: "600" as const },
    body_lg: { fontSize: 18, fontWeight: "400" as const },
    body_base: { fontSize: 16, fontWeight: "400" as const },
    body_sm: { fontSize: 14, fontWeight: "400" as const },
    caption: { fontSize: 12, fontWeight: "400" as const },
    label: { fontSize: 14, fontWeight: "500" as const },
  };

  const colorMap = {
    primary: theme.colors.text_primary,
    secondary: theme.colors.text_secondary,
    tertiary: theme.colors.text_tertiary,
    inverse: theme.colors.text_inverse,
    success: theme.colors.success,
    error: theme.colors.error,
    warning: theme.colors.warning,
  };

  const styles = StyleSheet.create({
    text: {
      ...variantStyles[variant],
      color: colorMap[color],
    },
  });

  return (
    <Text style={styles.text} testID={testID} allowFontScaling={true}>
      {children}
    </Text>
  );
};

// Convenience exports
export const H1 = (props: TypographyProps) => <Typography {...props} variant="h1" />;
export const H2 = (props: TypographyProps) => <Typography {...props} variant="h2" />;
export const H3 = (props: TypographyProps) => <Typography {...props} variant="h3" />;
export const H4 = (props: TypographyProps) => <Typography {...props} variant="h4" />;
export const H5 = (props: TypographyProps) => <Typography {...props} variant="h5" />;
export const Body = (props: TypographyProps) => <Typography {...props} variant="body_base" />;
export const Caption = (props: TypographyProps) => <Typography {...props} variant="caption" />;
export const Label = (props: TypographyProps) => <Typography {...props} variant="label" />;