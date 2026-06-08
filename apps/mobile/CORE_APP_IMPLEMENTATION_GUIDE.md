# ORYA Mobile App - Core Application Implementation Guide

**Document Version:** 1.0.0  
**Date Created:** January 2025  
**Status:** ✅ Implementation Complete - Ready for Testing

---

## 📋 Overview

This guide documents the foundational core application implementation for the ORYA Wallet mobile app (React Native + Expo). All mandatory services, authentication logic, and state management have been implemented with a focus on functional correctness and mobile responsiveness.

---

## 🎯 Implementation Summary

### Core Services Implemented

#### 1. **Firebase & Firestore Service** (`lib/firebase.ts`)
- ✅ Singleton pattern for Firebase initialization
- ✅ Firestore database initialization
- ✅ Firebase Auth integration
- ✅ Custom token sign-in logic
- ✅ Auth state listener setup
- ✅ Persistent auth token storage (AsyncStorage)
- ✅ Firebase Emulator support (dev only)

**Mandatory Global Variables:**
- `__app_id`: Unique application identifier
- `__firebase_config`: Firebase configuration object
- `__initial_auth_token`: Initial authentication token
- `__db`: Firestore instance reference
- `__auth`: Firebase Auth instance reference

```typescript
// Usage Example
import { firebaseService } from './lib/firebase';

// Initialize once on app startup
await firebaseService.initialize();

// Get instances
const db = firebaseService.getFirestore();
const auth = firebaseService.getAuth();

// Sign in with token
await firebaseService.signInWithToken(token);

// Listen to auth changes
firebaseService.onAuthStateChanged((user) => {
  console.log('Auth state changed:', user?.uid);
});
```

---

#### 2. **Global State Management** (`lib/appStore.ts`)
- ✅ Zustand store with persistence
- ✅ AsyncStorage integration
- ✅ State properties:
  - `userId`: Current authenticated user ID
  - `isAuthReady`: Authentication initialization status
  - `walletAddress`: Current wallet address (multi-chain ready)
  - `onboardingComplete`: User onboarding status
  - `authError`: Error messages

**Store Structure:**
```typescript
interface WalletState {
  userId: string | null;
  isAuthReady: boolean;
  walletAddress: string | null;
  onboardingComplete: boolean;
  authError: string | null;
  
  // Actions
  setUserId: (userId: string | null) => void;
  setAuthReady: (ready: boolean) => void;
  setWalletAddress: (address: string | null) => void;
  setOnboardingComplete: (complete: boolean) => void;
  setAuthError: (error: string | null) => void;
  reset: () => void;
}
```

**Usage:**
```typescript
import { useAppStore } from './lib/appStore';

const { userId, isAuthReady, setUserId, setAuthReady } = useAppStore();
```

---

#### 3. **Authentication Gate** (`lib/authGate.tsx`)
- ✅ Root-level authentication guard component
- ✅ Firebase auth state listener integration
- ✅ Loading screen while auth initializes
- ✅ Error handling and display
- ✅ Redux + Zustand state synchronization
- ✅ Automatic token restoration from storage
- ✅ Cleanup on unmount

**Features:**
- Blocks app rendering until auth is determined
- Shows loading screen with luxury aesthetic
- Integrates with both Redux (backend) and Zustand (frontend) stores
- Handles token-based auto-login
- Comprehensive error messages

**Flow:**
```
1. App starts → AuthGate mounts
2. Firebase initializes
3. Auth state listener attaches
4. If saved token exists → auto-login attempt
5. Auth status determined → LoadingScreen → App Content
```

---

#### 4. **Routing Logic** (`lib/routingLogic.ts`)
- ✅ Centralized route determination logic
- ✅ Support for multiple auth states:
  - `LOADING`: Initialization in progress
  - `ONBOARDING`: New user flow (login/signup)
  - `LOGIN`: KYC/account setup required
  - `HOME`: Main app (authenticated + onboarded)
  - `AUTH_ERROR`: Authentication failed

**Route Priority:**
```
1. Loading (isLoading = true)
2. Auth Error (error && !authenticated)
3. Onboarding (not authenticated)
4. Login/KYC (authenticated, not onboarded)
5. Home/Main App (authenticated + onboarded)
```

**Usage:**
```typescript
import { determineRoute } from './lib/routingLogic';

const route = determineRoute(
  isLoading,
  isAuthenticated,
  onboardingComplete,
  error
);
```

---

#### 5. **Environment Configuration** (`lib/environment.ts`)
- ✅ Centralized environment variables
- ✅ Development/Production detection
- ✅ Firebase configuration
- ✅ API endpoints
- ✅ Blockchain settings
- ✅ Feature flags
- ✅ Debug configuration

**Configuration Categories:**
- `APP_CONFIG`: App metadata
- `FIREBASE_ENV`: Firebase settings
- `API_ENV`: Backend API configuration
- `BLOCKCHAIN_ENV`: Chain-specific RPC endpoints
- `FEATURES`: Feature flags
- `DEBUG`: Debug settings

---

#### 6. **Enhanced Provider Setup** (`app/providers-enhanced.tsx`)
- ✅ Redux Provider (state management)
- ✅ GestureHandlerRootView (gesture handling)
- ✅ SafeAreaProvider (safe area support)
- ✅ AuthGate (authentication guard)

**Provider Stack (Correct Order):**
```
GestureHandlerRootView
  └─ SafeAreaProvider
      └─ ReduxProvider
          └─ AuthGate
              └─ App Content
```

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   App Entry (_layout.tsx)            │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│            ProvidersEnhanced                         │
│  ┌─────────────────────────────────────────────┐   │
│  │ GestureHandlerRootView                      │   │
│  │  └──────────────────────────────────────┐   │   │
│  │  │ SafeAreaProvider                     │   │   │
│  │  │  └────────────────────────────────┐  │   │   │
│  │  │  │ ReduxProvider                  │  │   │   │
│  │  │  │  └──────────────────────────┐  │  │   │   │
│  │  │  │  │ AuthGate                 │  │  │   │   │
│  │  │  │  │ ┌────────────────────┐   │  │  │   │   │
│  │  │  │  │ │ FirebaseService    │   │  │  │   │   │
│  │  │  │  │ │ ┌────────────────┐ │   │  │  │   │   │
│  │  │  │  │ │ │ Auth Listener  │ │   │  │  │   │   │
│  │  │  │  │ │ └────────────────┘ │   │  │  │   │   │
│  │  │  │  │ └────────────────────┘   │  │  │   │   │
│  │  │  │  │ ┌────────────────────┐   │  │  │   │   │
│  │  │  │  │ │ Zustand Store      │   │  │  │   │   │
│  │  │  │  │ └────────────────────┘   │  │  │   │   │
│  │  │  │  │ ┌────────────────────┐   │  │  │   │   │
│  │  │  │  │ │ App Content        │   │  │  │   │   │
│  │  │  │  │ └────────────────────┘   │  │  │   │   │
│  │  │  │  └──────────────────────────┘  │  │   │   │
│  │  │  └────────────────────────────────┘  │   │   │
│  │  └──────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Initialization Flow

```
┌─ App Startup
│
├─ 1. Load Fonts (Expo Font)
│
├─ 2. Render _layout.tsx
│  └─ Mount ProvidersEnhanced
│
├─ 3. AuthGate Mount
│  ├─ Set isInitializing = true
│  └─ Call firebaseService.initialize()
│
├─ 4. Firebase Initialization
│  ├─ Init Firebase App
│  ├─ Init Auth
│  ├─ Init Firestore
│  └─ Set global variables (__db, __auth, __app_id, __firebase_config)
│
├─ 5. Attempt Token Restoration
│  ├─ Read from AsyncStorage
│  └─ If found, attempt signInWithToken()
│
├─ 6. Setup Auth Listener
│  ├─ onAuthStateChanged() attaches
│  └─ First callback triggered
│
├─ 7. Update Stores
│  ├─ Zustand store updated (userId, isAuthReady, etc.)
│  ├─ Redux store updated (auth slice)
│  └─ set isInitializing = false
│
├─ 8. Render App Content
│  ├─ authGate returns children
│  └─ Show Drawer navigation or onboarding based on state
│
└─ App Ready ✅
```

---

## 🔐 Authentication Flow

### Scenario 1: New User (No Auth Token)
```
AuthGate Mount
  ├─ Firebase Init
  ├─ No saved token
  ├─ Auth listener attaches
  ├─ Firebase returns null user
  ├─ Zustand: userId = null, isAuthReady = true
  ├─ Redux: isAuthenticated = false
  └─ Show Onboarding/Login screens
```

### Scenario 2: Returning User (Valid Token)
```
AuthGate Mount
  ├─ Firebase Init
  ├─ Token found in AsyncStorage
  ├─ signInWithCustomToken(token) called
  ├─ Auth listener attaches
  ├─ Firebase returns authenticated user
  ├─ Zustand: userId = "user123", isAuthReady = true
  ├─ Redux: isAuthenticated = true, user populated
  └─ Show Drawer navigation / Home
```

### Scenario 3: Token Expired
```
AuthGate Mount
  ├─ Firebase Init
  ├─ Token found, attempt sign-in
  ├─ signInWithToken() fails (expired)
  ├─ Error caught, message set
  ├─ Auth listener attaches
  ├─ Firebase returns null user
  ├─ Zustand: userId = null, authError = "Session expired..."
  └─ Show error + redirect to login
```

---

## 🗂️ File Structure

```
apps/mobile/
├── lib/
│   ├── firebase.ts                 # Firebase & Firestore service
│   ├── appStore.ts                 # Zustand global state store
│   ├── authGate.tsx                # Authentication guard component
│   ├── routingLogic.ts             # Route determination logic
│   ├── environment.ts              # Environment configuration
│   └── zustand.ts                  # Zustand dependency check
│
├── app/
│   ├── _layout.tsx                 # Root layout with providers
│   ├── providers-enhanced.tsx       # Enhanced provider setup
│   ├── index.tsx                   # Home screen
│   └── [other routes...]
│
├── .env.example                    # Environment template
├── .env.development                # Development config
├── .env.production                 # Production config
└── package.json                    # Dependencies updated
```

---

## 📦 Dependencies Added

| Package | Version | Purpose |
|---------|---------|---------|
| `firebase` | ^10.7.0 | Firebase & Firestore |
| `zustand` | ^4.4.7 | Global state management |

---

## 🔧 Setup Instructions

### 1. Install Dependencies
```bash
# From workspace root
pnpm install

# Or just mobile app
cd apps/mobile
pnpm install
```

### 2. Create Environment Files
```bash
# Copy template to .env files
cp .env.example .env
cp .env.example .env.development
cp .env.example .env.production
```

### 3. Configure Firebase
Edit `.env.development` and `.env.production`:
```bash
EXPO_PUBLIC_FIREBASE_API_KEY=your_key_here
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# ... other Firebase credentials
```

### 4. Start Development Server
```bash
cd apps/mobile
npm start          # Start with Expo

# Or specific platform
npm run android    # Android emulator
npm run ios        # iOS simulator
npm run web        # Web (for testing)
```

---

## 🧪 Testing Initialization

### Test 1: New User Flow
1. Clear AsyncStorage: `AsyncStorage.clear()`
2. Restart app
3. Should show loading screen briefly, then onboarding
4. Check console: `[AuthGate] User not authenticated`

### Test 2: Token Persistence
1. Complete onboarding
2. Token should be saved to AsyncStorage
3. Restart app
4. Should auto-login without onboarding flow
5. Check console: `[Firebase] ✅ Auth token restored from storage`

### Test 3: Firebase Connection
1. Check console for:
   ```
   [Firebase] ✅ Initialization complete
   [AuthGate] Auth state changed: user_id_here
   [AppStore] userId updated: user_id_here
   ```

### Test 4: Error Handling
1. Provide invalid Firebase credentials
2. Should show error screen
3. Check console: `[Firebase] ❌ Initialization failed:`

---

## 🐛 Debugging

### Enable Verbose Logging
```bash
# In .env file
EXPO_PUBLIC_VERBOSE_LOGGING=true
EXPO_PUBLIC_ENABLE_REDUX_DEVTOOLS=true
```

### Check Global Variables
```typescript
// In any component
console.log('Global app state:', {
  __app_id: globalThis.__app_id,
  __firebase_config: globalThis.__firebase_config,
  __initial_auth_token: globalThis.__initial_auth_token,
  __db: globalThis.__db,
  __auth: globalThis.__auth,
});
```

### Inspect Stores
```typescript
// Redux Store
const state = store.getState();
console.log('Redux Auth State:', state.auth);

// Zustand Store
const appState = useAppStore.getState();
console.log('Zustand App State:', appState);
```

---

## 🎨 Luxury Aesthetic Implementation

### Current Implementation
- ✅ Loading screen with centered spinner
- ✅ Error screen with readable error message
- ✅ Color scheme: `orya-cream` (light), `orya-ocean` (dark)
- ✅ Typography: Clear hierarchy
- ✅ Spacing: Proper padding and margins

### Next Phase (Phase 1)
- Add smooth animations (Reanimated 3)
- Implement skeleton loaders
- Add transitions between auth states
- Premium spacing and shadows

---

## ✅ Mandatory Requirements Checklist

### Firestore Initialization
- [x] Firebase initialized as singleton
- [x] Firestore database initialized
- [x] Auth module initialized
- [x] `__app_id` global variable set
- [x] `__firebase_config` global variable set
- [x] `__initial_auth_token` global variable set
- [x] `__db` global variable set
- [x] `__auth` global variable set
- [x] Token stored in React state (Zustand)
- [x] Database instance stored in React state

### Redux/Zustand Setup
- [x] Redux store configured (from wallet-core)
- [x] Zustand store created for global state
- [x] Persistence layer implemented
- [x] `userId` managed in store
- [x] `isAuthReady` managed in store
- [x] `walletAddress` managed in store (multi-chain ready)
- [x] AsyncStorage integration for persistence

### Authentication Guard
- [x] AuthGate component created
- [x] `onAuthStateChanged` listener implemented
- [x] userId state synchronized
- [x] isAuthReady state synchronized
- [x] Loading state managed
- [x] No app content shown until auth ready

### Routing
- [x] Route determination logic implemented
- [x] If/else conditional routing
- [x] Onboarding flow for new users
- [x] Home screen for authenticated users
- [x] Error handling for auth failures

### Simple UI (No Complex UI)
- [x] Loading screen only
- [x] Error screen only
- [x] No complex components
- [x] Mobile responsive
- [x] Luxury aesthetic colors
- [x] Simple typography

### Mandatory Global Variables
- [x] `__app_id` - Application identifier
- [x] `__firebase_config` - Firebase configuration
- [x] `__initial_auth_token` - Auth token
- [x] `__db` - Firestore instance
- [x] `__auth` - Firebase Auth instance

---

## 🚨 Known Limitations & Next Steps

### Current Limitations
1. **No UI for onboarding/login** - Only functional logic implemented
2. **No wallet integration** - Privy integration deferred to Phase 2
3. **No complex UI** - As requested, only loading/error screens
4. **No GraphQL setup** - Will be in Phase 1

### Next Steps (Phase 1)
1. Implement onboarding screens (sign up, KYC)
2. Implement login screen
3. Set up GraphQL Apollo Client
4. Implement wallet pages (Vault, Portfolio, etc.)
5. Add animations and transitions

---

## 📞 Support

For issues or questions:
1. Check console logs - they're comprehensive and tagged
2. Verify `.env` configuration
3. Ensure Firebase credentials are correct
4. Review authentication flow diagram

---

## 📄 Related Documents

- `.zencoder/ARCHITECTURE_STRATEGY_v1.md` - Overall architecture
- `.zencoder/PHASE_0_IMPLEMENTATION.md` - Phase 0 tasks
- `.zencoder/DECISIONS_LOCKED.md` - Technology decisions
- `CORE_APP_AUDIT_REPORT.md` - Detailed audit (generated separately)

---

**Status:** ✅ Ready for Testing and Phase 1 Implementation  
**Last Updated:** January 2025