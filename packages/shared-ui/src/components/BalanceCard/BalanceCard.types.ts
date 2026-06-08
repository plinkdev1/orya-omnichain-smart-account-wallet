/**
 * BalanceCard component type definitions
 */

export interface BalanceCardProps {
  balance: string;
  currency: string;
  change24h?: number;
  isLoading?: boolean;
  onRefresh?: () => void;
}