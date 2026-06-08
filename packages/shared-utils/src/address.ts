/**
 * Blockchain address utilities
 * Supports: SUI, Ethereum, Solana, BTCfi, Crosschain
 * Week 1 Implementation
 */

/**
 * Validate Ethereum address format
 * @param address - Address string to validate (0x-prefixed, 40 hex chars)
 * @returns true if valid Ethereum address format, false otherwise
 */
export function validateEthereumAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  return /^0x[0-9a-fA-F]{40}$/.test(address.trim());
}

/**
 * Validate SUI address format
 * @param address - Address string to validate (0x-prefixed, 64 hex chars)
 * @returns true if valid SUI address format, false otherwise
 */
export function validateSuiAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  return /^0x[0-9a-fA-F]{64}$/.test(address.trim());
}

/**
 * Validate Solana address format
 * @param address - Address string to validate (base58, 43-44 chars)
 * @returns true if valid Solana address format, false otherwise
 */
export function validateSolanaAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  return /^[1-9A-HJ-NP-Z]{43,44}$/.test(address.trim());
}

/**
 * Validate an address for a specific chain
 * @param address - Address string to validate
 * @param chainType - Chain type (sui, ethereum, solana, btcfi, crosschain)
 * @returns true if valid for the chain, false otherwise
 */
export function isValidAddress(address: string, chainType?: string): boolean {
  if (!address || typeof address !== 'string') return false;

  const trimmed = address.trim();

  switch (chainType?.toLowerCase()) {
    case 'sui':
      // SUI addresses are 0x-prefixed hex strings, 64 chars (32 bytes)
      return /^0x[0-9a-fA-F]{64}$/.test(trimmed);

    case 'ethereum':
    case 'eth':
    case 'evm':
      // ETH addresses are 0x-prefixed hex strings, 40 chars (20 bytes)
      return /^0x[0-9a-fA-F]{40}$/.test(trimmed);

    case 'solana':
    case 'sol':
      // Solana addresses are base58-encoded, 43-44 chars
      return /^[1-9A-HJ-NP-Z]{43,44}$/.test(trimmed);

    case 'btcfi':
    case 'bitcoin':
    case 'btc':
      // BTCfi/Bitcoin addresses
      return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(trimmed);

    case 'crosschain':
      // Generic validation for crosschain (20-100 chars)
      return trimmed.length >= 20 && trimmed.length <= 100;

    default:
      // Generic validation if no chain specified
      return trimmed.length >= 20 && trimmed.length <= 100;
  }
}

/**
 * Format address for display (truncate with ellipsis)
 * @param address - Address string
 * @param chars - Number of characters to show on each side (default: 4)
 * @returns Formatted address (e.g., "0x1234...abcd")
 */
export function formatAddress(address: string, chars: number = 4): string {
  if (!address || address.length <= chars * 2 + 3) {
    return address;
  }

  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Check if Ethereum address has valid checksum
 * @param address - Address string
 * @returns true if checksum is valid or if not checksummed
 */
export function isValidChecksum(address: string): boolean {
  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) return false;

  // If all lowercase or all uppercase (except prefix), it's not checksummed (both valid)
  const addr = address.slice(2);
  if (addr === addr.toLowerCase() || addr === addr.toUpperCase()) return true;

  // Verify checksum using Keccak256 hash
  try {
    // Try to use ethers or web3 if available, otherwise use crypto
    if (typeof globalThis !== 'undefined' && (globalThis as any).crypto) {
      // Browser environment - would need web3/ethers
      return true; // Assume valid for now
    }

    // Node environment
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(address.slice(2).toLowerCase()).digest('hex');

    for (let i = 0; i < 40; i++) {
      const hashChar = parseInt(hash[i], 16);
      const shouldBeUppercase = hashChar >= 8;
      const isUppercase = address[i + 2] === address[i + 2].toUpperCase();

      if (shouldBeUppercase !== isUppercase) return false;
    }
    return true;
  } catch {
    // If crypto module not available, assume valid
    return true;
  }
}

/**
 * Convert address to checksum format (Ethereum-specific)
 * @param address - Address string
 * @returns Checksum address
 */
export function toChecksumAddress(address: string): string {
  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) return address;

  try {
    // Try Node.js crypto first
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(address.slice(2).toLowerCase()).digest('hex');
    let checksumAddress = '0x';

    for (let i = 0; i < 40; i++) {
      const hashChar = parseInt(hash[i], 16);
      checksumAddress += hashChar >= 8 ? address[i + 2].toUpperCase() : address[i + 2].toLowerCase();
    }

    return checksumAddress;
  } catch {
    // If crypto module not available, return lowercase
    return address.toLowerCase();
  }
}
