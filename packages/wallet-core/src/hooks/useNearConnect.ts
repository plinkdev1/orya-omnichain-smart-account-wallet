import { useCallback, useState } from 'react';
import { getNearAdapter, NEAR_CHAINS } from '../services/adapters';
import type { NearWalletAccount } from '../services/adapters';

interface UseNearConnectReturn {
  connected: boolean;
  connecting: boolean;
  account: NearWalletAccount | null;
  chainId: string;
  availableChains: string[];
  connect: (chainId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  switchChain: (chainId: string) => Promise<void>;
  getBalance: (accountId: string) => Promise<number>;
  getAccount: (accountId: string) => Promise<any>;
  getTransactionStatus: (txHash: string, accountId: string) => Promise<'pending' | 'success' | 'failed'>;
}

export function useNearConnect(): UseNearConnectReturn {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [account, setAccount] = useState<NearWalletAccount | null>(null);
  const [chainId, setChainId] = useState('near:mainnet');

  const connect = useCallback(
    async (selectedChainId: string = 'near:mainnet') => {
      setConnecting(true);
      try {
        const adapter = getNearAdapter(selectedChainId);
        setChainId(selectedChainId);
        setConnected(true);
        setConnecting(false);
      } catch (error) {
        console.error('Failed to connect to NEAR:', error);
        setConnecting(false);
        throw error;
      }
    },
    []
  );

  const disconnect = useCallback(async () => {
    const adapter = getNearAdapter(chainId);
    await adapter.disconnect();
    setConnected(false);
    setAccount(null);
  }, [chainId]);

  const switchChain = useCallback(async (newChainId: string) => {
    if (!NEAR_CHAINS[newChainId]) {
      throw new Error(`Unsupported chain: ${newChainId}`);
    }
    const adapter = getNearAdapter(newChainId);
    adapter.switchChain(newChainId);
    setChainId(newChainId);
  }, []);

  const getBalance = useCallback(
    async (accountId: string) => {
      const adapter = getNearAdapter(chainId);
      return adapter.getBalance(accountId);
    },
    [chainId]
  );

  const getAccount = useCallback(
    async (accountId: string) => {
      const adapter = getNearAdapter(chainId);
      return adapter.getAccount(accountId);
    },
    [chainId]
  );

  const getTransactionStatus = useCallback(
    async (txHash: string, accountId: string) => {
      const adapter = getNearAdapter(chainId);
      return adapter.getTransactionStatus(txHash, accountId);
    },
    [chainId]
  );

  return {
    connected,
    connecting,
    account,
    chainId,
    availableChains: Object.keys(NEAR_CHAINS),
    connect,
    disconnect,
    switchChain,
    getBalance,
    getAccount,
    getTransactionStatus,
  };
}
