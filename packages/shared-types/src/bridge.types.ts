/**
 * Cross-Chain Bridge Types
 * Multi-chain asset transfers with fee aggregation, routing, and atomic swap support
 * Supports Stargate, LayerZero, Axelar, Wormhole, and custom bridge implementations
 */

import { UUID, Address, Hash } from './common.types';
import { ChainType } from './chain.types';

/**
 * Bridge protocol types
 */
export enum BridgeProtocol {
  STARGATE = 'stargate',
  LAYERZERO = 'layerzero',
  AXELAR = 'axelar',
  WORMHOLE = 'wormhole',
  NOMAD = 'nomad',
  ACROSS = 'across',
  CONNEXT = 'connext',
  SYNAPSE = 'synapse',
  HYPHEN = 'hyphen',
  POLYGON_PORTAL = 'polygon_portal',
  NATIVE_BRIDGE = 'native_bridge',
}

/**
 * Bridge transaction status
 */
export enum BridgeTransactionStatus {
  INITIATED = 'initiated',
  SUBMITTED = 'submitted',
  CONFIRMED = 'confirmed',
  BRIDGING = 'bridging',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PARTIAL = 'partial',
  PENDING_CLAIM = 'pending_claim',
}

/**
 * Fee type for bridge transaction
 */
export enum BridgeFeeType {
  PROTOCOL_FEE = 'protocol_fee',
  RELAYER_FEE = 'relayer_fee',
  GAS_FEE = 'gas_fee',
  LP_FEE = 'lp_fee',
  INCENTIVE_FEE = 'incentive_fee',
  SLIPPAGE = 'slippage',
  INSURANCE = 'insurance',
}

/**
 * Route status for bridge
 */
export enum RouteStatus {
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
  DEGRADED = 'degraded',
  MAINTENANCE = 'maintenance',
}

/**
 * Bridge quote for cross-chain transfer
 */
export interface BridgeQuote {
  /** Unique quote identifier */
  id: UUID;
  
  /** Source chain */
  sourceChain: ChainType;
  
  /** Destination chain */
  destinationChain: ChainType;
  
  /** Token to bridge */
  tokenAddress: Address;
  
  /** Input amount */
  inputAmount: string;
  
  /** Expected output amount */
  outputAmount: string;
  
  /** Minimum output amount (with slippage) */
  minOutputAmount: string;
  
  /** Price impact percentage (0-100) */
  priceImpact: number;
  
  /** Estimated time to completion (seconds) */
  estimatedTime: number;
  
  /** Bridge protocol used */
  protocol: BridgeProtocol;
  
  /** Fee breakdown */
  fees: BridgeFee[];
  
  /** Total fee in destination token value */
  totalFeeUSD: number;
  
  /** Exchange rate */
  exchangeRate: string;
  
  /** Quote expiration timestamp */
  expiresAt: string;
  
  /** Route details */
  route: BridgeRoute;
  
  /** Whether quote is still valid */
  isValid: boolean;
  
  /** Quote creation timestamp */
  createdAt: string;
}

/**
 * Fee breakdown for bridge transaction
 */
export interface BridgeFee {
  /** Fee type */
  type: BridgeFeeType;
  
  /** Fee amount in source token */
  amount: string;
  
  /** Fee in USD */
  amountUSD: number;
  
  /** Fee percentage of transaction */
  percentage: number;
  
  /** Fee description */
  description?: string;
}

/**
 * Bridge route information
 */
export interface BridgeRoute {
  /** Route identifier */
  id: UUID;
  
  /** Route steps (can have intermediate hops) */
  steps: RouteStep[];
  
  /** Total estimated time */
  totalEstimatedTime: number;
  
  /** Route reliability score (0-100) */
  reliabilityScore: number;
  
  /** Whether route is optimized for speed */
  isExpressRoute: boolean;
  
  /** Whether route is optimized for cost */
  isCostOptimized: boolean;
}

/**
 * Individual route step (can involve swap, bridge, or both)
 */
export interface RouteStep {
  /** Step order (1-indexed) */
  stepNumber: number;
  
  /** From chain */
  fromChain: ChainType;
  
  /** To chain */
  toChain: ChainType;
  
  /** Bridge protocol for this step */
  protocol: BridgeProtocol;
  
  /** Input token */
  inputToken: Address;
  
  /** Output token */
  outputToken: Address;
  
  /** Input amount */
  inputAmount: string;
  
  /** Expected output amount */
  outputAmount: string;
  
  /** Estimated time for this step */
  estimatedTime: number;
  
  /** Step type */
  stepType: 'bridge' | 'swap' | 'bridge_and_swap' | 'liquidity_swap';
}

/**
 * Bridge transaction request
 */
export interface BridgeTransactionRequest {
  /** Source chain */
  sourceChain: ChainType;
  
  /** Destination chain */
  destinationChain: ChainType;
  
  /** Token address to bridge */
  tokenAddress: Address;
  
  /** Amount to bridge */
  amount: string;
  
  /** Recipient address on destination chain */
  recipient: Address;
  
  /** Sender address on source chain */
  sender: Address;
  
  /** Slippage tolerance (0-100) */
  slippageTolerance: number;
  
  /** Preferred bridge protocol */
  protocol?: BridgeProtocol;
  
  /** Use aggregate routing */
  useAggregator: boolean;
  
  /** Optional memo/message */
  memo?: string;
  
  /** Referral address for incentives */
  referralAddress?: Address;
}

/**
 * Bridge transaction
 */
export interface BridgeTransaction {
  /** Unique transaction identifier */
  id: UUID;
  
  /** Transaction hash on source chain */
  sourceTxHash: Hash;
  
  /** Transaction hash on destination chain */
  destinationTxHash?: Hash;
  
  /** Source chain */
  sourceChain: ChainType;
  
  /** Destination chain */
  destinationChain: ChainType;
  
  /** Token bridged */
  tokenAddress: Address;
  
  /** Token symbol */
  tokenSymbol: string;
  
  /** Amount bridged */
  amount: string;
  
  /** Recipient address */
  recipient: Address;
  
  /** Sender address */
  sender: Address;
  
  /** Bridge protocol used */
  protocol: BridgeProtocol;
  
  /** Transaction status */
  status: BridgeTransactionStatus;
  
  /** Bridge route used */
  route: BridgeRoute;
  
  /** Quote used for this transaction */
  quote: BridgeQuote;
  
  /** Actual output amount received */
  outputAmount?: string;
  
  /** Total fees charged */
  totalFeeUSD: number;
  
  /** Fee breakdown */
  fees: BridgeFee[];
  
  /** Estimated completion time */
  estimatedCompletionTime: number;
  
  /** Actual completion time (seconds) */
  actualCompletionTime?: number;
  
  /** Source chain confirmation status */
  sourceConfirmations: number;
  
  /** Destination chain confirmation status */
  destinationConfirmations?: number;
  
  /** Source timestamp */
  createdAt: string;
  
  /** Completion timestamp */
  completedAt?: string;
  
  /** Failure reason if failed */
  failureReason?: string;
  
  /** Can be refunded */
  canRefund: boolean;
  
  /** Metadata */
  metadata?: Record<string, any>;
}

/**
 * Fee aggregation configuration
 */
export interface FeeAggregatorConfig {
  /** Aggregator identifier */
  id: UUID;
  
  /** Enabled bridge protocols */
  enabledProtocols: BridgeProtocol[];
  
  /** Fee comparison mode */
  comparisonMode: 'lowest_fee' | 'fastest' | 'balanced' | 'custom';
  
  /** Maximum slippage tolerance */
  maxSlippage: number;
  
  /** Whether to aggregate multiple routes */
  allowMultiRouteAggregation: boolean;
  
  /** Maximum route depth (number of steps) */
  maxRouteDepth: number;
  
  /** Whether to hide uneconomical routes */
  hideUneconomicalRoutes: boolean;
  
  /** Minimum liquidity requirement (USD) */
  minLiquidity: number;
  
  /** Update frequency for route cache (seconds) */
  cacheUpdateFrequency: number;
}

/**
 * Atomic swap configuration (bridge + DEX swap)
 */
export interface AtomicSwapConfig {
  /** Swap identifier */
  id: UUID;
  
  /** Source chain */
  sourceChain: ChainType;
  
  /** Destination chain */
  destinationChain: ChainType;
  
  /** Input token */
  inputToken: Address;
  
  /** Output token */
  outputToken: Address;
  
  /** Input amount */
  inputAmount: string;
  
  /** Whether to use bridge for atomic swap */
  useBridge: boolean;
  
  /** DEX to use on destination (e.g., "uniswap", "curve") */
  dexProvider?: string;
  
  /** Settlement method */
  settlement: 'instant' | 'defer' | 'hybrid';
  
  /** Price oracle for validation */
  priceOracle?: Address;
}

/**
 * Atomic swap execution
 */
export interface AtomicSwapExecution {
  /** Execution identifier */
  id: UUID;
  
  /** Atomic swap configuration */
  config: AtomicSwapConfig;
  
  /** Source chain transaction hash */
  sourceTxHash: Hash;
  
  /** Destination chain transaction hash */
  destinationTxHash?: Hash;
  
  /** Execution status */
  status: BridgeTransactionStatus;
  
  /** Step-by-step execution details */
  steps: AtomicSwapStep[];
  
  /** Total execution time (seconds) */
  executionTime?: number;
  
  /** Creation timestamp */
  createdAt: string;
  
  /** Completion timestamp */
  completedAt?: string;
}

/**
 * Individual step in atomic swap execution
 */
export interface AtomicSwapStep {
  /** Step order */
  stepNumber: number;
  
  /** Step type */
  stepType: 'source_swap' | 'bridge' | 'destination_swap' | 'settlement';
  
  /** Step status */
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  
  /** Transaction hash */
  txHash?: Hash;
  
  /** Input and output details */
  input: { token: Address; amount: string };
  output?: { token: Address; amount: string };
  
  /** Step completion timestamp */
  completedAt?: string;
  
  /** Error if failed */
  error?: string;
}

/**
 * Bridge liquidity pool information
 */
export interface BridgeLiquidityPool {
  /** Pool identifier */
  id: UUID;
  
  /** Source chain */
  sourceChain: ChainType;
  
  /** Destination chain */
  destinationChain: ChainType;
  
  /** Token address */
  tokenAddress: Address;
  
  /** Token symbol */
  symbol: string;
  
  /** Total liquidity value (USD) */
  totalLiquidity: number;
  
  /** Available liquidity (USD) */
  availableLiquidity: number;
  
  /** Current utilization percentage */
  utilization: number;
  
  /** APY for liquidity providers */
  apy: number;
  
  /** Pool status */
  status: RouteStatus;
  
  /** Last updated timestamp */
  lastUpdated: string;
}

/**
 * Bridge rate and availability check
 */
export interface BridgeAvailability {
  /** Check identifier */
  id: UUID;
  
  /** Source chain */
  sourceChain: ChainType;
  
  /** Destination chain */
  destinationChain: ChainType;
  
  /** Available protocols */
  availableProtocols: ProtocolAvailability[];
  
  /** Any supported pair */
  isSupported: boolean;
  
  /** Estimated total time to destination */
  estimatedTotalTime: number;
  
  /** Last checked timestamp */
  checkedAt: string;
}

/**
 * Protocol availability details
 */
export interface ProtocolAvailability {
  /** Bridge protocol */
  protocol: BridgeProtocol;
  
  /** Is available */
  isAvailable: boolean;
  
  /** Status */
  status: RouteStatus;
  
  /** Estimated time (seconds) */
  estimatedTime: number;
  
  /** Estimated fee percentage */
  estimatedFeePercent: number;
  
  /** Last status update */
  lastStatusUpdate: string;
}

/**
 * Bridge compliance check
 */
export interface BridgeComplianceCheck {
  /** Check identifier */
  id: UUID;
  
  /** Address being checked */
  address: Address;
  
  /** Is compliant */
  isCompliant: boolean;
  
  /** Compliance status */
  status: 'approved' | 'flagged' | 'pending_review' | 'blocked';
  
  /** Reason for flag if applicable */
  flagReason?: string;
  
  /** Maximum bridge amount (USD) */
  maxBridgeAmountUSD?: number;
  
  /** Check timestamp */
  checkedAt: string;
  
  /** Check expiration timestamp */
  expiresAt: string;
}

/**
 * Bridge statistics and analytics
 */
export interface BridgeAnalytics {
  /** Analytics period start */
  periodStart: string;
  
  /** Analytics period end */
  periodEnd: string;
  
  /** Total bridge volume (USD) */
  totalVolume: number;
  
  /** Number of bridge transactions */
  transactionCount: number;
  
  /** Average transaction size (USD) */
  averageTransactionSize: number;
  
  /** Most used protocol */
  mostUsedProtocol: BridgeProtocol;
  
  /** Most used route */
  mostUsedRoute: { from: ChainType; to: ChainType };
  
  /** Average completion time (seconds) */
  averageCompletionTime: number;
  
  /** Success rate percentage */
  successRate: number;
  
  /** Average total fee percentage */
  averageFeePercent: number;
  
  /** Protocol breakdown */
  protocolBreakdown: Record<BridgeProtocol, number>;
}

/**
 * Cross-chain message for bridge operations
 */
export interface CrossChainMessage {
  /** Message identifier */
  id: UUID;
  
  /** Source chain */
  sourceChain: ChainType;
  
  /** Destination chain */
  destinationChain: ChainType;
  
  /** Message type */
  messageType: 'bridge' | 'contract_call' | 'atomic_swap' | 'liquidity_provision';
  
  /** Message payload */
  payload: Record<string, any>;
  
  /** Message status */
  status: 'sent' | 'confirmed' | 'executed' | 'failed';
  
  /** Source transaction hash */
  sourceTxHash: Hash;
  
  /** Destination transaction hash */
  destinationTxHash?: Hash;
  
  /** Message hash */
  messageHash: Hash;
  
  /** Timestamp sent */
  sentAt: string;
  
  /** Timestamp confirmed */
  confirmedAt?: string;
}

/**
 * Bridge configuration per wallet
 */
export interface WalletBridgeConfig {
  /** Wallet address */
  walletAddress: Address;
  
  /** Enabled bridges */
  enabledProtocols: BridgeProtocol[];
  
  /** Max bridge amount per transaction (USD) */
  maxAmountPerTransaction: number;
  
  /** Daily bridge limit (USD) */
  dailyBridgeLimit: number;
  
  /** Current daily usage (USD) */
  currentDailyUsage: number;
  
  /** Preferred slippage tolerance */
  preferredSlippage: number;
  
  /** Whether to auto-claim on destination */
  autoClaimDestination: boolean;
  
  /** Notification settings */
  notifications: {
    onBridgeStart: boolean;
    onBridgeComplete: boolean;
    onBridgeFail: boolean;
  };
}
