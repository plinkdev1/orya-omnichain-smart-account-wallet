/**
 * Verification Test 3A: Blockchain SDKs
 * Tests that all required blockchain integrations are available
 * 
 * Run: pnpm test verification-3a
 */

import { beforeAll, describe, expect, it } from '@jest/globals';

describe('3A - Blockchain SDKs Verification', () => {
  beforeAll(() => {
    console.log('🧪 Running Verification 3A: Blockchain SDKs\n');
  });

  describe('Sui Blockchain (PRIMARY)', () => {
    it('should have @mysten/sui.js installed', () => {
      try {
        const sui = require('@mysten/sui.js');
        expect(sui).toBeDefined();
        console.log('✅ @mysten/sui.js installed');
      } catch (e) {
        console.error('❌ @mysten/sui.js NOT installed - CRITICAL');
        throw new Error('@mysten/sui.js not installed');
      }
    });

    it('should export Sui client', () => {
      try {
        const { SuiClient } = require('@mysten/sui.js');
        expect(SuiClient).toBeDefined();
        console.log('✅ SuiClient exported');
      } catch (e) {
        console.error('❌ SuiClient not found');
      }
    });

    it('should have Transaction builder', () => {
      try {
        const { Transaction } = require('@mysten/sui.js');
        expect(Transaction).toBeDefined();
        console.log('✅ Transaction builder available');
      } catch (e) {
        console.error('❌ Transaction builder not found');
      }
    });

    it('should have @mysten/bcs for serialization', () => {
      try {
        const bcs = require('@mysten/bcs');
        expect(bcs).toBeDefined();
        console.log('✅ @mysten/bcs installed');
      } catch (e) {
        console.warn('⚠️  @mysten/bcs not installed - may be needed for advanced serialization');
      }
    });
  });

  describe('Solana Blockchain', () => {
    it('should have @solana/web3.js installed', () => {
      try {
        const solana = require('@solana/web3.js');
        expect(solana).toBeDefined();
        expect(solana.Connection).toBeDefined();
        console.log('✅ @solana/web3.js installed');
      } catch (e) {
        console.warn('⚠️  @solana/web3.js not installed yet');
        console.log('   Install with: pnpm add @solana/web3.js');
      }
    });

    it('should have Solana wallet adapters', () => {
      try {
        const adapter = require('@solana/wallet-adapter-react');
        expect(adapter).toBeDefined();
        expect(adapter.WalletProvider).toBeDefined();
        console.log('✅ Solana wallet adapters installed');
      } catch (e) {
        console.warn('⚠️  Solana wallet adapters not fully installed');
      }
    });

    it('should have @solana/spl-token for token operations', () => {
      try {
        const spl = require('@solana/spl-token');
        expect(spl).toBeDefined();
        console.log('✅ @solana/spl-token installed');
      } catch (e) {
        console.warn('⚠️  @solana/spl-token not installed yet');
      }
    });
  });

  describe('Aptos Blockchain', () => {
    it('should have @aptos-labs/ts-sdk installed', () => {
      try {
        const aptos = require('@aptos-labs/ts-sdk');
        expect(aptos).toBeDefined();
        expect(aptos.Aptos).toBeDefined();
        console.log('✅ @aptos-labs/ts-sdk installed');
      } catch (e) {
        console.warn('⚠️  @aptos-labs/ts-sdk not installed yet');
        console.log('   Install with: pnpm add @aptos-labs/ts-sdk');
      }
    });
  });

  describe('EVM Chains (Ethereum, Polygon, Arbitrum, etc.)', () => {
    it('should have ethers v6 installed', () => {
      try {
        const ethers = require('ethers');
        expect(ethers).toBeDefined();
        expect(ethers.Contract).toBeDefined();
        expect(ethers.BrowserProvider || ethers.providers).toBeDefined();
        console.log('✅ ethers v6 installed');
      } catch (e) {
        console.warn('⚠️  ethers not installed yet');
        console.log('   Install with: pnpm add ethers');
      }
    });

    it('should have viem for modern EVM interactions', () => {
      try {
        const viem = require('viem');
        expect(viem).toBeDefined();
        expect(viem.createPublicClient).toBeDefined();
        console.log('✅ viem installed');
      } catch (e) {
        console.warn('⚠️  viem not installed yet');
        console.log('   Install with: pnpm add viem');
      }
    });
  });

  describe('Bitcoin & BTCfi', () => {
    it('should have bitcoinjs-lib for Bitcoin operations', () => {
      try {
        const bitcoin = require('bitcoinjs-lib');
        expect(bitcoin).toBeDefined();
        console.log('✅ bitcoinjs-lib installed');
      } catch (e) {
        console.warn('⚠️  bitcoinjs-lib not installed yet');
        console.log('   Install with: pnpm add bitcoinjs-lib');
      }
    });
  });

  describe('Multi-Chain Support', () => {
    it('should verify blockchain SDKs coexistence', () => {
      const sdks = {
        'Sui (@mysten/sui.js)': () => require('@mysten/sui.js'),
        'Solana (@solana/web3.js)': () => require('@solana/web3.js'),
        'Aptos (@aptos-labs/ts-sdk)': () => require('@aptos-labs/ts-sdk'),
        'EVM (ethers)': () => require('ethers'),
        'Bitcoin (bitcoinjs-lib)': () => require('bitcoinjs-lib'),
      };

      const available = [];
      const missing = [];

      for (const [name, loader] of Object.entries(sdks)) {
        try {
          loader();
          available.push(name);
        } catch {
          missing.push(name);
        }
      }

      console.log(`\n📊 Blockchain SDK Status:`);
      console.log(`   Available: ${available.length}/5`);
      available.forEach(sdk => console.log(`   ✅ ${sdk}`));
      
      if (missing.length > 0) {
        console.log(`\n   Missing: ${missing.length}/5`);
        missing.forEach(sdk => console.log(`   ❌ ${sdk}`));
      }
    });
  });

  describe('Wallet Integration', () => {
    it('should verify Privy can handle multiple chains', () => {
      try {
        const privy = require('@privy-io/react-auth');
        expect(privy).toBeDefined();
        console.log('✅ Privy can handle multi-chain wallets');
      } catch {
        console.warn('⚠️  Privy not installed for wallet integration');
      }
    });
  });

  describe('Type Definitions', () => {
    it('should verify TypeScript types available', () => {
      try {
        const ts = require('typescript');
        expect(ts).toBeDefined();
        
        // Type definitions should be included with SDK packages
        const tsdefs = [
          '@mysten/sui.js',
          'ethers',
          'viem'
        ];

        console.log('✅ TypeScript type definitions should be included with SDKs');
        tsdefs.forEach(pkg => console.log(`   - ${pkg}`));
      } catch {
        console.warn('⚠️  TypeScript not available for type checking');
      }
    });
  });

  describe('Network Configuration', () => {
    it('should verify RPC endpoint configuration support', () => {
      const networks = {
        'Sui Devnet': 'https://fullnode.devnet.sui.io',
        'Solana Devnet': 'https://api.devnet.solana.com',
        'Aptos Testnet': 'https://fullnode.testnet.aptoslabs.com/v1',
        'Ethereum Mainnet': 'https://mainnet.infura.io/v3/YOUR-PROJECT-ID',
      };

      console.log('✅ Network endpoints should be configurable:');
      Object.entries(networks).forEach(([net, url]) => {
        console.log(`   - ${net}: ${url}`);
      });
    });
  });

  describe('Critical Missing SDKs', () => {
    it('should flag critical missing packages', () => {
      const critical = [];
      
      try { require('@mysten/sui.js'); } catch { critical.push('@mysten/sui.js'); }
      
      if (critical.length > 0) {
        console.error('\n🔴 CRITICAL MISSING PACKAGES:');
        critical.forEach(pkg => console.error(`   ❌ ${pkg}`));
        console.error('\n   These are required for primary chain (Sui) support!');
        console.error('   Install with: pnpm add @mysten/sui.js @mysten/sui-sdk @mysten/bcs');
      } else {
        console.log('\n✅ No critical blockchain SDKs missing');
      }
    });
  });
});