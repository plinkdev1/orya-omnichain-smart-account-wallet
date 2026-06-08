/**
 * Portfolio Entity & Calculations
 * Pure business logic for portfolio aggregation and analytics
 */

export interface AssetPosition {
  symbol: string;
  chainId: string;
  amount: string;
  priceUSD: string;
  valueUSD: string;
  change24h?: string;
  percentChange24h?: number;
}

export interface PortfolioSnapshot {
  walletId: string;
  totalValueUSD: string;
  assets: AssetPosition[];
  timestamp: Date;
  gainLossUSD?: string;
  gainLossPercent?: number;
}

export class Portfolio {
  private assets: Map<string, AssetPosition> = new Map();
  private snapshot: PortfolioSnapshot;

  constructor(walletId: string, assets: AssetPosition[] = []) {
    this.snapshot = {
      walletId,
      totalValueUSD: '0',
      assets,
      timestamp: new Date(),
    };

    assets.forEach((asset) => {
      const key = `${asset.chainId}:${asset.symbol}`;
      this.assets.set(key, asset);
    });
  }

  addAsset(asset: AssetPosition): void {
    const key = `${asset.chainId}:${asset.symbol}`;
    this.assets.set(key, asset);
    this.recalculateTotalValue();
  }

  removeAsset(chainId: string, symbol: string): void {
    const key = `${chainId}:${symbol}`;
    this.assets.delete(key);
    this.recalculateTotalValue();
  }

  getAsset(chainId: string, symbol: string): AssetPosition | undefined {
    const key = `${chainId}:${symbol}`;
    return this.assets.get(key);
  }

  getAssets(): AssetPosition[] {
    return Array.from(this.assets.values());
  }

  getTotalValue(): string {
    return this.snapshot.totalValueUSD;
  }

  getSnapshot(): PortfolioSnapshot {
    return { ...this.snapshot, assets: [...this.snapshot.assets] };
  }

  private recalculateTotalValue(): void {
    const total = Array.from(this.assets.values())
      .reduce((sum, asset) => sum + parseFloat(asset.valueUSD), 0);

    this.snapshot.totalValueUSD = total.toFixed(2);
    this.snapshot.assets = Array.from(this.assets.values());
    this.snapshot.timestamp = new Date();
  }

  calculateChange24h(): number {
    const change = this.snapshot.assets.reduce((sum, asset) => {
      const change24h = parseFloat(asset.change24h || '0');
      const assetValue = parseFloat(asset.valueUSD);
      return sum + change24h * assetValue;
    }, 0);

    return change;
  }

  calculateChangePercent24h(): number {
    const totalValue = parseFloat(this.snapshot.totalValueUSD);
    if (totalValue === 0) return 0;

    const change24h = this.calculateChange24h();
    return (change24h / totalValue) * 100;
  }

  getTopAssets(limit: number = 5): AssetPosition[] {
    return this.getAssets()
      .sort((a, b) => parseFloat(b.valueUSD) - parseFloat(a.valueUSD))
      .slice(0, limit);
  }

  getAssetAllocation(): Record<string, number> {
    const totalValue = parseFloat(this.snapshot.totalValueUSD);
    if (totalValue === 0) return {};

    const allocation: Record<string, number> = {};
    this.getAssets().forEach((asset) => {
      const value = parseFloat(asset.valueUSD);
      allocation[asset.symbol] = (value / totalValue) * 100;
    });

    return allocation;
  }
}

/**
 * Portfolio factory function
 */
export function createPortfolio(walletId: string, assets?: AssetPosition[]): Portfolio {
  return new Portfolio(walletId, assets);
}

/**
 * Portfolio calculations
 */
export function calculatePortfolioValue(assets: AssetPosition[]): string {
  const total = assets.reduce((sum, asset) => sum + parseFloat(asset.valueUSD), 0);
  return total.toFixed(2);
}

export function calculatePortfolioAllocation(
  assets: AssetPosition[]
): Record<string, number> {
  const total = parseFloat(calculatePortfolioValue(assets));
  if (total === 0) return {};

  const allocation: Record<string, number> = {};
  assets.forEach((asset) => {
    allocation[asset.symbol] = (parseFloat(asset.valueUSD) / total) * 100;
  });
  return allocation;
}