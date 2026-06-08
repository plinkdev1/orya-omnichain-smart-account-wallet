/**
 * Tests for amount utilities
 */
import {
    formatAmount,
    formatCrypto,
    fromWei,
    parseAmount,
    percentChange,
    toUSD,
    toWei,
} from '../amount';

describe('Amount Utilities', () => {
  describe('parseAmount', () => {
    it('should parse string amounts to BigInt', () => {
      expect(parseAmount('1', 18)).toBe(BigInt('1000000000000000000'));
      expect(parseAmount('1.5', 18)).toBe(BigInt('1500000000000000000'));
      expect(parseAmount('0.1', 6)).toBe(BigInt('100000'));
    });

    it('should handle edge cases', () => {
      expect(parseAmount('0', 18)).toBe(0n);
      expect(parseAmount('', 18)).toBe(0n);
      expect(parseAmount('.', 18)).toBe(0n);
      expect(parseAmount(null as any, 18)).toBe(0n);
    });

    it('should handle decimals correctly', () => {
      expect(parseAmount('0.123456789', 9)).toBe(BigInt('123456789'));
      expect(parseAmount('0.123456789123456789', 18)).toBe(
        BigInt('123456789123456789')
      );
    });
  });

  describe('formatAmount', () => {
    it('should format BigInt to readable strings', () => {
      expect(formatAmount(BigInt('1000000000000000000'), 18, 2)).toBe('1');
      expect(formatAmount(BigInt('1500000000000000000'), 18, 2)).toBe('1.5');
      expect(formatAmount(BigInt('100000'), 6, 2)).toBe('0.1');
    });

    it('should respect precision parameter', () => {
      expect(formatAmount(BigInt('1234567890000000000'), 18, 2)).toBe('1.23');
      expect(formatAmount(BigInt('1234567890000000000'), 18, 4)).toBe('1.2346');
    });

    it('should handle zero', () => {
      expect(formatAmount(0n, 18)).toBe('0');
    });

    it('should remove trailing zeros', () => {
      expect(formatAmount(BigInt('1000000000000000000'), 18)).toBe('1');
      expect(formatAmount(BigInt('1100000000000000000'), 18)).toBe('1.1');
    });
  });

  describe('formatCrypto', () => {
    it('should format amount with symbol', () => {
      expect(formatCrypto('1', 'ETH', 18, 2)).toBe('1 ETH');
      expect(formatCrypto('1.5', 'SUI', 9, 4)).toBe('1.5 SUI');
    });

    it('should handle invalid inputs', () => {
      expect(formatCrypto('', 'ETH')).toBe('0 ETH');
      expect(formatCrypto('1', '')).toBe('1');
      expect(formatCrypto(null as any, 'ETH')).toBe('0 ETH');
    });
  });

  describe('toWei', () => {
    it('should convert to wei', () => {
      expect(toWei(1, 18)).toBe(BigInt('1000000000000000000'));
      expect(toWei('1.5', 18)).toBe(BigInt('1500000000000000000'));
      expect(toWei(1, 6)).toBe(BigInt('1000000'));
    });
  });

  describe('fromWei', () => {
    it('should convert from wei', () => {
      expect(fromWei(BigInt('1000000000000000000'), 18)).toBe('1');
      expect(fromWei(BigInt('1500000000000000000'), 18)).toBe('1.5');
      expect(fromWei(BigInt('100000'), 6)).toBe('0.1');
    });
  });

  describe('toUSD', () => {
    it('should convert to USD value', () => {
      expect(toUSD(BigInt('1000000000000000000'), 2000, 18)).toBe(2000);
      expect(toUSD(BigInt('500000000000000000'), 2000, 18)).toBe(1000);
    });

    it('should handle zero amounts and prices', () => {
      expect(toUSD(0n, 2000, 18)).toBe(0);
      expect(toUSD(BigInt('1000000000000000000'), 0, 18)).toBe(0);
    });
  });

  describe('percentChange', () => {
    it('should calculate percentage change', () => {
      expect(percentChange(100, 110)).toBe(10);
      expect(percentChange(100, 90)).toBe(-10);
      expect(percentChange(100, 100)).toBe(0);
    });

    it('should handle zero before value', () => {
      expect(percentChange(0, 100)).toBe(0);
    });
  });
});