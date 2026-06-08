/**
 * ORYA Design System - Typography Tokens
 * Premium typography system for luxury aesthetic
 * 
 * Headers: Inter / Roboto Bold (32px H1, 24px H2)
 * Body: Merriweather (16px)
 * Captions: 12px (system font)
 */

export const typography = {
  // Headers
  heading: {
    h1: {
      fontFamily: 'Inter, Roboto, sans-serif',
      fontSize: 32,
      fontWeight: 'bold' as const,
      lineHeight: 1.2,
      letterSpacing: -0.5,
    },
    h2: {
      fontFamily: 'Inter, Roboto, sans-serif',
      fontSize: 24,
      fontWeight: 'bold' as const,
      lineHeight: 1.3,
      letterSpacing: -0.25,
    },
    h3: {
      fontFamily: 'Inter, Roboto, sans-serif',
      fontSize: 20,
      fontWeight: 'bold' as const,
      lineHeight: 1.4,
    },
    h4: {
      fontFamily: 'Inter, Roboto, sans-serif',
      fontSize: 18,
      fontWeight: 'bold' as const,
      lineHeight: 1.5,
    },
  },
  // Body text
  body: {
    large: {
      fontFamily: 'Merriweather, serif',
      fontSize: 18,
      fontWeight: 'normal' as const,
      lineHeight: 1.6,
    },
    medium: {
      fontFamily: 'Merriweather, serif',
      fontSize: 16,
      fontWeight: 'normal' as const,
      lineHeight: 1.6,
    },
    small: {
      fontFamily: 'Merriweather, serif',
      fontSize: 14,
      fontWeight: 'normal' as const,
      lineHeight: 1.5,
    },
  },
  // Captions
  caption: {
    fontSize: 12,
    fontWeight: 'normal' as const,
    lineHeight: 1.4,
  },
};

export type TypographyVariant = keyof typeof typography;