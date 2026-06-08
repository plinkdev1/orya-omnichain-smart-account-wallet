/**
 * Tests for formatting utilities
 */
import {
    abbreviateNumber,
    formatCurrency,
    formatDate,
    formatNumber,
    formatPercent,
    formatTime,
} from '../formatting';

describe('Formatting Utilities', () => {
  describe('formatCurrency', () => {
    it('should format numbers as currency', () => {
      const result = formatCurrency(1234.56, 'USD', 'en-US');
      expect(result).toContain('1,234');
      expect(result).toContain('56');
    });

    it('should use default currency', () => {
      const result = formatCurrency(100);
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle invalid inputs', () => {
      expect(formatCurrency(NaN)).toBe('$0.00');
      expect(formatCurrency(null as any)).toBe('$0.00');
    });
  });

  describe('formatPercent', () => {
    it('should format decimals as percentages', () => {
      expect(formatPercent(0.05)).toBe('5.00%');
      expect(formatPercent(0.1)).toBe('10.00%');
      expect(formatPercent(1)).toBe('100.00%');
    });

    it('should respect decimal places', () => {
      expect(formatPercent(0.055, 3)).toBe('5.500%');
      expect(formatPercent(0.055, 0)).toBe('6%');
    });

    it('should handle invalid inputs', () => {
      expect(formatPercent(NaN)).toBe('0.00%');
      expect(formatPercent(null as any)).toBe('0.00%');
    });
  });

  describe('formatDate', () => {
    it('should format timestamps as dates', () => {
      const timestamp = new Date('2024-01-15').getTime();
      const result = formatDate(timestamp, 'short');
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should accept seconds or milliseconds', () => {
      const ms = new Date('2024-01-15').getTime();
      const seconds = Math.floor(ms / 1000);
      
      const resultMs = formatDate(ms);
      const resultSeconds = formatDate(seconds);
      
      expect(resultMs).toBeDefined();
      expect(resultSeconds).toBeDefined();
    });

    it('should handle invalid inputs', () => {
      expect(formatDate(0)).toBe('');
      expect(formatDate(null as any)).toBe('');
    });
  });

  describe('formatTime', () => {
    it('should format timestamps as times', () => {
      const timestamp = new Date('2024-01-15T14:30:00').getTime();
      const result = formatTime(timestamp);
      expect(result).toBeDefined();
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('should optionally show seconds', () => {
      const timestamp = new Date('2024-01-15T14:30:45').getTime();
      const resultWithSeconds = formatTime(timestamp, true);
      expect(resultWithSeconds).toBeDefined();
    });

    it('should handle invalid inputs', () => {
      expect(formatTime(0)).toBe('');
      expect(formatTime(null as any)).toBe('');
    });
  });

  describe('abbreviateNumber', () => {
    it('should abbreviate large numbers', () => {
      expect(abbreviateNumber(1000)).toBe('1.00K');
      expect(abbreviateNumber(1000000)).toBe('1.00M');
      expect(abbreviateNumber(1000000000)).toBe('1.00B');
    });

    it('should handle decimals', () => {
      expect(abbreviateNumber(1500)).toBe('1.50K');
      expect(abbreviateNumber(1500000)).toBe('1.50M');
    });

    it('should respect decimal places parameter', () => {
      expect(abbreviateNumber(1550, 0)).toBe('2K');
      expect(abbreviateNumber(1550, 1)).toBe('1.6K');
      expect(abbreviateNumber(1550, 3)).toBe('1.550K');
    });

    it('should handle negative numbers', () => {
      expect(abbreviateNumber(-1000)).toBe('-1.00K');
      expect(abbreviateNumber(-1000000)).toBe('-1.00M');
    });

    it('should handle small numbers', () => {
      expect(abbreviateNumber(123)).toBe('123.00');
      expect(abbreviateNumber(100, 0)).toBe('100');
    });

    it('should handle invalid inputs', () => {
      expect(abbreviateNumber(NaN)).toBe('0');
      expect(abbreviateNumber(null as any)).toBe('0');
    });
  });

  describe('formatNumber', () => {
    it('should add thousands separators', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
    });

    it('should respect decimal places', () => {
      expect(formatNumber(1234.567, 2)).toBe('1,234.57');
      expect(formatNumber(1000.5, 1)).toBe('1,000.5');
    });

    it('should handle small numbers', () => {
      expect(formatNumber(100)).toBe('100');
      expect(formatNumber(99)).toBe('99');
    });

    it('should handle invalid inputs', () => {
      expect(formatNumber(NaN)).toBe('0');
      expect(formatNumber(null as any)).toBe('0');
    });
  });
});