/**
 * useCopy Hook - Mobile Platform
 * Provides access to mobile-optimized copy dictionary
 * Supports React Native with i18n integration stub
 */

import { copyPremiumEN } from "../copy/premium-en";

type NestedValue = string | Record<string, string>;

interface CopyDict {
  [key: string]: NestedValue;
}

/**
 * Mobile-specific copy hook
 * Returns mobile-optimized, concise copy
 * @example
 * const copy = useCopy();
 * copy.nav.vault
 * copy.actions.send
 * copy.errors.insufficientBalance
 */
export function useCopy(): typeof copyPremiumEN {
  // TODO: Future implementation
  // - Accept language parameter from Redux or Context
  // - Support react-i18next with React Native
  // - Load language files dynamically
  // - Cache translations in AsyncStorage
  // - Handle RTL languages (Arabic, Hebrew)

  return copyPremiumEN;
}

/**
 * Get copy value by path (dot notation)
 * Useful for dynamic key access in mobile forms
 * @example
 * getCopyByPath('nav.vault')
 * getCopyByPath('errors.insufficientBalance')
 */
export function getCopyByPath(path: string, dict: CopyDict = copyPremiumEN): string {
  return path.split(".").reduce((obj, key) => {
    const value = obj?.[key];
    return typeof value === "string" ? value : obj;
  }, dict as any) as string;
}

/**
 * Mobile copy reference (premium tier)
 * Can be extended for free/premium tier differences
 */
export const copy = copyPremiumEN;