/**
 * @orya/shared-utils - Platform-agnostic utilities
 * 
 * Exports:
 * - Address utilities (validation, formatting, checksums)
 * - Amount utilities (decimals, parsing, formatting, conversions)
 * - Formatting utilities (currency, date, time, percentages)
 * - Validation utilities (email, password, URL, hex, etc.)
 * - Crypto utilities (hashing, encryption, random generation)
 * - Storage utilities (high-level persistent storage API)
 */

// Address utilities
export {
    formatAddress, isValidAddress, isValidChecksum,
    toChecksumAddress, validateEthereumAddress, validateSolanaAddress, validateSuiAddress
} from './address';

// Amount utilities
export {
    formatAmount, formatCrypto, fromWei, parseAmount, percentChange, toUSD, toWei
} from './amount';

// Formatting utilities
export {
    abbreviateNumber, formatCurrency, formatDate, formatNumber, formatPercent, formatTime
} from './formatting';

// Validation utilities
export {
    isAlphanumeric, isInRange, isValidEmail, isValidHexColor, isValidLength, isValidPassword, isValidUrl, sanitizeInput, validatePrivateKey, validateRecoveryPhrase
} from './validation';

// Crypto utilities
export {
    decryptData, encryptData, generateRandomBytes, generateRandomHex, hashPassword, keccak256, sha256, verifyPassword
} from './crypto';

// Storage utilities
export {
    clearStorage, getStorageItem, getStorageJSON, getStorageKeys, hasStorageItem, removeStorageItem, setStorageItem, setStorageJSON, type StorageOptions
} from './storage';

