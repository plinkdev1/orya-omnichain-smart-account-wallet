/**
 * @orya/wallet-core/storage
 * 
 * Platform-agnostic storage abstraction
 * Supports: Web (localStorage), Mobile (AsyncStorage)
 * 
 * Quick Start:
 * import { createStorage } from '@orya/wallet-core/storage';
 * const storage = createStorage(); // Auto-detects platform
 */

export { AsyncStorageAdapter } from './AsyncStorageAdapter';
export type { IStorage } from './IStorage';
export { LocalStorageAdapter } from './LocalStorageAdapter';
export { StorageFactory, createStorage } from './StorageFactory';

