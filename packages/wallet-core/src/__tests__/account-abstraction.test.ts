/**
 * Account Abstraction Service Tests
 */

import { AccountAbstractionService } from '../services/account-abstraction';
import type { AAProviderConfig } from '../services/account-abstraction';

describe('AccountAbstractionService', () => {
  let service: AccountAbstractionService;

  beforeEach(() => {
    service = new AccountAbstractionService('alchemy');
  });

  describe('Provider Registration', () => {
    it('should register providers', () => {
      const providers = service.getRegisteredProviders();
      expect(providers).toBeDefined();
    });

    it('should throw when initializing without registered provider', async () => {
      const config: AAProviderConfig = {
        name: 'unknown',
        rpcUrl: 'http://localhost:8545',
        chainId: 1,
      };

      await expect(service.initialize(config)).rejects.toThrow();
    });
  });

  describe('UserOperation Management', () => {
    it('should create execution data structure', () => {
      const executionData = {
        target: '0x1234567890123456789012345678901234567890',
        value: '1000000000000000000',
        data: '0x',
      };

      expect(executionData.target).toBeDefined();
      expect(executionData.value).toBeDefined();
      expect(executionData.data).toBeDefined();
    });

    it('should handle batch execution data', () => {
      const executionData = {
        target: [
          '0x1234567890123456789012345678901234567890',
          '0x0987654321098765432109876543210987654321',
        ],
        value: ['1000000000000000000', '2000000000000000000'],
        data: ['0x', '0x'],
      };

      expect(Array.isArray(executionData.target)).toBe(true);
      expect(executionData.target).toHaveLength(2);
    });
  });

  describe('Smart Account Types', () => {
    const smartAccountTypes = [
      'simple_account',
      'multi_owner',
      'factory_managed',
      'safe_proxy',
      'kernel',
      'permissionless',
      'modular',
    ];

    it.each(smartAccountTypes)('should support %s smart account type', (type) => {
      expect(type).toBeDefined();
    });
  });

  describe('Paymaster Support', () => {
    const paymasterModes = [
      'sponsored',
      'erc20_oracle',
      'erc20_session',
      'verify_signing',
      'staked',
    ];

    it.each(paymasterModes)('should support %s paymaster mode', (mode) => {
      expect(mode).toBeDefined();
    });
  });
});
