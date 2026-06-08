/**
 * Session Keys Service Tests
 */

import { SessionKeyService } from '../services/session-keys';
import type { SessionKeyPermission } from '@orya/shared-types';

describe('SessionKeyService', () => {
  let service: SessionKeyService;
  const testWallet = '0x1234567890123456789012345678901234567890';

  beforeEach(() => {
    service = new SessionKeyService();
  });

  describe('Session Key Creation', () => {
    it('should create a session key', async () => {
      const sessionKey = await service.createSessionKey({
        walletAddress: testWallet as any,
        permissions: ['transfer', 'approve'] as SessionKeyPermission[],
        durationSeconds: 3600,
      });

      expect(sessionKey).toBeDefined();
      expect(sessionKey.walletAddress).toBe(testWallet);
      expect(sessionKey.permissions).toContain('transfer');
      expect(sessionKey.status).toBe('active');
    });

    it('should throw if duration exceeds maximum', async () => {
      const maxDuration = 30 * 24 * 60 * 60;

      await expect(
        service.createSessionKey({
          walletAddress: testWallet as any,
          permissions: ['transfer'],
          durationSeconds: maxDuration + 1,
        })
      ).rejects.toThrow();
    });

    it('should create session with policies', async () => {
      const sessionKey = await service.createSessionKey({
        walletAddress: testWallet as any,
        permissions: ['transfer'],
        durationSeconds: 3600,
        authorizationPolicies: [
          {
            id: 'policy1' as any,
            type: 'value_limit',
            isEnforced: true,
            params: {
              maxValueWei: '1000000000000000000',
              scope: 'per_transaction',
            },
            createdAt: new Date().toISOString(),
          },
        ],
      });

      expect(sessionKey.authorizationPolicies).toHaveLength(1);
    });
  });

  describe('Session Key Retrieval', () => {
    it('should retrieve session key by ID', async () => {
      const created = await service.createSessionKey({
        walletAddress: testWallet as any,
        permissions: ['transfer'],
        durationSeconds: 3600,
      });

      const retrieved = service.getSessionKey(created.id);
      expect(retrieved).toEqual(created);
    });

    it('should return undefined for expired session', async () => {
      const sessionKey = await service.createSessionKey({
        walletAddress: testWallet as any,
        permissions: ['transfer'],
        durationSeconds: -1,
      });

      const retrieved = service.getSessionKey(sessionKey.id);
      expect(retrieved).toBeUndefined();
    });

    it('should get session keys for wallet', async () => {
      await service.createSessionKey({
        walletAddress: testWallet as any,
        permissions: ['transfer'],
        durationSeconds: 3600,
      });

      await service.createSessionKey({
        walletAddress: testWallet as any,
        permissions: ['approve'],
        durationSeconds: 3600,
      });

      const sessions = service.getSessionKeysForWallet(testWallet as any);
      expect(sessions.length).toBeGreaterThanOrEqual(2);
    });

    it('should get active session keys for wallet', async () => {
      const sessionKey = await service.createSessionKey({
        walletAddress: testWallet as any,
        permissions: ['transfer'],
        durationSeconds: 3600,
      });

      const active = service.getActiveSessionKeysForWallet(testWallet as any);
      expect(active).toContainEqual(expect.objectContaining({ id: sessionKey.id }));
    });
  });

  describe('Session Key Validation', () => {
    it('should validate session key permission', async () => {
      const sessionKey = await service.createSessionKey({
        walletAddress: testWallet as any,
        permissions: ['transfer', 'approve'],
        durationSeconds: 3600,
      });

      const result = await service.validateSessionKey({
        sessionKey,
        permission: 'transfer',
      });

      expect(result.valid).toBe(true);
    });

    it('should fail validation for missing permission', async () => {
      const sessionKey = await service.createSessionKey({
        walletAddress: testWallet as any,
        permissions: ['transfer'],
        durationSeconds: 3600,
      });

      const result = await service.validateSessionKey({
        sessionKey,
        permission: 'approve',
      });

      expect(result.valid).toBe(false);
    });

    it('should validate value limit policy', async () => {
      const sessionKey = await service.createSessionKey({
        walletAddress: testWallet as any,
        permissions: ['transfer'],
        durationSeconds: 3600,
        authorizationPolicies: [
          {
            id: 'policy1' as any,
            type: 'value_limit',
            isEnforced: true,
            params: {
              maxValueWei: '1000000000000000000',
              scope: 'per_transaction',
            },
            createdAt: new Date().toISOString(),
          },
        ],
      });

      const result = await service.validateSessionKey({
        sessionKey,
        permission: 'transfer',
        operationData: {
          value: '500000000000000000',
        },
      });

      expect(result.valid).toBe(true);
    });
  });

  describe('Session Key Revocation', () => {
    it('should revoke session key', async () => {
      const sessionKey = await service.createSessionKey({
        walletAddress: testWallet as any,
        permissions: ['transfer'],
        durationSeconds: 3600,
      });

      const revoked = service.revokeSessionKey(sessionKey.id);
      expect(revoked).toBe(true);

      const retrieved = service.getSessionKey(sessionKey.id);
      expect(retrieved).toBeUndefined();
    });

    it('should revoke all session keys for wallet', async () => {
      await service.createSessionKey({
        walletAddress: testWallet as any,
        permissions: ['transfer'],
        durationSeconds: 3600,
      });

      await service.createSessionKey({
        walletAddress: testWallet as any,
        permissions: ['approve'],
        durationSeconds: 3600,
      });

      const count = service.revokeAllSessionKeysForWallet(testWallet as any);
      expect(count).toBe(2);

      const sessions = service.getSessionKeysForWallet(testWallet as any);
      expect(sessions).toHaveLength(0);
    });
  });

  describe('Session Key Suspension', () => {
    it('should suspend session key', async () => {
      const sessionKey = await service.createSessionKey({
        walletAddress: testWallet as any,
        permissions: ['transfer'],
        durationSeconds: 3600,
      });

      const suspended = service.suspendSessionKey(sessionKey.id);
      expect(suspended).toBe(true);

      const retrieved = service.getSessionKey(sessionKey.id);
      expect(retrieved).toBeUndefined();
    });

    it('should resume suspended session key', async () => {
      const sessionKey = await service.createSessionKey({
        walletAddress: testWallet as any,
        permissions: ['transfer'],
        durationSeconds: 3600,
      });

      service.suspendSessionKey(sessionKey.id);
      const resumed = service.resumeSessionKey(sessionKey.id);
      expect(resumed).toBe(true);
    });
  });

  describe('Nonce Management', () => {
    it('should increment session nonce', async () => {
      const sessionKey = await service.createSessionKey({
        walletAddress: testWallet as any,
        permissions: ['transfer'],
        durationSeconds: 3600,
      });

      const nonce1 = service.incrementSessionNonce(sessionKey.id);
      const nonce2 = service.incrementSessionNonce(sessionKey.id);

      expect(nonce2).toBe(nonce1 + 1);
    });
  });

  describe('Statistics', () => {
    it('should provide session statistics', async () => {
      await service.createSessionKey({
        walletAddress: testWallet as any,
        permissions: ['transfer'],
        durationSeconds: 3600,
      });

      const stats = service.getSessionStats();
      expect(stats.activeSessions).toBeGreaterThan(0);
      expect(stats.totalSessions).toBeGreaterThan(0);
    });
  });
});
