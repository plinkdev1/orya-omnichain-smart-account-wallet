/**
 * ORYA Shared UI Package
 * Centralized design system and components for mobile & web
 */

// Design tokens
export { ANIMATIONS, BORDER_RADIUS, COLORS, DESIGN_SYSTEM, SHADOWS, SPACING, TYPOGRAPHY } from './design-tokens';
export type { } from './design-tokens';

// Colors
export {
    COLORS_DARK, COLORS_GRADIENTS, COLORS_LIGHT, COLORS_SEMANTIC, getDarkColor, getLightColor, getSemanticColor
} from './colors';
export type { DarkColor, LightColor, SemanticColor } from './colors';

// Typography
export {
    FONT_FAMILIES, FONT_SIZES, FONT_WEIGHTS, LINE_HEIGHTS,
    TYPOGRAPHY_STYLES,
    getTypographyStyle
} from './typography';
export type { FontSize, FontWeight, LineHeight, TypographyStyle } from './typography';

// Animations
export {
    ANIMATION_EASING, ANIMATION_TIMING, MOBILE_ANIMATIONS, WEB_ANIMATIONS, getAnimationEasing, getAnimationTiming, getMobileAnimation, getWebAnimation
} from './animations';
export type { AnimationEasing, AnimationTiming, MobileAnimation, WebAnimation } from './animations';
