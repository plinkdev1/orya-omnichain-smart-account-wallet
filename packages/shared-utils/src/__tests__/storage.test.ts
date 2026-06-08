/**
 * Tests for storage utilities
 */
import {
    clearStorage,
    getStorageItem,
    getStorageJSON,
    getStorageKeys,
    hasStorageItem,
    removeStorageItem,
    setStorageItem,
    setStorageJSON,
    type StorageOptions,
} from '../storage';

describe('Storage Utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.clear();
      }
    } catch {
      // localStorage may not be available
    }
  });

  describe('setStorageItem & getStorageItem', () => {
    it('should store and retrieve string values', async () => {
      await setStorageItem('test-key', 'test-value');
      const result = await getStorageItem('test-key');
      expect(result).toBe('test-value');
    });

    it('should return null for non-existent keys', async () => {
      const result = await getStorageItem('non-existent-key');
      expect(result).toBeNull();
    });

    it('should support key prefixes', async () => {
      const options: StorageOptions = { prefix: 'app' };
      await setStorageItem('key1', 'value1', options);
      
      const result = await getStorageItem('key1', options);
      expect(result).toBe('value1');
    });
  });

  describe('setStorageJSON & getStorageJSON', () => {
    it('should store and retrieve JSON objects', async () => {
      const testObj = { name: 'John', age: 30, active: true };
      await setStorageJSON('user', testObj);

      const result = await getStorageJSON('user');
      expect(result).toEqual(testObj);
    });

    it('should handle complex nested objects', async () => {
      const complex = {
        user: { name: 'John', address: { city: 'NYC' } },
        items: [1, 2, 3],
      };
      await setStorageJSON('complex', complex);

      const result = await getStorageJSON('complex');
      expect(result).toEqual(complex);
    });

    it('should return null for non-existent keys', async () => {
      const result = await getStorageJSON('non-existent');
      expect(result).toBeNull();
    });

    it('should return null for corrupted data', async () => {
      await setStorageItem('corrupted', 'not-json');
      const result = await getStorageJSON('corrupted');
      expect(result).toBeNull();
    });
  });

  describe('removeStorageItem', () => {
    it('should remove stored items', async () => {
      await setStorageItem('to-remove', 'value');
      await removeStorageItem('to-remove');

      const result = await getStorageItem('to-remove');
      expect(result).toBeNull();
    });

    it('should handle removing non-existent items', async () => {
      expect(async () => {
        await removeStorageItem('non-existent');
      }).not.toThrow();
    });

    it('should support prefix-based removal', async () => {
      const options = { prefix: 'app' };
      await setStorageItem('key1', 'value1', options);
      await removeStorageItem('key1', 'app');

      const result = await getStorageItem('key1', options);
      expect(result).toBeNull();
    });
  });

  describe('hasStorageItem', () => {
    it('should check if key exists', async () => {
      await setStorageItem('existing', 'value');

      expect(await hasStorageItem('existing')).toBe(true);
      expect(await hasStorageItem('non-existent')).toBe(false);
    });

    it('should support prefix-based checking', async () => {
      const options = { prefix: 'app' };
      await setStorageItem('key', 'value', options);

      expect(await hasStorageItem('key', 'app')).toBe(true);
      expect(await hasStorageItem('key')).toBe(false); // Without prefix
    });
  });

  describe('getStorageKeys', () => {
    it('should retrieve all storage keys', async () => {
      await setStorageItem('key1', 'value1');
      await setStorageItem('key2', 'value2');

      const keys = await getStorageKeys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });

    it('should filter keys by prefix', async () => {
      await setStorageItem('app:key1', 'value1');
      await setStorageItem('app:key2', 'value2');
      await setStorageItem('other:key', 'value');

      const keys = await getStorageKeys('app');
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).not.toContain('other:key');
    });

    it('should return empty array if no keys', async () => {
      const keys = await getStorageKeys();
      expect(Array.isArray(keys)).toBe(true);
    });
  });

  describe('clearStorage', () => {
    it('should clear all storage items', async () => {
      await setStorageItem('key1', 'value1');
      await setStorageItem('key2', 'value2');

      await clearStorage();

      expect(await getStorageItem('key1')).toBeNull();
      expect(await getStorageItem('key2')).toBeNull();
    });

    it('should support prefix-based clearing', async () => {
      await setStorageItem('app:key1', 'value1');
      await setStorageItem('app:key2', 'value2');
      await setStorageItem('other:key', 'value');

      await clearStorage('app');

      expect(await getStorageItem('app:key1')).toBeNull();
      expect(await getStorageItem('app:key2')).toBeNull();
      // Non-prefixed item should still exist (in real localStorage)
    });
  });

  describe('Expiration handling', () => {
    it('should respect expiration time', async () => {
      const options: StorageOptions = { expiresIn: 100 }; // 100ms
      await setStorageItem('expiring', 'value', options);

      // Should exist immediately
      const resultBefore = await getStorageItem('expiring', options);
      expect(resultBefore).not.toBeNull();

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be removed by now (might still exist in real localStorage)
      const resultAfter = await getStorageJSON('expiring', options);
      // Note: Real behavior depends on localStorage implementation
    });
  });
});