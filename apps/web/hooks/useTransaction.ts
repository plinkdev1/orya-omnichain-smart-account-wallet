/**
 * Platform-specific React hook for Transactions
 * Wraps core transaction logic with Redux selectors for Web (Next.js)
 * 
 * PROMPT C2: Platform-Specific UI Hooks
 */

import { useTransaction as getCoreTransactionLogic, type TransactionLogic } from '@orya/wallet-core/hooks';
import type { RootState } from '@orya/wallet-core/store';
import { useDispatch, useSelector } from 'react-redux';

/**
 * Platform-specific return type for Web
 */
export interface UseTransactionReturn extends TransactionLogic {
  /** Redux transactions state */
  transactions: RootState['transactions'];
  /** Loading state */
  loading: boolean;
  /** Fetching state (for background loads) */
  fetching: boolean;
  /** Error state */
  error: any;
}

/**
 * React hook for transaction operations on Web platform
 * 
 * @returns {UseTransactionReturn} Transaction logic, state, and metadata
 * 
 * @example
 * function TransactionHistory() {
 *   const { 
 *     transactions, 
 *     loading, 
 *     getTransactions, 
 *     setFilter 
 *   } = useTransaction();
 *   
 *   useEffect(() => {
 *     getTransactions();
 *   }, []);
 *   
 *   return (
 *     <div>
 *       {loading && <Spinner />}
 *       {transactions.items.map(tx => (
 *         <TransactionRow key={tx.hash} tx={tx} />
 *       ))}
 *     </div>
 *   );
 * }
 */
export function useTransaction(): UseTransactionReturn {
  const dispatch = useDispatch();
  const transactionsState = useSelector((state: RootState) => state.transactions);
  const coreLogic = getCoreTransactionLogic();

  return {
    ...coreLogic,
    transactions: transactionsState,
    loading: transactionsState.loading,
    fetching: transactionsState.fetching,
    error: transactionsState.error,
  };
}