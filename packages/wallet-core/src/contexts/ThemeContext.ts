/**
 * Theme Context - Provides theme across app
 * Used by useTheme hook to access current theme
 * 
 * For React apps: wrap with <ThemeProvider>
 * For RN: wrap with theme object in app wrapper
 * 
 * @orya/design-tokens is an optional dependency
 */

// Optional: design tokens theme
let designTheme: any = {
  light: { primary: "#D4C29E", background: "#F8F6F1", text: "#1A1A1A" },
  dark: { primary: "#FFD700", background: "#111111", text: "#F8F6F1" },
};

try {
  const designTokens = require("@orya/design-tokens");
  designTheme = designTokens;
} catch (error) {
  console.warn("@orya/design-tokens not available - using fallback theme");
}

// Create a minimal React context replacement for non-React environments
let createContext: any = null;

try {
  const react = require("react");
  createContext = react.createContext;
} catch (error) {
  // Fallback for non-React environments
  createContext = (defaultValue: any) => ({
    Provider: ({ value, children }: any) => children,
    Consumer: ({ children }: any) => children(defaultValue),
    _currentValue: defaultValue,
    displayName: "Context"
  });
}

export type ThemeMode = "light" | "dark";
export interface Theme {
  primary: string;
  background: string;
  text: string;
  [key: string]: any;
}

export interface ThemeContextValue {
  mode: ThemeMode;
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const lightTheme: Theme = designTheme.light || { primary: "#D4C29E", background: "#F8F6F1", text: "#1A1A1A" };

const defaultValue: ThemeContextValue = {
  mode: "light",
  theme: lightTheme,
  toggleTheme: () => console.log("[ThemeContext] toggleTheme not implemented"),
  setTheme: () => console.log("[ThemeContext] setTheme not implemented"),
};

export const ThemeContext = createContext(defaultValue) as any;

ThemeContext.displayName = "ThemeContext";