/**
 * useTheme Hook - Web Platform
 * Theme management hook for Next.js apps
 * Integrates with Redux store and Next.js dark mode
 * Uses storage abstraction from shared-utils
 */

import { darkTheme, lightTheme, type Theme, type ThemeMode } from "@orya/design-tokens";
import { getStorageItem, setStorageItem } from "@orya/shared-utils";
import { useCallback, useEffect, useState } from "react";

// TODO: Import from app Redux store when available
// import { setTheme } from "@/store/slices/appSlice";

/**
 * useTheme Hook - Web
 * @example
 * const { mode, theme, toggleTheme } = useTheme();
 * 
 * // Apply to document
 * useEffect(() => {
 *   document.documentElement.setAttribute('data-theme', mode);
 * }, [mode]);
 */
export function useTheme() {
  // TODO: Implement
  // - Connect to Redux app state (appSlice.theme)
  // - Sync with localStorage
  // - Listen to system preference changes (prefers-color-scheme)
  // - Apply data-theme attribute to document.documentElement

  const [mode, setMode] = useState<ThemeMode>("light");
  const [theme, setThemeState] = useState<Theme>(lightTheme);
  const [mounted, setMounted] = useState(false);

  // On mount, load saved theme preference
  useEffect(() => {
    setMounted(true);

    // Load from storage or system preference
    const loadTheme = async () => {
      try {
        const saved = await getStorageItem("theme-mode");
        if (saved && (saved === "dark" || saved === "light")) {
          setMode(saved as ThemeMode);
        } else {
          // Detect system preference
          const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          setMode(prefersDark ? "dark" : "light");
        }
      } catch (e) {
        console.error("[useTheme] Failed to load theme from storage", e);
      }
    };

    loadTheme();
  }, []);

  // Update theme object when mode changes
  useEffect(() => {
    setThemeState(mode === "light" ? lightTheme : darkTheme);
    
    // Apply to document and persist
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", mode);
      setStorageItem("theme-mode", mode);
    }
  }, [mode]);

  const toggleTheme = useCallback(() => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const setThemeMode = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
  }, []);

  return {
    mode: mounted ? mode : "light",
    theme: mounted ? theme : lightTheme,
    toggleTheme,
    setTheme: setThemeMode,
    isLight: mode === "light",
    isDark: mode === "dark",
  };
}