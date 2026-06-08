import { useCallback, useState } from 'react';
import { getCosmosAdapter, COSMOS_CHAINS } from '../services/adapters';
import type { CosmosWalletAccount } from '../services/adapters';

interface UseCosmosExtendedConnectReturn {
  connected: boolean;
  connecting: boolean;
  account: CosmosWalletAccount | null;
  chainId: string;
  availableChains: string[];
  connect: (chainId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  switchChain: (chainId: string) => Promise<void>;
  getBalance: (address: string) => Promise<number>;
  getAllBalances: (address: string) => Promise<Array<{ denom: string; amount: string }>>;
}

export function useCosmosExtendedConnect(): UseCosmosExtendedConnectReturn {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [account, setAccount] = useState<CosmosWalletAccount | null>(null);
  const [chainId, setChainId] = useState('cosmoshub-4');

  const connect = useCallback(
    async (selectedChainId: string = 'cosmoshub-4') => {
      setConnecting(true);
      try {
        const adapter = getCosmosAdapter(selectedChainId);
        setChainId(selectedChainId);
        setConnected(true);
        setConnecting(false);
      } catch (error) {
        console.error('Failed to connect to Cosmos:', error);
        setConnecting(false);
        throw error;
      }
    },
    []
  );

  const disconnect = useCallback(async () => {
    const adapter = getCosmosAdapter(chainId);
    await adapter.disconnect();
    setConnected(false);
    setAccount(null);
  }, [chainId]);

  const switchChain = useCallback(async (newChainId: string) => {
    if (!COSMOS_CHAINS[newChainId]) {
      throw new Error(`Unsupported chain: ${newChainId}`);
    }
    const adapter = getCosmosAdapter(newChainId);
    adapter.switchChain(newChainId);
    setChainId(newChainId);
  }, []);

  const getBalance = useCallback(
    async (address: string) => {
      const adapter = getCosmosAdapter(chainId);
      return adapter.getBalance(address);
    },
    [chainId]
  );

  const getAllBalances = useCallback(
    async (address: string) => {
      const adapter = getCosmosAdapter(chainId);
      return adapter.getAllBalances(address);
    },
    [chainId]
  );

  return {
    connected,
    connecting,
    account,
    chainId,
    availableChains: Object.keys(COSMOS_CHAINS),
    connect,
    disconnect,
    switchChain,
    getBalance,
    getAllBalances,
  };
}
