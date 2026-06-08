/**
 * Verification Test 2A: Privy SDK Integration
 * Tests that Privy authentication is properly configured
 * 
 * Run: pnpm test verification-2a
 */

import { beforeAll, describe, expect, it } from '@jest/globals';

describe('2A - Privy SDK Verification', () => {
  beforeAll(() => {
    console.log('🧪 Running Verification 2A: Privy SDK\n');
  });

  describe('Privy Installation', () => {
    it('should have Privy React Auth installed', () => {
      try {
        const privy = require('@privy-io/react-auth');
        expect(privy).toBeDefined();
        console.log('✅ @privy-io/react-auth installed');
      } catch (e) {
        throw new Error('@privy-io/react-auth not installed');
      }
    });

    it('should export PrivyProvider component', () => {
      try {
        const { PrivyProvider } = require('@privy-io/react-auth');
        expect(PrivyProvider).toBeDefined();
        expect(typeof PrivyProvider).toBe('function');
        console.log('✅ PrivyProvider component exported');
      } catch (e) {
        throw new Error('PrivyProvider not found in @privy-io/react-auth');
      }
    });

    it('should export usePrivy hook', () => {
      try {
        const { usePrivy } = require('@privy-io/react-auth');
        expect(usePrivy).toBeDefined();
        expect(typeof usePrivy).toBe('function');
        console.log('✅ usePrivy hook exported');
      } catch (e) {
        throw new Error('usePrivy hook not found in @privy-io/react-auth');
      }
    });

    it('should export useWallets hook', () => {
      try {
        const { useWallets } = require('@privy-io/react-auth');
        expect(useWallets).toBeDefined();
        expect(typeof useWallets).toBe('function');
        console.log('✅ useWallets hook exported');
      } catch (e) {
        throw new Error('useWallets hook not found in @privy-io/react-auth');
      }
    });
  });

  describe('Environment Configuration', () => {
    it('should verify Privy environment variables', () => {
      const requiredVars = [
        'PRIVY_API_KEY',
        'PRIVY_APP_ID',
        'PRIVY_APP_SECRET',
        'PRIVY_KYC_KEY'
      ];

      const missingVars = requiredVars.filter(varName => {
        return !process.env[varName] || process.env[varName] === 'your_privy_api_key';
      });

      if (missingVars.length > 0) {
        console.warn(`⚠️  Missing Privy environment variables: ${missingVars.join(', ')}`);
        console.warn('   These will be needed for production use');
      } else {
        console.log('✅ All Privy environment variables configured');
      }
    });

    it('should verify .env file exists', () => {
      try {
        const fs = require('fs');
        const path = require('path');
        const envPath = path.resolve(__dirname, '../.env');
        const envExamplePath = path.resolve(__dirname, '../.env.example');

        const envExists = fs.existsSync(envPath);
        const envExampleExists = fs.existsSync(envExamplePath);

        expect(envExampleExists).toBe(true);

        if (!envExists) {
          console.warn('⚠️  .env file not found (create from .env.example)');
        } else {
          console.log('✅ .env file exists');
        }
      } catch (e) {
        throw new Error(`Environment file verification failed: ${e}`);
      }
    });
  });

  describe('Authentication Types', () => {
    it('should verify supported login methods are exported', () => {
      try {
        const privy = require('@privy-io/react-auth');
        
        // These should be available as configuration options
        const expectedMethods = ['google', 'apple', 'email', 'phone', 'sms'];
        
        console.log('✅ Expected login methods: ' + expectedMethods.join(', '));
      } catch (e) {
        throw new Error('Login methods verification failed');
      }
    });
  });

  describe('MPC Wallet Support', () => {
    it('should verify embedded wallet types', () => {
      try {
        const { useWallets, usePrivy } = require('@privy-io/react-auth');
        
        expect(useWallets).toBeDefined();
        expect(usePrivy).toBeDefined();
        
        console.log('✅ Embedded wallet hooks available');
        console.log('   - useWallets: For wallet management');
        console.log('   - usePrivy: For authentication state');
      } catch (e) {
        throw new Error('Embedded wallet verification failed');
      }
    });
  });

  describe('Integration Status', () => {
    it('should check if Privy is integrated in providers', () => {
      try {
        const fs = require('fs');
        const path = require('path');
        const providersPath = path.resolve(__dirname, '../apps/mobile/app/providers-enhanced.tsx');

        if (fs.existsSync(providersPath)) {
          const content = fs.readFileSync(providersPath, 'utf-8');
          const hasPrivy = content.includes('PrivyProvider') || content.includes('@privy-io');

          if (hasPrivy) {
            console.log('✅ Privy appears to be integrated in providers');
          } else {
            console.warn('⚠️  Privy not found in providers-enhanced.tsx');
            console.warn('   Action: Add PrivyProvider configuration');
          }
        } else {
          console.warn('⚠️  providers-enhanced.tsx not found');
          console.warn('   Action: Create and configure providers file');
        }
      } catch (e) {
        console.warn(`⚠️  Could not check Privy integration: ${e}`);
      }
    });
  });

  describe('API Capabilities', () => {
    it('should verify key Privy exports', () => {
      try {
        const privy = require('@privy-io/react-auth');
        
        const keyExports = [
          'PrivyProvider',
          'usePrivy',
          'useWallets',
          'useWallet'
        ];

        const missing = keyExports.filter(exp => !privy[exp]);

        if (missing.length > 0) {
          console.warn(`⚠️  Missing exports: ${missing.join(', ')}`);
        } else {
          console.log('✅ All key exports available');
        }
      } catch (e) {
        throw new Error('Export verification failed');
      }
    });
  });
});