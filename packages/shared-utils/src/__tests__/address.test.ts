/**
 * Tests for address utilities
 */
import {
    formatAddress,
    isValidAddress,
    isValidChecksum,
    toChecksumAddress,
    validateEthereumAddress,
    validateSolanaAddress,
    validateSuiAddress,
} from '../address';

describe('Address Utilities', () => {
  describe('validateEthereumAddress', () => {
    it('should validate correct Ethereum addresses', () => {
      expect(validateEthereumAddress('0x1234567890123456789012345678901234567890')).toBe(
        true
      );
      expect(validateEthereumAddress('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd')).toBe(
        true
      );
    });

    it('should reject invalid Ethereum addresses', () => {
      expect(validateEthereumAddress('0x123')).toBe(false);
      expect(validateEthereumAddress('1234567890123456789012345678901234567890')).toBe(false);
      expect(validateEthereumAddress('0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG')).toBe(false);
      expect(validateEthereumAddress('')).toBe(false);
      expect(validateEthereumAddress(null as any)).toBe(false);
    });
  });

  describe('validateSuiAddress', () => {
    it('should validate correct SUI addresses', () => {
      expect(
        validateSuiAddress('0x' + 'a'.repeat(64))
      ).toBe(true);
      expect(
        validateSuiAddress('0x' + '0123456789abcdef'.repeat(4))
      ).toBe(true);
    });

    it('should reject invalid SUI addresses', () => {
      expect(validateSuiAddress('0x123')).toBe(false);
      expect(validateSuiAddress('0x' + 'a'.repeat(40))).toBe(false);
      expect(validateSuiAddress('')).toBe(false);
    });
  });

  describe('validateSolanaAddress', () => {
    it('should validate correct Solana addresses', () => {
      // Solana addresses are 43-44 base58 characters
      expect(validateSolanaAddress('11111111111111111111111111111112')).toBe(true);
      expect(validateSolanaAddress('EPjFWaJrnUguicfD4CLjw1t5PqLCvmQZWgVmZLuqX4C')).toBe(true);
    });

    it('should reject invalid Solana addresses', () => {
      expect(validateSolanaAddress('0x1234567890123456789012345678901234567890')).toBe(false);
      expect(validateSolanaAddress('invalid')).toBe(false);
      expect(validateSolanaAddress('')).toBe(false);
    });
  });

  describe('formatAddress', () => {
    it('should format long addresses', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      expect(formatAddress(address)).toBe('0x12...5678');
      expect(formatAddress(address, 6)).toBe('0x123456...5678');
    });

    it('should not format short addresses', () => {
      expect(formatAddress('0x123')).toBe('0x123');
      expect(formatAddress('short')).toBe('short');
    });

    it('should handle edge cases', () => {
      expect(formatAddress('')).toBe('');
      expect(formatAddress(null as any)).toBe(null);
    });
  });

  describe('isValidAddress', () => {
    it('should validate addresses by chain type', () => {
      expect(isValidAddress('0x1234567890123456789012345678901234567890', 'ethereum')).toBe(true);
      expect(isValidAddress('0x' + 'a'.repeat(64), 'sui')).toBe(true);
      expect(isValidAddress('EPjFWaJrnUguicfD4CLjw1t5PqLCvmQZWgVmZLuqX4C', 'solana')).toBe(true);
    });

    it('should return false for invalid combinations', () => {
      expect(isValidAddress('0x' + 'a'.repeat(40), 'sui')).toBe(false);
      expect(isValidAddress('0x' + 'a'.repeat(64), 'ethereum')).toBe(false);
    });

    it('should handle generic validation', () => {
      expect(isValidAddress('somelong.address.here')).toBe(true);
      expect(isValidAddress('x')).toBe(false);
    });
  });

  describe('isValidChecksum', () => {
    it('should validate non-checksummed addresses', () => {
      expect(isValidChecksum('0x1234567890123456789012345678901234567890')).toBe(true);
      expect(isValidChecksum('0x0000000000000000000000000000000000000000')).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(isValidChecksum('0x123')).toBe(false);
      expect(isValidChecksum('invalid')).toBe(false);
      expect(isValidChecksum('')).toBe(false);
    });
  });

  describe('toChecksumAddress', () => {
    it('should return lowercase for invalid addresses', () => {
      expect(toChecksumAddress('invalid')).toBe('invalid');
      expect(toChecksumAddress('0x123')).toBe('0x123');
    });

    it('should handle valid addresses', () => {
      const result = toChecksumAddress('0x1234567890123456789012345678901234567890');
      expect(result.startsWith('0x')).toBe(true);
      expect(result.length).toBe(42);
    });
  });
});