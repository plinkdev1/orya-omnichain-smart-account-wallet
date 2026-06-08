/**
 * Formatting utilities for display and presentation
 * Week 1 Implementation
 */

/**
 * Format a number as currency
 * @param value - Numeric value to format
 * @param currency - Currency code (default: 'USD')
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted currency string (e.g., "$1,234.50")
 */
export function formatCurrency(
  value: number,
  currency: string = 'USD',
  locale: string = 'en-US',
): string {
  if (typeof value !== 'number' || isNaN(value)) return '$0.00';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    // Fallback if Intl not available
    return `$${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }
}

/**
 * Format a number as percentage
 * @param value - Numeric value (0.05 = 5%)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string (e.g., "5.00%")
 */
export function formatPercent(value: number, decimals: number = 2): string {
  if (typeof value !== 'number' || isNaN(value)) return '0.00%';

  try {
    const percentage = (value * 100).toFixed(decimals);
    return `${percentage}%`;
  } catch {
    return '0.00%';
  }
}

/**
 * Format a Unix timestamp as readable date
 * @param timestamp - Unix timestamp in milliseconds (or seconds)
 * @param format - Format style ('short', 'long', 'medium' - default: 'short')
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted date string
 */
export function formatDate(
  timestamp: number,
  format: 'short' | 'long' | 'medium' = 'short',
  locale: string = 'en-US',
): string {
  if (typeof timestamp !== 'number' || timestamp === 0) return '';

  try {
    // Assume milliseconds if over 10 billion, otherwise seconds
    const date = new Date(timestamp > 10_000_000_000 ? timestamp : timestamp * 1000);

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: format === 'long' ? 'long' : 'short',
      day: 'numeric',
    };

    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch {
    return new Date(timestamp).toLocaleDateString();
  }
}

/**
 * Format a Unix timestamp as readable time
 * @param timestamp - Unix timestamp in milliseconds (or seconds)
 * @param showSeconds - Include seconds in output (default: false)
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted time string
 */
export function formatTime(
  timestamp: number,
  showSeconds: boolean = false,
  locale: string = 'en-US',
): string {
  if (typeof timestamp !== 'number' || timestamp === 0) return '';

  try {
    // Assume milliseconds if over 10 billion, otherwise seconds
    const date = new Date(timestamp > 10_000_000_000 ? timestamp : timestamp * 1000);

    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
    };

    if (showSeconds) {
      options.second = '2-digit';
    }

    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch {
    return new Date(timestamp).toLocaleTimeString();
  }
}

/**
 * Abbreviate large numbers for display
 * @param value - Number to abbreviate
 * @param decimals - Number of decimal places (default: 2)
 * @returns Abbreviated string (e.g., "1.2M", "500K")
 */
export function abbreviateNumber(value: number, decimals: number = 2): string {
  if (typeof value !== 'number' || isNaN(value)) return '0';

  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (abs >= 1_000_000_000) {
    return sign + (abs / 1_000_000_000).toFixed(decimals) + 'B';
  }

  if (abs >= 1_000_000) {
    return sign + (abs / 1_000_000).toFixed(decimals) + 'M';
  }

  if (abs >= 1_000) {
    return sign + (abs / 1_000).toFixed(decimals) + 'K';
  }

  return sign + abs.toFixed(decimals);
}

/**
 * Format a number with thousands separator
 * @param value - Number to format
 * @param decimals - Number of decimal places
 * @returns Formatted number string
 */
export function formatNumber(value: number, decimals?: number): string {
  if (typeof value !== 'number' || isNaN(value)) return '0';

  if (decimals !== undefined) {
    return value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
