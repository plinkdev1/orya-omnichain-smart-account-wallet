/**
 * ORYA Animation System
 * Timing, easing, and predefined animations
 */

export const ANIMATION_TIMING = {
  fast: 150,      // ms - Quick interactions
  normal: 300,    // ms - Standard animations
  slow: 500,      // ms - Entrance/exit animations
  verySlow: 1000, // ms - Slow transitions
} as const;

export const ANIMATION_EASING = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOutCirc: 'cubic-bezier(0, 0.55, 0.45, 1)',
  easeOutBack: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

// Web-specific animations (CSS/Tailwind compatible)
export const WEB_ANIMATIONS = {
  fadeIn: {
    keyframes: {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },
    duration: ANIMATION_TIMING.normal,
    easing: ANIMATION_EASING.easeOut,
  },
  slideUp: {
    keyframes: {
      '0%': { transform: 'translateY(16px)', opacity: '0' },
      '100%': { transform: 'translateY(0)', opacity: '1' },
    },
    duration: ANIMATION_TIMING.slow,
    easing: ANIMATION_EASING.easeOut,
  },
  slideDown: {
    keyframes: {
      '0%': { transform: 'translateY(-16px)', opacity: '0' },
      '100%': { transform: 'translateY(0)', opacity: '1' },
    },
    duration: ANIMATION_TIMING.slow,
    easing: ANIMATION_EASING.easeOut,
  },
  scaleIn: {
    keyframes: {
      '0%': { transform: 'scale(0.95)', opacity: '0' },
      '100%': { transform: 'scale(1)', opacity: '1' },
    },
    duration: ANIMATION_TIMING.normal,
    easing: ANIMATION_EASING.easeOut,
  },
  pulseGlow: {
    keyframes: {
      '0%, 100%': { boxShadow: '0 0 0 0 rgba(212, 194, 158, 0.7)' },
      '50%': { boxShadow: '0 0 0 8px rgba(212, 194, 158, 0)' },
    },
    duration: 2000,
    easing: ANIMATION_EASING.easeInOut,
  },
} as const;

// Mobile-specific animations (React Native Reanimated compatible)
export const MOBILE_ANIMATIONS = {
  fadeIn: {
    duration: ANIMATION_TIMING.normal,
    easing: ANIMATION_EASING.easeOut,
    config: { opacity: [0, 1] },
  },
  slideUp: {
    duration: ANIMATION_TIMING.slow,
    easing: ANIMATION_EASING.easeOut,
    config: { translateY: [16, 0], opacity: [0, 1] },
  },
  slideDown: {
    duration: ANIMATION_TIMING.slow,
    easing: ANIMATION_EASING.easeOut,
    config: { translateY: [-16, 0], opacity: [0, 1] },
  },
  scaleIn: {
    duration: ANIMATION_TIMING.normal,
    easing: ANIMATION_EASING.easeOut,
    config: { scale: [0.95, 1], opacity: [0, 1] },
  },
  bounce: {
    duration: ANIMATION_TIMING.slow,
    easing: ANIMATION_EASING.easeOutBack,
    config: { scale: [0.5, 1] },
  },
} as const;

export type AnimationTiming = keyof typeof ANIMATION_TIMING;
export type AnimationEasing = keyof typeof ANIMATION_EASING;
export type WebAnimation = keyof typeof WEB_ANIMATIONS;
export type MobileAnimation = keyof typeof MOBILE_ANIMATIONS;

export function getAnimationTiming(key: AnimationTiming): number {
  return ANIMATION_TIMING[key];
}

export function getAnimationEasing(key: AnimationEasing): string {
  return ANIMATION_EASING[key];
}

export function getWebAnimation(key: WebAnimation) {
  return WEB_ANIMATIONS[key];
}

export function getMobileAnimation(key: MobileAnimation) {
  return MOBILE_ANIMATIONS[key];
}