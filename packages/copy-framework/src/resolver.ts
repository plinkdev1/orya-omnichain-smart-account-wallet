/**
 * Copy Resolver
 * Handles variable replacement in copy strings
 * Supports placeholders like {variableName}
 */

import type { CopyVariables, ResolvedCopy } from "./types";

/**
 * Variable placeholder pattern: {variableName}
 */
const PLACEHOLDER_PATTERN = /\{([a-zA-Z_$][a-zA-Z0-9_$]*)\}/g;

/**
 * Extract variable names from a copy string
 * @param text - The copy string that may contain placeholders
 * @returns Array of variable names found in the text
 */
export function extractVariables(text: string): string[] {
  const matches = text.matchAll(PLACEHOLDER_PATTERN);
  return Array.from(matches, (match) => match[1]);
}

/**
 * Check if a string contains unresolved variables
 * @param text - The copy string to check
 * @param variables - Map of available variables
 * @returns Array of unresolved variable names
 */
export function getUnresolvedVariables(
  text: string,
  variables?: CopyVariables
): string[] {
  const placeholders = extractVariables(text);
  if (!variables) {
    return placeholders;
  }
  return placeholders.filter((v) => !(v in variables));
}

/**
 * Replace placeholders in copy string with provided variables
 * @param text - The copy string with placeholders
 * @param variables - Map of variable names to values
 * @returns Resolved string with all available variables replaced
 */
export function resolveCopy(
  text: string,
  variables?: CopyVariables
): string {
  if (!variables) {
    return text;
  }

  return text.replace(PLACEHOLDER_PATTERN, (match, variableName) => {
    if (variableName in variables) {
      return String(variables[variableName]);
    }
    // Return original placeholder if variable not found
    return match;
  });
}

/**
 * Create a copy resolver function
 * @param text - The raw copy string
 * @param variables - Optional variables to replace
 * @returns Resolved copy object with metadata
 */
export function createCopyResolver(
  text: string,
  variables?: CopyVariables
): ResolvedCopy {
  const unresolvedVariables = getUnresolvedVariables(text, variables);
  const resolved = resolveCopy(text, variables);

  return {
    raw: text,
    resolved,
    hasUnresolvedVariables: unresolvedVariables.length > 0,
    unresolvedVariables,
  };
}

/**
 * Batch resolve multiple copy strings
 * @param copies - Map of keys to copy strings
 * @param variables - Shared variables for all copies
 * @returns Map of keys to resolved copy objects
 */
export function resolveMultiple(
  copies: Record<string, string>,
  variables?: CopyVariables
): Record<string, ResolvedCopy> {
  const result: Record<string, ResolvedCopy> = {};

  for (const [key, text] of Object.entries(copies)) {
    result[key] = createCopyResolver(text, variables);
  }

  return result;
}

/**
 * Format copy with strict variable validation
 * Throws error if any variables are missing
 * @param text - The copy string
 * @param variables - Variables to replace
 * @throws Error if any required variables are missing
 * @returns Resolved string
 */
export function formatCopyStrict(
  text: string,
  variables: CopyVariables
): string {
  const unresolved = getUnresolvedVariables(text, variables);

  if (unresolved.length > 0) {
    throw new Error(
      `Missing required variables for copy: ${unresolved.join(", ")}\n` +
        `Provided: ${Object.keys(variables).join(", ")}\n` +
        `Original: "${text}"`
    );
  }

  return resolveCopy(text, variables);
}

/**
 * Format copy with lenient variable validation
 * Returns copy with unresolved variables as-is
 * @param text - The copy string
 * @param variables - Variables to replace
 * @returns Resolved string (may contain unresolved placeholders)
 */
export function formatCopyLenient(
  text: string,
  variables?: CopyVariables
): string {
  return resolveCopy(text, variables);
}

/**
 * Create a pre-configured resolver for a specific set of variables
 * Useful for creating bound resolvers
 * @param variables - Base variables
 * @returns Function that resolves copy with merged variables
 */
export function createBoundResolver(variables: CopyVariables) {
  return (text: string, additionalVariables?: CopyVariables) => {
    const merged = { ...variables, ...additionalVariables };
    return createCopyResolver(text, merged);
  };
}

/**
 * Validate that all required variables are provided
 * @param text - The copy string to validate
 * @param variables - Variables provided
 * @returns Object with validation result and details
 */
export function validateCopyVariables(
  text: string,
  variables?: CopyVariables
): {
  valid: boolean;
  missing: string[];
  extra: string[];
  message: string;
} {
  const required = extractVariables(text);
  const provided = Object.keys(variables || {});

  const missing = required.filter((v) => !provided.includes(v));
  const extra = provided.filter((v) => !required.includes(v));

  return {
    valid: missing.length === 0,
    missing,
    extra,
    message:
      missing.length > 0
        ? `Missing variables: ${missing.join(", ")}`
        : extra.length > 0
          ? `Unused variables: ${extra.join(", ")}`
          : "All variables valid",
  };
}

/**
 * Common variable replacers for frequently used patterns
 */
export const commonReplacers = {
  /**
   * Format amount with currency
   * Example: "{amount} {currency}" -> "1,234.56 USD"
   */
  amount: (amount: number | string, currency: string = "USD") => ({
    amount: String(amount),
    currency,
  }),

  /**
   * Format date
   */
  date: (date: Date | string) => ({
    date: typeof date === "string" ? date : date.toLocaleDateString(),
  }),

  /**
   * Format user name
   */
  user: (firstName: string, lastName?: string) => ({
    user: lastName ? `${firstName} ${lastName}` : firstName,
  }),

  /**
   * Format address (truncate)
   */
  address: (address: string, chars: number = 6) => ({
    address: `${address.slice(0, chars)}...${address.slice(-chars)}`,
  }),

  /**
   * Format percentage
   */
  percent: (percent: number | string) => ({
    percent: `${percent}%`,
  }),
} as const;