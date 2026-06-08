/**
 * Amount/number utilities for token amounts, decimals, conversions
 * Week 1 Implementation
 */

/**
 * Parse a string amount to BigInt with decimal handling
 * @param value - String representation of amount (e.g., "1.5")
 * @param decimals - Number of decimal places (default: 18 for most tokens)
 * @returns BigInt representation (e.g., "1500000000000000000")
 */
export function parseAmount(value: string, decimals: number = 18): bigint {
  if (!value || typeof value !== 'string') return 0n;

  const trimmed = value.trim();
  if (trimmed === '' || trimmed === '.') return 0n;

  try {
    // Split by decimal point
    const parts = trimmed.split('.');
    const integerPart = parts[0] || '0';
    const decimalPart = (parts[1] || '').padEnd(decimals, '0').slice(0, decimals);

    // Combine and convert to BigInt
    const combined = integerPart + decimalPart;
    return BigInt(combined);
  } catch {
    return 0n;
  }
}

/**
 * Format a BigInt amount to string with decimals
 * @param value - BigInt amount in smallest units (e.g., wei)
 * @param decimals - Number of decimal places (default: 18)
 * @param precision - Number of decimal places to display (default: 2)
 * @returns Formatted string (e.g., "1.50")
 */
export function formatAmount(
  value: bigint,
  decimals: number = 18,
  precision: number = 2,
): string {
  if (value === 0n) return '0';

  try {
    const valueStr = value.toString().padStart(decimals + 1, '0');
    const integerLength = valueStr.length - decimals;

    const integerPart = valueStr.slice(0, integerLength) || '0';
    const decimalPart = valueStr.slice(integerLength);

    // Format with precision
    const formatted = integerPart + '.' + decimalPart.slice(0, precision).padEnd(precision, '0');

    // Remove trailing zeros and decimal point if not needed
    return formatted.replace(/\.?0+$/, '');
  } catch {
    return '0';
  }
}

/**
 * Convert BigInt amount to USD value
 * @param amount - BigInt amount in smallest units
 * @param price - Price per token in USD
 * @param decimals - Number of decimal places (default: 18)
 * @returns USD value as number
 */
export function toUSD(amount: bigint, price: number, decimals: number = 18): number {
  if (amount === 0n || price === 0) return 0;

  try {
    const amountInTokens = Number(amount) / Math.pow(10, decimals);
    return amountInTokens * price;
  } catch {
    return 0;
  }
}

/**
 * Calculate percentage change between two values
 * @param before - Previous value
 * @param after - Current value
 * @returns Percentage change (e.g., 10 for +10%, -5 for -5%)
 */
export function percentChange(before: number, after: number): number {
  if (before === 0) return 0;

  try {
    return ((after - before) / before) * 100;
  } catch {
    return 0;
  }
}

/**
 * Convert amount to wei (multiply by 10^decimals)
 * @param amount - Amount as number or string
 * @param decimals - Number of decimal places (default: 18)
 * @returns BigInt in wei
 */
export function toWei(amount: number | string, decimals: number = 18): bigint {
  return parseAmount(String(amount), decimals);
}

/**
 * Convert amount from wei (divide by 10^decimals)
 * @param amount - Amount as BigInt in wei
 * @param decimals - Number of decimal places (default: 18)
 * @returns Formatted string representation
 */
export function fromWei(amount: bigint, decimals: number = 18): string {
  return formatAmount(amount, decimals);
}

/**
 * Format a cryptocurrency amount with symbol
 * @param amount - Amount string (e.g., "1.5")
 * @param symbol - Token symbol (e.g., "ETH", "SUI", "USDC")
 * @param decimals - Number of decimal places (default: 18)
 * @param precision - Decimal places to display (default: 4)
 * @returns Formatted string (e.g., "1.5 ETH")
 */
export function formatCrypto(
  amount: string,
  symbol: string,
  decimals: number = 18,
  precision: number = 4,
): string {
  if (!amount || typeof amount !== 'string') return `0 ${symbol}`;
  if (!symbol || typeof symbol !== 'string') return amount;

  try {
    const parsed = parseAmount(amount, decimals);
    const formatted = formatAmount(parsed, decimals, precision);
    return `${formatted} ${symbol}`;
  } catch {
    return `0 ${symbol}`;
  }
}
