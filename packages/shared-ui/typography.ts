/**
 * ORYA Typography System
 * Font sizes, weights, and line heights
 */

export const FONT_FAMILIES = {
  heading: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  body: 'Merriweather, -apple-system, BlinkMacSystemFont, "Segoe UI", serif',
  mono: '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", "Courier New", monospace',
} as const;

export const FONT_WEIGHTS = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const LINE_HEIGHTS = {
  tight: 1.2,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const;

export const TYPOGRAPHY_STYLES = {
  h1: {
    size: FONT_SIZES['3xl'],
    weight: FONT_WEIGHTS.bold,
    lineHeight: LINE_HEIGHTS.tight,
    family: FONT_FAMILIES.heading,
  },
  h2: {
    size: FONT_SIZES['2xl'],
    weight: FONT_WEIGHTS.bold,
    lineHeight: LINE_HEIGHTS.snug,
    family: FONT_FAMILIES.heading,
  },
  h3: {
    size: FONT_SIZES.xl,
    weight: FONT_WEIGHTS.semibold,
    lineHeight: LINE_HEIGHTS.snug,
    family: FONT_FAMILIES.heading,
  },
  body: {
    size: FONT_SIZES.base,
    weight: FONT_WEIGHTS.normal,
    lineHeight: LINE_HEIGHTS.normal,
    family: FONT_FAMILIES.body,
  },
  caption: {
    size: FONT_SIZES.sm,
    weight: FONT_WEIGHTS.normal,
    lineHeight: LINE_HEIGHTS.normal,
    family: FONT_FAMILIES.body,
  },
  small: {
    size: FONT_SIZES.xs,
    weight: FONT_WEIGHTS.normal,
    lineHeight: LINE_HEIGHTS.normal,
    family: FONT_FAMILIES.body,
  },
} as const;

export type TypographyStyle = keyof typeof TYPOGRAPHY_STYLES;
export type FontSize = keyof typeof FONT_SIZES;
export type FontWeight = keyof typeof FONT_WEIGHTS;
export type LineHeight = keyof typeof LINE_HEIGHTS;

export function getTypographyStyle(style: TypographyStyle) {
  return TYPOGRAPHY_STYLES[style];
}