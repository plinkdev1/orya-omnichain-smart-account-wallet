'use client';

/**
 * useCopy Hook - Web Platform
 * Provides access to localized copy dictionary with branding context support
 * Supports branded/non-branded mode and premium tier switching
 */

import { copyEN } from "../copy/en";
import { useBranding } from "../contexts/BrandingContext";

type NestedValue = string | Record<string, string>;

interface CopyDict {
  [key: string]: NestedValue;
}

/**
 * Web-specific copy hook
 * Returns copy dictionary based on branding mode and tier
 * @example
 * const copy = useCopy();
 * copy.nav.vault
 * copy.actions.send
 * copy.errors.insufficientBalance
 */
export function useCopy(): typeof copyEN {
  try {
    const { copy } = useBranding();
    return copy;
  } catch {
    return copyEN;
  }
}

/**
 * Get copy value by path (dot notation)
 * Useful for dynamic key access
 * @example
 * getCopyByPath('nav.vault')
 * getCopyByPath('actions.send')
 */
export function getCopyByPath(path: string, dict: CopyDict = copyEN): string {
  return path.split(".").reduce((obj, key) => {
    const value = obj?.[key];
    return typeof value === "string" ? value : obj;
  }, dict as any) as string;
}

/**
 * Type-safe copy getter with autocomplete
 * Can be extended for runtime language switching
 */
export const copy = copyEN;