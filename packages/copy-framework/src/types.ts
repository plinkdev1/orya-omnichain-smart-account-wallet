/**
 * Copy Framework Types
 * Defines the structure for microcopy tokens and dictionaries
 */

/**
 * Variable replacement map for copy strings with placeholders
 * Example: { amount: "1,234.56", token: "ETH" }
 */
export interface CopyVariables {
  [key: string]: string | number | boolean;
}

/**
 * Copy dictionary containing all localized strings
 * Maps token keys to their localized values
 * Values can contain placeholders like {variableName}
 */
export interface CopyDictionary {
  [key: string]: string | CopyDictionary;
}

/**
 * Platform-specific copy variants
 * Allows different copy between web and mobile
 */
export interface PlatformCopy {
  web: CopyDictionary;
  mobile: CopyDictionary;
}

/**
 * Tier-specific copy variants
 * Supports standard vs premium tiers with different messaging
 */
export interface TieredCopy {
  standard: CopyDictionary;
  premium: CopyDictionary;
}

/**
 * Complete copy configuration
 * Combines platform and tier variants
 */
export interface CopyConfig {
  web: {
    en: TieredCopy;
    // Future: es, fr, etc.
  };
  mobile: {
    en: TieredCopy;
    // Future: es, fr, etc.
  };
}

/**
 * Resolved copy value with variable substitution
 */
export interface ResolvedCopy {
  raw: string;
  resolved: string;
  hasUnresolvedVariables: boolean;
  unresolvedVariables: string[];
}

/**
 * Copy token key path (flattened dot notation)
 * Example: "auth.passwordMismatch" or "vault.summary.totalBalance"
 */
export type CopyTokenKey = string & { readonly __brand: "CopyTokenKey" };

/**
 * Options for copy resolution
 */
export interface CopyResolveOptions {
  allowMissing?: boolean;
  allowUnresolved?: boolean;
  throwOnMissing?: boolean;
}

/**
 * Copy resolver function type
 */
export type CopyResolverFn = (
  key: CopyTokenKey,
  variables?: CopyVariables,
  options?: CopyResolveOptions
) => ResolvedCopy | string;

/**
 * Copy hook context
 */
export interface CopyContextValue {
  dict: CopyDictionary;
  tier: "standard" | "premium";
  platform: "web" | "mobile";
  language: "en"; // Future: expand to other languages
  resolve: CopyResolverFn;
  get: (key: CopyTokenKey) => string | undefined;
}