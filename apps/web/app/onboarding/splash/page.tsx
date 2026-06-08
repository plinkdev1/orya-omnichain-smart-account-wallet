'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';

export default function SplashScreen() {
  const router = useRouter();
  const { reset, setStep } = useOnboardingStore();

  useEffect(() => {
    reset();
    setStep(0);

    const timer = setTimeout(() => {
      setStep(1);
      router.push('/onboarding/wallet-type');
    }, 4000);

    return () => clearTimeout(timer);
  }, [router, reset, setStep]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
      {/* Animated background orbs */}
      <motion.div
        className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 100, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, -100, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* Logo animation */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <motion.div
            className="w-32 h-32 flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, ease: 'linear', repeat: Infinity }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400/30" />
              <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-500" />
              <text x="50" y="60" textAnchor="middle" fontSize="48" fill="currentColor" className="text-white font-bold">
                Ø
              </text>
            </svg>
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-6xl md:text-7xl font-bold text-white mb-4 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          ORŸA
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-2xl text-purple-300 mb-2 text-center font-light"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          The Future of Web3 Wallets
        </motion.p>

        {/* Tagline */}
        <motion.p
          className="text-lg text-purple-200/70 text-center mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          Multi-chain, Non-custodial, Secure
        </motion.p>

        {/* Loading dots */}
        <motion.div
          className="flex space-x-3 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-purple-400 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}