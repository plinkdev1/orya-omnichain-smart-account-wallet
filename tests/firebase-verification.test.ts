/**
 * PROMPT 1A: Firestore & Firebase Initialization Verification
 * Tests that Firebase and Firestore are initialized correctly
 * Verifies mandatory parameters and instance availability
 */

import type { Auth, Firestore } from 'firebase/auth';

/**
 * Test Suite: Firebase Configuration
 */
export const testFirebaseConfiguration = {
  name: '1A.1 - Firebase Configuration',
  tests: [
    {
      name: 'FIREBASE_CONFIG has all required fields',
      verify: (config: any): boolean => {
        const requiredFields = [
          'apiKey',
          'authDomain',
          'projectId',
          'storageBucket',
          'messagingSenderId',
          'appId',
        ];
        return requiredFields.every(field => field in config && config[field]);
      },
      errorMessage: 'Firebase config is missing required fields',
    },
    {
      name: 'Firebase config values are not demo placeholders',
      verify: (config: any): boolean => {
        const demoValues = ['AIzaSyDemoApiKey', 'orya-wallet', '123456789', '1:123456789:web:abcdef'];
        return !Object.values(config).some((val: any) => demoValues.includes(val));
      },
      errorMessage: 'Firebase config still contains demo placeholder values',
      warning: true, // This is a warning, not a critical error
    },
  ],
};

/**
 * Test Suite: Mandatory Global Variables
 */
export const testMandatoryGlobals = {
  name: '1A.2 - Mandatory Global Variables',
  tests: [
    {
      name: '__app_id is set and valid',
      verify: (): boolean => {
        if (typeof globalThis !== 'undefined' && '__app_id' in globalThis) {
          const appId = (globalThis as any).__app_id;
          return typeof appId === 'string' && appId.length > 0;
        }
        return false;
      },
      errorMessage: '__app_id is not set or is invalid',
    },
    {
      name: '__firebase_config is set',
      verify: (): boolean => {
        if (typeof globalThis !== 'undefined' && '__firebase_config' in globalThis) {
          return (globalThis as any).__firebase_config !== null;
        }
        return false;
      },
      errorMessage: '__firebase_config is not set',
    },
    {
      name: '__initial_auth_token is initialized (can be null)',
      verify: (): boolean => {
        if (typeof globalThis !== 'undefined' && '__initial_auth_token' in globalThis) {
          const token = (globalThis as any).__initial_auth_token;
          return token === null || typeof token === 'string';
        }
        return false;
      },
      errorMessage: '__initial_auth_token is not properly initialized',
    },
  ],
};

/**
 * Test Suite: Firebase Instances
 */
export const testFirebaseInstances = {
  name: '1A.3 - Firebase Instances',
  tests: [
    {
      name: 'Firebase Auth instance is initialized',
      verify: (auth: Auth | null): boolean => {
        return auth !== null && auth !== undefined;
      },
      errorMessage: 'Firebase Auth instance is not initialized',
    },
    {
      name: 'Firestore instance is initialized',
      verify: (db: Firestore | null): boolean => {
        return db !== null && db !== undefined;
      },
      errorMessage: 'Firestore instance is not initialized',
    },
    {
      name: 'Instances are stored in global variables',
      verify: (): boolean => {
        if (typeof globalThis === 'undefined') return false;
        const hasAuth = '__auth' in globalThis && (globalThis as any).__auth !== null;
        const hasDb = '__db' in globalThis && (globalThis as any).__db !== null;
        return hasAuth && hasDb;
      },
      errorMessage: 'Firebase instances are not stored in global variables',
    },
  ],
};

/**
 * Test Suite: Firestore Operations
 */
export const testFirestoreOperations = {
  name: '1A.4 - Firestore Operations',
  tests: [
    {
      name: 'getDB() helper function works',
      verify: (getDB: any): boolean => {
        try {
          const db = getDB();
          return db !== null && db !== undefined;
        } catch (error) {
          return false;
        }
      },
      errorMessage: 'getDB() helper function failed',
    },
    {
      name: 'getAuthInstance() helper function works',
      verify: (getAuthInstance: any): boolean => {
        try {
          const auth = getAuthInstance();
          return auth !== null && auth !== undefined;
        } catch (error) {
          return false;
        }
      },
      errorMessage: 'getAuthInstance() helper function failed',
    },
  ],
};

/**
 * Verification Checklist for Prompt 1A
 */
export const prompt1aChecklist = {
  category: 'Prompt 1A: Firestore & Firebase Initialization',
  checks: [
    {
      item: 'Firebase is initialized correctly',
      status: 'PENDING',
      notes: 'Verify firebaseService.isInitialized() returns true',
    },
    {
      item: 'Mandatory parameters are set (__app_id, __firebase_config, __initial_auth_token)',
      status: 'PENDING',
      notes: 'Check global variables are defined and populated',
    },
    {
      item: 'db and auth instances are stored in React state or global vars',
      status: 'PENDING',
      notes: 'Verify getDB() and getAuthInstance() functions work',
    },
    {
      item: 'Firestore operations function correctly',
      status: 'PENDING',
      notes: 'Test read/write operations with current auth state',
    },
    {
      item: 'Environment variables are properly configured',
      status: 'PENDING',
      notes: 'Check .env files have Firebase config',
    },
  ],
};

/**
 * Test Configuration Differences between Mobile and Web
 */
export const platformDifferences = {
  mobile: {
    storageBackend: 'AsyncStorage',
    configPrefix: 'EXPO_PUBLIC_',
    environmentFiles: ['.env.development', '.env.production', '.env.example'],
  },
  web: {
    storageBackend: 'localStorage',
    configPrefix: 'NEXT_PUBLIC_',
    environmentFiles: ['.env.local', '.env.production', '.env.example'],
  },
};

/**
 * Run all verification tests
 */
export async function runFirebaseVerification(
  config: any,
  auth: Auth | null,
  db: Firestore | null
) {
  console.log('🧪 Running Prompt 1A: Firebase Initialization Verification\n');

  const results = {
    configuration: await runTestSuite(testFirebaseConfiguration, config),
    globals: await runTestSuite(testMandatoryGlobals),
    instances: await runTestSuite(testFirebaseInstances, auth, db),
    operations: await runTestSuite(testFirestoreOperations),
  };

  return results;
}

/**
 * Helper function to run a test suite
 */
async function runTestSuite(suite: any, ...args: any[]) {
  console.log(`\n📋 ${suite.name}`);
  console.log('─'.repeat(50));

  const results = [];
  for (const test of suite.tests) {
    try {
      const passed = test.verify(...args);
      const status = passed ? '✅' : '❌';
      const prefix = test.warning ? '⚠️' : status;
      console.log(`${prefix} ${test.name}`);

      if (!passed) {
        console.log(`   └─ Error: ${test.errorMessage}`);
      }

      results.push({
        name: test.name,
        passed,
        warning: test.warning || false,
        error: passed ? null : test.errorMessage,
      });
    } catch (error) {
      console.log(`❌ ${test.name}`);
      console.log(`   └─ Exception: ${error}`);
      results.push({
        name: test.name,
        passed: false,
        warning: false,
        error: String(error),
      });
    }
  }

  return results;
}

/**
 * Generate verification report
 */
export function generateVerificationReport(results: any) {
  const totalTests = Object.values(results).reduce(
    (sum: number, suite: any) => sum + suite.length,
    0
  );
  const passedTests = Object.values(results).reduce(
    (sum: number, suite: any) =>
      sum + (suite as any[]).filter((test: any) => test.passed).length,
    0
  );

  console.log('\n' + '='.repeat(50));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`);

  if (passedTests === totalTests) {
    console.log('\n✅ ALL TESTS PASSED! Firebase is properly configured.');
  } else {
    console.log('\n❌ Some tests failed. Please review the errors above.');
  }

  return {
    totalTests,
    passedTests,
    failedTests: totalTests - passedTests,
    successRate: (passedTests / totalTests) * 100,
  };
}