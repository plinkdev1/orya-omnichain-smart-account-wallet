/**
 * Redux Auth Slice
 * Manages authentication state: login, logout, user info, errors
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AuthState {
  isLoggedIn: boolean;
  userId: string | null;
  userEmail: string | null;
  authMethod: "email" | "social" | "wallet" | null;
  sessionToken: string | null;
  error: string | null;
  loading: boolean;
  lastLoginAt: number | null;
  theme: "light" | "dark";
}

const initialState: AuthState = {
  isLoggedIn: false,
  userId: null,
  userEmail: null,
  authMethod: null,
  sessionToken: null,
  error: null,
  loading: false,
  lastLoginAt: null,
  theme: "light",
};

const authSlice: any = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Login actions
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (
      state,
      action: PayloadAction<{
        userId: string;
        userEmail?: string;
        authMethod: "email" | "social" | "wallet";
        sessionToken: string;
      }>
    ) => {
      state.isLoggedIn = true;
      state.userId = action.payload.userId;
      state.userEmail = action.payload.userEmail || null;
      state.authMethod = action.payload.authMethod;
      state.sessionToken = action.payload.sessionToken;
      state.loading = false;
      state.error = null;
      state.lastLoginAt = Date.now();
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
      state.isLoggedIn = false;
    },

    // Logout action
    logout: (state) => {
      state.isLoggedIn = false;
      state.userId = null;
      state.userEmail = null;
      state.authMethod = null;
      state.sessionToken = null;
      state.error = null;
      state.loading = false;
    },

    // Session actions
    sessionRefresh: (state, action: PayloadAction<string>) => {
      state.sessionToken = action.payload;
      state.error = null;
    },
    sessionExpired: (state) => {
      state.isLoggedIn = false;
      state.sessionToken = null;
      state.error = "Session expired";
    },

    // Error handling
    clearError: (state) => {
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },

    // Theme toggle
    toggleTheme: (state) => {
      state.theme = state.theme === "light" ? "dark" : "light";
    },
    setTheme: (state, action: PayloadAction<"light" | "dark">) => {
      state.theme = action.payload;
    },

    // Restore session
    restoreSession: (state, action: PayloadAction<Partial<AuthState>>) => {
      Object.assign(state, action.payload);
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  sessionRefresh,
  sessionExpired,
  clearError,
  setError,
  toggleTheme,
  setTheme,
  restoreSession,
} = authSlice.actions;

// Aliases for compatibility
export const setSession = sessionRefresh;
export const setSessionExpiry = sessionExpired;
export const setToken = sessionRefresh;
export const setUser = loginSuccess;
export const setLoading = loginStart;

export { authSlice };
export default authSlice.reducer;