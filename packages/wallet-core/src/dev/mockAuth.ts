/**
 * Development-Only Mock Authentication Utilities
 * 
 * Provides fake authentication for local development and testing
 * WITHOUT requiring a real backend or Firebase credentials.
 * 
 * ⚠️ DEVELOPMENT ONLY - Never runs in production
 */


/**
 * Mock authenticated user object for development
 * Can be customized by setting MOCK_AUTH_EMAIL env var
 */
export interface MockAuthUser {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  isAnonymous?: boolean;
}

/**
 * Check if mock auth mode is enabled
 * Enable with: NEXT_PUBLIC_MOCK_AUTH=true (web) or EXPO_PUBLIC_MOCK_AUTH=true (mobile)
 */
export function isMockAuthEnabled(): boolean {
  if (typeof window === 'undefined') {
    // Server-side, check Node env
    return process.env.NODE_ENV === 'development' && process.env.MOCK_AUTH === 'true';
  }
  
  // Client-side (web/mobile), check public env vars
  return (
    process.env.NEXT_PUBLIC_MOCK_AUTH === 'true' ||
    process.env.EXPO_PUBLIC_MOCK_AUTH === 'true' ||
    false
  );
}

/**
 * Generate a mock authenticated user object
 * 
 * @param email - Optional email to use (defaults to test@local.dev)
 * @returns Mock user object ready for Redux/state management
 */
export function createMockAuthUser(email?: string): MockAuthUser {
  const testEmail = email || process.env.NEXT_PUBLIC_MOCK_AUTH_EMAIL || 'test@local.dev';
  
  return {
    id: 'dev-user-001',
    email: testEmail,
    displayName: 'Developer Test User',
    emailVerified: true,
    isAnonymous: false,
  };
}

/**
 * Simulate Firebase login with mock user
 * Returns a mock user object that would normally come from Firebase
 */
export async function mockFirebaseLogin(email: string): Promise<MockAuthUser> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  console.log('[MockAuth] 🔐 Mock login with:', email);
  
  return createMockAuthUser(email);
}

/**
 * Simulate Firebase signup with mock user
 */
export async function mockFirebaseSignup(
  email: string,
  password: string,
  displayName: string
): Promise<MockAuthUser> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log('[MockAuth] 🔐 Mock signup:', { email, displayName });
  
  // Validate inputs (basic)
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email');
  }
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  if (!displayName || displayName.trim().length === 0) {
    throw new Error('Display name is required');
  }
  
  return {
    ...createMockAuthUser(email),
    displayName: displayName,
  };
}

/**
 * Simulate Firebase logout
 */
export async function mockFirebaseLogout(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 200));
  console.log('[MockAuth] 🔐 Mock logout');
}

/**
 * Simulate restoring auth from mock storage
 * Returns saved mock user or null if not found
 */
export async function mockRestoreAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  
  const saved = localStorage.getItem('@orya/mock-auth-token');
  if (saved) {
    console.log('[MockAuth] 📦 Restored mock auth token from storage');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return saved;
}

/**
 * Simulate saving mock auth token
 */
export async function mockSaveAuthToken(token: string): Promise<void> {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('@orya/mock-auth-token', token);
  console.log('[MockAuth] 💾 Saved mock auth token');
}

/**
 * Create a mock auth token (fake JWT-like string)
 */
export function createMockToken(userId: string): string {
  const now = Date.now();
  const expiresIn = 24 * 60 * 60 * 1000; // 24 hours
  
  return `mock_token_${userId}_${now}_${expiresIn}`;
}