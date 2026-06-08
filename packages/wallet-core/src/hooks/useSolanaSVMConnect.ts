import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSolanaAdapter, SOLANA_SVM_CHAINS } from '../services/adapters';
import type { SolanaWalletAccount } from '../services/adapters';

interface UseSolanaSVMConnectReturn {
  connected: boolean;
  connecting: boolean;
  account: SolanaWalletAccount | null;
  chainId: string;
  availableChains: string[];
  connect: (chainId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  switchChain: (chainId: string) => Promise<void>;
  getBalance: (address: string) => Promise<number>;
}

export function useSolanaSVMConnect(): UseSolanaSVMConnectReturn {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [account, setAccount] = useState<SolanaWalletAccount | null>(null);
  const [chainId, setChainId] = useState('solana:mainnet');

  const connect = useCallback(
    async (selectedChainId: string = 'solana:mainnet') => {
      setConnecting(true);
      try {
        const adapter = getSolanaAdapter(selectedChainId);
        setChainId(selectedChainId);
        setConnected(true);
        setConnecting(false);
      } catch (error) {
        console.error('Failed to connect to Solana:', error);
        setConnecting(false);
        throw error;
      }
    },
    []
  );

  const disconnect = useCallback(async () => {
    setConnected(false);
    setAccount(null);
  }, []);

  const switchChain = useCallback(async (newChainId: string) => {
    if (!SOLANA_SVM_CHAINS[newChainId]) {
      throw new Error(`Unsupported chain: ${newChainId}`);
    }
    const adapter = getSolanaAdapter(newChainId);
    setChainId(newChainId);
  }, []);

  const getBalance = useCallback(
    async (address: string) => {
      const adapter = getSolanaAdapter(chainId);
      return adapter.getBalance(address);
    },
    [chainId]
  );

  return {
    connected,
    connecting,
    account,
    chainId,
    availableChains: Object.keys(SOLANA_SVM_CHAINS),
    connect,
    disconnect,
    switchChain,
    getBalance,
  };
}
