/**
 * Upgrade Wallet Hook
 * Handles the upgrade flow from Normie to Web3 mode
 * Creates SUI MPC wallet and updates user profile
 */

import { useMutation } from '@apollo/client';
import { useCallback, useState } from 'react';
import { UserSegment } from '@orya/shared-types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addWallet as addWalletAction, setLoading, setError } from '../store/wallet.slice';
import { setUser } from '../store/auth.slice';
import type { RootState } from '../store/store';
import { MUTATION_UPGRADE_TO_WEB3 } from '../graphql/mutations';

interface UpgradeResult {
  id: string;
  address: string;
  chainType: string;
  type: string;
  userSegment: UserSegment;
}

interface UpgradeResponse {
  upgradeToWeb3: UpgradeResult;
}

export interface UseUpgradeWalletReturn {
  upgrade: () => Promise<UpgradeResult>;
  loading: boolean;
  error: string | null;
  success: boolean;
  reset: () => void;
}

export function useUpgradeWallet(): UseUpgradeWalletReturn {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state: RootState) => state.auth.user);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [mutateUpgrade] = useMutation<UpgradeResponse>(MUTATION_UPGRADE_TO_WEB3);

  const upgrade = useCallback(async (): Promise<UpgradeResult> => {
    if (!user?.id) {
      const error = 'User not authenticated';
      setLocalError(error);
      throw new Error(error);
    }

    try {
      setLocalLoading(true);
      setLocalError(null);
      setSuccess(false);
      dispatch(setLoading(true));
      dispatch(setError(null));

      const result = await mutateUpgrade({
        variables: { userId: user.id },
      });

      if (!result.data?.upgradeToWeb3) {
        throw new Error('Failed to upgrade wallet');
      }

      const walletData = result.data.upgradeToWeb3;

      dispatch(
        addWalletAction({
          id: walletData.id,
          name: 'SUI Wallet',
          address: walletData.address,
          chain: walletData.chainType,
          balance: null,
          type: 'mpc',
        })
      );

      if (user) {
        dispatch(
          setUser({
            ...user,
            userSegment: walletData.userSegment,
          })
        );
      }

      setSuccess(true);
      setLocalLoading(false);
      dispatch(setLoading(false));

      return walletData;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to upgrade wallet';
      setLocalError(errorMessage);
      dispatch(setError(errorMessage));
      setLocalLoading(false);
      dispatch(setLoading(false));
      throw err;
    }
  }, [user, mutateUpgrade, dispatch]);

  const reset = useCallback(() => {
    setLocalLoading(false);
    setLocalError(null);
    setSuccess(false);
    dispatch(setError(null));
  }, [dispatch]);

  return {
    upgrade,
    loading: localLoading,
    error: localError,
    success,
    reset,
  };
}
