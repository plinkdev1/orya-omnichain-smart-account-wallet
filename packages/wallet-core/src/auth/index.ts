/**
 * Authentication Module Exports
 */

export { GoogleAuthService, getGoogleAuthService, initializeGoogleAuth } from './GoogleAuthService';
export type { GoogleAuthResult, GoogleAuthUser } from './GoogleAuthService';

export { BiometricAuthService, getBiometricAuthService } from './BiometricAuthService';
export type { BiometricAuthResult, BiometricCredential } from './BiometricAuthService';

export { SuiZkLoginService } from './SuiZkLoginService';
export type { ZkLoginProvider, ZkLoginConfig, ZkLoginSession, ZkLoginCredential } from './SuiZkLoginService';
