/**
 * Web Platform - useWallet Hook
 * Re-exports platform-agnostic core hook from wallet-core
 * 
 * PROMPT C2: Platform-Agnostic Hooks - Apps Layer
 * Apps simply re-export the core hooks. No wrapper needed unless
 * there are platform-specific customizations required.
 */

export {
    useWallet,
    type UseWalletReturn,
    type WalletLogic
} from '@orya/wallet-core/hooks';
