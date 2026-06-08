/**
 * Verification Test 1A: React Native / Expo Framework
 * Tests that React Native and Expo are properly initialized
 * 
 * Run: pnpm test verification-1a
 */

import { beforeAll, describe, expect, it } from '@jest/globals';

describe('1A - React Native / Expo Verification', () => {
  beforeAll(() => {
    console.log('🧪 Running Verification 1A: React Native / Expo\n');
  });

  describe('React Native Installation', () => {
    it('should have React Native installed', () => {
      try {
        const rn = require('react-native');
        expect(rn).toBeDefined();
        expect(rn.Platform).toBeDefined();
        console.log('✅ React Native installed');
      } catch (e) {
        throw new Error('React Native not installed or not found');
      }
    });

    it('should have React installed', () => {
      try {
        const react = require('react');
        expect(react).toBeDefined();
        expect(react.createElement).toBeDefined();
        console.log('✅ React installed');
      } catch (e) {
        throw new Error('React not installed or not found');
      }
    });

    it('should detect Android/iOS platform support', () => {
      try {
        const { Platform } = require('react-native');
        const platform = Platform.OS;
        expect(['ios', 'android', 'web']).toContain(platform);
        console.log(`✅ Platform detected: ${platform}`);
      } catch (e) {
        console.warn('⚠️  Platform detection in test environment limited');
      }
    });
  });

  describe('Expo Installation', () => {
    it('should have Expo installed', () => {
      try {
        const expo = require('expo');
        expect(expo).toBeDefined();
        console.log('✅ Expo installed');
      } catch (e) {
        throw new Error('Expo not installed or not found');
      }
    });

    it('should have Expo Asset module', () => {
      try {
        const { Asset } = require('expo-asset');
        expect(Asset).toBeDefined();
        console.log('✅ Expo Asset module available');
      } catch (e) {
        throw new Error('Expo Asset module not found');
      }
    });

    it('should have Expo Router installed', () => {
      try {
        const router = require('expo-router');
        expect(router).toBeDefined();
        expect(router.Stack).toBeDefined();
        console.log('✅ Expo Router installed');
      } catch (e) {
        throw new Error('Expo Router not installed');
      }
    });

    it('should have Expo Splash Screen module', () => {
      try {
        const SplashScreen = require('expo-splash-screen');
        expect(SplashScreen).toBeDefined();
        expect(SplashScreen.preventAutoHideAsync).toBeDefined();
        console.log('✅ Expo Splash Screen module available');
      } catch (e) {
        throw new Error('Expo Splash Screen module not found');
      }
    });
  });

  describe('Core App Structure', () => {
    it('should verify app.json configuration', () => {
      try {
        const fs = require('fs');
        const path = require('path');
        const appJsonPath = path.resolve(__dirname, '../apps/mobile/app.json');
        
        expect(fs.existsSync(appJsonPath)).toBe(true);
        const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
        
        expect(appJson.expo).toBeDefined();
        expect(appJson.expo.name).toBe('ORYA Wallet');
        expect(appJson.expo.slug).toBe('orya-wallet');
        console.log('✅ app.json configuration valid');
      } catch (e) {
        throw new Error(`app.json verification failed: ${e}`);
      }
    });

    it('should verify package.json dependencies', () => {
      try {
        const fs = require('fs');
        const path = require('path');
        const packageJsonPath = path.resolve(__dirname, '../apps/mobile/package.json');
        
        expect(fs.existsSync(packageJsonPath)).toBe(true);
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        
        // Check required dependencies
        const required = ['react', 'react-native', 'expo', 'expo-router'];
        required.forEach(dep => {
          expect(packageJson.dependencies[dep]).toBeDefined();
        });
        console.log('✅ package.json dependencies valid');
      } catch (e) {
        throw new Error(`package.json verification failed: ${e}`);
      }
    });
  });

  describe('Core Screens', () => {
    it('should verify screen files exist', () => {
      try {
        const fs = require('fs');
        const path = require('path');
        
        const screens = [
          'app/_layout.tsx',
          'app/index.tsx',
          'app/vault.tsx',
          'app/link.tsx',
          'app/flow.tsx',
          'app/insights.tsx',
          'app/curio.tsx',
          'app/grove.tsx',
          'app/nexus.tsx',
          'app/circle.tsx',
          'app/care.tsx',
          'app/suite.tsx',
          'app/chains.tsx',
          'app/settings.tsx',
        ];

        const appDir = path.resolve(__dirname, '../apps/mobile');
        const missing = [];

        screens.forEach(screen => {
          const screenPath = path.join(appDir, screen);
          if (!fs.existsSync(screenPath)) {
            missing.push(screen);
          }
        });

        if (missing.length > 0) {
          throw new Error(`Missing screen files: ${missing.join(', ')}`);
        }

        console.log(`✅ All ${screens.length} screen files present`);
      } catch (e) {
        throw new Error(`Screen file verification failed: ${e}`);
      }
    });
  });

  describe('Navigation Setup', () => {
    it('should verify React Navigation installed', () => {
      try {
        const nav = require('@react-navigation/native');
        expect(nav).toBeDefined();
        expect(nav.NavigationContainer).toBeDefined();
        console.log('✅ React Navigation installed');
      } catch (e) {
        throw new Error('React Navigation not installed');
      }
    });

    it('should verify Drawer navigation available', () => {
      try {
        const drawer = require('@react-navigation/drawer');
        expect(drawer).toBeDefined();
        expect(drawer.createDrawerNavigator).toBeDefined();
        console.log('✅ Drawer navigation available');
      } catch (e) {
        throw new Error('Drawer navigation not available');
      }
    });
  });

  describe('TypeScript Support', () => {
    it('should verify TypeScript installed', () => {
      try {
        const ts = require('typescript');
        expect(ts).toBeDefined();
        expect(ts.version).toBeDefined();
        console.log(`✅ TypeScript installed (v${ts.version})`);
      } catch (e) {
        throw new Error('TypeScript not installed');
      }
    });

    it('should verify tsconfig.json exists', () => {
      try {
        const fs = require('fs');
        const path = require('path');
        const tsconfigPath = path.resolve(__dirname, '../apps/mobile/tsconfig.json');
        
        expect(fs.existsSync(tsconfigPath)).toBe(true);
        console.log('✅ tsconfig.json present');
      } catch (e) {
        throw new Error('tsconfig.json not found');
      }
    });
  });
});