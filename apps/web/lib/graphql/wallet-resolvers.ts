import { gql } from '@apollo/client';

export const WALLET_QUERIES = gql`
  query GetUserWallet($userId: String!) {
    getUserWallet(userId: $userId) {
      id
      userId
      walletType
      walletAddress
      provider
      createdAt
      features {
        id
        name
        enabled
      }
      metadata {
        chainSupported
        mpcEnabled
        smartAccountEnabled
      }
    }
  }

  query GetWalletFeatures($walletType: String!) {
    getWalletFeatures(walletType: $walletType) {
      id
      name
      enabled
      optional
      description
    }
  }

  query GetUserWalletConfig($userId: String!) {
    getUserWalletConfig(userId: $userId) {
      walletType
      provider
      requiresKYB
      enableMPC
      enableSmartAccount
      availableFeatures {
        id
        name
      }
    }
  }

  query GetAvailableChains($walletType: String!) {
    getAvailableChains(walletType: $walletType) {
      id
      name
      symbol
      rpcUrl
      explorer
      enabled
    }
  }
`;

export const WALLET_MUTATIONS = gql`
  mutation CreateWallet($input: CreateWalletInput!) {
    createWallet(input: $input) {
      success
      wallet {
        id
        walletAddress
        walletType
        provider
      }
      message
    }
  }

  mutation UpdateWalletFeatures($userId: String!, $features: [String!]!) {
    updateWalletFeatures(userId: $userId, features: $features) {
      success
      wallet {
        id
        features {
          id
          name
          enabled
        }
      }
    }
  }

  mutation EnableFeature($userId: String!, $featureId: String!) {
    enableFeature(userId: $userId, featureId: $featureId) {
      success
      feature {
        id
        name
        enabled
      }
    }
  }

  mutation DisableFeature($userId: String!, $featureId: String!) {
    disableFeature(userId: $userId, featureId: $featureId) {
      success
      feature {
        id
        name
        enabled
      }
    }
  }

  mutation LinkProviderWallet($userId: String!, $provider: String!, $walletAddress: String!) {
    linkProviderWallet(userId: $userId, provider: $provider, walletAddress: $walletAddress) {
      success
      wallet {
        id
        provider
        walletAddress
      }
    }
  }
`;

export const WALLET_SUBSCRIPTIONS = gql`
  subscription OnWalletCreated($userId: String!) {
    walletCreated(userId: $userId) {
      id
      walletAddress
      walletType
      createdAt
    }
  }

  subscription OnWalletFeaturesUpdated($userId: String!) {
    walletFeaturesUpdated(userId: $userId) {
      userId
      features {
        id
        name
        enabled
      }
    }
  }
`;

export interface CreateWalletInput {
  userId: string;
  walletType: 'normie' | 'power_user' | 'eoa' | 'institutional';
  displayName?: string;
  email?: string;
  features?: string[];
}

export interface WalletResponse {
  id: string;
  userId: string;
  walletType: string;
  walletAddress: string;
  provider: string;
  createdAt: string;
  features: WalletFeature[];
  metadata: WalletMetadata;
}

export interface WalletFeature {
  id: string;
  name: string;
  enabled: boolean;
  optional?: boolean;
  description?: string;
}

export interface WalletMetadata {
  chainSupported: string[];
  mpcEnabled: boolean;
  smartAccountEnabled: boolean;
}

export interface WalletConfig {
  walletType: string;
  provider: string;
  requiresKYB: boolean;
  enableMPC: boolean;
  enableSmartAccount: boolean;
  availableFeatures: WalletFeature[];
}

export interface Chain {
  id: string;
  name: string;
  symbol: string;
  rpcUrl: string;
  explorer: string;
  enabled: boolean;
}
