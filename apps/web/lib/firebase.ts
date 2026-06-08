'use client';

/**
 * Firebase & Firestore Service Initialization
 * Web Platform (Next.js)
 *
 * Mandatory Global Variables:
 * - __app_id: Application identifier
 * - __firebase_config: Firebase configuration object
 * - __initial_auth_token: Initial authentication token for custom sign-in
 *
 * Singleton Pattern: Initialized once, reused throughout app lifecycle
 */

import { getStorageItem, setStorageItem } from '@orya/shared-utils';
import { getApp, getApps, initializeApp } from 'firebase/app';
import type { User } from 'firebase/auth';
import {
    Auth,
    connectAuthEmulator,
    getAuth,
    onAuthStateChanged,
    signInWithCustomToken,
} from 'firebase/auth';
import {
    connectFirestoreEmulator,
    Firestore,
    getFirestore,
} from 'firebase/firestore';

/**
 * Firebase Configuration - Load from env or use default
 * CRITICAL: These values MUST be set in environment
 */
export const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDemoApiKey',
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'orya-wallet.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'orya-wallet',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'orya-wallet.appspot.com',
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef',
};

/**
 * Mandatory Global Variables
 * __app_id: Unique application identifier
 * __firebase_config: Configuration for Firebase initialization
 * __initial_auth_token: Token for initial authentication (if available)
 */
declare global {
  var __app_id: string;
  var __firebase_config: typeof FIREBASE_CONFIG;
  var __initial_auth_token: string | null;
  var __db: Firestore | null;
  var __auth: Auth | null;
}

// Initialize global mandatory variables
if (typeof globalThis !== 'undefined') {
  globalThis.__app_id = '@orya/web:' + Date.now();
  globalThis.__firebase_config = FIREBASE_CONFIG;
  globalThis.__initial_auth_token = null;
  globalThis.__db = null;
  globalThis.__auth = null;
}

/**
 * Firebase Service Singleton
 * Ensures single instance across entire app lifecycle
 */
class FirebaseService {
  private static instance: FirebaseService | null = null;
  private _auth: Auth | null = null;
  private _db: Firestore | null = null;
  private _isInitialized = false;
  private _isInitializing = false;
  private _authStateUnsubscribe: (() => void) | null = null;

  private constructor() {}

  /**
   * Get or create singleton instance
   */
  static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  /**
   * Initialize Firebase and Firestore
   * Must be called once on app startup
   * Safe to call multiple times - handles concurrent requests
   */
  async initialize(): Promise<void> {
    // If already initialized, return immediately
    if (this._isInitialized) {
      console.log('[Firebase] Already initialized, skipping...');
      return;
    }

    // If currently initializing, wait for completion
    if (this._isInitializing) {
      console.log('[Firebase] Initialization in progress, waiting...');
      // Wait for initialization to complete (with timeout)
      let attempts = 0;
      while (this._isInitializing && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      return;
    }

    try {
      this._isInitializing = true;
      console.log('[Firebase] Initializing Firebase with config:', {
        projectId: FIREBASE_CONFIG.projectId,
        authDomain: FIREBASE_CONFIG.authDomain,
      });

      // Initialize Firebase App
      let app;
      if (getApps().length === 0) {
        app = initializeApp(FIREBASE_CONFIG);
      } else {
        app = getApp();
      }

      // Initialize Auth
      this._auth = getAuth(app);

      // Initialize Firestore
      this._db = getFirestore(app);

      // Store in global variables
      globalThis.__db = this._db;
      globalThis.__auth = this._auth;

      // Use Firebase Emulator in development if available
      if (
        process.env.NODE_ENV === 'development' &&
        process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true'
      ) {
        console.log('[Firebase] Using Firebase Emulator Suite');
        try {
          connectAuthEmulator(this._auth, 'http://127.0.0.1:9099', {
            disableWarnings: true,
          });
          connectFirestoreEmulator(this._db, '127.0.0.1', 8080);
        } catch (error) {
          console.warn('[Firebase] Emulator already connected:', error);
        }
      }

      this._isInitialized = true;
      this._isInitializing = false;
      console.log('[Firebase] ✅ Initialization complete');
    } catch (error) {
      this._isInitializing = false;
      console.error('[Firebase] ❌ Initialization failed:', error);
      throw new Error(`Firebase initialization failed: ${error}`);
    }
  }

  /**
   * Get Firestore instance
   */
  getFirestore(): Firestore {
    if (!this._db) {
      throw new Error('Firebase not initialized. Call initialize() first.');
    }
    return this._db;
  }

  /**
   * Get Auth instance
   */
  getAuth(): Auth {
    if (!this._auth) {
      throw new Error('Firebase Auth not initialized. Call initialize() first.');
    }
    return this._auth;
  }

  /**
   * Sign in with custom token
   * Used for server-generated token authentication
   */
  async signInWithToken(token: string): Promise<User | null> {
    try {
      const auth = this.getAuth();
      globalThis.__initial_auth_token = token;
      const result = await signInWithCustomToken(auth, token);
      console.log('[Firebase] ✅ Custom token sign-in successful:', result.user.uid);
      return result.user;
    } catch (error) {
      console.error('[Firebase] ❌ Custom token sign-in failed:', error);
      throw error;
    }
  }

  /**
   * Listen to authentication state changes
   * Returns unsubscribe function
   */
  onAuthStateChanged(
    callback: (user: User | null) => void
  ): (() => void) {
    const auth = this.getAuth();
    const unsubscribe = onAuthStateChanged(auth, callback);
    this._authStateUnsubscribe = unsubscribe;
    return unsubscribe;
  }

  /**
   * Restore auth token from browser storage
   */
  async restoreAuthToken(): Promise<string | null> {
    try {
      if (typeof window === 'undefined') {
        return null;
      }

      const token = await getStorageItem('__firebase_auth_token');
      if (token) {
        globalThis.__initial_auth_token = token;
        console.log('[Firebase] ✅ Auth token restored from storage');
      }
      return token;
    } catch (error) {
      console.warn('[Firebase] Could not restore auth token:', error);
      return null;
    }
  }

  /**
   * Save auth token to browser storage
   */
  async saveAuthToken(token: string): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        return;
      }

      await setStorageItem('__firebase_auth_token', token);
      console.log('[Firebase] ✅ Auth token saved to storage');
    } catch (error) {
      console.warn('[Firebase] Could not save auth token:', error);
    }
  }

  /**
   * Clear all Firebase state and listeners
   */
  async cleanup(): Promise<void> {
    if (this._authStateUnsubscribe) {
      this._authStateUnsubscribe();
    }
    globalThis.__db = null;
    globalThis.__auth = null;
    this._isInitialized = false;
    this._isInitializing = false;
  }

  /**
   * Check if Firebase is initialized
   */
  isInitialized(): boolean {
    return this._isInitialized;
  }
}

// Export singleton instance
export const firebaseService = FirebaseService.getInstance();

/**
 * Helper: Get DB instance (assumes initialized)
 */
export const getDB = (): Firestore => firebaseService.getFirestore();

/**
 * Helper: Get Auth instance (assumes initialized)
 */
export const getAuthInstance = (): Auth => firebaseService.getAuth();