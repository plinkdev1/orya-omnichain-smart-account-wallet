/**
 * Tests for validation utilities
 */
import {
    isAlphanumeric,
    isInRange,
    isValidEmail,
    isValidHexColor,
    isValidLength,
    isValidPassword,
    isValidUrl,
    sanitizeInput,
    validatePrivateKey,
    validateRecoveryPhrase,
} from '../validation';

describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('john.doe@company.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail(null as any)).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should return detailed validation results', () => {
      const result = isValidPassword('ValidPass123!');
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should identify missing requirements', () => {
      const shortPass = isValidPassword('Test1!');
      expect(shortPass.valid).toBe(false);
      expect(shortPass.errors).toContain('Password must be at least 8 characters long');

      const noUpper = isValidPassword('lowercas123!');
      expect(noUpper.valid).toBe(false);
      expect(noUpper.errors).toContain(
        'Password must contain at least one uppercase letter'
      );

      const noNumber = isValidPassword('Password!');
      expect(noNumber.valid).toBe(false);
      expect(noNumber.errors).toContain('Password must contain at least one number');

      const noSpecial = isValidPassword('Password123');
      expect(noSpecial.valid).toBe(false);
      expect(noSpecial.errors).toContain(
        'Password must contain at least one special character'
      );
    });

    it('should handle invalid input', () => {
      const result = isValidPassword(null as any);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateRecoveryPhrase', () => {
    it('should validate correct recovery phrases', () => {
      const phrase12 = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      expect(validateRecoveryPhrase(phrase12)).toBe(true);

      const phrase24 = Array(24).fill('word').join(' ');
      expect(validateRecoveryPhrase(phrase24)).toBe(true);
    });

    it('should reject invalid phrase lengths', () => {
      expect(validateRecoveryPhrase('word')).toBe(false);
      expect(validateRecoveryPhrase('word word')).toBe(false);
      expect(validateRecoveryPhrase(Array(11).fill('word').join(' '))).toBe(false);
    });

    it('should reject non-word phrases', () => {
      expect(validateRecoveryPhrase('123 456 789 101 112 131 415 161 718 192 021 222')).toBe(
        false
      );
      expect(validateRecoveryPhrase('a a a a a a a a a a a a')).toBe(true); // Single letters are valid
    });

    it('should handle edge cases', () => {
      expect(validateRecoveryPhrase('')).toBe(false);
      expect(validateRecoveryPhrase(null as any)).toBe(false);
    });
  });

  describe('validatePrivateKey', () => {
    it('should validate correct private keys', () => {
      const validKey = '0x' + 'a'.repeat(64);
      expect(validatePrivateKey(validKey)).toBe(true);

      const validKeyNoPrefix = 'a'.repeat(64);
      expect(validatePrivateKey(validKeyNoPrefix)).toBe(true);
    });

    it('should reject invalid length', () => {
      expect(validatePrivateKey('0x123')).toBe(false);
      expect(validatePrivateKey('0x' + 'a'.repeat(63))).toBe(false);
      expect(validatePrivateKey('0x' + 'a'.repeat(65))).toBe(false);
    });

    it('should reject invalid characters', () => {
      expect(validatePrivateKey('0x' + 'g'.repeat(64))).toBe(false);
    });

    it('should reject all zeros or all ones', () => {
      expect(validatePrivateKey('0x' + '0'.repeat(64))).toBe(false);
      expect(validatePrivateKey('0x' + 'f'.repeat(64))).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validatePrivateKey('')).toBe(false);
      expect(validatePrivateKey(null as any)).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should escape HTML entities', () => {
      expect(sanitizeInput('<script>alert("XSS")</script>')).toBe(
        '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'
      );
      expect(sanitizeInput('Hello & goodbye')).toBe('Hello &amp; goodbye');
    });

    it('should handle edge cases', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput(null as any)).toBe('');
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('ftp://ftp.example.com')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not a url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl(null as any)).toBe(false);
    });
  });

  describe('isValidHexColor', () => {
    it('should validate correct hex colors', () => {
      expect(isValidHexColor('#FF5733')).toBe(true);
      expect(isValidHexColor('FF5733')).toBe(true);
      expect(isValidHexColor('#FFF')).toBe(true);
    });

    it('should reject invalid colors', () => {
      expect(isValidHexColor('#GGGGGG')).toBe(false);
      expect(isValidHexColor('#FF')).toBe(false);
      expect(isValidHexColor('RGB(255,0,0)')).toBe(false);
      expect(isValidHexColor('')).toBe(false);
    });
  });

  describe('isInRange', () => {
    it('should validate values in range', () => {
      expect(isInRange(5, 0, 10)).toBe(true);
      expect(isInRange(0, 0, 10)).toBe(true);
      expect(isInRange(10, 0, 10)).toBe(true);
    });

    it('should reject values out of range', () => {
      expect(isInRange(15, 0, 10)).toBe(false);
      expect(isInRange(-1, 0, 10)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isInRange(NaN, 0, 10)).toBe(false);
    });
  });

  describe('isValidLength', () => {
    it('should validate string lengths', () => {
      expect(isValidLength('hello', 0, 10)).toBe(true);
      expect(isValidLength('hello', 5, 10)).toBe(true);
    });

    it('should reject invalid lengths', () => {
      expect(isValidLength('hello', 0, 3)).toBe(false);
      expect(isValidLength('hello', 10, 20)).toBe(false);
    });

    it('should use defaults', () => {
      expect(isValidLength('hello')).toBe(true);
      expect(isValidLength('')).toBe(true); // Default minLength is 0
    });
  });

  describe('isAlphanumeric', () => {
    it('should validate alphanumeric strings', () => {
      expect(isAlphanumeric('abc123')).toBe(true);
      expect(isAlphanumeric('ABC')).toBe(true);
      expect(isAlphanumeric('123')).toBe(true);
    });

    it('should reject non-alphanumeric strings', () => {
      expect(isAlphanumeric('abc-123')).toBe(false);
      expect(isAlphanumeric('abc 123')).toBe(false);
      expect(isAlphanumeric('')).toBe(false);
    });
  });
});