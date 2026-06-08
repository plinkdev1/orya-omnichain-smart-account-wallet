/**
 * TxList component type definitions
 */

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'swap';
  amount: string;
  asset: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface TxListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onTransactionClick?: (tx: Transaction) => void;
}