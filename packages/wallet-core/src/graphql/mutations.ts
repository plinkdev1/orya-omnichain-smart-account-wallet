/**
 * GraphQL Mutations - wallet-core
 * Shared mutations used by both web and mobile
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
 * Create transaction
 */
export const MUTATION_CREATE_TRANSACTION = gql`
  mutation CreateTransaction($input: CreateTransactionInput!) {
    createTransaction(input: $input) {
      id
      type
      status
      amount
      token
      fromAddress
      toAddress
      timestamp
    }
  }
`;

/**
 * Approve transaction
 */
export const MUTATION_APPROVE_TRANSACTION = gql`
  mutation ApproveTransaction($transactionId: ID!) {
    approveTransaction(transactionId: $transactionId) {
      id
      status
      txHash
    }
  }
`;

/**
 * Reject transaction
 */
export const MUTATION_REJECT_TRANSACTION = gql`
  mutation RejectTransaction($transactionId: ID!) {
    rejectTransaction(transactionId: $transactionId)
  }
`;

/**
 * Update user profile
 */
export const MUTATION_UPDATE_USER_PROFILE = gql`
  mutation UpdateUserProfile($input: UpdateUserInput!) {
    updateUserProfile(input: $input) {
      id
      displayName
      profileImage
      updatedAt
    }
  }
`;

/**
 * Add wallet
 */
export const MUTATION_ADD_WALLET = gql`
  mutation AddWallet($input: AddWalletInput!) {
    addWallet(input: $input) {
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
    }
  }
`;

/**
 * Remove wallet
 */
export const MUTATION_REMOVE_WALLET = gql`
  mutation RemoveWallet($walletId: ID!) {
    removeWallet(walletId: $walletId)
  }
`;

/**
 * Rename wallet
 */
export const MUTATION_RENAME_WALLET = gql`
  mutation RenameWallet($walletId: ID!, $name: String!) {
    renameWallet(walletId: $walletId, name: $name) {
      id
      name
    }
  }
`;

/**
 * Register user
 */
export const MUTATION_REGISTER_USER = gql`
  mutation RegisterUser($email: String!, $authProvider: String!) {
    register(email: $email, authProvider: $authProvider) {
      id
      email
      kycStatus
    }
  }
`;

/**
 * Create wallet (MPC)
 */
export const MUTATION_CREATE_WALLET_MPC = gql`
  mutation CreateWallet($userId: String!, $chainId: String!, $walletType: String!) {
    createWallet(userId: $userId, chainId: $chainId, walletType: $walletType) {
      walletId
      address
      recoveryPhrase
    }
  }
`;

/**
 * Sign transaction
 */
export const MUTATION_SIGN_TRANSACTION = gql`
  mutation SignTransaction($walletId: String!, $transaction: String!) {
    signTransaction(walletId: $walletId, transaction: $transaction)
  }
`;

/**
 * Upgrade wallet (Normie to Web3)
 * Creates a SUI MPC wallet and updates user segment
 */
export const MUTATION_UPGRADE_TO_WEB3 = gql`
  mutation UpgradeToWeb3($userId: String!) {
    upgradeToWeb3(userId: $userId) {
      id
      address
      chainType
      type
      userSegment
    }
  }
`;