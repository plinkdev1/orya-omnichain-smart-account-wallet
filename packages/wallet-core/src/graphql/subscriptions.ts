/**
 * GraphQL Subscriptions - wallet-core
 * Real-time updates for wallet, transactions, market data
 * TODO: Implement subscription setup in Apollo clients
 */

// Apollo Client is an optional dependency
let gql: any = null;
try {
  const apolloClient = require("@apollo/client");
  gql = apolloClient.gql;
} catch (error) {
  // Fallback: provide a mock gql function
  gql = (strings: any, ...values: any[]) => ({ kind: 'Document', definitions: [] });
}

/**
 * Subscribe to balance updates
 */
export const SUBSCRIPTION_BALANCE_UPDATED = gql`
  subscription BalanceUpdated($walletAddress: String!) {
    balanceUpdated(walletAddress: $walletAddress) {
      symbol
      amount
      decimals
      valueUSD
      chainType
    }
  }
`;

/**
 * Subscribe to transaction status changes
 */
export const SUBSCRIPTION_TRANSACTION_STATUS = gql`
  subscription TransactionStatusChanged($transactionId: ID!) {
    transactionStatusChanged(transactionId: $transactionId) {
      id
      status
      txHash
      gasUsed
      gasFee
    }
  }
`;

/**
 * Subscribe to portfolio updates
 */
export const SUBSCRIPTION_PORTFOLIO_UPDATED = gql`
  subscription PortfolioUpdated($userId: ID!) {
    portfolioUpdated(userId: $userId) {
      id
      totalValueUSD
      dailyChange
      allocations {
        chainType
        percentage
        valueUSD
      }
    }
  }
`;

/**
 * Subscribe to price updates
 */
export const SUBSCRIPTION_PRICE_UPDATED = gql`
  subscription PriceUpdated($symbol: String!) {
    priceUpdated(symbol: $symbol)
  }
`;