/**
 * Input validation utilities
 * Week 1 Implementation
 */

/**
 * Validate email format
 * @param email - Email string to validate
 * @returns true if valid email format, false otherwise
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;

  // RFC 5322 simplified pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email.trim());
}

/**
 * Validate password strength with detailed error reporting
 * Requires: 8+ chars, uppercase, lowercase, number, special char
 * @param password - Password string to validate
 * @returns Object with valid boolean and array of error messages
 */
export function isValidPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password must be a non-empty string'] };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-={};':"\\|,.<>/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate BIP39 recovery phrase (mnemonic)
 * Checks for 12 or 24 words separated by spaces
 * @param phrase - Recovery phrase string
 * @returns true if valid recovery phrase format, false otherwise
 */
export function validateRecoveryPhrase(phrase: string): boolean {
  if (!phrase || typeof phrase !== 'string') return false;

  const trimmed = phrase.trim();
  const words = trimmed.split(/\s+/);

  // Valid BIP39 mnemonics are 12, 15, 18, 21, or 24 words
  const validLengths = [12, 15, 18, 21, 24];
  if (!validLengths.includes(words.length)) return false;

  // Check each word is alphabetic
  const validWordPattern = /^[a-z]+$/i;
  return words.every((word) => validWordPattern.test(word) && word.length > 2);
}

/**
 * Validate private key format (hex string, 32 bytes)
 * Supports with or without 0x prefix
 * @param key - Private key string
 * @returns true if valid private key format, false otherwise
 */
export function validatePrivateKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;

  const trimmed = key.trim();

  // Remove 0x prefix if present
  const hexString = trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed;

  // Private key should be 64 hex characters (32 bytes)
  if (!/^[0-9a-fA-F]{64}$/.test(hexString)) return false;

  // Additional check: not all zeros (invalid private key)
  if (/^0+$/.test(hexString)) return false;

  // Additional check: not all ones (invalid private key)
  if (/^f+$/i.test(hexString)) return false;

  return true;
}

/**
 * Sanitize user input to prevent XSS attacks
 * @param input - String to sanitize
 * @returns Sanitized string with HTML entities escaped
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate URL format
 * @param url - URL string to validate
 * @returns true if valid URL format, false otherwise
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate if string is a valid hexadecimal color
 * @param color - Color string (e.g., "#FF5733" or "FF5733")
 * @returns true if valid hex color, false otherwise
 */
export function isValidHexColor(color: string): boolean {
  if (!color || typeof color !== 'string') return false;

  const hexPattern = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexPattern.test(color);
}

/**
 * Validate if number is within range
 * @param value - Number to validate
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns true if value is within range, false otherwise
 */
export function isInRange(value: number, min: number, max: number): boolean {
  if (typeof value !== 'number' || isNaN(value)) return false;
  return value >= min && value <= max;
}

/**
 * Validate string length
 * @param value - String to validate
 * @param minLength - Minimum length (default: 0)
 * @param maxLength - Maximum length (default: Infinity)
 * @returns true if within length range, false otherwise
 */
export function isValidLength(
  value: string,
  minLength: number = 0,
  maxLength: number = Infinity,
): boolean {
  if (!value || typeof value !== 'string') return minLength === 0;
  return value.length >= minLength && value.length <= maxLength;
}

/**
 * Validate that a string contains only alphanumeric characters
 * @param value - String to validate
 * @returns true if alphanumeric only, false otherwise
 */
export function isAlphanumeric(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  return /^[a-zA-Z0-9]+$/.test(value);
}
