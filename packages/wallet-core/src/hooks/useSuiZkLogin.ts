import { useCallback, useEffect, useState } from 'react';
import { SuiZkLoginService, ZkLoginProvider, ZkLoginSession, ZkLoginCredential } from '../auth/SuiZkLoginService';

interface UseSuiZkLoginOptions {
  clientId: string;
  redirectUrl: string;
  googleClientId?: string;
  appleTeamId?: string;
  twitchClientId?: string;
}

interface UseSuiZkLoginState {
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  credential: ZkLoginCredential | null;
  activeProvider: ZkLoginProvider | null;
  sessionData: ZkLoginSession | null;
}

interface SocialLoginButtonConfig {
  provider: ZkLoginProvider;
  label: string;
  icon: string;
  color: string;
}

export function useSuiZkLogin(options: UseSuiZkLoginOptions) {
  const [state, setState] = useState<UseSuiZkLoginState>({
    isLoading: false,
    error: null,
    isAuthenticated: false,
    credential: null,
    activeProvider: null,
    sessionData: null,
  });

  const [service] = useState(() => new SuiZkLoginService({
    clientId: options.clientId,
    redirectUrl: options.redirectUrl,
  }));

  const supportedProviders: SocialLoginButtonConfig[] = [
    {
      provider: 'google',
      label: 'Continue with Google',
      icon: '🔍',
      color: '#4285F4',
    },
    {
      provider: 'apple',
      label: 'Continue with Apple',
      icon: '🍎',
      color: '#000000',
    },
    {
      provider: 'twitch',
      label: 'Continue with Twitch',
      icon: '📺',
      color: '#9146FF',
    },
  ];

  const startZkLogin = useCallback(
    async (provider: ZkLoginProvider) => {
      try {
        setState((prev) => ({
          ...prev,
          isLoading: true,
          error: null,
          activeProvider: provider,
        }));

        const session = service.initializeZkLogin(provider);
        setState((prev) => ({
          ...prev,
          sessionData: session,
        }));

        const oauthUrl = service.getOAuthUrl(provider, session);
        window.location.href = oauthUrl;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err,
          activeProvider: null,
        }));
      }
    },
    [service]
  );

  const handleZkLoginCallback = useCallback(
    async (idToken: string, provider: ZkLoginProvider, userAddress: string) => {
      try {
        setState((prev) => ({
          ...prev,
          isLoading: true,
          error: null,
        }));

        const nonce = service.extractNonceFromJwt(idToken);
        const session = service.getSession(provider, nonce);

        if (!session) {
          throw new Error('Session not found or has expired');
        }

        const credential: ZkLoginCredential = {
          provider,
          idToken,
          userAddress,
        };

        setState((prev) => ({
          ...prev,
          isLoading: false,
          isAuthenticated: true,
          credential,
          activeProvider: provider,
        }));

        service.clearSession(provider, nonce);

        return credential;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err,
          activeProvider: null,
        }));
        throw err;
      }
    },
    [service]
  );

  const logout = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      isAuthenticated: false,
      credential: null,
      activeProvider: null,
      sessionData: null,
    });
  }, []);

  const hasProvider = (provider: ZkLoginProvider): boolean => {
    return supportedProviders.some((p) => p.provider === provider);
  };

  return {
    ...state,
    startZkLogin,
    handleZkLoginCallback,
    logout,
    service,
    supportedProviders,
    hasProvider,
  };
}
