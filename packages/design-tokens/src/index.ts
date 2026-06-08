/**
 * ORYA Design System - Centralized Design Tokens
 * Used by both mobile (React Native) and web (Next.js)
 */

export const COLORS = {
  // Light Mode
  light: {
    background: '#F8F6F1',  // Bone White
    primary: '#D4C29E',      // Pale Gold
    text: '#1A1A1A',         // Deep Charcoal
    textSecondary: '#666666',
    border: '#E0DDD8',
    surface: '#FFFFFF',
  },
  // Dark Mode
  dark: {
    background: '#111111',   // Deep Charcoal
    primary: '#FFD700',      // Neon Gold
    text: '#F8F6F1',         // Bone White
    textSecondary: '#CCCCCC',
    border: '#333333',
    surface: '#1A1A1A',
  },
  // Semantic Colors
  semantic: {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  },
};

export const TYPOGRAPHY = {
  heading1: {
    size: 32,
    lineHeight: 1.2,
    weight: 700,
    family: 'Inter',
  },
  heading2: {
    size: 24,
    lineHeight: 1.3,
    weight: 700,
    family: 'Inter',
  },
  heading3: {
    size: 20,
    lineHeight: 1.4,
    weight: 600,
    family: 'Inter',
  },
  body: {
    size: 16,
    lineHeight: 1.5,
    weight: 400,
    family: 'Merriweather',
  },
  caption: {
    size: 12,
    lineHeight: 1.4,
    weight: 400,
    family: 'System',
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
};

export const ANIMATIONS = {
  // Timing
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  // Easing
  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  },
};

export const SHADOWS = {
  soft: {
    web: '0 2px 8px rgba(0, 0, 0, 0.1)',
    mobile: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  },
  medium: {
    web: '0 4px 16px rgba(0, 0, 0, 0.15)',
    mobile: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
  },
  luxury: {
    web: '0 8px 32px rgba(0, 0, 0, 0.2)',
    mobile: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16 },
  },
};

export const DESIGN_SYSTEM = {
  colors: COLORS,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  animations: ANIMATIONS,
  shadows: SHADOWS,
};

// Alias for backwards compatibility
export const tokens = DESIGN_SYSTEM;

// Theme exports for design system packages
export const lightTheme = {
  colors: COLORS.light,
  semanticColors: COLORS.semantic,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  animations: ANIMATIONS,
  shadows: SHADOWS,
};

export const darkTheme = {
  colors: COLORS.dark,
  semanticColors: COLORS.semantic,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  animations: ANIMATIONS,
  shadows: SHADOWS,
};

export default DESIGN_SYSTEM;