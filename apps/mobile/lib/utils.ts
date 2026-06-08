/**
 * Shared utility functions for ORŸA Mobile
 * 
 * Formatting and validation imports from shared packages:
 * - @orya/shared-utils/formatting: formatNumber, formatCurrency, formatDate
 * - @orya/shared-utils/address: isValidAddress, shortenAddress (via address module)
 */

// Re-export commonly used functions from shared packages
export {
    abbreviateNumber, formatCurrency,
    formatDate,
    formatNumber, formatPercent,
    formatTime
} from '@orya/shared-utils/formatting';

// Note: isValidAddress is available in shared-utils but uses EVM format
// For other chain types, use the chain-specific validators
export { isValidAddress } from '@orya/shared-utils/address';

/**
 * Shorten wallet address
 * Mobile-specific utility for display
 * @example shortenAddress('0x1234567890123456789012345678901234567890') => "0x12...7890"
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return ''
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

/**
 * Convert Wei to Ether (mobile-specific, blockchain utility)
 */
export function weiToEther(wei: string | number): string {
  const weiNum = typeof wei === 'string' ? parseFloat(wei) : wei
  return (weiNum / 1e18).toFixed(4)
}

/**
 * Convert Ether to Wei (mobile-specific, blockchain utility)
 */
export function etherToWei(ether: string | number): string {
  const etherNum = typeof ether === 'string' ? parseFloat(ether) : ether
  return (etherNum * 1e18).toFixed(0)
}

/**
 * Format time difference (e.g., "2 hours ago")
 */
export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return formatDate(timestamp)
}

/**
 * Generate random color for avatar
 */
export function generateAvatarColor(seed: string): string {
  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FFA07A',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E2',
  ]
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastFunc: NodeJS.Timeout
  let lastRan: number
  return function executedFunction(...args: Parameters<T>) {
    if (!lastRan) {
      func(...args)
      lastRan = Date.now()
    } else {
      clearTimeout(lastFunc)
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func(...args)
          lastRan = Date.now()
        }
      }, limit - (Date.now() - lastRan))
    }
  }
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

/**
 * Generate UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)))
      }
    }
  }

  throw lastError
}