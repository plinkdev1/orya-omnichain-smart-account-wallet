/**
 * Web Chain Store Hook
 * Zustand store for chain selection (web-specific wrapper)
 */

'use client';

export {
    useAvailableChains, useChainStore,
    useCurrentChain, useSwitchChain
} from '../../packages/shared-types/chainStore';
