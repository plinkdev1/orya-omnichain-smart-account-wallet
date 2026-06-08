import { useState } from 'react';
import { useSUIWallet } from '../providers/SUIWalletProvider';
import { Alert } from 'react-native';

interface TransactionBlockLike {
  build?: (options?: any) => Promise<Uint8Array> | Uint8Array;
}

export function useSUITransaction() {
  const { signAndExecuteTransactionBlock, selectedAccount } = useSUIWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<string | null>(null);

  const execute = async (txBlock: TransactionBlockLike | Uint8Array) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!selectedAccount) throw new Error('No account selected');

      let txBytes: Uint8Array;

      if (txBlock instanceof Uint8Array) {
        txBytes = txBlock;
      } else if (typeof txBlock === 'object' && txBlock !== null && 'build' in txBlock) {
        txBytes = await txBlock.build?.();
      } else {
        txBytes = txBlock as Uint8Array;
      }

      if (!txBytes || !(txBytes instanceof Uint8Array)) {
        throw new Error('Failed to build transaction');
      }

      const digest = await signAndExecuteTransactionBlock(txBytes);
      setData(digest);
      Alert.alert('Success', `Transaction executed: ${digest.slice(0, 10)}...`);
      return digest;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      Alert.alert(
        'Error',
        errorObj.message || 'An unknown error occurred'
      );
      throw errorObj;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setIsLoading(false);
    setError(null);
    setData(null);
  };

  return {
    execute,
    mutateAsync: execute,
    isLoading,
    error,
    data,
    reset,
  };
}
