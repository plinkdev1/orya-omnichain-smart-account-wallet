# Storage Abstraction Layer - Quick Start Guide

## TL;DR (One-Minute Overview)

```typescript
// 1. Import
import { createStorage } from '@orya/wallet-core/storage';

// 2. Create (auto-detects platform)
const storage = createStorage();

// 3. Use (same API everywhere!)
await storage.setItem('key', 'value');
const value = await storage.getItem('key');
await storage.removeItem('key');
await storage.clear();
```

## Common Patterns

### Pattern 1: Simple Key-Value Storage
```typescript
// Store a string
await storage.setItem('username', 'alice');
const username = await storage.getItem('username');

// Store JSON
const userData = { id: 123, name: 'Alice', verified: true };
await storage.setItem('user', JSON.stringify(userData));
const user = JSON.parse(await storage.getItem('user') || '{}');
```

### Pattern 2: React Hook
```typescript
import { useEffect, useState } from 'react';
import { createStorage } from '@orya/wallet-core/storage';

export function useLocalStorage(key: string, initialValue?: string) {
  const [storage] = useState(() => createStorage());
  const [value, setValue] = useState<string | null>(initialValue ?? null);
  
  useEffect(() => {
    storage.getItem(key).then(setValue);
  }, [key, storage]);
  
  const setStoredValue = async (val: string) => {
    setValue(val);
    await storage.setItem(key, val);
  };
  
  return [value, setStoredValue] as const;
}

// Usage
function MyComponent() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Current theme: {theme}
    </button>
  );
}
```

### Pattern 3: Authentication Token Storage
```typescript
const storage = createStorage();

// Save tokens
async function saveTokens(accessToken: string, refreshToken: string) {
  await storage.setItem('access_token', accessToken);
  await storage.setItem('refresh_token', refreshToken);
}

// Load tokens
async function loadTokens() {
  const accessToken = await storage.getItem('access_token');
  const refreshToken = await storage.getItem('refresh_token');
  return { accessToken, refreshToken };
}

// Clear tokens (logout)
async function clearTokens() {
  await storage.removeItem('access_token');
  await storage.removeItem('refresh_token');
}
```

### Pattern 4: Persist Redux State
```typescript
import { configureStore } from '@reduxjs/toolkit';
import { createStorage } from '@orya/wallet-core/storage';

const storage = createStorage();

// Save
export const saveState = (state: RootState) => {
  storage.setItem('redux-root-state', JSON.stringify(state));
};

// Load
export const loadState = async () => {
  const saved = await storage.getItem('redux-root-state');
  return saved ? JSON.parse(saved) : undefined;
};

// Use in store config
const preloadedState = await loadState();
const store = configureStore({
  reducer: rootReducer,
  preloadedState,
});

store.subscribe(() => saveState(store.getState()));
```

### Pattern 5: Settings/Preferences
```typescript
interface UserSettings {
  theme: 'light' | 'dark';
  language: string;
  notificationsEnabled: boolean;
}

const storage = createStorage();

async function saveSettings(settings: UserSettings) {
  await storage.setItem('user-settings', JSON.stringify(settings));
}

async function loadSettings(): Promise<UserSettings> {
  const saved = await storage.getItem('user-settings');
  return saved ? JSON.parse(saved) : {
    theme: 'light',
    language: 'en',
    notificationsEnabled: true,
  };
}

async function updateSetting<K extends keyof UserSettings>(
  key: K,
  value: UserSettings[K]
) {
  const settings = await loadSettings();
  settings[key] = value;
  await saveSettings(settings);
}
```

### Pattern 6: Cache with TTL
```typescript
interface CachedValue<T> {
  value: T;
  timestamp: number;
  ttl: number; // milliseconds
}

async function setCached<T>(
  key: string,
  value: T,
  ttlMs: number = 3600000 // 1 hour default
) {
  const cached: CachedValue<T> = {
    value,
    timestamp: Date.now(),
    ttl: ttlMs,
  };
  await storage.setItem(key, JSON.stringify(cached));
}

async function getCached<T>(key: string): Promise<T | null> {
  const stored = await storage.getItem(key);
  if (!stored) return null;
  
  const cached: CachedValue<T> = JSON.parse(stored);
  const isExpired = Date.now() - cached.timestamp > cached.ttl;
  
  if (isExpired) {
    await storage.removeItem(key);
    return null;
  }
  
  return cached.value;
}
```

### Pattern 7: Feature Flags/Config
```typescript
interface FeatureFlags {
  betaFeatures: boolean;
  newUI: boolean;
  offlineMode: boolean;
}

async function loadFeatureFlags(): Promise<FeatureFlags> {
  const saved = await storage.getItem('feature-flags');
  return saved ? JSON.parse(saved) : {
    betaFeatures: false,
    newUI: false,
    offlineMode: true,
  };
}

async function setFeatureFlag(flag: keyof FeatureFlags, enabled: boolean) {
  const flags = await loadFeatureFlags();
  flags[flag] = enabled;
  await storage.setItem('feature-flags', JSON.stringify(flags));
}

// Usage
if ((await loadFeatureFlags()).betaFeatures) {
  // Show beta features
}
```

## Platform-Specific Setup

### Web App Setup
```typescript
// No special setup needed! Just import and use
import { createStorage } from '@orya/wallet-core/storage';

const storage = createStorage(); // Automatically uses localStorage
```

### React Native App Setup
```typescript
// Install dependency
// npm install @react-native-async-storage/async-storage

// Import both
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageFactory } from '@orya/wallet-core/storage';

// Create with explicit platform
const storage = StorageFactory.create('mobile', AsyncStorage);

// Or auto-detect (if AsyncStorage is available globally)
import { createStorage } from '@orya/wallet-core/storage';
const storage = createStorage();
```

## API Reference

### IStorage Interface
```typescript
export interface IStorage {
  /**
   * Retrieve a value by key
   * @returns Value or null if not found
   */
  getItem(key: string): Promise<string | null>;

  /**
   * Store a key-value pair
   */
  setItem(key: string, value: string): Promise<void>;

  /**
   * Remove a specific key
   */
  removeItem(key: string): Promise<void>;

  /**
   * Remove all stored data
   */
  clear(): Promise<void>;

  /**
   * Get all stored keys
   * Useful for debugging or iterating
   */
  getAllKeys(): Promise<string[]>;
}
```

### StorageFactory
```typescript
// Explicit platform selection (recommended)
StorageFactory.create('web'): IStorage
StorageFactory.create('mobile', asyncStorage): IStorage

// Auto-detect
createStorage(): IStorage
```

## Error Handling

The storage layer handles errors gracefully:

```typescript
// If storage fails, operations won't throw
// Instead, they return null or empty results

// Safe to use without try-catch:
const value = await storage.getItem('key'); // null if fails
await storage.setItem('key', 'value'); // silently fails if quota exceeded

// But you can still add error handling if needed:
try {
  await storage.setItem('large-data', hugeString);
} catch (error) {
  console.error('Storage error:', error);
}
```

## Best Practices

✅ **DO:**
- Use JSON.stringify/parse for complex objects
- Use consistent key naming (e.g., `app:user:preferences`)
- Call `storage.clear()` on logout
- Use descriptive key names
- Handle async/await properly
- Test on both web and mobile

❌ **DON'T:**
- Store sensitive data (passwords, private keys) in plain text
- Store very large objects (localStorage has limits)
- Assume synchronous operations
- Forget to JSON.parse when retrieving objects
- Use arbitrary key names that might conflict

## Debugging

```typescript
// List all stored keys
const storage = createStorage();
const keys = await storage.getAllKeys();
console.log('Stored keys:', keys);

// View a specific key
for (const key of keys) {
  const value = await storage.getItem(key);
  console.log(`${key}:`, value);
}

// Check storage before/after operations
console.log('Before:', await storage.getAllKeys());
await storage.setItem('test', 'value');
console.log('After:', await storage.getAllKeys());
```

## Troubleshooting

### "Unable to detect platform" error
**Cause:** Can't find localStorage (web) or AsyncStorage (mobile)

**Solution:** Use explicit factory:
```typescript
// Instead of:
const storage = createStorage(); // ❌ fails

// Do this:
import AsyncStorage from '@react-native-async-storage/async-storage';
const storage = StorageFactory.create('mobile', AsyncStorage); // ✅ works
```

### localStorage quota exceeded
**Cause:** Trying to store more than ~5-10MB

**Solution:** Clear old data or reduce stored values:
```typescript
// Clear old entries
const keys = await storage.getAllKeys();
const oldKeys = keys.filter(k => k.startsWith('old:'));
for (const key of oldKeys) {
  await storage.removeItem(key);
}
```

### Undefined or null values
**Cause:** Forgetting JSON.parse:
```typescript
// ❌ Wrong
const data = await storage.getItem('key');
console.log(data.id); // TypeError: data is string!

// ✅ Correct
const data = JSON.parse(await storage.getItem('key') || '{}');
console.log(data.id);
```

## Performance Tips

- Call `createStorage()` once and reuse the instance
- Batch operations when possible
- Use `getAllKeys()` sparingly (it's relatively expensive)
- Consider caching frequently-accessed values in memory
- For React, use context + hooks to avoid recreating storage instance

---

**Quick Links:**
- [Full Documentation](./STORAGE_ABSTRACTION_IMPLEMENTATION.md)
- [Source Files](./src/storage/)
- [Examples](./src/storage/)

**Last Updated:** 2025-01-11