/**
 * Mobile Platform - useAuth Hook
 * Re-exports platform-agnostic core hook from wallet-core
 * 
 * PROMPT C2: Platform-Agnostic Hooks - Apps Layer
 * Apps simply re-export the core hooks. No wrapper needed unless
 * there are platform-specific customizations required.
 */

export {
    useAuth, type AuthLogic, type UseAuthReturn
} from '@orya/wallet-core/hooks';
