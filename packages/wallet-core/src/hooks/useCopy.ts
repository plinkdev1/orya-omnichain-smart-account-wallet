/**
 * React Hook: Clipboard Copy
 * Provides clipboard copy functionality with feedback
 */

import { useCallback, useState } from 'react';

export interface UseCopyReturn {
  isCopied: boolean;
  copy: (text: string) => Promise<void>;
}

/**
 * useCopy Hook
 * Copies text to clipboard and provides feedback
 * @example
 * const { isCopied, copy } = useCopy();
 * return <button onClick={() => copy('text')}>
 *   {isCopied ? 'Copied!' : 'Copy'}
 * </button>;
 */
export function useCopy(): UseCopyReturn {
  const [isCopied, setIsCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } else {
        // Fallback for environments without clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      setIsCopied(false);
    }
  }, []);

  return { isCopied, copy };
}