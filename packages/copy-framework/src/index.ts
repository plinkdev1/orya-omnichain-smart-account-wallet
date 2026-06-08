/**
 * Copy Framework
 * Central export for all copy framework utilities
 */

// Types
export type {
    CopyConfig, CopyContextValue, CopyDictionary, CopyResolveOptions, CopyResolverFn, CopyTokenKey,
    CopyVariables,
    PlatformCopy, ResolvedCopy, TieredCopy
} from "./types";

// Tokens
export {
    ACTIONS_TOKENS, ATRIUM_TOKENS, AUTH_TOKENS, FLOW_TOKENS,
    INSIGHTS_TOKENS, LINK_TOKENS, NAV_TOKENS, SETTINGS_TOKENS, STATUS_TOKENS, TOKENS, VAULT_TOKENS, type TokenKey,
    type TokensByCategory
} from "./tokens";

// Resolver
export {
    commonReplacers, createBoundResolver, createCopyResolver as createCopyResolverUtil, extractVariables, formatCopyLenient, formatCopyStrict, getUnresolvedVariables,
    resolveCopy, resolveMultiple, validateCopyVariables
} from "./resolver";

// Core Hook
export {
    createCopyContext, createCopyResolver,
    createUseCopy,
    withCopy, type UseCopyConfig,
    type UseCopyReturn
} from "./useCopyCore";
