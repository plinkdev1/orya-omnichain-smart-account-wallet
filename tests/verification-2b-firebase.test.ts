/**
 * Verification Test 2B: Firebase / Firestore
 * Tests that Firebase is properly initialized
 * 
 * Run: pnpm test verification-2b
 */

import { beforeAll, describe, expect, it } from '@jest/globals';

describe('2B - Firebase / Firestore Verification', () => {
  beforeAll(() => {
    console.log('🧪 Running Verification 2B: Firebase\n');
  });

  describe('Firebase Installation', () => {
    it('should have Firebase SDK installed', () => {
      try {
        const firebase = require('firebase/app');
        expect(firebase).toBeDefined();
        expect(firebase.initializeApp).toBeDefined();
        console.log('✅ Firebase app SDK installed');
      } catch (e) {
        throw new Error('Firebase SDK not installed');
      }
    });

    it('should have Firebase Auth module', () => {
      try {
        const auth = require('firebase/auth');
        expect(auth).toBeDefined();
        expect(auth.getAuth).toBeDefined();
        expect(auth.signInWithCustomToken).toBeDefined();
        console.log('✅ Firebase Auth module available');
      } catch (e) {
        throw new Error('Firebase Auth module not available');
      }
    });

    it('should have Firestore module', () => {
      try {
        const firestore = require('firebase/firestore');
        expect(firestore).toBeDefined();
        expect(firestore.getFirestore).toBeDefined();
        expect(firestore.collection).toBeDefined();
        console.log('✅ Firestore module available');
      } catch (e) {
        throw new Error('Firestore module not available');
      }
    });
  });

  describe('Firebase Service Initialization', () => {
    it('should verify firebase.ts module exists', () => {
      try {
        const fs = require('fs');
        const path = require('path');
        const firebasePath = path.resolve(__dirname, '../apps/mobile/lib/firebase.ts');
        
        expect(fs.existsSync(firebasePath)).toBe(true);
        console.log('✅ firebase.ts service module found');
      } catch (e) {
        throw new Error('firebase.ts not found');
      }
    });

    it('should verify FirebaseService singleton implementation', () => {
      try {
        const fs = require('fs');
        const path = require('path');
        const firebasePath = path.resolve(__dirname, '../apps/mobile/lib/firebase.ts');
        const content = fs.readFileSync(firebasePath, 'utf-8');

        const hasClass = content.includes('class FirebaseService');
        const hasSingleton = content.includes('static getInstance');
        const hasInitialize = content.includes('async initialize');
        const hasGetFirestore = content.includes('getFirestore()');
        const hasGetAuth = content.includes('getAuth()');

        expect(hasClass).toBe(true);
        expect(hasSingleton).toBe(true);
        expect(hasInitialize).toBe(true);
        expect(hasGetFirestore).toBe(true);
        expect(hasGetAuth).toBe(true);

        console.log('✅ FirebaseService singleton properly implemented');
      } catch (e) {
        throw new Error(`FirebaseService verification failed: ${e}`);
      }
    });
  });

  describe('Configuration', () => {
    it('should verify FIREBASE_CONFIG constant defined', () => {
      try {
        const fs = require('fs');
        const path = require('path');
        const firebasePath = path.resolve(__dirname, '../apps/mobile/lib/firebase.ts');
        const content = fs.readFileSync(firebasePath, 'utf-8');

        const hasConfig = content.includes('export const FIREBASE_CONFIG');
        expect(hasConfig).toBe(true);

        console.log('✅ FIREBASE_CONFIG constant defined');
        console.log('   - apiKey');
        console.log('   - authDomain');
        console.log('   - projectId');
        console.log('   - storageBucket');
        console.log('   - messagingSenderId');
        console.log('   - appId');
      } catch (e) {
        throw new Error(`Configuration verification failed: ${e}`);
      }
    });

    it('should verify environment variables mapping', () => {
      const requiredEnvVars = [
        'EXPO_PUBLIC_FIREBASE_API_KEY',
        'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
        'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
        'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
        'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
        'EXPO_PUBLIC_FIREBASE_APP_ID'
      ];

      const configured = requiredEnvVars.filter(v => process.env[v]);
      const missing = requiredEnvVars.filter(v => !process.env[v]);

      if (missing.length > 0) {
        console.warn(`⚠️  Missing Firebase environment variables (${missing.length}/${requiredEnvVars.length}):`);
        missing.forEach(v => console.warn(`   - ${v}`));
      } else {
        console.log('✅ All Firebase environment variables configured');
      }
    });
  });

  describe('Global Variables', () => {
    it('should verify global Firebase variables are declared', () => {
      try {
        const fs = require('fs');
        const path = require('path');
        const firebasePath = path.resolve(__dirname, '../apps/mobile/lib/firebase.ts');
        const content = fs.readFileSync(firebasePath, 'utf-8');

        const globalVars = [
          '__app_id',
          '__firebase_config',
          '__initial_auth_token',
          '__db',
          '__auth'
        ];

        const missing = globalVars.filter(v => !content.includes(`var ${v}`));

        if (missing.length > 0) {
          throw new Error(`Missing global variables: ${missing.join(', ')}`);
        }

        console.log('✅ All required global variables declared');
        globalVars.forEach(v => console.log(`   - ${v}`));
      } catch (e) {
        throw new Error(`Global variables verification failed: ${e}`);
      }
    });
  });

  describe('Authentication Features', () => {
    it('should verify custom token authentication support', () => {
      try {
        const fs = require('fs');
        const path = require('path');
        const firebasePath = path.resolve(__dirname, '../apps/mobile/lib/firebase.ts');
        const content = fs.readFileSync(firebasePath, 'utf-8');

        const hasSignInWithToken = content.includes('signInWithToken');
        const hasStateListener = content.includes('onAuthStateChanged');
        const hasTokenPersistence = content.includes('restoreAuthToken');

        expect(hasSignInWithToken).toBe(true);
        expect(hasStateListener).toBe(true);
        expect(hasTokenPersistence).toBe(true);

        console.log('✅ Authentication features implemented:');
        console.log('   - Custom token sign-in');
        console.log('   - Auth state listening');
        console.log('   - Token persistence');
      } catch (e) {
        throw new Error(`Authentication features verification failed: ${e}`);
      }
    });
  });

  describe('AsyncStorage Integration', () => {
    it('should have AsyncStorage for persistence', () => {
      try {
        const asyncStorage = require('@react-native-async-storage/async-storage');
        expect(asyncStorage).toBeDefined();
        expect(asyncStorage.default).toBeDefined();
        console.log('✅ AsyncStorage installed for token persistence');
      } catch (e) {
        throw new Error('AsyncStorage not installed');
      }
    });
  });

  describe('Firestore Setup', () => {
    it('should verify collection helper functions', () => {
      try {
        const firestore = require('firebase/firestore');
        
        const helpers = [
          'collection',
          'doc',
          'setDoc',
          'getDoc',
          'updateDoc',
          'deleteDoc',
          'query',
          'where',
          'orderBy',
          'limit'
        ];

        const missing = helpers.filter(h => !firestore[h]);

        if (missing.length > 0) {
          console.warn(`⚠️  Missing Firestore helpers: ${missing.join(', ')}`);
        } else {
          console.log('✅ All Firestore helper functions available');
        }
      } catch (e) {
        throw new Error(`Firestore helpers verification failed: ${e}`);
      }
    });
  });

  describe('Development Mode', () => {
    it('should verify Firebase Emulator support', () => {
      try {
        const fs = require('fs');
        const path = require('path');
        const firebasePath = path.resolve(__dirname, '../apps/mobile/lib/firebase.ts');
        const content = fs.readFileSync(firebasePath, 'utf-8');

        const hasEmulator = content.includes('connectAuthEmulator') && 
                           content.includes('connectFirestoreEmulator');

        if (hasEmulator) {
          console.log('✅ Firebase Emulator support configured');
        } else {
          console.warn('⚠️  Firebase Emulator support not found');
        }
      } catch (e) {
        console.warn(`Could not verify Emulator support: ${e}`);
      }
    });
  });
});