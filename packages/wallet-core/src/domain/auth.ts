/**
 * Auth State Machine & Auth Entity
 * Pure business logic for authentication state transitions
 */

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';
export type AuthMethod = 'email' | 'google' | 'biometric' | 'wallet';

export interface AuthUser {
  id: string;
  email?: string;
  displayName?: string;
  walletAddress?: string;
  kycStatus?: 'pending' | 'verified' | 'rejected';
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface AuthSession {
  userId: string;
  token: string;
  expiresAt: Date;
  refreshToken?: string;
}

export class AuthStateMachine {
  private status: AuthStatus = 'idle';
  private user: AuthUser | null = null;
  private session: AuthSession | null = null;
  private error: Error | null = null;

  getStatus(): AuthStatus {
    return this.status;
  }

  getUser(): AuthUser | null {
    return this.user;
  }

  getSession(): AuthSession | null {
    return this.session;
  }

  getError(): Error | null {
    return this.error;
  }

  isAuthenticated(): boolean {
    return this.status === 'authenticated' && this.user !== null && this.session !== null;
  }

  isLoading(): boolean {
    return this.status === 'loading';
  }

  /**
   * State transitions
   */
  transitionToLoading(): void {
    if (this.status === 'idle' || this.status === 'unauthenticated' || this.status === 'error') {
      this.status = 'loading';
      this.error = null;
    }
  }

  transitionToAuthenticated(user: AuthUser, session: AuthSession): void {
    if (this.status === 'loading') {
      this.status = 'authenticated';
      this.user = user;
      this.session = session;
      this.error = null;
      user.lastLoginAt = new Date();
    }
  }

  transitionToUnauthenticated(): void {
    this.status = 'unauthenticated';
    this.user = null;
    this.session = null;
    this.error = null;
  }

  transitionToError(error: Error): void {
    this.status = 'error';
    this.error = error;
  }

  transitionToIdle(): void {
    this.status = 'idle';
    this.error = null;
  }

  /**
   * Session management
   */
  isSessionValid(): boolean {
    if (!this.session) return false;
    return new Date() < this.session.expiresAt;
  }

  refreshSession(newSession: AuthSession): void {
    if (this.isAuthenticated()) {
      this.session = newSession;
    }
  }

  /**
   * User management
   */
  updateUser(updates: Partial<AuthUser>): void {
    if (this.user) {
      this.user = { ...this.user, ...updates };
    }
  }

  getSnapshot() {
    return {
      status: this.status,
      user: this.user,
      session: this.session,
      error: this.error,
      isAuthenticated: this.isAuthenticated(),
      isLoading: this.isLoading(),
    };
  }
}

/**
 * Auth entity factory
 */
export function createAuthStateMachine(): AuthStateMachine {
  return new AuthStateMachine();
}

/**
 * Auth validation
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one digit');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Session utilities
 */
export function isSessionExpired(expiresAt: Date): boolean {
  return new Date() >= expiresAt;
}

export function calculateSessionExpiry(durationMinutes: number = 60): Date {
  const now = new Date();
  return new Date(now.getTime() + durationMinutes * 60 * 1000);
}