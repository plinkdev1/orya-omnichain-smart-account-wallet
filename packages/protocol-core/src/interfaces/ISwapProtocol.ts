/**
 * Standard interface for swap protocols
 * All DEXs must implement this interface
 */

export interface SwapQuoteParams {
  /**
   * Token address or symbol
   */
  fromToken: string;
  /**
   * Token address or symbol
   */
  toToken: string;
  /**
   * Amount to swap (as string for BigNumber compatibility)
   */
  amount: string;
  /**
   * Chain identifier (e.g., "sui", "ethereum")
   */
  chainId: string;
  /**
   * Slippage tolerance (0.01 = 1%)
   */
  slippage?: number;
  /**
   * User's wallet address for personalized quotes
   */
  userAddress?: string;
}

export interface Token {
  /**
   * Token contract address
   */
  address: string;
  /**
   * Token ticker symbol
   */
  symbol: string;
  /**
   * Human-readable token name
   */
  name: string;
  /**
   * Number of decimal places
   */
  decimals: number;
  /**
   * URL to token logo image
   */
  logoUrl?: string;
  /**
   * Current price in USD
   */
  priceUSD?: number;
}

export interface SwapRoute {
  /**
   * Protocol name (e.g., "Aftermath", "Cetus")
   */
  protocol: string;
  /**
   * Percentage of trade routed through this protocol
   */
  percentage: number;
  /**
   * Token addresses in the swap path
   */
  path: string[];
}

export interface SwapQuote {
  /**
   * Source token information
   */
  fromToken: Token;
  /**
   * Destination token information
   */
  toToken: Token;
  /**
   * Input amount
   */
  fromAmount: string;
  /**
   * Expected output amount
   */
  toAmount: string;
  /**
   * Minimum output considering slippage
   */
  minAmountOut: string;
  /**
   * Price impact percentage (0.01 = 1%)
   */
  priceImpact: number;
  /**
   * Route path taken through liquidity pools
   */
  route: SwapRoute[];
  /**
   * Estimated gas cost in native token
   */
  estimatedGas: string;
  /**
   * Estimated gas cost in USD
   */
  estimatedGasUSD: number;
  /**
   * Timestamp when quote expires
   */
  validUntil: Date;
  /**
   * Protocol-specific metadata
   */
  metadata: Record<string, unknown>;
}

export interface SwapExecutionParams {
  /**
   * Quote to execute
   */
  quote: SwapQuote;
  /**
   * User's wallet address
   */
  userAddress: string;
  /**
   * Maximum acceptable slippage
   */
  maxSlippage: number;
}

export interface SwapResult {
  /**
   * On-chain transaction hash
   */
  transactionHash: string;
  /**
   * Transaction status
   */
  status: 'pending' | 'confirmed' | 'failed';
  /**
   * Actual input amount
   */
  fromAmount: string;
  /**
   * Actual output amount
   */
  toAmount: string;
  /**
   * Actual price impact experienced
   */
  actualPriceImpact: number;
  /**
   * Actual gas used (if confirmed)
   */
  gasUsed?: string;
}

export interface FeeStructure {
  /**
   * Protocol's swap fee (0.003 = 0.3%)
   */
  protocolFee: number;
  /**
   * Platform's fee on top of protocol fee
   */
  platformFee: number;
  /**
   * Total combined fee
   */
  totalFee: number;
  /**
   * Human-readable fee breakdown
   */
  feeBreakdown: string;
}

export interface LiquidityInfo {
  /**
   * Reserve amount of first token in pool
   */
  token0Reserve: string;
  /**
   * Reserve amount of second token in pool
   */
  token1Reserve: string;
  /**
   * Total liquidity value in USD
   */
  totalLiquidityUSD: number;
  /**
   * 24-hour trading volume in USD
   */
  volume24h: number;
}

export interface ProtocolSecurityInfo {
  /**
   * Whether protocol has undergone security audit
   */
  isAudited: boolean;
  /**
   * List of auditing firms
   */
  auditors: string[];
  /**
   * URL to audit report
   */
  auditReportUrl?: string;
  /**
   * Whether protocol has active bug bounty
   */
  hasBugBounty: boolean;
  /**
   * Whether protocol code is open source
   */
  isOpenSource: boolean;
  /**
   * Security rating from 0-100
   */
  securityRating?: number;
}

export interface HealthStatus {
  /**
   * Whether protocol is currently operational
   */
  isOperational: boolean;
  /**
   * Response latency in milliseconds
   */
  latency: number;
  /**
   * When status was last updated
   */
  lastUpdated: Date;
  /**
   * Any ongoing issues or maintenance
   */
  issues?: string[];
}

/**
 * ISwapProtocol - Standard interface all swap protocol adapters must implement
 * 
 * @example
 * ```typescript
 * class AftermathSwapAdapter implements ISwapProtocol {
 *   readonly name = "Aftermath Finance";
 *   readonly chainId = "sui";
 *   // ... implementation
 * }
 * ```
 */
export interface ISwapProtocol {
  /**
   * Protocol display name
   */
  readonly name: string;
  /**
   * Chain this protocol operates on
   */
  readonly chainId: string;
  /**
   * URL to protocol logo
   */
  readonly logoUrl: string;
  /**
   * Protocol adapter version
   */
  readonly version: string;

  /**
   * Initialize the protocol adapter
   */
  initialize(): Promise<void>;

  /**
   * Get a swap quote for given parameters
   */
  getQuote(params: SwapQuoteParams): Promise<SwapQuote>;

  /**
   * Execute a swap based on quote
   */
  executeSwap(params: SwapExecutionParams): Promise<SwapResult>;

  /**
   * Get list of all supported tokens on this protocol
   */
  getSupportedTokens(): Promise<Token[]>;

  /**
   * Check if specific token is supported
   */
  isTokenSupported(tokenAddress: string): Promise<boolean>;

  /**
   * Get protocol's current fee structure
   */
  getFeeStructure(): Promise<FeeStructure>;

  /**
   * Get liquidity information for token pair
   */
  getLiquidity(tokenPair: [string, string]): Promise<LiquidityInfo>;

  /**
   * Get security information about this protocol
   */
  getSecurityInfo(): ProtocolSecurityInfo;

  /**
   * Check if protocol is currently available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get current health status of protocol endpoints
   */
  getHealthStatus(): Promise<HealthStatus>;

  /**
   * Get minimum swap amount for a token
   */
  getMinSwapAmount(token: string): Promise<string>;

  /**
   * Get maximum swap amount for a token
   */
  getMaxSwapAmount(token: string): Promise<string>;
}
