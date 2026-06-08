import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  token: string | null;
  refreshToken?: string | null;
  expiresIn?: number;
  sessionExpiry?: number;
  error: string | null;
  loading: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  refreshToken: null,
  error: null,
  loading: false,
};

const authSlice: any = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
    setUser: (state, action: PayloadAction<any>) => {
      state.user = action.payload;
    },
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
    },
    setSession: (state, action: PayloadAction<{
      token: string;
      refreshToken?: string;
      expiresIn?: number;
    }>) => {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.expiresIn = action.payload.expiresIn;
      state.isAuthenticated = true;
      if (action.payload.expiresIn) {
        state.sessionExpiry = Date.now() + (action.payload.expiresIn * 1000);
      }
    },
    setSessionExpiry: (state, action: PayloadAction<number>) => {
      state.sessionExpiry = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.error = null;
      state.sessionExpiry = undefined;
    },
  },
});

export const { 
  setLoading, 
  setError, 
  clearError,
  setAuthenticated, 
  setUser, 
  setToken, 
  setSession,
  setSessionExpiry,
  logout 
} = authSlice.actions;
export { authSlice };
export default authSlice.reducer;
