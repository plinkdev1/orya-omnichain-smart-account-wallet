/**   
 * Redux Store Configuration  
 * Combines all slices and configures store with middleware  
 */  
  
import { configureStore, PreloadedState } from "@reduxjs/toolkit";  
import { authSlice } from "./slices/authSlice";  
import { walletSlice } from "./slices/walletSlice";  
import { walletProfileSlice } from "./slices/walletProfileSlice";  
import { onboardingSlice } from "./slices/onboardingSlice";  
  
// Root state type  
export interface RootState {  
  auth: ReturnType<typeof authSlice.reducer>;  
  wallet: ReturnType<typeof walletSlice.reducer>;  
  walletProfile: ReturnType<typeof walletProfileSlice.reducer>;  
  onboarding: ReturnType<typeof onboardingSlice.reducer>;  
}  
  
/**   
 * Create store with optional preloaded state (for testing)  
 */  
export function createAppStore(preloadedState?: PreloadedState<RootState>) {  
  return configureStore({  
    reducer: {  
      auth: authSlice.reducer,  
      wallet: walletSlice.reducer,  
      walletProfile: walletProfileSlice.reducer,  
      onboarding: onboardingSlice.reducer,  
    },  
    preloadedState,  
    middleware: (getDefaultMiddleware) =>  
      getDefaultMiddleware({  
        serializableCheck: {  
          // Ignore these action types for serialization check  
          ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],  
        },  
      }),  
  });  
}  
  
// Create default store instance  
export const store = createAppStore();  
  
export type AppDispatch = typeof store.dispatch;  
