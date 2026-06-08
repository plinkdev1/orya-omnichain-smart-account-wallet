// @ts-nocheck
/**
 * Card Component - React Native
 * Container for grouped content with elevation
 */

import { lightTheme } from "@orya/design-tokens";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export interface CardProps {
  variant?: "flat" | "elevated" | "outlined";
  interactive?: boolean;
  onPress?: () => void;
  padding?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

/**
 * Card Component - React Native
 * @example
 * <Card variant="elevated">
 *   <Text>Card content</Text>
 * </Card>
 */
export const Card: React.FC<CardProps> = ({
  variant = "elevated",
  interactive = false,
  onPress,
  padding = "md",
  children,
}) => {
  // TODO: Implement
  // - Apply variant styles
  // - Support touchable if interactive
  // - Read tokens for spacing, radius, shadows
  // - Apply platform-specific shadows (RN elevation API)
  // - Smooth animations on press

  const theme = lightTheme;

  const paddingMap = {
    sm: 12,
    md: 16,
    lg: 24,
  };

  const variantStyles = {
    flat: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.neutral_200,
    },
    elevated: {
      backgroundColor: theme.colors.surface,
      elevation: 4,
      shadowColor: theme.colors.text_primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    outlined: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: theme.colors.neutral_300,
    },
  };

  const styles = StyleSheet.create({
    card: {
      borderRadius: 12,
      padding: paddingMap[padding],
      ...variantStyles[variant],
    },
  });

  const Container = interactive ? TouchableOpacity : View;

  if (interactive) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={styles.card}
      accessible={false}
    >
      {children}
    </View>
  );
};