/**
 * Environment Configuration
 * Centralized environment variables and configuration
 */

/**
 * Application Environment
 */
export const APP_ENV = process.env.NODE_ENV || 'development';
export const IS_DEVELOPMENT = APP_ENV === 'development';
export const IS_PRODUCTION = APP_ENV === 'production';

/**
 * App Metadata
 */
export const APP_CONFIG = {
  name: 'ORYA Wallet',
  appId: '@orya/mobile',
  version: '0.1.0',
  buildNumber: process.env.EXPO_PUBLIC_BUILD_NUMBER || '1',
};

/**
 * Firebase Configuration
 */
export const FIREBASE_ENV = {
  enabled: process.env.EXPO_PUBLIC_FIREBASE_ENABLED !== 'false',
  useEmulator:
    IS_DEVELOPMENT &&
    process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true',
  emulatorHost:
    process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST || '127.0.0.1',
  emulatorAuthPort: parseInt(
    process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_AUTH_PORT || '9099'
  ),
  emulatorDbPort: parseInt(
    process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_DB_PORT || '8080'
  ),
};

/**
 * API Configuration
 */
export const API_ENV = {
  baseUrl:
    process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  graphqlUrl:
    process.env.EXPO_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql',
  timeout: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000'),
};

/**
 * Blockchain Configuration
 */
export const BLOCKCHAIN_ENV = {
  primaryChain:
    process.env.EXPO_PUBLIC_PRIMARY_CHAIN || 'sui',
  suiRpcUrl:
    process.env.EXPO_PUBLIC_SUI_RPC_URL ||
    'https://fullnode.devnet.sui.io',
  ethRpcUrl:
    process.env.EXPO_PUBLIC_ETH_RPC_URL ||
    'https://eth-mainnet.alchemyapi.io/v2/demo',
  privyAppId: process.env.EXPO_PUBLIC_PRIVY_APP_ID || '',
};

/**
 * Feature Flags
 */
export const FEATURES = {
  enableOfflineMode:
    process.env.EXPO_PUBLIC_ENABLE_OFFLINE_MODE === 'true',
  enableAnalytics:
    process.env.EXPO_PUBLIC_ENABLE_ANALYTICS !== 'false',
  enableCrashReporting:
    process.env.EXPO_PUBLIC_ENABLE_CRASH_REPORTING !== 'false',
  enableDevTools: IS_DEVELOPMENT,
};

/**
 * Debug Flags
 */
export const DEBUG = {
  enableVerboseLogging:
    IS_DEVELOPMENT &&
    process.env.EXPO_PUBLIC_VERBOSE_LOGGING === 'true',
  enableReduxDevTools:
    IS_DEVELOPMENT &&
    process.env.EXPO_PUBLIC_ENABLE_REDUX_DEVTOOLS === 'true',
  enableNetworkMonitoring:
    process.env.EXPO_PUBLIC_ENABLE_NETWORK_MONITORING === 'true',
};

/**
 * Logging utility
 */
export const configLog = () => {
  if (DEBUG.enableVerboseLogging) {
    console.log('[Config] Environment variables loaded:', {
      APP_ENV,
      FIREBASE_ENV,
      API_ENV,
      BLOCKCHAIN_ENV,
      FEATURES,
    });
  }
};