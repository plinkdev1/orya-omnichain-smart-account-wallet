/**
 * Step 4: Connectivity Module Index
 * Exports all wallet connectivity components and utilities
 */

// Transaction Router (Step 4A & 4B foundation)
export {
    OwnWalletBackend,
    SuiWalletKitBackend,
    ReownEvmBackend,
    ReownSolanaBackend,
    TransactionRouter,
    getTransactionRouter,
    initializeTransactionRouter
} from "./TransactionRouter";

export type {
    SigningBackend,
    TransactionRoute
} from "./TransactionRouter";

// WalletProvider (Step 4A - Sui Standard Wallets)
export {
    WalletContext, WalletProvider,
    useWalletProvider
} from "./WalletProvider";

export type {
    WalletContextType, WalletProviderConfig
} from "./WalletProvider";

// WalletConnect Manager (Step 4B - Cross-device)
export {
    WalletConnectManager,
    getWalletConnectManager,
    initializeWalletConnectManager
} from "./WalletConnectManager";

export type {
    PairingSession,
    SigningRequest as WalletConnectSigningRequest, 
    WalletConnectConfig
} from "./WalletConnectManager";

// WalletConnect AppKit (v2/ReOwn - New Standard)
export {
    WalletConnectAppKitManager,
    createWalletConnectAppKit,
    initializeWalletConnectAppKit,
    getWalletConnectAppKit
} from "./WalletConnectAppKit";

export type {
    WalletConnectAppKitConfig,
    WalletSession as WalletConnectAppKitSession,
    SignRequest,
    SignResponse
} from "./WalletConnectAppKit";

// UI Components (Step 4A & 4B)
export {
    WalletConnectUI
} from "./WalletConnectUI";

export type {
    WalletConnectUIProps
} from "./WalletConnectUI";

// Sui-First Onboarding (Phase 2)
export {
    SuiFirstBootstrap
} from "./SuiFirstBootstrap";

export type {
    SuiFirstBootstrapProps
} from "./SuiFirstBootstrap";

// ReOwn Provider (Stub - Main module disabled due to compilation errors)
export {
    ReOwnProvider,
    useReOwn,
    useReOwnManager,
    useReOwnApprovals,
    ApprovalModal
} from "./ReOwnProviderStub";

export type {
    ReOwnContextType,
    ReOwnProviderProps,
    UseReOwnApprovalsReturn,
    UseReOwnApprovalsState,
    UseReOwnApprovalsActions
} from "./ReOwnProviderStub";

// ReOwn AppKit Integration (Phase 1 Migration)
// TEMPORARILY DISABLED - Module has compilation errors
// export {
//     ReOwnConfigManager,
//     useSessionStore,
//     SessionManager,
//     SigningQueue,
//     ChainAdapter,
//     Analytics,
//     ApprovalModal,
//     ReOwnWalletManager,
//     getReOwnWalletManager
// } from "./reown";

// export type {
//     ReOwnProjectConfig,
//     ReOwnChainConfig,
//     WalletSession,
//     SigningRequest,
//     SessionStoreState,
//     SessionConfig,
//     SigningQueueConfig,
//     SigningMethod,
//     SigningRequestDetails,
//     ChainInfo,
//     SigningParams,
//     SigningResult,
//     ChainNamespace,
//     AnalyticsEvent,
//     AnalyticsMetrics,
//     AnalyticsEventType,
//     ApprovalModalProps,
//     ReOwnManagerConfig,
//     ReOwnWalletManagerEventType
// } from "./reown";
