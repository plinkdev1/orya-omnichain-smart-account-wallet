# ORYA Mobile App - Quick Start Guide

**⏱️ 5-Minute Setup**

---

## 🚀 Quick Start (Copy-Paste)

### 1. Install Dependencies
```bash
cd apps/mobile
pnpm install
```

### 2. Create Environment File
```bash
cp .env.example .env.development
```

### 3. Add Firebase Credentials
Edit `.env.development`:
```
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_app.firebaseapp.com
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_app.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Start App
```bash
npm start          # Expo start
# Or
npm run android    # Android
npm run ios        # iOS
```

---

## ✅ Verify Installation

### Check Console Output
```
[Firebase] ✅ Initialization complete
[AuthGate] Auth state changed: null
[AppStore] userId updated: null
```

### First Run Behavior
- **New user:** See loading screen → onboarding
- **Returning user:** See loading screen → auto-login → home
- **Error:** See error message → retry

---

## 📋 Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `lib/firebase.ts` | Firebase service | 211 |
| `lib/appStore.ts` | State management | 95 |
| `lib/authGate.tsx` | Auth guard | 125 |
| `app/providers-enhanced.tsx` | Provider setup | 52 |

---

## 🔧 Useful Commands

```bash
# Check TypeScript errors
npm run tsc

# Format code
npm run format

# Test build
npm run build

# Clear cache
npm start -- -c
```

---

## 🐛 Troubleshooting

### Problem: "Firebase initialization failed"
**Solution:** Check `.env` file has all required keys

### Problem: "No module found: zustand"
**Solution:** Run `pnpm install` again

### Problem: "Cannot find module '@orya/wallet-core'"
**Solution:** Run from workspace root: `pnpm install`

### Problem: App shows blank screen
**Solution:** Check console for errors, ensure .env is correct

---

## 📚 Full Documentation

1. **Setup Details:** `CORE_APP_IMPLEMENTATION_GUIDE.md`
2. **Audit Results:** `CORE_APP_AUDIT_REPORT.md`
3. **Full Summary:** `CORE_APP_SUMMARY.md`

---

## 🎯 What's Implemented

✅ Firebase + Firestore  
✅ Redux + Zustand stores  
✅ Authentication guard  
✅ Loading screen  
✅ Error handling  
✅ Persistent state  

**Ready for Phase 1!** 🚀