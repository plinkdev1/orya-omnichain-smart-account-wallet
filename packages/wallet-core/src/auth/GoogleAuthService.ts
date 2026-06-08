/**
 * Google OAuth Authentication Service
 * Integrates Google Sign-In with Firebase backend verification
 * Used for onboarding and login flows
 */

// Firebase imports are optional - wrapped in try-catch for graceful degradation
let firebaseInitialized = false;
let firebaseAuth: any = null;
let GoogleAuthProvider: any = null;
let initializeApp: any = null;
let getAuth: any = null;
let onAuthStateChanged: any = null;
let signInWithCredential: any = null;
let signOut: any = null;

try {
  // Dynamically import Firebase only if available
  const firebaseAppModule = require('firebase/app');
  const firebaseAuthModule = require('firebase/auth');
  
  initializeApp = firebaseAppModule.initializeApp;
  getAuth = firebaseAuthModule.getAuth;
  GoogleAuthProvider = firebaseAuthModule.GoogleAuthProvider;
  onAuthStateChanged = firebaseAuthModule.onAuthStateChanged;
  signInWithCredential = firebaseAuthModule.signInWithCredential;
  signOut = firebaseAuthModule.signOut;
  firebaseInitialized = true;
} catch (error) {
  console.warn('Firebase not available - GoogleAuthService will have limited functionality', error);
}

export interface GoogleAuthUser {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

export interface GoogleAuthResult {
  success: boolean;
  user?: GoogleAuthUser;
  error?: string;
}

export class GoogleAuthService {
  private auth: any = null;
  private currentUser: any = null;
  private listeners: Set<(user: GoogleAuthUser | null) => void> = new Set();
  private isAvailable: boolean;

  constructor(firebaseConfig: Record<string, string>) {
    this.isAvailable = firebaseInitialized;
    if (!firebaseInitialized) {
      console.warn('Firebase not initialized. GoogleAuthService will operate in limited mode.');
      return;
    }

    try {
      const app = initializeApp(firebaseConfig);
      this.auth = getAuth(app);
      this.setupAuthListener();
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      this.isAvailable = false;
    }
  }

  /**
   * Set up listener for authentication state changes
   */
  private setupAuthListener(): void {
    if (!this.auth) return;
    onAuthStateChanged(this.auth, (user: any) => {
      this.currentUser = user;
      const mappedUser = user ? this.mapUser(user) : null;
      this.notifyListeners(mappedUser);
    });
  }

  /**
   * Sign in with Google credential token from frontend
   * @param idToken - Google ID token from @react-oauth/google
   */
  async signInWithGoogle(idToken: string): Promise<GoogleAuthResult> {
    if (!this.isAvailable || !this.auth) {
      return {
        success: false,
        error: 'Firebase not initialized. Please ensure Firebase is installed and configured.',
      };
    }

    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(this.auth, credential);
      
      return {
        success: true,
        user: this.mapUser(result.user),
      };
    } catch (error: any) {
      console.error('Google sign-in failed:', error);
      return {
        success: false,
        error: error.message || 'Google sign-in failed',
      };
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): GoogleAuthUser | null {
    if (!this.currentUser) return null;
    return this.mapUser(this.currentUser);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null && !this.currentUser.isAnonymous;
  }

  /**
   * Get Firebase ID token for API calls
   */
  async getIdToken(forceRefresh: boolean = false): Promise<string | null> {
    try {
      if (!this.currentUser) return null;
      return await this.currentUser.getIdToken(forceRefresh);
    } catch (error) {
      console.error('Failed to get ID token:', error);
      return null;
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
      this.currentUser = null;
      this.notifyListeners(null);
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  }

  /**
   * Register listener for auth state changes
   */
  onAuthStateChanged(
    callback: (user: GoogleAuthUser | null) => void
  ): () => void {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of auth state change
   */
  private notifyListeners(user: GoogleAuthUser | null): void {
    this.listeners.forEach((callback) => callback(user));
  }

  /**
   * Map Firebase User to GoogleAuthUser
   */
  private mapUser(user: any): GoogleAuthUser {
    return {
      uid: user?.uid || '',
      email: user?.email || '',
      displayName: user?.displayName || null,
      photoURL: user?.photoURL || null,
      isAnonymous: user?.isAnonymous ?? false,
    };
  }

  /**
   * Get user metadata
   */
  getUserMetadata() {
    if (!this.currentUser) return null;
    
    return {
      createdAt: this.currentUser.metadata.creationTime,
      lastSignIn: this.currentUser.metadata.lastSignInTime,
      email: this.currentUser.email,
      emailVerified: this.currentUser.emailVerified,
    };
  }
}

// Singleton instance
let googleAuthService: GoogleAuthService | null = null;

/**
 * Initialize Google Auth Service (call once on app startup)
 */
export function initializeGoogleAuth(
  firebaseConfig: Record<string, string>
): GoogleAuthService {
  if (!googleAuthService) {
    googleAuthService = new GoogleAuthService(firebaseConfig);
  }
  return googleAuthService;
}

/**
 * Get existing Google Auth Service instance
 */
export function getGoogleAuthService(): GoogleAuthService {
  if (!googleAuthService) {
    throw new Error(
      'GoogleAuthService not initialized. Call initializeGoogleAuth() first.'
    );
  }
  return googleAuthService;
}