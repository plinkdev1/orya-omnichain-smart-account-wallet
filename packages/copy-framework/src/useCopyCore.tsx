/**
 * Copy Framework Hook
 * Core hook for consuming copy tokens in React components
 * 
 * Usage:
 * const { t } = useCopy();
 * const label = t("auth.signIn");
 * const message = t("flow.send.step4.youSending", { amount: "1.5" });
 */

import React from "react";

import { getUnresolvedVariables, resolveCopy } from "./resolver";
import type {
    CopyDictionary,
    CopyTokenKey,
    CopyVariables,
    ResolvedCopy,
} from "./types";

/**
 * Nested key access helper
 * Handles dot-notation key access: "auth.signIn" -> auth.signIn
 */
function getNestedValue(
  obj: CopyDictionary | string,
  key: string
): string | undefined {
  if (typeof obj === "string") {
    return undefined;
  }

  const keys = key.split(".");
  let current: any = obj;

  for (const k of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[k];
  }

  return typeof current === "string" ? current : undefined;
}

/**
 * Core copy resolver
 * Resolves copy tokens from dictionary with optional variable substitution
 */
export function createCopyResolver(
  dictionary: CopyDictionary,
  onMissing?: (key: string) => void
) {
  return (
    key: CopyTokenKey | string,
    variables?: CopyVariables,
    returnObject: boolean = false
  ): string | ResolvedCopy => {
    const copyString = getNestedValue(dictionary, key);

    if (!copyString) {
      onMissing?.(key);
      console.warn(`[Copy] Missing key: "${key}"`);
      return returnObject
        ? {
            raw: key,
            resolved: key,
            hasUnresolvedVariables: false,
            unresolvedVariables: [],
          }
        : key;
    }

    const resolved = resolveCopy(copyString, variables);
    const unresolvedVariables = getUnresolvedVariables(
      copyString,
      variables
    );

    if (returnObject) {
      return {
        raw: copyString,
        resolved,
        hasUnresolvedVariables: unresolvedVariables.length > 0,
        unresolvedVariables,
      };
    }

    return resolved;
  };
}

/**
 * Copy hook configuration
 */
export interface UseCopyConfig {
  dictionary: CopyDictionary;
  tier?: "standard" | "premium";
  language?: "en";
  onMissing?: (key: string) => void;
  warnUnresolved?: boolean;
}

/**
 * Copy hook return value
 */
export interface UseCopyReturn {
  /**
   * Translate token key to localized string
   * @param key - Token key in dot notation
   * @param variables - Optional variables to replace in copy
   * @returns Localized string with variables resolved
   */
  t: (key: CopyTokenKey | string, variables?: CopyVariables) => string;

  /**
   * Get raw copy object with metadata
   * Useful for debugging or advanced use cases
   */
  tDebug: (key: CopyTokenKey | string, variables?: CopyVariables) => ResolvedCopy;

  /**
   * Get copy value or fallback
   * Returns undefined if key doesn't exist instead of the key itself
   */
  tOptional: (key: CopyTokenKey | string, fallback?: string) => string | undefined;

  /**
   * Get multiple copy values at once
   */
  tMultiple: (keys: Array<CopyTokenKey | string>) => Record<string, string>;

  /**
   * Dictionary reference
   */
  dictionary: CopyDictionary;

  /**
   * Current tier
   */
  tier: "standard" | "premium";

  /**
   * Current language
   */
  language: "en";
}

/**
 * Create copy hook with configuration
 * This is typically called once at app initialization
 */
export function createUseCopy(config: UseCopyConfig): () => UseCopyReturn {
  const resolver = createCopyResolver(config.dictionary, config.onMissing);

  return function useCopy(): UseCopyReturn {
    return {
      t: (key, variables) => resolver(key, variables, false) as string,

      tDebug: (key, variables) => resolver(key, variables, true) as ResolvedCopy,

      tOptional: (key, fallback) => {
        const value = getNestedValue(config.dictionary, key);
        if (!value) {
          return fallback;
        }
        return resolveCopy(value);
      },

      tMultiple: (keys) => {
        const result: Record<string, string> = {};
        for (const key of keys) {
          result[key] = resolver(key, undefined, false) as string;
        }
        return result;
      },

      dictionary: config.dictionary,

      tier: config.tier || "standard",

      language: config.language || "en",
    };
  };
}

/**
 * Higher-order function to bind copy to a component
 * Useful for class components or non-React code
 */
export function withCopy<P extends { copy?: UseCopyReturn }>(
  Component: React.ComponentType<P>,
  useCopy: () => UseCopyReturn
) {
  return (props: Omit<P, "copy">) => {
    const copy = useCopy();
    return <Component {...(props as P)} copy={copy} />;
  };
}

/**
 * Utility to create a copy context for React context API
 */
export function createCopyContext() {
  const context = React.createContext<UseCopyReturn | undefined>(undefined);

  function CopyProvider({
    children,
    copy,
  }: {
    children: React.ReactNode;
    copy: UseCopyReturn;
  }) {
    return <context.Provider value={copy}>{children}</context.Provider>;
  }

  function useCopyContext(): UseCopyReturn {
    const value = React.useContext(context);
    if (!value) {
      throw new Error("useCopyContext must be used within CopyProvider");
    }
    return value;
  }

  return { Provider: CopyProvider, useCopyContext };
}