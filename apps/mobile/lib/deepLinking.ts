import * as Linking from 'expo-linking';
import { router } from 'expo-router';

export type DeepLinkParams = {
  action?: string;
  address?: string;
  chain?: string;
  txHash?: string;
  uri?: string;
  status?: string;
  error?: string;
};

export type DeepLinkRoute = {
  path: string;
  params?: Record<string, string>;
};

const DEEP_LINK_PREFIX = 'orya://';
const UNIVERSAL_LINK_PREFIX = 'https://orya.app/wallet';

export function parseDeepLink(url: string): DeepLinkRoute | null {
  try {
    const parsed = Linking.parse(url);
    
    if (!parsed.path) {
      return null;
    }

    const params = parsed.queryParams as Record<string, string>;
    
    return {
      path: parsed.path,
      params,
    };
  } catch (error) {
    console.error('[DeepLink] Parse error:', error);
    return null;
  }
}

export function handleWalletCallback(params: DeepLinkParams): void {
  const { action, address, chain, txHash, status, error } = params;

  if (error) {
    console.error('[DeepLink] Wallet callback error:', error);
    router.push({
      pathname: '/onboarding/external/error',
      params: { error },
    });
    return;
  }

  switch (action) {
    case 'connect':
      if (address) {
        router.push({
          pathname: '/onboarding/external/confirm',
          params: { address, chain: chain || 'unknown' },
        });
      }
      break;

    case 'transaction':
      if (txHash) {
        router.push({
          pathname: '/transactions',
          params: { txHash, status: status || 'pending' },
        });
      }
      break;

    case 'sign':
      if (status === 'success') {
        router.push('/');
      } else if (status === 'rejected') {
        router.back();
      }
      break;

    default:
      console.warn('[DeepLink] Unknown action:', action);
      router.push('/');
  }
}

export function handleDeepLink(url: string): void {
  console.log('[DeepLink] Handling URL:', url);

  const route = parseDeepLink(url);
  
  if (!route) {
    console.warn('[DeepLink] Invalid URL format');
    return;
  }

  const { path, params } = route;

  if (path === 'wallet/callback' || path === 'callback') {
    handleWalletCallback(params as DeepLinkParams);
  } else if (path.startsWith('wallet/')) {
    const cleanPath = path.replace('wallet/', '');
    router.push({
      pathname: `/${cleanPath}` as any,
      params,
    });
  } else {
    router.push({
      pathname: `/${path}` as any,
      params,
    });
  }
}

export function createWalletConnectRedirectUri(): string {
  return `${DEEP_LINK_PREFIX}wallet/callback`;
}

export function createTransactionRedirectUri(txHash: string): string {
  return `${DEEP_LINK_PREFIX}wallet/callback?action=transaction&txHash=${txHash}`;
}

export function subscribeToDeepLinks(callback: (url: string) => void): () => void {
  const subscription = Linking.addEventListener('url', ({ url }) => {
    callback(url);
  });

  Linking.getInitialURL().then((url) => {
    if (url) {
      callback(url);
    }
  });

  return () => {
    subscription.remove();
  };
}
