/**
 * Wallet Core Package
 * Framework-agnostic business logic, hooks, and utilities
 * Used by both web and mobile platforms
 * 
 * Main export entry point for @orya/wallet-core
 */

// ============ Domain Layer ============
export type { Blockchain, BlockchainConfig, BlockchainType } from "./domain";

// ============ Services Layer ============
// Services are available via individual service modules, see packages/wallet-core/src/services/

// ============ Hooks (Business Logic) ============
export { useBiometricAuth, useCopy, useCrossChainTransfer, useGoogleAuth, usePortfolio, usePriceFeeds, useTheme, useTransaction, useUIBridge, useWalletGeneration, useWallet as useWalletLegacy, useChainHealth, useMoralis, useTatum, useChainbaseSupportedChains, useWalletConnect, useSUIBalance, useChainbaseBalance, useChainbaseAnalytics, useChainbaseTransactions, useSuiZkLogin, useUnifiedConnect } from "./hooks";
export type { UsePortfolioReturn, UseThemeReturn, UseWalletReturn as UseWalletLegacyReturn, UseChainbaseSupportedChainsReturn, ChainInfo, UseWalletConnectReturn, UseSUIBalanceReturn, UseChainbaseBalanceReturn, UseChainbaseAnalyticsReturn, UseChainbaseTransactionsReturn, UnifiedConnectState, WalletConnectionProvider } from "./hooks";

// ============ Utils ============
export * from "./utils";

// ============ Storage Abstraction ============
export * from "./storage";

// ============ Crypto (Step 3A) ============
export { OwnWallet, generateNewWallet, restoreKeyPairFromStorage, securelyStoreKeyPair } from "./crypto/OwnWallet";
export type {
    EncryptedKeyStore, KeyPairData, MnemonicKeyData,
    SignedTransaction
} from "./crypto/OwnWallet";

// ============ Redux Store (Step 3B) ============
export { createAppStore, store } from "./store/store";
export type { RootState } from "./store/store";

export {
    useActiveWallet, useAppDispatch,
    useAppSelector,
    useAuth, useBalances, useConnectedWallets, useCurrentTheme, useIsLoggedIn, useNetworkStatus, useRecentTransactions, useTotalValueUSD, useTransactions, useUserId, useWallet
} from "./store/hooks";

// Redux Slices (namespaced to avoid conflicts)
export { clearError as authClearError, setError as authSetError, setLoading as authSetLoading, setSession as authSetSession, authSlice, setSessionExpiry, setToken, setUser } from "./store/slices/authSlice";
export type { AuthState } from "./store/slices/authSlice";

export { addTransaction, clearTransactions, removeTransaction, transactionSlice, updateTransaction } from "./store/slices/transactionSlice";
export type { Transaction as TransactionState, TransactionStatus, TransactionType } from "./store/slices/transactionSlice";

export { addWallet, clearWallets, removeWallet, selectWallet, setWallets, updateBalance, setBalances as walletSetBalances, setError as walletSetError, setLoading as walletSetLoading, walletSlice } from "./store/slices/walletSlice";
export type { WalletState } from "./store/slices/walletSlice";

// ============ Zustand Stores (Phase 2-4) ============
export { useChainHealthStore } from "./store/chainHealthStore";
export type { ChainHealth, ChainHealthState } from "./store/chainHealthStore";

export { useVaultCustomizationStore } from "./store/vaultCustomizationStore";
export type { VaultActionId, VaultAction, VaultCustomizationState } from "./store/vaultCustomizationStore";

export { useProtocolPreferenceStore } from "./store/protocolPreferenceStore";
export { useAutoSigningStore } from "./store/autoSigningStore";

// ============ Services (Phase 5-6) ============
export { chainHealthPollingService } from "./services/chainHealthPollingService";
export type { ChainHealthConfig, RpcHealthResponse } from "./services/chainHealthPollingService";

// ============ Connectivity (Step 4A & 4B) ============
export {
    OwnWalletBackend,
    SuiWalletKitBackend, TransactionRouter, getTransactionRouter,
    initializeTransactionRouter
} from "./connectivity/TransactionRouter";

export type {
    SigningBackend,
    TransactionRoute
} from "./connectivity/TransactionRouter";

export {
    WalletContext, WalletProvider,
    useWalletProvider
} from "./connectivity/WalletProvider";

export type {
    WalletContextType, WalletProviderConfig
} from "./connectivity/WalletProvider";

export {
    WalletConnectManager,
    getWalletConnectManager,
    initializeWalletConnectManager
} from "./connectivity/WalletConnectManager";

export type {
    PairingSession,
    SigningRequest, WalletConnectConfig
} from "./connectivity/WalletConnectManager";

export {
    WalletConnectUI
} from "./connectivity/WalletConnectUI";

export type {
    WalletConnectUIProps
} from "./connectivity/WalletConnectUI";

export {
    ReOwnProvider,
    useReOwn,
    useReOwnManager
} from "./connectivity";

export type {
    ReOwnContextType,
    ReOwnProviderProps
} from "./connectivity";

// ============ Authentication ============
export { SuiZkLoginService } from "./auth";
export type { ZkLoginProvider, ZkLoginConfig, ZkLoginSession, ZkLoginCredential } from "./auth";

// ============ Services ============
export { SyncService, syncService } from "./services/SyncService";
export type { SyncError, SyncState } from "./services/SyncService";

export { RPCManager, RPCError } from "./services/RPCManager";
export type { RPCProviderConfig, RPCHealthCheck, RPCRequest, RPCResponse } from "./services/RPCManager";

export { getWagmiConfig, resetWagmiConfig, DEFAULT_CHAINS, DEFAULT_CHAIN_IDS } from "./services/wagmi";
export type { WagmiChain } from "./services/wagmi";

export { AptosAdapter, getAptosAdapter, clearAptosAdapterCache } from "./services/adapters";
export { MovementAdapter, getMovementAdapter, clearMovementAdapterCache } from "./services/adapters";
export { getVMAdapterRegistry, getVMAdapter, clearVMAdapterCache } from "./services/adapters";
export type { VMAdapter, VMFamily } from "./services/adapters";

export { OfflineManager, offlineManager } from "./offline/OfflineManager";
export type { OfflineConfig, OfflineOperation } from "./offline/OfflineManager";

// ============ Storage ============
export { StorageAdapter, createStorageAdapter } from "./storage/StorageAdapter";
export type { StorageAdapterInterface } from "./storage/StorageAdapter";

// ============ Types ============
export * from "@orya/shared-types";

// ============ Protocol Data ============
export * from "./data/sui-protocols";

// ============ Contexts ============
export { ThemeContext } from "./contexts/ThemeContext";
export type { ThemeContextValue } from "./contexts/ThemeContext";

export { BrandingContext, BrandingProvider, useBranding, useBrandingStore, BrandingSwitch } from "./context/BrandingContext";
export type { BrandingContextType } from "./context/BrandingContext";

// ============ GraphQL Queries ============
export { GET_SUI_BALANCE } from "./graphql/queries";

// ============ SUI Wallet Standard (Phase 2D) ============
export * from "./sui";

// ============ Wallet Standards (Phase 5) ============
export {
  EIP6963StandardAdapter,
  EthereumJSONRPCProvider,
  EIP6963_ANNOUNCEMENT_EVENT,
  EIP6963_REQUEST_EVENT,
  type EIP6963ProviderDetail,
  type EIP6963ProviderInfo,
} from "./standards/eip6963";

export {
  SUIStandardAdapter,
  SUI_WALLET_NAME,
  SUI_WALLET_VERSION,
  type SUIWalletCapabilities,
} from "./standards/sui-standard";

export {
  AptosStandardAdapter,
  type AptosAccount,
  type AptosChainInfo,
  type AptosSignMessageInput,
  type AptosSignMessageOutput,
  type AptosSignTransactionInput,
} from "./standards/aptos-standard";

export {
  MovementStandardAdapter,
  type MovementAccount,
  type MovementChainInfo,
  type MovementSignMessageInput,
  type MovementSignMessageOutput,
  type MovementSignTransactionInput,
} from "./standards/movement-standard";

export {
  SolanaStandardAdapter,
  SOLANA_WALLET_NAME,
  SOLANA_WALLET_VERSION,
  type SolanaAccount,
  type SolanaChainInfo,
  type SolanaSignTransactionInput,
  type SolanaSignTransactionOutput,
  type SolanaSignMessageInput,
  type SolanaSignMessageOutput,
  type SolanaSignAndSendTransactionInput,
  type SolanaSignAndSendTransactionOutput,
  type SolanaWalletCapabilities,
} from "./standards/solana-standard";

export {
  ProviderRegistry,
  getProviderRegistry,
  resetProviderRegistry,
  type BlockchainStandard,
  type ProviderInfo,
  type RegisteredProvider,
} from "./standards/ProviderRegistry";

export {
  EIP1193_STANDARD_METHODS,
  EIP1193_ERROR_CODES,
  EIP1193EventEmitter,
  EIP1193ProviderBase,
  EIP1193ProviderError,
  type EIP1193EventMap,
  type EIP1193EventName,
  type EIP1193Provider,
  type EIP1193RequestArguments,
  type EIP1193RpcError,
  type EIP1193BaseProvider,
  type EIP1193Method,
  ETHEREUM_JSON_RPC_METHODS,
  JSON_RPC_ERROR_CODES,
  JSON_RPC_ERROR_MESSAGES,
  JSON_RPC_METHODS_SPEC,
  JSONRPC2RequestBuilder,
  JSONRPC2ResponseBuilder,
  JSONRPC2Validator,
  type JSONRPC2Request,
  type JSONRPC2Response,
  type JSONRPC2Error,
  type JSONRPC2BatchRequest,
  type JSONRPC2BatchResponse,
  type JSONRPCMethodSpec,
  MAINNET_CHAIN_IDS,
  TESTNET_CHAIN_IDS,
  EIP155ChainValidator,
  EIP155TransactionValidator,
  EIP155SignatureUtil,
  type EIP155ChainConfig,
  type EthereumChainId,
  type EIP155Transaction,
  type EIP155SignedTransaction,
  type EIP155SignatureData,
} from "./standards";
