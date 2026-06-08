/**
 * Standard interface for lending protocols
 */
import type { Token, ProtocolSecurityInfo, HealthStatus } from './ISwapProtocol';
export interface SupplyParams {
    /**
     * Asset to supply (token address)
     */
    asset: string;
    /**
     * Amount to supply
     */
    amount: string;
    /**
     * User's wallet address
     */
    userAddress: string;
}
export interface BorrowParams {
    /**
     * Asset to borrow (token address)
     */
    asset: string;
    /**
     * Amount to borrow
     */
    amount: string;
    /**
     * User's wallet address
     */
    userAddress: string;
    /**
     * Collateral asset address (if different from borrow asset)
     */
    collateralAsset?: string;
}
export interface SuppliedAsset {
    /**
     * Token information
     */
    token: Token;
    /**
     * Amount supplied
     */
    amount: string;
    /**
     * Annual percentage yield
     */
    apy: number;
    /**
     * Value in USD
     */
    valueUSD: number;
}
export interface BorrowedAsset {
    /**
     * Token information
     */
    token: Token;
    /**
     * Amount borrowed
     */
    amount: string;
    /**
     * Annual percentage rate charged
     */
    apr: number;
    /**
     * Value in USD
     */
    valueUSD: number;
}
export interface LendingPosition {
    /**
     * All supplied assets
     */
    supplied: SuppliedAsset[];
    /**
     * All borrowed assets
     */
    borrowed: BorrowedAsset[];
    /**
     * Health factor (> 1 means safe, < 1 means at risk)
     */
    healthFactor: number;
    /**
     * Ratio of collateral to borrowed
     */
    collateralRatio: number;
    /**
     * Threshold below which liquidation occurs
     */
    liquidationThreshold: number;
}
export interface MarketData {
    /**
     * Token address
     */
    asset: string;
    /**
     * Total amount supplied to market
     */
    totalSupplied: string;
    /**
     * Total amount borrowed from market
     */
    totalBorrowed: string;
    /**
     * Current supply APY
     */
    supplyAPY: number;
    /**
     * Current borrow APR
     */
    borrowAPY: number;
    /**
     * Market utilization rate
     */
    utilizationRate: number;
    /**
     * Available liquidity
     */
    liquidityAvailable: string;
}
/**
 * ILendingProtocol - Standard interface all lending protocol adapters must implement
 *
 * @example
 * ```typescript
 * class NAVILendingAdapter implements ILendingProtocol {
 *   readonly name = "NAVI Protocol";
 *   readonly chainId = "sui";
 *   // ... implementation
 * }
 * ```
 */
export interface ILendingProtocol {
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
     * Supply (deposit) an asset as collateral
     */
    supply(params: SupplyParams): Promise<string>;
    /**
     * Withdraw a previously supplied asset
     */
    withdraw(params: SupplyParams): Promise<string>;
    /**
     * Get current supply APY for an asset
     */
    getSupplyAPY(asset: string): Promise<number>;
    /**
     * Borrow an asset against collateral
     */
    borrow(params: BorrowParams): Promise<string>;
    /**
     * Repay borrowed amount
     */
    repay(params: BorrowParams): Promise<string>;
    /**
     * Get current borrow APR for an asset
     */
    getBorrowAPY(asset: string): Promise<number>;
    /**
     * Get lending position for user
     */
    getPosition(userAddress: string): Promise<LendingPosition>;
    /**
     * Get available amount user can borrow for an asset
     */
    getAvailableToBorrow(userAddress: string, asset: string): Promise<string>;
    /**
     * Get all supported lending assets
     */
    getSupportedAssets(): Promise<Token[]>;
    /**
     * Get market data for an asset
     */
    getMarketData(asset: string): Promise<MarketData>;
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
}
//# sourceMappingURL=ILendingProtocol.d.ts.map