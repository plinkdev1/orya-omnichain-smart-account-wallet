/**
 * Tests for crypto utilities
 */
import {
    decryptData,
    encryptData,
    generateRandomBytes,
    generateRandomHex,
    hashPassword,
    sha256,
    verifyPassword,
} from '../crypto';

describe('Crypto Utilities', () => {
  describe('generateRandomBytes', () => {
    it('should generate random bytes of requested length', () => {
      const result = generateRandomBytes(32);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(32);
    });

    it('should generate different random bytes each time', () => {
      const bytes1 = generateRandomBytes(32);
      const bytes2 = generateRandomBytes(32);
      expect(bytes1).not.toEqual(bytes2);
    });

    it('should reject invalid length', () => {
      expect(() => generateRandomBytes(-1)).toThrow();
      expect(() => generateRandomBytes(0)).toThrow();
      expect(() => generateRandomBytes(65537)).toThrow();
    });

    it('should reject non-integer length', () => {
      expect(() => generateRandomBytes(32.5)).toThrow();
    });
  });

  describe('generateRandomHex', () => {
    it('should generate random hex strings', () => {
      const result = generateRandomHex(16);
      expect(result).toMatch(/^0x[0-9a-f]{32}$/);
    });

    it('should generate different hex strings', () => {
      const hex1 = generateRandomHex(16);
      const hex2 = generateRandomHex(16);
      expect(hex1).not.toEqual(hex2);
    });

    it('should have correct length', () => {
      const result = generateRandomHex(8);
      expect(result.length).toBe(2 + 8 * 2); // 0x + 16 hex chars
    });
  });

  describe('sha256', () => {
    it('should hash data consistently', () => {
      const hash1 = sha256('test data');
      const hash2 = sha256('test data');
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = sha256('test data 1');
      const hash2 = sha256('test data 2');
      expect(hash1).not.toBe(hash2);
    });

    it('should return hex string with 0x prefix', () => {
      const result = sha256('test');
      expect(result).toMatch(/^0x[0-9a-f]+$/);
    });

    it('should reject invalid input', () => {
      expect(() => sha256(null as any)).toThrow();
      expect(() => sha256('')).toThrow();
    });
  });

  describe('encryptData & decryptData', () => {
    it('should encrypt and decrypt data', () => {
      const plaintext = 'secret message';
      const key = 'encryption-key';

      const encrypted = encryptData(plaintext, key);
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.length).toBeGreaterThan(plaintext.length);

      const decrypted = decryptData(encrypted, key);
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertexts for same input (due to random IV)', () => {
      const plaintext = 'same message';
      const key = 'key';

      const encrypted1 = encryptData(plaintext, key);
      const encrypted2 = encryptData(plaintext, key);

      expect(encrypted1).not.toBe(encrypted2);

      // Both should decrypt to same value
      expect(decryptData(encrypted1, key)).toBe(plaintext);
      expect(decryptData(encrypted2, key)).toBe(plaintext);
    });

    it('should fail with wrong key', () => {
      const plaintext = 'secret';
      const encrypted = encryptData(plaintext, 'correct-key');

      expect(() => decryptData(encrypted, 'wrong-key')).toThrow();
    });

    it('should reject corrupted data', () => {
      const encrypted = generateRandomHex(100);
      expect(() => decryptData(encrypted, 'key')).toThrow();
    });

    it('should reject invalid inputs', () => {
      expect(() => encryptData('', 'key')).toThrow();
      expect(() => encryptData('data', '')).toThrow();
      expect(() => encryptData(null as any, 'key')).toThrow();
    });
  });

  describe('hashPassword & verifyPassword', () => {
    it('should hash passwords', () => {
      const password = 'MyPassword123!';
      const hash = hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash).toContain(':');
    });

    it('should verify correct passwords', () => {
      const password = 'MyPassword123!';
      const hash = hashPassword(password);

      expect(verifyPassword(password, hash)).toBe(true);
    });

    it('should reject incorrect passwords', () => {
      const password = 'MyPassword123!';
      const hash = hashPassword(password);

      expect(verifyPassword('WrongPassword123!', hash)).toBe(false);
    });

    it('should produce different hashes for same password (different salts)', () => {
      const password = 'MyPassword123!';
      const hash1 = hashPassword(password);
      const hash2 = hashPassword(password);

      expect(hash1).not.toBe(hash2);

      // Both should verify
      expect(verifyPassword(password, hash1)).toBe(true);
      expect(verifyPassword(password, hash2)).toBe(true);
    });

    it('should use consistent salt for testing', () => {
      const password = 'MyPassword123!';
      const salt = 'fixed-salt-for-testing';

      const hash1 = hashPassword(password, salt);
      const hash2 = hashPassword(password, salt);

      expect(hash1).toBe(hash2);
    });

    it('should reject invalid inputs', () => {
      expect(() => hashPassword('')).toThrow();
      expect(() => hashPassword(null as any)).toThrow();

      expect(verifyPassword('', 'invalid:hash')).toBe(false);
      expect(verifyPassword('password', null as any)).toBe(false);
    });
  });

  describe('keccak256', () => {
    it('should require @noble/hashes or ethers.js', () => {
      // This test documents the dependency requirement
      // In a real environment with dependencies installed, this would work
      expect(() => {
        require('@noble/hashes/sha3');
      }).not.toThrow();
    });
  });
});