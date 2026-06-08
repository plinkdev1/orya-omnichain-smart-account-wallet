/**
 * Recovery Phrase Generator Hook
 * Generates and manages 12-word BIP39 recovery phrases
 *
 * Note: This is a mock implementation for prototyping.
 * Production should use:
 * - ethers.js or @noble/hashes for actual BIP39
 * - Tatum SDK for enterprise-grade key management
 * - Hardware wallet integration for security
 */

import { useCallback } from 'react';

// Mock BIP39 wordlist (subset for demo - production should use full 2048 word list)
const MOCK_WORDLIST = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'abuse',
  'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire',
  'across', 'act', 'action', 'actor', 'actual', 'add', 'addict', 'adding', 'address',
  'adjust', 'admit', 'admittance', 'adult', 'advance', 'advent', 'adventure', 'adverse',
  'advertise', 'advice', 'advise', 'advocate', 'affair', 'afford', 'afraid', 'after',
  'again', 'against', 'age', 'agent', 'agree', 'ahead', 'aim', 'air', 'airport', 'aisle',
  'alarm', 'album', 'alert', 'alien', 'align', 'alike', 'alive', 'all', 'allege',
  'alliance', 'allied', 'allocate', 'allow', 'alloy', 'almost', 'alone', 'along',
  'already', 'also', 'altar', 'alter', 'always', 'amateur', 'amaze', 'ambient',
  'ambiguity', 'ambiguous', 'ambition', 'ambitious', 'ambush', 'amend', 'amendment',
  'amenity', 'among', 'amongst', 'amount', 'amounted', 'amounting', 'amounts', 'ample',
  'amplifier', 'amused', 'amusement', 'amusing', 'an', 'ana', 'analog', 'analogue',
  'analyse', 'analysis', 'analyze', 'ancestor', 'ancestral', 'ancestry', 'anchor',
  'ancient', 'and', 'androgen', 'anew', 'angel', 'angelic', 'anger', 'angle', 'angled',
  'angles', 'anglicanism', 'anglicise', 'anglicism', 'anglicize', 'anglo', 'angolan',
  'angrily', 'angry', 'angst', 'anguish', 'angular', 'angulation', 'anhydride', 'anhydrite',
];

export interface RecoveryPhraseGeneratorResult {
  phrase: string;
  words: string[];
  randomIndices: number[];
}

export const useRecoveryPhraseGenerator = () => {
  /**
   * Generate a random 12-word recovery phrase
   * Uses mock wordlist - production should use full BIP39 wordlist
   */
  const generatePhrase = useCallback((): RecoveryPhraseGeneratorResult => {
    const words: string[] = [];
    const randomIndices: number[] = [];

    for (let i = 0; i < 12; i++) {
      const randomIndex = Math.floor(Math.random() * MOCK_WORDLIST.length);
      randomIndices.push(randomIndex);
      words.push(MOCK_WORDLIST[randomIndex]);
    }

    return {
      phrase: words.join(' '),
      words,
      randomIndices,
    };
  }, []);

  /**
   * Get a specific word from the wordlist (for verification)
   */
  const getWord = useCallback(
    (index: number): string | null => {
      return MOCK_WORDLIST[index] ?? null;
    },
    []
  );

  /**
   * Verify if a word is in the wordlist
   */
  const isValidWord = useCallback(
    (word: string): boolean => {
      return MOCK_WORDLIST.includes(word.toLowerCase());
    },
    []
  );

  /**
   * Verify recovery phrase format (12 words, all valid)
   */
  const verifyPhrase = useCallback(
    (phrase: string): {
      isValid: boolean;
      words: string[];
      errors: string[];
    } => {
      const words = phrase.trim().toLowerCase().split(/\s+/);
      const errors: string[] = [];

      if (words.length !== 12) {
        errors.push(`Expected 12 words, got ${words.length}`);
      }

      const invalidWords = words.filter((word) => !MOCK_WORDLIST.includes(word));
      if (invalidWords.length > 0) {
        errors.push(`Invalid words: ${invalidWords.join(', ')}`);
      }

      return {
        isValid: errors.length === 0,
        words,
        errors,
      };
    },
    []
  );

  /**
   * Extract words at specific positions for verification quiz
   */
  const getVerificationQuizWords = useCallback(
    (phrase: string, count: number = 3): Array<{
      position: number;
      word: string;
      options: string[];
    }> => {
      const words = phrase.trim().split(/\s+/);

      // Pick random positions from the phrase
      const positions: number[] = [];
      while (positions.length < count && positions.length < words.length) {
        const pos = Math.floor(Math.random() * 12);
        if (!positions.includes(pos)) {
          positions.push(pos);
        }
      }

      // For each position, create quiz with correct answer + 2 random alternatives
      return positions.map((pos) => {
        const correctWord = words[pos];
        const options: string[] = [correctWord];

        // Add 2 random alternative words
        while (options.length < 3) {
          const randomWord =
            MOCK_WORDLIST[Math.floor(Math.random() * MOCK_WORDLIST.length)];
          if (!options.includes(randomWord)) {
            options.push(randomWord);
          }
        }

        // Shuffle options
        options.sort(() => Math.random() - 0.5);

        return {
          position: pos + 1, // 1-indexed for display
          word: correctWord,
          options,
        };
      });
    },
    []
  );

  return {
    generatePhrase,
    getWord,
    isValidWord,
    verifyPhrase,
    getVerificationQuizWords,
  };
};