import { useCallback, useState } from 'react';
import { getTonAdapter, TON_CHAINS } from '../services/adapters';
import type { TonWalletAccount } from '../services/adapters';

interface UseTonConnectReturn {
  connected: boolean;
  connecting: boolean;
  account: TonWalletAccount | null;
  chainId: string;
  availableChains: string[];
  connect: (chainId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  switchChain: (chainId: string) => Promise<void>;
  getBalance: (address: string) => Promise<number>;
  createWallet: (mnemonic: string[]) => Promise<string>;
  sendTransaction: (
    sender: string,
    destination: string,
    amount: number,
    payload?: string
  ) => Promise<string>;
}

export function useTonConnect(): UseTonConnectReturn {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [account, setAccount] = useState<TonWalletAccount | null>(null);
  const [chainId, setChainId] = useState('ton:mainnet');

  const connect = useCallback(
    async (selectedChainId: string = 'ton:mainnet') => {
      setConnecting(true);
      try {
        const adapter = getTonAdapter(selectedChainId);
        setChainId(selectedChainId);
        setConnected(true);
        setConnecting(false);
      } catch (error) {
        console.error('Failed to connect to TON:', error);
        setConnecting(false);
        throw error;
      }
    },
    []
  );

  const disconnect = useCallback(async () => {
    const adapter = getTonAdapter(chainId);
    await adapter.disconnect();
    setConnected(false);
    setAccount(null);
  }, [chainId]);

  const switchChain = useCallback(async (newChainId: string) => {
    if (!TON_CHAINS[newChainId]) {
      throw new Error(`Unsupported chain: ${newChainId}`);
    }
    const adapter = getTonAdapter(newChainId);
    adapter.switchChain(newChainId);
    setChainId(newChainId);
  }, []);

  const getBalance = useCallback(
    async (address: string) => {
      const adapter = getTonAdapter(chainId);
      return adapter.getBalance(address);
    },
    [chainId]
  );

  const createWallet = useCallback(
    async (mnemonic: string[]) => {
      const adapter = getTonAdapter(chainId);
      return adapter.createWallet(mnemonic);
    },
    [chainId]
  );

  const sendTransaction = useCallback(
    async (sender: string, destination: string, amount: number, payload?: string) => {
      const adapter = getTonAdapter(chainId);
      return adapter.sendTransaction(sender, destination, amount, payload);
    },
    [chainId]
  );

  return {
    connected,
    connecting,
    account,
    chainId,
    availableChains: Object.keys(TON_CHAINS),
    connect,
    disconnect,
    switchChain,
    getBalance,
    createWallet,
    sendTransaction,
  };
}
