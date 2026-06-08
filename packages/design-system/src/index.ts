/**
 * Design System - Main Export (Facade)
 * 
 * This is a platform-agnostic facade that re-exports platform-specific
 * component implementations. Build tools (Webpack, Metro) will resolve
 * the correct platform at build-time based on the app context.
 *
 * Usage:
 * - Web apps: import { Button } from '@orya/design-system'
 * - Mobile apps: import { Button } from '@orya/design-system'
 * - Explicit: import { Button } from '@orya/design-system/web'
 *            import { Button } from '@orya/design-system/native'
 *
 * Platform Resolution:
 * - Webpack (web): resolves to @orya/design-system-web
 * - Metro (mobile): resolves to @orya/design-system-native
 * - tsc (TS): uses @orya/design-system-web as default
 */

// TODO: Future implementation
// - Implement runtime platform detection (if needed)
// - Support platform override via context
// - Export platform detection utility

// Default export for TypeScript - web platform
export * from "@orya/design-system-web";

// Also export tokens
export { darkTheme, lightTheme, tokens } from "@orya/design-tokens";
