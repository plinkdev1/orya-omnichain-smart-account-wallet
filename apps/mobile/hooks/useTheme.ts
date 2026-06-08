/**
 * useTheme Hook - Mobile Platform (React Native)
 * Theme management hook for Expo/React Native apps
 * Integrates with Redux store and device appearance
 */

import { darkTheme, lightTheme, type Theme, type ThemeMode } from "@orya/design-tokens";
import { useCallback, useEffect, useState } from "react";
import { Appearance } from "react-native";

// TODO: Import from app Redux store when available
// import { setTheme } from "@/store/slices/appSlice";

/**
 * useTheme Hook - Mobile
 * @example
 * const { mode, theme, toggleTheme } = useTheme();
 * 
 * // Wrap components with theme values
 * <View style={{ backgroundColor: theme.colors.background }}>
 *   {children}
 * </View>
 */
export function useTheme() {
  // TODO: Implement
  // - Connect to Redux app state (appSlice.theme)
  // - Sync with device appearance (Appearance API)
  // - Persist theme to AsyncStorage
  // - Listen to device appearance changes

  const [mode, setMode] = useState<ThemeMode>("light");
  const [theme, setThemeState] = useState<Theme>(lightTheme);

  // On mount, load saved theme or device preference
  useEffect(() => {
    // Get device preference
    const appearance = Appearance.getColorScheme();
    const deviceMode = appearance === "dark" ? "dark" : "light";

    // TODO: Load from AsyncStorage
    // try {
    //   const saved = await AsyncStorage.getItem('theme-mode');
    //   if (saved) {
    //     setMode(saved as ThemeMode);
    //     return;
    //   }
    // } catch (e) {
    //   console.error('[useTheme] Failed to load theme', e);
    // }

    setMode(deviceMode);
  }, []);

  // Update theme object when mode changes
  useEffect(() => {
    setThemeState(mode === "light" ? lightTheme : darkTheme);

    // TODO: Save to AsyncStorage
    // AsyncStorage.setItem('theme-mode', mode).catch(e => {
    //   console.error('[useTheme] Failed to save theme', e);
    // });
  }, [mode]);

  // Subscribe to device appearance changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      const newMode = colorScheme === "dark" ? "dark" : "light";
      setMode(newMode);
    });

    return () => subscription.remove();
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const setThemeMode = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
  }, []);

  return {
    mode,
    theme,
    toggleTheme,
    setTheme: setThemeMode,
    isLight: mode === "light",
    isDark: mode === "dark",
  };
}