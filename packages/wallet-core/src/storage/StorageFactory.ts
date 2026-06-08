import { AsyncStorageAdapter } from './AsyncStorageAdapter';
import { IStorage } from './IStorage';
import { LocalStorageAdapter } from './LocalStorageAdapter';

/**
 * Factory for creating platform-specific storage adapters
 * 
 * Supports both explicit platform selection and automatic detection
 * 
 * Usage:
 * // Explicit platform selection:
 * // In Web app:
 * const storage = StorageFactory.create('web');
 * 
 * // In Mobile app:
 * import AsyncStorage from '@react-native-async-storage/async-storage';
 * const storage = StorageFactory.create('mobile', AsyncStorage);
 * 
 * // Automatic detection:
 * const storage = createStorage(); // Detects platform automatically
 */
export class StorageFactory {
  static create(platform: 'web' | 'mobile', asyncStorage?: any): IStorage {
    if (platform === 'web') {
      return new LocalStorageAdapter();
    } else if (platform === 'mobile') {
      if (!asyncStorage) {
        throw new Error(
          'AsyncStorage must be provided for mobile platform. Import from @react-native-async-storage/async-storage'
        );
      }
      return new AsyncStorageAdapter(asyncStorage);
    }
    throw new Error(`Unknown platform: ${platform}`);
  }
}

/**
 * Automatically detects platform and creates appropriate storage adapter
 * 
 * Usage:
 * const storage = createStorage();
 * 
 * For mobile apps, make sure AsyncStorage is properly installed and available
 * in the global scope, or use StorageFactory.create('mobile', AsyncStorage) directly
 */
export function createStorage(): IStorage {
  // Detect platform based on environment
  if (typeof window !== 'undefined' && window.localStorage) {
    // Web platform detected
    return new LocalStorageAdapter();
  } else {
    // Mobile platform - requires AsyncStorage to be available globally
    // or imported and passed to StorageFactory.create()
    try {
      // Try to detect if we're in React Native environment
      if (typeof global !== 'undefined' && (global as any).AsyncStorage) {
        return new AsyncStorageAdapter((global as any).AsyncStorage);
      }
    } catch (error) {
      // Fallback
    }
    
    throw new Error(
      'Unable to detect platform. For mobile, use: StorageFactory.create("mobile", AsyncStorage) where AsyncStorage is imported from "@react-native-async-storage/async-storage"'
    );
  }
}