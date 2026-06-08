/**
 * Services Layer - Business Logic & API Clients
 * Pure business logic layer for wallet operations
 * NO React/Redux dependencies - consumed by UI via hooks
 */

export * from './api-client';
export * from './apollo-client';
export * from './blockchain';
export * from './privy';
// IKA services disabled - API incompatibilities with current SDK version
// export * from './ika/index';
// export * from './ika-mpc';
// export * from './privy-ika-bridge';
// export * from './multisig';
export * from './PythPriceFeedService';
export * from './StargateService';
// export * from './SwapService';
export * from './WormholeBridgeService';
export * from './SyncService';
// Tatum/Moralis/BitqueryService disabled - API version incompatibilities
// export * from './tatum';
// export * from './moralis';
// export * from './BitqueryService';
// WalletConnect services disabled - moving to native ReOwn AppKit
// export * from './walletconnect';
export * from './QRPaymentService';
export * from './ChainHealthService';
export * from './StripePaymentService';
// Payment services disabled - will be re-integrated separately
// export * from './KulipaPaymentService';
// export * from './WalletConnectPayService';
// export * from './PaymentProviderAdapter';
export * from './account-abstraction';
export * from './batch-operations';
export * from './session-keys';
// Privy AA integration disabled - type compatibility issues
// export * from './privy-aa-integration';
export * from './chainbase.service';
export * from './eigenlayer.service';
export * from './RPCManager';
export * from './rpc';
export * from './SwapAggregatorManager';
export * from './wagmi';
export * from './adapters';

export const SERVICES_VERSION = '0.5.1-aggregators';
