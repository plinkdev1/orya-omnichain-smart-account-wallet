/**
 * ORYA Design System - Color Tokens
 * Luxury aesthetic with premium color palette
 * 
 * Light Mode:
 * - Background: Bone White #F8F6F1
 * - Primary Accent: Pale Gold #D4C29E
 * - Text Primary: Deep Charcoal #1A1A1A
 * 
 * Dark Mode:
 * - Background: Deep Charcoal #111111
 * - Primary Accent: Neon Gold #FFD700
 * - Text Primary: Bone White #F8F6F1
 */

export const colors = {
  // Light mode
  light: {
    background: '#F8F6F1',
    surfacePrimary: '#FFFFFF',
    surfaceSecondary: '#F2F0EC',
    accentPrimary: '#D4C29E',
    accentSecondary: '#E8D4B8',
    textPrimary: '#1A1A1A',
    textSecondary: '#4A4A4A',
    textTertiary: '#7A7A7A',
    border: '#D9D5CF',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  // Dark mode
  dark: {
    background: '#111111',
    surfacePrimary: '#1F1F1F',
    surfaceSecondary: '#2A2A2A',
    accentPrimary: '#FFD700',
    accentSecondary: '#FFE680',
    textPrimary: '#F8F6F1',
    textSecondary: '#D0CCC6',
    textTertiary: '#A8A29E',
    border: '#3A3A3A',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
};

export type ColorScheme = 'light' | 'dark';
export type ColorToken = keyof typeof colors.light;