// TODO: @mysten/zklogin module may have signature differences
// import { generateNonce, generateRandomness } from '@mysten/zklogin';

function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateRandomness(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export type ZkLoginProvider = 'google' | 'apple' | 'twitch' | 'facebook';
export type SuiSignatureVerificationScheme = 'ZkLogin';

export interface ZkLoginConfig {
  clientId: string;
  redirectUrl: string;
}

export interface ZkLoginSession {
  provider: ZkLoginProvider;
  nonce: string;
  randomness: string;
  timestamp: number;
}

export interface ZkLoginCredential {
  provider: ZkLoginProvider;
  idToken: string;
  userAddress: string;
}

export class SuiZkLoginService {
  private config: ZkLoginConfig;
  private sessions: Map<string, ZkLoginSession> = new Map();

  constructor(config: ZkLoginConfig) {
    this.config = config;
  }

  initializeZkLogin(provider: ZkLoginProvider): ZkLoginSession {
    const nonce = generateNonce();
    const randomness = generateRandomness();

    const session: ZkLoginSession = {
      provider,
      nonce,
      randomness,
      timestamp: Date.now(),
    };

    const sessionKey = `${provider}_${nonce}`;
    this.sessions.set(sessionKey, session);

    return session;
  }

  getOAuthUrl(provider: ZkLoginProvider, session: ZkLoginSession): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUrl,
      response_type: 'id_token',
      scope: 'openid profile email',
      nonce: session.nonce,
      state: JSON.stringify({
        provider,
        randomness: session.randomness,
      }),
    });

    const baseUrls: Record<ZkLoginProvider, string> = {
      google: 'https://accounts.google.com/o/oauth2/v2/auth',
      apple: 'https://appleid.apple.com/auth/authorize',
      twitch: 'https://id.twitch.tv/oauth2/authorize',
      facebook: 'https://www.facebook.com/v18.0/dialog/oauth',
    };

    return `${baseUrls[provider]}?${params.toString()}`;
  }

  getSession(provider: ZkLoginProvider, nonce: string): ZkLoginSession | undefined {
    const sessionKey = `${provider}_${nonce}`;
    const session = this.sessions.get(sessionKey);

    if (session && Date.now() - session.timestamp > 15 * 60 * 1000) {
      this.sessions.delete(sessionKey);
      return undefined;
    }

    return session;
  }

  clearSession(provider: ZkLoginProvider, nonce: string): void {
    const sessionKey = `${provider}_${nonce}`;
    this.sessions.delete(sessionKey);
  }

  extractNonceFromJwt(jwt: string): string {
    try {
      const parts = jwt.split('.');
      if (parts.length !== 3) throw new Error('Invalid JWT');

      const payload = JSON.parse(atob(parts[1]));
      return payload.nonce;
    } catch (error) {
      throw new Error(`Failed to extract nonce from JWT: ${error}`);
    }
  }

  extractSubFromJwt(jwt: string): string {
    try {
      const parts = jwt.split('.');
      if (parts.length !== 3) throw new Error('Invalid JWT');

      const payload = JSON.parse(atob(parts[1]));
      return payload.sub;
    } catch (error) {
      throw new Error(`Failed to extract sub from JWT: ${error}`);
    }
  }

  getSuiSignatureScheme(): SuiSignatureVerificationScheme {
    return 'ZkLogin';
  }
}
