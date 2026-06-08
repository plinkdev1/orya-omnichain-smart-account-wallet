/**
 * Cryptographic utilities for hashing, encryption, and random generation
 * Supports: Keccak256, SHA256, encryption, key generation
 * Week 1 Implementation
 */

/**
 * Generate cryptographic hash using Keccak256 (Ethereum standard)
 * @param data - String data to hash
 * @returns Hexadecimal hash string with 0x prefix
 * @throws Error if data is invalid
 */
export function keccak256(data: string): string {
  if (!data || typeof data !== 'string') {
    throw new Error('keccak256: input must be a non-empty string');
  }

  try {
    // Try to use @noble/hashes if available (Node.js environment)
    try {
      const { keccak_256 } = require('@noble/hashes/sha3');
      const bytes = new TextEncoder().encode(data);
      const hash = keccak_256(bytes);
      return '0x' + Buffer.from(hash).toString('hex');
    } catch {
      // Fallback: Try Node.js crypto module
      const crypto = require('crypto');
      
      // For Keccak256, we need keccak or use ethers.js if available
      try {
        const keccak = require('keccak');
        const hash = keccak('keccak256').update(data).digest('hex');
        return '0x' + hash;
      } catch {
        // Last resort: use SHA3-256 which is not exactly Keccak but close
        // In production, users should install @noble/hashes or ethers
        throw new Error(
          'keccak256 requires @noble/hashes or ethers.js. Install with: npm install @noble/hashes'
        );
      }
    }
  } catch (error) {
    throw new Error(
      `keccak256 failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Generate cryptographic hash using SHA256
 * @param data - String data to hash
 * @returns Hexadecimal hash string with 0x prefix
 * @throws Error if data is invalid or crypto module unavailable
 */
export function sha256(data: string): string {
  if (!data || typeof data !== 'string') {
    throw new Error('sha256: input must be a non-empty string');
  }

  try {
    // Try Node.js crypto module
    try {
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256').update(data).digest('hex');
      return '0x' + hash;
    } catch {
      // Try @noble/hashes
      const { sha256: nobleSha256 } = require('@noble/hashes/sha256');
      const bytes = new TextEncoder().encode(data);
      const hash = nobleSha256(bytes);
      return '0x' + Buffer.from(hash).toString('hex');
    }
  } catch (error) {
    throw new Error(
      `sha256 failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Generate cryptographically secure random bytes
 * @param length - Number of random bytes to generate
 * @returns Uint8Array of random bytes
 * @throws Error if length is invalid or crypto unavailable
 */
export function generateRandomBytes(length: number): Uint8Array {
  if (!Number.isInteger(length) || length <= 0) {
    throw new Error('generateRandomBytes: length must be a positive integer');
  }

  if (length > 65_536) {
    throw new Error('generateRandomBytes: maximum length is 65536 bytes');
  }

  try {
    // Node.js environment
    try {
      const crypto = require('crypto');
      return crypto.randomBytes(length);
    } catch {
      // Browser environment with crypto.getRandomValues
      if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
        const bytes = new Uint8Array(length);
        globalThis.crypto.getRandomValues(bytes);
        return bytes;
      }

      throw new Error(
        'generateRandomBytes: crypto API not available in this environment'
      );
    }
  } catch (error) {
    throw new Error(
      `generateRandomBytes failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Encrypt data using AES-256-GCM (authenticated encryption)
 * @param data - Plain text data to encrypt
 * @param key - Encryption key (should be 32 bytes / 256 bits)
 * @returns Encrypted data as hex string with IV and auth tag prepended
 * @throws Error if data invalid or crypto unavailable
 */
export function encryptData(data: string, key: string): string {
  if (!data || typeof data !== 'string') {
    throw new Error('encryptData: data must be a non-empty string');
  }

  if (!key || typeof key !== 'string') {
    throw new Error('encryptData: key must be a non-empty string');
  }

  try {
    const crypto = require('crypto');
    
    // Derive a proper key from the provided string
    const derivedKey = crypto
      .createHash('sha256')
      .update(key)
      .digest();

    // Generate random IV
    const iv = crypto.randomBytes(16);

    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);

    // Encrypt
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get auth tag
    const authTag = cipher.getAuthTag();

    // Combine: IV (32 hex chars) + authTag (32 hex chars) + encrypted
    return (
      iv.toString('hex') + authTag.toString('hex') + encrypted
    );
  } catch (error) {
    throw new Error(
      `encryptData failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Decrypt data encrypted with encryptData()
 * @param encrypted - Encrypted hex string (IV + authTag + ciphertext)
 * @param key - Encryption key (must match encryption key)
 * @returns Decrypted plain text
 * @throws Error if decryption fails or data invalid
 */
export function decryptData(encrypted: string, key: string): string {
  if (!encrypted || typeof encrypted !== 'string') {
    throw new Error('decryptData: encrypted must be a non-empty string');
  }

  if (!key || typeof key !== 'string') {
    throw new Error('decryptData: key must be a non-empty string');
  }

  if (encrypted.length < 64) {
    throw new Error('decryptData: encrypted data is too short (corrupted)');
  }

  try {
    const crypto = require('crypto');

    // Derive key from provided string
    const derivedKey = crypto
      .createHash('sha256')
      .update(key)
      .digest();

    // Extract IV, auth tag, and ciphertext
    const iv = Buffer.from(encrypted.slice(0, 32), 'hex');
    const authTag = Buffer.from(encrypted.slice(32, 64), 'hex');
    const ciphertext = encrypted.slice(64);

    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(
      `decryptData failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Generate a random hex string (useful for nonces, salts)
 * @param length - Number of bytes to generate (will be 2*length hex chars)
 * @returns Random hex string with 0x prefix
 */
export function generateRandomHex(length: number): string {
  try {
    const bytes = generateRandomBytes(length);
    return '0x' + Buffer.from(bytes).toString('hex');
  } catch (error) {
    throw new Error(
      `generateRandomHex failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Hash a password using bcrypt-style slow hashing (PBKDF2)
 * NOTE: This is not production-grade. For user passwords, use bcrypt.js or argon2
 * @param password - Password to hash
 * @param salt - Salt string (optional, will generate if not provided)
 * @returns Hash and salt combined as hex string
 */
export function hashPassword(password: string, salt?: string): string {
  if (!password || typeof password !== 'string') {
    throw new Error('hashPassword: password must be a non-empty string');
  }

  try {
    const crypto = require('crypto');
    
    // Generate salt if not provided
    const actualSalt = salt || crypto.randomBytes(32).toString('hex');
    
    // Use PBKDF2 with 100,000 iterations
    const hash = crypto.pbkdf2Sync(password, actualSalt, 100_000, 64, 'sha256');
    
    return actualSalt + ':' + hash.toString('hex');
  } catch (error) {
    throw new Error(
      `hashPassword failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Verify a password against a hash created with hashPassword()
 * @param password - Password to verify
 * @param hash - Hash string from hashPassword()
 * @returns true if password matches hash, false otherwise
 */
export function verifyPassword(password: string, hash: string): boolean {
  if (!password || typeof password !== 'string') return false;
  if (!hash || typeof hash !== 'string') return false;

  try {
    const [salt, hashHex] = hash.split(':');
    if (!salt || !hashHex) return false;

    const crypto = require('crypto');
    const computed = crypto.pbkdf2Sync(password, salt, 100_000, 64, 'sha256');
    
    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(hashHex, 'hex'),
      computed
    );
  } catch {
    return false;
  }
}