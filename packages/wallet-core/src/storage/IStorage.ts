/**
 * Storage Abstraction Interface
 * Platform-agnostic interface for persistence
 * 
 * Implementations:
 * - LocalStorageAdapter (web)
 * - AsyncStorageAdapter (mobile)
 */

export interface IStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
}
