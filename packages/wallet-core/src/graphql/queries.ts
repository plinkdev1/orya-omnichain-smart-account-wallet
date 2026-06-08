/**
 * GraphQL Queries - wallet-core
 * Shared queries used by both web and mobile
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
 * Get current user
 */
export const QUERY_CURRENT_USER = gql`
  query CurrentUser {
    currentUser {
      id
      email
      displayName
      profileImage
      createdAt
      kyc {
        status
        level
        completedAt
      }
    }
  }
`;

/**
 * Get user wallets
 */
export const QUERY_USER_WALLETS = gql`
  query UserWallets($userId: ID!) {
    userWallets(userId: $userId) {
      id
      address
      chainType
      name
      balance {
        symbol
        amount
        decimals
        valueUSD
      }
      createdAt
    }
  }
`;

/**
 * Get user portfolio
 */
export const QUERY_PORTFOLIO = gql`
  query Portfolio($userId: ID!) {
    portfolio(userId: $userId) {
      id
      totalValueUSD
      dailyChange
      dailyChangePercent
      allocations {
        chainType
        percentage
        valueUSD
      }
      riskProfile {
        score
        level
      }
      metrics {
        totalValueUSD
        totalValueChange24h
        totalValueChangePercent24h
      }
    }
  }
`;

/**
 * Get transaction history
 */
export const QUERY_TRANSACTIONS = gql`
  query Transactions($userId: ID!, $limit: Int, $offset: Int) {
    transactions(userId: $userId, limit: $limit, offset: $offset) {
      id
      type
      status
      amount
      token
      fromAddress
      toAddress
      txHash
      timestamp
      gasUsed
      gasFee
    }
  }
`;

/**
 * Get single transaction
 */
export const QUERY_TRANSACTION = gql`
  query Transaction($id: ID!) {
    transaction(id: $id) {
      id
      type
      status
      amount
      token
      fromAddress
      toAddress
      txHash
      timestamp
      gasUsed
      gasFee
    }
  }
`;

/**
 * Get wallet balance
 */
export const QUERY_WALLET_BALANCE = gql`
  query WalletBalance($address: String!, $chainType: String!) {
    walletBalance(address: $address, chainType: $chainType) {
      symbol
      amount
      decimals
      valueUSD
      chainType
    }
  }
`;

/**
 * Get token metadata
 */
export const QUERY_TOKEN = gql`
  query Token($id: ID!) {
    token(id: $id) {
      id
      address
      symbol
      name
      decimals
      chainType
      price
      marketCap
      volume24h
      change24h
      verified
    }
  }
`;

/**
 * Get multiple tokens
 */
export const QUERY_TOKENS = gql`
  query Tokens($chainType: String, $limit: Int) {
    tokens(chainType: $chainType, limit: $limit) {
      id
      symbol
      name
      decimals
      price
      change24h
      icon
      verified
    }
  }
`;

/**
 * Get user by ID (Task 2.9)
 */
export const QUERY_USER = gql`
  query GetUser($userId: String!) {
    user(userId: $userId) {
      id
      email
      kycStatus
    }
  }
`;

/**
 * Get user wallets (Task 2.9)
 */
export const QUERY_USER_WALLETS_V2 = gql`
  query GetUserWallets($userId: String!) {
    wallets(userId: $userId) {
      id
      address
      chainId
      walletType
    }
  }
`;

/**
 * Get wallet balance (Task 2.9)
 */
export const QUERY_WALLET_BALANCE_V2 = gql`
  query GetWalletBalance($walletId: String!) {
    walletBalance(walletId: $walletId) {
      amount
      symbol
      usdValue
    }
  }
`;

/**
 * Get SUI balance (Task 2D.3)
 */
export const GET_SUI_BALANCE = gql`
  query GetSUIBalance($userId: ID!, $address: String!) {
    suiWallet(userId: $userId, chain: "sui") {
      address
      balance {
        total
        coinType
        lockedBalance
      }
      coins {
        coinType
        balance
        coinObjectCount
      }
    }
  }
`;