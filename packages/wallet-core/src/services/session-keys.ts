/**
 * Session Keys Service
 * Manages temporary authorization keys for scoped wallet access
 * Supports both standalone and Privy MPC integrated modes
 */

import type {
  UUID,
  Address,
  SessionKey,
  SessionKeyStatus,
  SessionKeyPermission,
  AuthorizationPolicy,
  AuthorizationPolicyType,
} from '@orya/shared-types';

export enum SessionKeyMode {
  STANDALONE = 'standalone',
  PRIVY_INTEGRATED = 'privy_integrated',
  HYBRID = 'hybrid',
}

export interface SessionKeyCreateRequest {
  walletAddress: Address;
  permissions: SessionKeyPermission[];
  durationSeconds: number;
  authorizationPolicies?: AuthorizationPolicy[];
  mode?: SessionKeyMode;
  metadata?: Record<string, any>;
}

export interface SessionKeyValidationRequest {
  sessionKey: SessionKey;
  permission: SessionKeyPermission;
  operationData?: Record<string, any>;
}

export interface SessionKeyValidationResult {
  valid: boolean;
  reason?: string;
  policiesEnforced?: string[];
}

/**
 * Session Keys Service
 * Creates and manages session keys for delegated access
 */
export class SessionKeyService {
  private sessionKeys: Map<string, SessionKey> = new Map();
  private sessionsByWallet: Map<Address, Set<string>> = new Map();
  private mode: SessionKeyMode = SessionKeyMode.STANDALONE;
  private maxSessionDuration: number = 30 * 24 * 60 * 60;
  private encryptionKey?: string;

  constructor(mode: SessionKeyMode = SessionKeyMode.STANDALONE) {
    this.mode = mode;
  }

  /**
   * Set encryption key for storing session secrets
   */
  setEncryptionKey(key: string): void {
    this.encryptionKey = key;
  }

  /**
   * Create a new session key
   */
  async createSessionKey(request: SessionKeyCreateRequest): Promise<SessionKey> {
    if (request.durationSeconds > this.maxSessionDuration) {
      throw new Error(
        `Session duration exceeds maximum (${this.maxSessionDuration} seconds)`
      );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + request.durationSeconds * 1000);

    const sessionKey: SessionKey = {
      id: `sk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as UUID,
      walletAddress: request.walletAddress,
      publicKey: await this.generatePublicKey(),
      keyAddress: await this.deriveKeyAddress(),
      permissions: request.permissions,
      status: 'active' as SessionKeyStatus,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      nonce: 0,
      authorizationPolicies: request.authorizationPolicies || [],
      metadata: {
        ...request.metadata,
        mode: request.mode || this.mode,
      },
    };

    this.sessionKeys.set(sessionKey.id, sessionKey);

    const walletSessions = this.sessionsByWallet.get(request.walletAddress) || new Set();
    walletSessions.add(sessionKey.id);
    this.sessionsByWallet.set(request.walletAddress, walletSessions);

    return sessionKey;
  }

  /**
   * Get session key by ID
   */
  getSessionKey(sessionKeyId: string): SessionKey | undefined {
    const key = this.sessionKeys.get(sessionKeyId);

    if (key && this.isExpired(key)) {
      this.revokeSessionKey(sessionKeyId);
      return undefined;
    }

    return key;
  }

  /**
   * Get all session keys for a wallet
   */
  getSessionKeysForWallet(walletAddress: Address): SessionKey[] {
    const sessionIds = this.sessionsByWallet.get(walletAddress) || new Set();
    const keys: SessionKey[] = [];

    for (const sessionId of sessionIds) {
      const key = this.sessionKeys.get(sessionId);
      if (key && !this.isExpired(key)) {
        keys.push(key);
      } else if (key && this.isExpired(key)) {
        this.revokeSessionKey(sessionId);
      }
    }

    return keys;
  }

  /**
   * Get active session keys for wallet
   */
  getActiveSessionKeysForWallet(walletAddress: Address): SessionKey[] {
    return this.getSessionKeysForWallet(walletAddress).filter(
      (key) => key.status === 'active'
    );
  }

  /**
   * Validate session key and permission
   */
  async validateSessionKey(
    request: SessionKeyValidationRequest
  ): Promise<SessionKeyValidationResult> {
    if (!request.sessionKey) {
      return {
        valid: false,
        reason: 'Session key not found',
      };
    }

    if (this.isExpired(request.sessionKey)) {
      this.revokeSessionKey(request.sessionKey.id);
      return {
        valid: false,
        reason: 'Session key expired',
      };
    }

    if (request.sessionKey.status !== 'active') {
      return {
        valid: false,
        reason: `Session key status is ${request.sessionKey.status}`,
      };
    }

    if (!request.sessionKey.permissions.includes(request.permission)) {
      return {
        valid: false,
        reason: `Permission ${request.permission} not granted`,
      };
    }

    const enforcedPolicies: string[] = [];

    for (const policy of request.sessionKey.authorizationPolicies) {
      if (!policy.isEnforced) {
        continue;
      }

      if (policy.expiresAt && new Date(policy.expiresAt) < new Date()) {
        return {
          valid: false,
          reason: 'Authorization policy expired',
        };
      }

      const policyValid = await this.validatePolicy(policy, request.operationData);
      if (!policyValid) {
        return {
          valid: false,
          reason: `Authorization policy ${policy.type} validation failed`,
        };
      }

      enforcedPolicies.push(policy.type);
    }

    return {
      valid: true,
      policiesEnforced: enforcedPolicies,
    };
  }

  /**
   * Revoke a session key
   */
  revokeSessionKey(sessionKeyId: string): boolean {
    const key = this.sessionKeys.get(sessionKeyId);
    if (!key) {
      return false;
    }

    key.status = 'revoked' as SessionKeyStatus;
    key.revokedAt = new Date().toISOString();

    const walletSessions = this.sessionsByWallet.get(key.walletAddress);
    if (walletSessions) {
      walletSessions.delete(sessionKeyId);
    }

    return true;
  }

  /**
   * Revoke all session keys for a wallet
   */
  revokeAllSessionKeysForWallet(walletAddress: Address): number {
    const sessionIds = this.sessionsByWallet.get(walletAddress) || new Set();
    let count = 0;

    for (const sessionId of sessionIds) {
      if (this.revokeSessionKey(sessionId)) {
        count++;
      }
    }

    this.sessionsByWallet.delete(walletAddress);
    return count;
  }

  /**
   * Suspend a session key (temporary)
   */
  suspendSessionKey(sessionKeyId: string): boolean {
    const key = this.sessionKeys.get(sessionKeyId);
    if (!key) {
      return false;
    }

    key.status = 'suspended' as SessionKeyStatus;
    return true;
  }

  /**
   * Resume a suspended session key
   */
  resumeSessionKey(sessionKeyId: string): boolean {
    const key = this.sessionKeys.get(sessionKeyId);
    if (!key) {
      return false;
    }

    if (key.status !== 'suspended') {
      return false;
    }

    if (this.isExpired(key)) {
      return false;
    }

    key.status = 'active' as SessionKeyStatus;
    return true;
  }

  /**
   * Increment session nonce
   */
  incrementSessionNonce(sessionKeyId: string): number {
    const key = this.sessionKeys.get(sessionKeyId);
    if (!key) {
      throw new Error(`Session key ${sessionKeyId} not found`);
    }

    key.nonce++;
    return key.nonce;
  }

  /**
   * Update authorization policies for session key
   */
  updateAuthorizationPolicies(
    sessionKeyId: string,
    policies: AuthorizationPolicy[]
  ): boolean {
    const key = this.sessionKeys.get(sessionKeyId);
    if (!key) {
      return false;
    }

    key.authorizationPolicies = policies;
    return true;
  }

  /**
   * Get session key statistics
   */
  getSessionStats(): {
    totalSessions: number;
    activeSessions: number;
    suspendedSessions: number;
    expiredSessions: number;
    revokedSessions: number;
  } {
    const sessions = Array.from(this.sessionKeys.values());
    return {
      totalSessions: sessions.length,
      activeSessions: sessions.filter((s) => s.status === 'active').length,
      suspendedSessions: sessions.filter((s) => s.status === 'suspended').length,
      expiredSessions: sessions.filter((s) => this.isExpired(s)).length,
      revokedSessions: sessions.filter((s) => s.status === 'revoked').length,
    };
  }

  /**
   * Private helper methods
   */

  private isExpired(sessionKey: SessionKey): boolean {
    return new Date(sessionKey.expiresAt) < new Date();
  }

  private async generatePublicKey(): Promise<string> {
    const random = Math.random().toString(36).substr(2);
    const timestamp = Date.now().toString(36);
    return `pk_${timestamp}_${random}`;
  }

  private async deriveKeyAddress(): Promise<Address> {
    const random = Math.random().toString(16).substr(2);
    return `0x${random.padStart(40, '0')}` as Address;
  }

  private async validatePolicy(
    policy: AuthorizationPolicy,
    operationData?: Record<string, any>
  ): Promise<boolean> {
    if (!policy.isEnforced) {
      return true;
    }

    const params = policy.params as any;

    switch (policy.type) {
      case 'rate_limit':
        return (
          !params.currentCount || params.currentCount < params.maxOperations
        );

      case 'value_limit': {
        if (!operationData?.value) {
          return true;
        }
        const value = BigInt(operationData.value);
        return value <= BigInt(params.maxValueWei);
      }

      case 'whitelist':
        if (!operationData?.target) {
          return true;
        }
        return params.allowedAddresses.includes(operationData.target.toLowerCase());

      case 'blacklist':
        if (!operationData?.target) {
          return true;
        }
        return !params.blockedAddresses.includes(operationData.target.toLowerCase());

      case 'time_lock':
        return !params.pendingExecutionAt || new Date() >= new Date(params.pendingExecutionAt);

      case 'gas_limit':
        if (!operationData?.gasLimit) {
          return true;
        }
        return BigInt(operationData.gasLimit) <= BigInt(params.maxGasUnits);

      case 'nonce_based':
        return !operationData?.nonce || operationData.nonce === params.expectedNonce;

      default:
        return true;
    }
  }
}

export default SessionKeyService;
