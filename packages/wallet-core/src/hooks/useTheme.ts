/**
 * useTheme Hook - Theme Management
 * Provides access to current theme and theme switching
 * Integrates with Redux state
 * 
 * TODO: Future implementation
 * - Connect to Redux state (themeSlice)
 * - Support theme persistence (localStorage/AsyncStorage)
 * - Sync across browser tabs (storage event)
 * - System preference detection (prefers-color-scheme)
 * - Animation/transition on theme change
 */

import { useMemo } from "react";

// Type stubs for design-tokens (optional dependency)
// Will be replaced with actual types when @orya/design-tokens is available
type ThemeMode = "light" | "dark";
type Theme = any; // Placeholder - will be replaced with actual Theme type

// Stub theme object - replace with actual lightTheme from @orya/design-tokens in production
const lightTheme = {
  colors: {
    background: "#F8F6F1",
    primary: "#D4C29E",
    text_primary: "#1A1A1A",
  },
  typography: {},
  spacing: {},
  shadows: {},
};

export interface UseThemeReturn {
  mode: ThemeMode;
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  isLight: boolean;
  isDark: boolean;
}

/**
 * useTheme Hook - Access theme and switching
 * @example
 * const { mode, theme, toggleTheme } = useTheme();
 * 
 * // Use theme values
 * const { colors, spacing, typography } = theme;
 * 
 * // Toggle theme
 * <Button onClick={toggleTheme}>
 *   Switch to {mode === 'light' ? 'dark' : 'light'} mode
 * </Button>
 */
export function useTheme(): UseThemeReturn {
  // TODO: Implement
  // - Read current theme mode from Redux state (appSlice.theme)
  // - Return appropriate theme object (lightTheme or darkTheme)
  // - Dispatch Redux action on toggleTheme/setTheme
  // - Subscribe to theme changes

  // Stub: default to light theme
  const mode = ("light" as ThemeMode);
  const theme = lightTheme;

  const toggleTheme = () => {
    console.log("[useTheme] TODO: toggleTheme - dispatch Redux action");
    // dispatch(setTheme(mode === 'light' ? 'dark' : 'light'))
  };

  const setTheme = (newMode: ThemeMode) => {
    console.log("[useTheme] TODO: setTheme", newMode);
    // dispatch(setTheme(newMode))
  };

  const isLight = mode === "light";
  const isDark = !isLight;

  return useMemo(
    () => ({
      mode,
      theme,
      toggleTheme,
      setTheme,
      isLight,
      isDark,
    }),
    [mode, theme]
  );
}

/**
 * Get CSS variables for current theme
 * Useful for injecting into document head
 */
export function getThemeCSSVariables(mode: ThemeMode): string {
  // TODO: Move to design-tokens package for reuse
  // Import from @orya/design-tokens:
  // import { generateCSSVariables } from "@orya/design-tokens";
  // return generateCSSVariables(mode);

  console.log("[getThemeCSSVariables] TODO: implement with generateCSSVariables from tokens");
  return "";
}

/**
 * System theme preference detection
 * Returns 'light' or 'dark' based on OS preference
 */
export function getSystemThemePreference(): ThemeMode {
  // TODO: Implement
  // - Check prefers-color-scheme media query
  // - Return 'light' or 'dark'
  // - Fallback to 'light' if not supported

  if (typeof window === "undefined") return "light";

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

/**
 * Subscribe to system theme changes
 * Returns cleanup function
 */
export function subscribeToSystemTheme(callback: (mode: ThemeMode) => void): () => void {
  // TODO: Implement
  // - Use MediaQueryList.addEventListener
  // - Call callback when system theme preference changes
  // - Return cleanup function that removes listener

  console.log("[subscribeToSystemTheme] TODO: implement media query listener");
  return () => {};
}