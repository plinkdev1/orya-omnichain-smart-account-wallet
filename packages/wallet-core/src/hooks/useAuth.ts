/**
 * Platform-Agnostic useAuth Hook
 * Combines Redux state with authentication business logic
 * Provides unified interface for auth operations across web and mobile
 * 
 * PROMPT C1: Platform-Agnostic Hooks
 * This is a React hook that integrates with Redux for state management
 * Use directly in components or wrap in app-specific hooks
 */

import type { AuthSession, User } from '@orya/shared-types';
import { useCallback, useMemo } from 'react';
import {
    logout as logoutAction,
    setError,
    setLoading,
    setSession,
    setToken,
    setUser,
} from '../store/auth.slice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import type { RootState } from '../store/store';

/**
 * Business logic interface for authentication operations
 * Platform-agnostic - can be used by any UI framework
 */
export interface AuthLogic {
  login: (user: User, session: AuthSession) => void;
  logout: () => void;
  setAuthUser: (user: User) => void;
  setAuthSession: (session: AuthSession) => void;
  setAuthToken: (token: { token: string; refreshToken?: string; expiresIn?: number }) => void;
  setIsLoading: (loading: boolean) => void;
  setErrorMessage: (error: string | null) => void;
}

/**
 * Complete return type including state + logic
 */
export interface UseAuthReturn extends AuthLogic {
  // State
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  token: string | null;
  refreshToken: string | null;
  sessionExpiry: number | null;
}

/**
 * Platform-agnostic auth hook
 * Integrates Redux store with authentication business logic
 * 
 * @returns {UseAuthReturn} Complete auth state and operations
 * 
 * @example
 * // In component
 * function LoginPage() {
 *   const { login, loading, error, isAuthenticated } = useAuth();
 *   
 *   const handleLogin = async (email, password) => {
 *     // Get user and session from your backend API
 *     const { user, session } = await authenticateUser(email, password);
 *     login(user, session);
 *   };
 *   
 *   return isAuthenticated ? <Navigate to="/" /> : <LoginForm onSubmit={handleLogin} />;
 * }
 */
export function useAuth(): UseAuthReturn {
  const dispatch = useAppDispatch();
  const authState = useAppSelector((state: RootState) => state.auth);

  // Business logic - login (set user and session)
  const login = useCallback(
    (user: User, session: AuthSession) => {
      dispatch(setUser(user));
      dispatch(setSession(session));
    },
    [dispatch]
  );

  // Business logic - logout (clear everything)
  const logout = useCallback(
    () => {
      dispatch(logoutAction());
    },
    [dispatch]
  );

  // Business logic - set user
  const setAuthUser = useCallback(
    (user: User) => {
      dispatch(setUser(user));
    },
    [dispatch]
  );

  // Business logic - set session
  const setAuthSession = useCallback(
    (session: AuthSession) => {
      dispatch(setSession(session));
    },
    [dispatch]
  );

  // Business logic - set token
  const setAuthToken = useCallback(
    (tokenData: { token: string; refreshToken?: string; expiresIn?: number }) => {
      dispatch(setSession(tokenData));
    },
    [dispatch]
  );

  // Business logic - set loading state
  const setIsLoading = useCallback(
    (loading: boolean) => {
      dispatch(setLoading(loading));
    },
    [dispatch]
  );

  // Business logic - set error state
  const setErrorMessage = useCallback(
    (error: string | null) => {
      dispatch(setError(error));
    },
    [dispatch]
  );

  return useMemo(
    () => ({
      // State
      user: authState.user,
      session: authState.session,
      isAuthenticated: authState.isAuthenticated,
      loading: authState.loading,
      error: authState.error,
      token: authState.token,
      refreshToken: authState.refreshToken,
      sessionExpiry: authState.sessionExpiry,

      // Logic
      login,
      logout,
      setAuthUser,
      setAuthSession,
      setAuthToken,
      setIsLoading,
      setErrorMessage,
    }),
    [
      authState.user,
      authState.session,
      authState.isAuthenticated,
      authState.loading,
      authState.error,
      authState.token,
      authState.refreshToken,
      authState.sessionExpiry,
      login,
      logout,
      setAuthUser,
      setAuthSession,
      setAuthToken,
      setIsLoading,
      setErrorMessage,
    ]
  );
}
