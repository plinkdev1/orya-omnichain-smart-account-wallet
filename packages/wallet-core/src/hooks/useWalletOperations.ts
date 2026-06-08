/**
 * Wallet Operations Hooks
 * Task 2.9 - GraphQL hooks for wallet creation, user registration, etc.
 */

import { useMutation, useQuery } from '@apollo/client';
import {
  MUTATION_REGISTER_USER,
  MUTATION_CREATE_WALLET_MPC,
  MUTATION_SIGN_TRANSACTION,
} from '../graphql/mutations';
import {
  QUERY_USER,
  QUERY_USER_WALLETS_V2,
  QUERY_WALLET_BALANCE_V2,
} from '../graphql/queries';

interface User {
  id: string;
  email: string;
  kycStatus: string;
}

interface Wallet {
  id: string;
  address: string;
  chainId: string;
  walletType: string;
}

interface Balance {
  amount: string;
  symbol: string;
  usdValue: string;
}

interface CreateWalletResponse {
  walletId: string;
  address: string;
  recoveryPhrase?: string[];
}

export function useRegisterUser() {
  const [register, { data, loading, error }] = useMutation<
    { register: User },
    { email: string; authProvider: string }
  >(MUTATION_REGISTER_USER);

  const registerUser = async (email: string, authProvider: string): Promise<User> => {
    const result = await register({
      variables: { email, authProvider },
    });
    if (!result.data?.register) {
      throw new Error('Failed to register user');
    }
    return result.data.register;
  };

  return { registerUser, data, loading, error };
}

export function useCreateWallet() {
  const [create, { data, loading, error }] = useMutation<
    { createWallet: CreateWalletResponse },
    { userId: string; chainId: string; walletType: string }
  >(MUTATION_CREATE_WALLET_MPC);

  const createWallet = async (
    userId: string,
    chainId: string,
    walletType: string
  ): Promise<CreateWalletResponse> => {
    const result = await create({
      variables: { userId, chainId, walletType },
    });
    if (!result.data?.createWallet) {
      throw new Error('Failed to create wallet');
    }
    return result.data.createWallet;
  };

  return { createWallet, data, loading, error };
}

export function useSignTransaction() {
  const [sign, { data, loading, error }] = useMutation<
    { signTransaction: string },
    { walletId: string; transaction: string }
  >(MUTATION_SIGN_TRANSACTION);

  const signTransaction = async (
    walletId: string,
    transaction: string
  ): Promise<string> => {
    const result = await sign({
      variables: { walletId, transaction },
    });
    if (!result.data?.signTransaction) {
      throw new Error('Failed to sign transaction');
    }
    return result.data.signTransaction;
  };

  return { signTransaction, data, loading, error };
}

export function useUser(userId: string) {
  const { data, loading, error, refetch } = useQuery<
    { user: User },
    { userId: string }
  >(QUERY_USER, {
    variables: { userId },
    skip: !userId,
  });

  return {
    user: data?.user || null,
    loading,
    error,
    refetch,
  };
}

export function useUserWallets(userId: string) {
  const { data, loading, error, refetch } = useQuery<
    { wallets: Wallet[] },
    { userId: string }
  >(QUERY_USER_WALLETS_V2, {
    variables: { userId },
    skip: !userId,
  });

  return {
    wallets: data?.wallets || [],
    loading,
    error,
    refetch,
  };
}

export function useWalletBalance(walletId: string) {
  const { data, loading, error, startPolling, stopPolling } = useQuery<
    { walletBalance: Balance },
    { walletId: string }
  >(QUERY_WALLET_BALANCE_V2, {
    variables: { walletId },
    skip: !walletId,
    pollInterval: 30000,
  });

  return {
    balance: data?.walletBalance || null,
    loading,
    error,
    startPolling,
    stopPolling,
  };
}
