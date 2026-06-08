/**
 * ORYA Design System - Animation Tokens
 * Smooth, intentional micro-interactions
 * 
 * Hover effects: 150-200ms lift + glow
 * Portal transitions: 300-500ms slide
 * Easing: ease-in-out curves
 */

export const animations = {
  durations: {
    fast: 150,
    normal: 300,
    slow: 500,
    verySlow: 800,
  },
  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    linear: 'linear',
  },
  transitions: {
    hover: {
      duration: 175,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      properties: ['transform', 'box-shadow'],
    },
    portal: {
      duration: 400,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      properties: ['transform', 'opacity'],
    },
    fade: {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      properties: ['opacity'],
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    glow: '0 0 20px rgba(212, 194, 158, 0.3)', // Pale Gold glow
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    full: 9999,
  },
};