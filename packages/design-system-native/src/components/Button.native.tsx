// @ts-nocheck
/**
 * Button Component - React Native
 * Touch-optimized button with gestures and animations
 * Platform-specific: RN primitives + Reanimated for animations
 */

import { lightTheme } from "@orya/design-tokens";
import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  children: string | React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
}

/**
 * Button Component - React Native
 * @example
 * <Button variant="primary" size="md" onPress={handlePress}>Click me</Button>
 */
export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  children,
  onPress,
  disabled = false,
  testID,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  // TODO: Implement
  // - Use RN StyleSheet for performance
  // - Reanimated animations for press/release
  // - Gesture handling via react-native-gesture-handler
  // - Platform-specific haptics (iOS/Android)
  // - Accessibility labels (accessible, accessibilityRole)
  // - Read tokens for colors, spacing
  // - Support different sizes with responsive scaling

  const theme = lightTheme; // TODO: Read from theme context

  const variantStyles = {
    primary: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    secondary: {
      backgroundColor: theme.colors.neutral_200,
      borderColor: theme.colors.neutral_300,
    },
    ghost: {
      backgroundColor: "transparent",
      borderColor: theme.colors.primary,
    },
    danger: {
      backgroundColor: theme.colors.error,
      borderColor: theme.colors.error,
    },
  };

  const sizeMap = {
    sm: { paddingVertical: 8, paddingHorizontal: 12, fontSize: 12 },
    md: { paddingVertical: 12, paddingHorizontal: 16, fontSize: 14 },
    lg: { paddingVertical: 16, paddingHorizontal: 20, fontSize: 16 },
  };

  const styles = StyleSheet.create({
    button: {
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      width: fullWidth ? "100%" : "auto",
      opacity: disabled || loading ? 0.5 : 1,
      ...variantStyles[variant],
      ...sizeMap[size],
    },
    text: {
      fontWeight: "600",
      color: variant === "ghost" ? theme.colors.primary : "white",
    },
  });

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      disabled={disabled || loading}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      activeOpacity={0.7}
      testID={testID}
      accessible
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <>
          {typeof children === "string" ? (
            <Text style={styles.text}>{children}</Text>
          ) : (
            children
          )}
        </>
      )}
    </TouchableOpacity>
  );
};