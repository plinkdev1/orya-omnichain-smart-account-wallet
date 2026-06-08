/**
 * ORYA Color System
 * Centralized for consistent theming across platforms
 */

export const COLORS_LIGHT = {
  background: '#F8F6F1',
  primary: '#D4C29E',
  text: '#1A1A1A',
  textSecondary: '#666666',
  textTertiary: '#999999',
  border: '#E0DDD8',
  surface: '#FFFFFF',
  surfaceHover: '#F5F3F0',
  divider: '#E5E2DD',
} as const;

export const COLORS_DARK = {
  background: '#111111',
  primary: '#FFD700',
  text: '#F8F6F1',
  textSecondary: '#CCCCCC',
  textTertiary: '#999999',
  border: '#333333',
  surface: '#1A1A1A',
  surfaceHover: '#2A2A2A',
  divider: '#404040',
} as const;

export const COLORS_SEMANTIC = {
  success: '#10B981',
  successLight: '#D1FAE5',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
} as const;

export const COLORS_GRADIENTS = {
  luxuryLight: {
    from: '#F8F6F1',
    via: '#D4C29E',
    to: '#D4C29E',
  },
  luxuryDark: {
    from: '#111111',
    via: '#1A1A1A',
    to: '#1A1A1A',
  },
  accent: {
    from: '#D4C29E',
    to: '#FFD700',
  },
} as const;

export type LightColor = keyof typeof COLORS_LIGHT;
export type DarkColor = keyof typeof COLORS_DARK;
export type SemanticColor = keyof typeof COLORS_SEMANTIC;

export function getLightColor(name: LightColor): string {
  return COLORS_LIGHT[name];
}

export function getDarkColor(name: DarkColor): string {
  return COLORS_DARK[name];
}

export function getSemanticColor(name: SemanticColor): string {
  return COLORS_SEMANTIC[name];
}