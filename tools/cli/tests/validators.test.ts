import { describe, it, expect } from 'vitest';
import {
  validateChainConfig,
  validateAdapterPath,
  validateChainName,
} from '../src/utils/validators';

describe('Validators', () => {
  describe('validateChainConfig', () => {
    it('should validate valid chain config', () => {
      const config = {
        name: 'Test Chain',
        dirName: 'test-adapter',
        language: 'typescript' as const,
        tier: 1,
      };

      expect(() => validateChainConfig(config)).not.toThrow();
    });

    it('should reject invalid dirName', () => {
      const config = {
        name: 'Test Chain',
        dirName: 'Test-Adapter', // Invalid: uppercase
        language: 'typescript' as const,
        tier: 1,
      };

      expect(() => validateChainConfig(config)).toThrow();
    });

    it('should reject invalid language', () => {
      const config = {
        name: 'Test Chain',
        dirName: 'test-adapter',
        language: 'python' as any,
        tier: 1,
      };

      expect(() => validateChainConfig(config)).toThrow();
    });

    it('should reject invalid tier', () => {
      const config = {
        name: 'Test Chain',
        dirName: 'test-adapter',
        language: 'typescript' as const,
        tier: 5 as any,
      };

      expect(() => validateChainConfig(config)).toThrow();
    });
  });

  describe('validateAdapterPath', () => {
    it('should accept valid paths', () => {
      expect(validateAdapterPath('/path/to/adapter')).toBe(true);
      expect(validateAdapterPath('adapter-name')).toBe(true);
      expect(validateAdapterPath('C:\\adapters\\test')).toBe(true);
    });

    it('should reject invalid characters', () => {
      expect(validateAdapterPath('adapter<name>')).toBe(false);
      expect(validateAdapterPath('adapter|name')).toBe(false);
      expect(validateAdapterPath('adapter?name')).toBe(false);
    });

    it('should reject empty paths', () => {
      expect(validateAdapterPath('')).toBe(false);
    });
  });

  describe('validateChainName', () => {
    it('should allow new chain names', () => {
      const existing = new Set(['sui', 'ethereum']);
      const result = validateChainName('aptos', existing);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject existing chain names', () => {
      const existing = new Set(['sui', 'ethereum']);
      const result = validateChainName('sui', existing);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('already exists');
    });
  });
});
