/**
 * Authentication types
 */

import { UUID } from './common.types';

export enum AuthProvider {
  GOOGLE = 'google',
  APPLE = 'apple',
  EMAIL = 'email',
  WALLET = 'wallet',
  PRIVY = 'privy',
  SUI_ZKLOGIN = 'sui_zklogin',
}

export enum KYCStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export interface User {
  id: UUID;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  emailVerified: boolean;
  kycStatus: KYCStatus;
  authProviders: AuthProvider[];
  walletAddresses: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface AuthSession {
  user: User;
  token: AuthToken;
  isAuthenticated: boolean;
}

export interface LoginRequest {
  email?: string;
  password?: string;
  provider?: AuthProvider;
  walletAddress?: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  username: string;
  displayName: string;
  provider?: AuthProvider;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  username: string;
  displayName: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface WalletAuthRequest {
  walletAddress: string;
  signature: string;
  message: string;
}