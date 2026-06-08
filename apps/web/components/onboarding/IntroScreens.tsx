'use client';

import { motion } from 'framer-motion';
import { ChevronRight, X, Wallet, Zap, Shield, TrendingUp, Sparkles } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';

interface IntroScreen {
  id: string;
  title: string;
  description: string;
  visual: () => React.ReactNode;
}

const SCREENS: IntroScreen[] = [
  {
    id: 'welcome',
    title: 'Welcome to ORŸA',
    description: 'Your gateway to Web3 starts here',
    visual: () => (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex items-center justify-center"
      >
        <div className="relative w-32 h-32">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pale-gold/20 to-neon-gold/20 blur-2xl dark:from-neon-gold/20 dark:to-pale-gold/20" />
          <div className="absolute inset-0 rounded-full border-2 border-pale-gold/30 dark:border-neon-gold/30" />
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl font-bold text-pale-gold dark:text-neon-gold">◇</span>
          </div>
        </div>
      </motion.div>
    ),
  },
  {
    id: 'finance',
    title: 'Control Your Finance Future',
    description: 'Manage tokens, swaps, and rewards seamlessly',
    visual: () => (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full"
      >
        <div className="grid grid-cols-3 gap-4 px-4">
          {[
            { icon: Wallet, label: 'Wallet' },
            { icon: Zap, label: 'Fast' },
            { icon: Shield, label: 'Secure' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1, ease: 'easeOut' }}
                className="bg-gradient-to-br from-pale-gold/10 to-neon-gold/10 dark:from-neon-gold/10 dark:to-pale-gold/10 rounded-2xl p-6 flex flex-col items-center justify-center border border-pale-gold/20 dark:border-neon-gold/20"
              >
                <Icon size={32} className="mb-2 text-pale-gold dark:text-neon-gold" />
                <span className="text-sm font-semibold text-deep-charcoal dark:text-bone-white text-center">
                  {item.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    ),
  },
  {
    id: 'sui',
    title: 'Fast, Secure, SUI-first',
    description: 'Lightning-fast transactions, military-grade security',
    visual: () => (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex items-center justify-center"
      >
        <div className="relative w-40 h-40">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pale-gold/30 to-transparent blur-3xl dark:from-neon-gold/30" />
          <div className="w-full h-full flex items-center justify-center rounded-full border-2 border-pale-gold/40 dark:border-neon-gold/40">
            <span className="text-6xl font-bold text-pale-gold dark:text-neon-gold">◆</span>
          </div>
        </div>
      </motion.div>
    ),
  },
  {
    id: 'modes',
    title: 'Start Simple or Unlock Advanced Control',
    description: 'Choose your level: Beginner to Power User',
    visual: () => (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full px-4 space-y-3"
      >
        {[
          { label: 'Simple Wallet', icon: '◈' },
          { label: 'Next-gen Web3', icon: '◆' },
          { label: 'I have a wallet', icon: '○' },
        ].map((btn, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: idx * 0.1, ease: 'easeOut' }}
            className="flex items-center gap-3 bg-gradient-to-r from-pale-gold/5 to-neon-gold/5 dark:from-neon-gold/5 dark:to-pale-gold/5 rounded-xl p-4 border border-pale-gold/20 dark:border-neon-gold/20"
          >
            <span className="text-xl text-neon-gold dark:text-pale-gold">{btn.icon}</span>
            <span className="text-base font-semibold text-deep-charcoal dark:text-bone-white flex-1">
              {btn.label}
            </span>
            <span className="text-sm text-pale-gold dark:text-neon-gold">→</span>
          </motion.div>
        ))}
      </motion.div>
    ),
  },
  {
    id: 'grow',
    title: 'Learn How ORŸA Grows With You',
    description: 'From simple payments to advanced DeFi',
    visual: () => (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full h-64 flex items-center justify-center"
      >
        <div className="w-full h-full bg-gradient-to-br from-pale-gold/20 via-neon-gold/5 to-transparent dark:from-neon-gold/20 dark:via-pale-gold/5 rounded-3xl flex flex-row items-center justify-center gap-6">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles size={48} className="text-pale-gold dark:text-neon-gold" />
          </motion.div>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
          >
            <TrendingUp size={48} className="text-neon-gold dark:text-pale-gold" />
          </motion.div>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
          >
            <Wallet size={48} className="text-pale-gold dark:text-neon-gold" />
          </motion.div>
        </div>
      </motion.div>
    ),
  },
];

interface IntroScreensProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export const IntroScreens = ({ onComplete, onSkip }: IntroScreensProps) => {
  const [currentScreen, setCurrentScreen] = useState(0);

  const handleNext = useCallback(() => {
    if (currentScreen < SCREENS.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      onComplete();
    }
  }, [currentScreen, onComplete]);

  const handlePrevious = useCallback(() => {
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    }
  }, [currentScreen]);

  const handleSkip = useCallback(() => {
    onSkip?.();
  }, [onSkip]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'Escape') {
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrevious, handleSkip]);

  const screen = SCREENS[currentScreen];
  const Visual = screen.visual;

  return (
    <div className="min-h-screen bg-bone-white dark:bg-deep-charcoal flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 flex justify-between items-center border-b border-pale-gold/10 dark:border-neon-gold/10">
        <div className="w-8" />
        
        {/* Progress Dots */}
        <div className="flex justify-center gap-2">
          {SCREENS.map((_, idx) => (
            <motion.button
              key={idx}
              onClick={() => setCurrentScreen(idx)}
              className={`rounded-full transition-all ${
                idx === currentScreen
                  ? 'w-8 h-2.5 bg-pale-gold dark:bg-neon-gold'
                  : 'w-2.5 h-2.5 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
              whileHover={{ scale: 1.2 }}
              aria-label={`Go to screen ${idx + 1}`}
            />
          ))}
        </div>

        {/* Skip Button */}
        <button
          onClick={handleSkip}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          aria-label="Skip intro"
        >
          <X size={24} className="text-pale-gold dark:text-neon-gold" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-4xl">
          {/* Visual Content */}
          <div className="mb-12 flex justify-center">
            <motion.div
              key={screen.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Visual />
            </motion.div>
          </div>

          {/* Text Content */}
          <motion.div
            key={`text-${screen.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-deep-charcoal dark:text-bone-white mb-4 leading-tight">
              {screen.title}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              {screen.description}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="px-6 py-8 border-t border-pale-gold/10 dark:border-neon-gold/10">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Next/Get Started Button */}
          <motion.button
            onClick={handleNext}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pale-gold to-neon-gold dark:from-neon-gold dark:to-pale-gold text-deep-charcoal dark:text-bone-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>
              {currentScreen === SCREENS.length - 1 ? 'Get Started' : 'Next'}
            </span>
            <ChevronRight size={20} />
          </motion.button>

          {/* Back Button */}
          {currentScreen > 0 && (
            <motion.button
              onClick={handlePrevious}
              className="w-full py-3 px-6 rounded-2xl border-2 border-pale-gold dark:border-neon-gold text-pale-gold dark:text-neon-gold font-semibold hover:bg-pale-gold/5 dark:hover:bg-neon-gold/5 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Back
            </motion.button>
          )}
        </div>

        {/* Navigation Info */}
        <div className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
          <p>Screen {currentScreen + 1} of {SCREENS.length}</p>
          <p className="text-xs mt-2">Use arrow keys or click dots to navigate • Press ESC to skip</p>
        </div>
      </div>
    </div>
  );
};
