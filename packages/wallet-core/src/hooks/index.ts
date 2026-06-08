/**
 * Wallet Core Hooks - Platform-Agnostic
 * 
 * These are React hooks that integrate with Redux for state management.
 * They provide consistent interfaces across web and mobile platforms.
 * 
 * PROMPT C1: Platform-Agnostic Hooks
 * - useWallet: Wallet state + operations
 * - useAuth: Authentication state + operations
 * 
 * Both hooks can be used directly in components or wrapped in app-specific adapters.
 * 
 * @example
 * // Direct usage in components
 * function WalletComponent() {
 *   const { wallets, selectedWallet, addWallet } = useWallet();
 *   const { isAuthenticated, user } = useAuth();
 *   return <div>...</div>;
 * }
 * 
 * // Or wrap in app-specific hooks for platform customization
 * // In apps/web/hooks/useWallet.ts
 * export function useWallet() {
 *   return coreUseWallet(); // Direct re-export, or add web-specific logic
 * }
 */

// Platform-agnostic hooks
export { useAuth, type AuthLogic, type UseAuthReturn } from './useAuth';
export { useWallet, type UseWalletReturn, type WalletLogic } from './useWallet';
export { useCreateWalletWithSuiFirst, type UseCreateWalletWithSuiFirstReturn, type SuiFirstWalletResult } from './useCreateWalletWithSuiFirst';
export { useAddSecondaryChain, type UseAddSecondaryChainReturn } from './useAddSecondaryChain';

// Feature hooks
export { useBiometricAuth, type UseBiometricAuthReturn } from './useBiometricAuth';
export { useCrossChainTransfer, type UseCrossChainTransferReturn } from './useCrossChainTransfer';
export { useGoogleAuth, type UseGoogleAuthReturn } from './useGoogleAuth';
export { useSuiZkLogin } from './useSuiZkLogin';
export { useUnifiedConnect, type UnifiedConnectState, type WalletConnectionProvider } from './useUnifiedConnect';
export { usePortfolio, type UsePortfolioReturn } from './usePortfolio';
export { usePriceFeeds, type UsePriceFeedsReturn } from './usePriceFeeds';
export { useTheme, type UseThemeReturn } from './useTheme';
export { useWalletGeneration, type UseWalletGenerationReturn } from './useWalletGeneration';
export { useWalletConnect, type UseWalletConnectReturn } from './useWalletConnectStub'; // Disabled - using stub

// Other hooks
export { useTransaction, type TransactionLogic, type TransactionResult } from './useTransaction';
export { useUIBridge, type BiometricOptions, type BiometricType, type ModalConfig, type ToastMessage, type ToastType, type UIBridgeLogic } from './useUIBridge';

// Stub for useCopy - placeholder for text clipboard utility
export { useCopy, type UseCopyReturn } from './useCopy';

// GraphQL hooks (Task 2.9)
export {
  useRegisterUser,
  useCreateWallet,
  useSignTransaction,
  useUser,
  useUserWallets,
  useWalletBalance,
} from './useWalletOperations';

// SUI Balance hook (Task 2D.3)
export { useSUIBalance, type UseSUIBalanceReturn } from './useSUIBalance';

// Enhanced Wallet hooks (Phase 3.D - IKA 2PC-MPC Integration) - DISABLED (using stub)
export {
  useEnhancedWallet,
  useEnhancedWalletTransaction,
  useEnhancedWalletHealth,
  type UseEnhancedWalletState,
  type UseEnhancedWalletActions,
} from './useEnhancedWalletStub';

// dWallet Creation hook (Phase 3.D.2 - Zero-Trust dWallet Creation) - DISABLED (using stub)
export { useCreateDWallet, type UseCreateDWalletReturn } from './useCreateDWalletStub';

// Transaction Signing hook (Phase 3.D.3 - Zero-Trust dWallet Signing) - DISABLED (using stub)
export { useSignWithDWallet, type UseSignWithDWalletReturn } from './useSignWithDWalletStub';

// Wallet Capabilities hook (Task 1.5.5 - Adaptive Feature Unlocking)
export {
  useWalletCapabilities,
  type WalletCapabilities,
  type UseWalletCapabilitiesReturn,
} from './useWalletCapabilities';

// Upgrade Wallet hook (Task 1.5.21 - Upgrade Flow)
export {
  useUpgradeWallet,
  type UseUpgradeWalletReturn,
} from './useUpgradeWallet';

// Phase 2: Chain Health Monitoring
export { useChainHealth } from './useChainHealth';

// Chain Registry
export { useChainRegistry } from './useChainRegistry';

// Phase 5: Moralis Integration
export { useMoralis } from './useMoralis';

// Phase 6: Tatum Integration
export { useTatum } from './useTatum';

// Phase 7: Account Abstraction & Advanced Features
export { useAccountAbstraction, type UseAccountAbstractionState, type UseAccountAbstractionActions } from './useAccountAbstraction';
export { useBatchOperations, type UseBatchOperationsState, type UseBatchOperationsActions } from './useBatchOperations';
export { useSessionKeys, type UseSessionKeysState, type UseSessionKeysActions } from './useSessionKeys';
export { usePrivyAAIntegration, type UsePrivyAAIntegrationState, type UsePrivyAAIntegrationActions } from './usePrivyAAIntegration';

// Chainbase Integration (Task 4.1)
export { useChainbaseBalance, type UseChainbaseBalanceProps, type UseChainbaseBalanceReturn, type BalanceData, type Token } from './useChainbaseBalance';
export { useChainbaseAnalytics, type UseChainbaseAnalyticsReturn, type AnalyticsData } from './useChainbaseAnalytics';
export { useChainbaseTransactions, type UseChainbaseTransactionsProps, type UseChainbaseTransactionsReturn, type TransactionsData, type Transaction } from './useChainbaseTransactions';
export { useChainbaseSupportedChains, type UseChainbaseSupportedChainsReturn, type ChainInfo } from './useChainbaseSupportedChains';



// Protocol Selection & Auto Signing (Feature)
export { useProtocolSelection, type UseProtocolSelectionReturn } from './useProtocolSelection';
export { useAutoSigning, type UseAutoSigningReturn } from './useAutoSigning';

// Phase 1B: Multi-Chain Adapters (Solana/SVM, TON, Cosmos, NEAR)
export { useSolanaSVMConnect } from './useSolanaSVMConnect';
export { useCosmosExtendedConnect } from './useCosmosExtendedConnect';
export { useTonConnect } from './useTonConnect';
export { useNearConnect } from './useNearConnect';
