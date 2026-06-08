/**
 * Storage Adapter - Compatibility Wrapper
 * Provides platform-agnostic storage with auto-detection
 */

export type { IStorage as StorageAdapterInterface } from './IStorage';
export { StorageFactory as StorageAdapter, createStorage as createStorageAdapter } from './StorageFactory';
