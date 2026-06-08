// @ts-nocheck
/**
 * Input Component - React Native
 * Text input with validation, error states, and icons
 */

import { lightTheme } from "@orya/design-tokens";
import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

export interface InputProps {
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  editable?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  secureTextEntry?: boolean;
  testID?: string;
}

/**
 * Input Component - React Native
 * @example
 * <Input
 *   label="Email"
 *   placeholder="user@example.com"
 *   value={email}
 *   onChangeText={setEmail}
 * />
 */
export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  placeholder,
  value,
  onChangeText,
  editable = true,
  keyboardType = "default",
  secureTextEntry = false,
  testID,
}) => {
  // TODO: Implement
  // - Support label rendering
  // - Error and hint text display
  // - Keyboard type selection
  // - Focus management
  // - Error state styling
  // - Accessibility labels

  const theme = lightTheme;

  const styles = StyleSheet.create({
    container: {
      gap: 8,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text_primary,
    },
    inputContainer: {
      borderRadius: 8,
      borderWidth: 1,
      borderColor: error ? theme.colors.error : theme.colors.neutral_300,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: editable ? "white" : theme.colors.neutral_100,
    },
    input: {
      fontSize: 14,
      color: theme.colors.text_primary,
    },
    error: {
      fontSize: 12,
      color: theme.colors.error,
    },
    hint: {
      fontSize: 12,
      color: theme.colors.text_tertiary,
    },
  });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          testID={testID}
          placeholderTextColor={theme.colors.text_tertiary}
          accessible
          accessibilityLabel={label}
          accessibilityState={{ disabled: !editable }}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
};