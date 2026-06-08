/**
 * Storage utilities - High-level API for persistent storage
 * Wrapper around wallet-core storage abstraction
 * Week 1 Implementation
 */

export interface StorageOptions {
  /** Encryption enabled (default: false) */
  encrypted?: boolean;
  /** Expiration time in milliseconds (default: never) */
  expiresIn?: number;
  /** Key prefix for namespacing (default: '') */
  prefix?: string;
}

/**
 * Get a value from storage
 * @param key - Storage key
 * @param options - Storage options
 * @returns Stored value as string, or null if not found
 */
export async function getStorageItem(key: string, options?: StorageOptions): Promise<string | null> {
  try {
    // This would be implemented to use wallet-core storage
    // For now, detect environment and use appropriate storage
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(options?.prefix ? `${options.prefix}:${key}` : key);
    }

    // React Native environment would use AsyncStorage
    // Placeholder for now
    return null;
  } catch {
    return null;
  }
}

/**
 * Set a value in storage
 * @param key - Storage key
 * @param value - Value to store
 * @param options - Storage options
 */
export async function setStorageItem(
  key: string,
  value: string,
  options?: StorageOptions,
): Promise<void> {
  try {
    const finalKey = options?.prefix ? `${options.prefix}:${key}` : key;

    // Store metadata if expiration is set
    if (options?.expiresIn) {
      const metadata = {
        value,
        expiresAt: Date.now() + options.expiresIn,
      };

      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(finalKey, JSON.stringify(metadata));
      }
    } else if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(finalKey, value);
    }
  } catch {
    // Storage quota exceeded or other error
  }
}

/**
 * Remove a value from storage
 * @param key - Storage key
 * @param prefix - Key prefix (default: '')
 */
export async function removeStorageItem(key: string, prefix?: string): Promise<void> {
  try {
    const finalKey = prefix ? `${prefix}:${key}` : key;

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(finalKey);
    }
  } catch {
    // Ignore errors
  }
}

/**
 * Clear all storage items (with optional prefix filter)
 * @param prefix - Only clear keys with this prefix (default: clear all)
 */
export async function clearStorage(prefix?: string): Promise<void> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (prefix) {
        // Clear only items with prefix
        const keys = Object.keys(localStorage);
        for (const key of keys) {
          if (key.startsWith(`${prefix}:`)) {
            localStorage.removeItem(key);
          }
        }
      } else {
        // Clear all
        localStorage.clear();
      }
    }
  } catch {
    // Ignore errors
  }
}

/**
 * Store a JSON object (serializes automatically)
 * @param key - Storage key
 * @param value - Object to store
 * @param options - Storage options
 */
export async function setStorageJSON<T extends Record<string, any>>(
  key: string,
  value: T,
  options?: StorageOptions,
): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    await setStorageItem(key, serialized, options);
  } catch {
    // JSON serialization or storage error
  }
}

/**
 * Retrieve a JSON object (deserializes automatically)
 * @param key - Storage key
 * @param options - Storage options
 * @returns Deserialized object, or null if not found
 */
export async function getStorageJSON<T = any>(
  key: string,
  options?: StorageOptions,
): Promise<T | null> {
  try {
    const item = await getStorageItem(key, options);
    if (!item) return null;

    // Check if item has expiration metadata
    let value: string;
    try {
      const metadata = JSON.parse(item);
      if (metadata.expiresAt && metadata.expiresAt < Date.now()) {
        // Expired - remove and return null
        await removeStorageItem(key, options?.prefix);
        return null;
      }
      value = metadata.value || item;
    } catch {
      value = item;
    }

    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * Check if a key exists in storage
 * @param key - Storage key
 * @param prefix - Key prefix (default: '')
 * @returns true if key exists, false otherwise
 */
export async function hasStorageItem(key: string, prefix?: string): Promise<boolean> {
  try {
    const finalKey = prefix ? `${prefix}:${key}` : key;

    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(finalKey) !== null;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Get all keys from storage (with optional prefix filter)
 * @param prefix - Filter keys by this prefix (default: all keys)
 * @returns Array of storage keys
 */
export async function getStorageKeys(prefix?: string): Promise<string[]> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const allKeys = Object.keys(localStorage);

      if (prefix) {
        const prefixWithColon = `${prefix}:`;
        return allKeys
          .filter((key) => key.startsWith(prefixWithColon))
          .map((key) => key.replace(prefixWithColon, ''));
      }

      return allKeys;
    }

    return [];
  } catch {
    return [];
  }
}
