import { IStorage } from './IStorage';

/**
 * Mobile-specific storage adapter
 * Wraps React Native AsyncStorage with consistent interface
 * 
 * Usage:
 * import AsyncStorage from '@react-native-async-storage/async-storage';
 * const storage = new AsyncStorageAdapter(AsyncStorage);
 */
export class AsyncStorageAdapter implements IStorage {
  private asyncStorage: any; // React Native AsyncStorage

  constructor(asyncStorage: any) {
    this.asyncStorage = asyncStorage;
  }

  async getItem(key: string): Promise<string | null> {
    try {
      return await this.asyncStorage.getItem(key);
    } catch (error) {
      console.error(`Failed to get item from AsyncStorage: ${key}`, error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await this.asyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`Failed to set item in AsyncStorage: ${key}`, error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await this.asyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove item from AsyncStorage: ${key}`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.asyncStorage.clear();
    } catch (error) {
      console.error('Failed to clear AsyncStorage', error);
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return await this.asyncStorage.getAllKeys();
    } catch (error) {
      console.error('Failed to get all keys from AsyncStorage', error);
      return [];
    }
  }
}