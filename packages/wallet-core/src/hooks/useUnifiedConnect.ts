import { useCallback, useState } from 'react';
import { useConnect as useWagmiConnect } from 'wagmi';
import { useSuiZkLogin } from './useSuiZkLogin';
import type { Chain } from '@orya/shared-types';
import { ChainType } from '@orya/shared-types';
import { getVMAdapter } from '../services/adapters';

export type WalletConnectionProvider = 
  | 'walletconnect'
  | 'metamask'
  | 'coinbase'
  | 'rainbow'
  | 'privy'
  | 'sui-zklogin'
  | 'sui-standard'
  | 'aptos'
  | 'movement'
  | 'solana'
  | 'keplr'
  | 'magic'
  | 'tronlink'
  | 'eternl'
  | 'nami'
  | 'talisman'
  | 'nova';

export interface UnifiedConnectState {
  isConnecting: boolean;
  isConnected: boolean;
  error: Error | null;
  walletAddress: string | null;
  chainId: string | null;
  provider: WalletConnectionProvider | null;
}

export interface UseUnifiedConnectOptions {
  chain: Chain;
  clientId?: string;
  redirectUrl?: string;
  onSuccess?: (address: string, provider: WalletConnectionProvider) => void;
  onError?: (error: Error) => void;
}

export function useUnifiedConnect(options: UseUnifiedConnectOptions) {
  const { chain, clientId, redirectUrl, onSuccess, onError } = options;
  const [state, setState] = useState<UnifiedConnectState>({
    isConnecting: false,
    isConnected: false,
    error: null,
    walletAddress: null,
    chainId: null,
    provider: null,
  });

  const wagmiConnect = useWagmiConnect();
  const suiZkLogin = useSuiZkLogin({
    clientId: clientId || '',
    redirectUrl: redirectUrl || window.location.origin,
  });

  const connect = useCallback(
    async (provider: WalletConnectionProvider) => {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));

      try {
        let address: string | null = null;

        switch (chain.type) {
          case ChainType.SUI:
            if (provider === 'sui-zklogin' && clientId && redirectUrl) {
              await suiZkLogin.startZkLogin('google');
              return;
            }
            break;

          case ChainType.EVM:
            if (['metamask', 'walletconnect', 'coinbase', 'rainbow'].includes(provider)) {
              await wagmiConnect.connect({ connector: wagmiConnect.connectors[0] });
              address = 'pending';
            }
            break;

          case ChainType.APTOS:
          case ChainType.MOVEMENT:
            const adapter = getVMAdapter(chain);
            if (adapter) {
              setState(prev => ({
                ...prev,
                isConnecting: false,
                isConnected: true,
                provider,
                chainId: chain.id,
                walletAddress: 'connected',
              }));
              onSuccess?.('connected', provider);
              return;
            }
            break;

          case ChainType.SOLANA:
            break;

          case ChainType.COSMOS:
            break;

          case ChainType.TRON:
            if (provider === 'tronlink') {
              address = 'pending';
            }
            break;

          case ChainType.CARDANO:
            if (['eternl', 'nami'].includes(provider)) {
              address = 'pending';
            }
            break;

          case ChainType.SUBSTRATE:
            if (['talisman', 'nova'].includes(provider)) {
              address = 'pending';
            }
            break;

          default:
            throw new Error(`Unsupported chain type: ${chain.type}`);
        }

        if (address || address === 'pending' || address === 'connected') {
          setState(prev => ({
            ...prev,
            isConnecting: false,
            isConnected: address !== 'pending',
            provider,
            chainId: chain.id,
            walletAddress: address === 'pending' ? null : address || '',
          }));

          if (address && address !== 'pending') {
            onSuccess?.(address, provider);
          }
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState(prev => ({
          ...prev,
          isConnecting: false,
          error: err,
        }));
        onError?.(err);
      }
    },
    [chain, clientId, redirectUrl, wagmiConnect, suiZkLogin, onSuccess, onError]
  );

  const disconnect = useCallback(async () => {
    try {
      setState({
        isConnecting: false,
        isConnected: false,
        error: null,
        walletAddress: null,
        chainId: null,
        provider: null,
      });

      if (state.provider === 'sui-zklogin') {
        suiZkLogin.logout();
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState(prev => ({ ...prev, error: err }));
    }
  }, [state.provider, suiZkLogin]);

  const getRecommendedProvider = useCallback((): WalletConnectionProvider => {
    switch (chain.type) {
      case ChainType.SUI:
        return 'sui-zklogin';
      case ChainType.EVM:
        return 'metamask';
      case ChainType.APTOS:
        return 'aptos';
      case ChainType.MOVEMENT:
        return 'movement';
      case ChainType.SOLANA:
        return 'solana';
      case ChainType.COSMOS:
        return 'keplr';
      case ChainType.TRON:
        return 'tronlink';
      case ChainType.CARDANO:
        return 'eternl';
      case ChainType.SUBSTRATE:
        return 'talisman';
      default:
        return 'walletconnect';
    }
  }, [chain.type]);

  const getSupportedProviders = useCallback((): WalletConnectionProvider[] => {
    const providers: WalletConnectionProvider[] = [];

    switch (chain.type) {
      case ChainType.SUI:
        providers.push('sui-zklogin', 'sui-standard', 'walletconnect');
        break;
      case ChainType.EVM:
        providers.push('metamask', 'walletconnect', 'coinbase', 'rainbow', 'privy');
        break;
      case ChainType.APTOS:
        providers.push('aptos', 'walletconnect');
        break;
      case ChainType.MOVEMENT:
        providers.push('movement', 'walletconnect');
        break;
      case ChainType.SOLANA:
        providers.push('solana', 'walletconnect');
        break;
      case ChainType.COSMOS:
        providers.push('keplr', 'walletconnect');
        break;
      case ChainType.TRON:
        providers.push('tronlink', 'walletconnect');
        break;
      case ChainType.CARDANO:
        providers.push('eternl', 'nami', 'walletconnect');
        break;
      case ChainType.SUBSTRATE:
        providers.push('talisman', 'nova', 'walletconnect');
        break;
      default:
        providers.push('walletconnect');
    }

    return providers;
  }, [chain.type]);

  return {
    ...state,
    connect,
    disconnect,
    getRecommendedProvider,
    getSupportedProviders,
  };
}
