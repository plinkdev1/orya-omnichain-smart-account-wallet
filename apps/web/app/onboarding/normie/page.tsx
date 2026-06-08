'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useOnboardingStore } from '@/lib/onboarding-store';
import { Shield, Zap, Gift, ArrowRight, Loader2 } from 'lucide-react';

type AuthStep = 'options' | 'loading' | 'success';

export default function NormieOnboarding() {
  const router = useRouter();
  const { login, user, authenticated, isReady } = usePrivy();
  const { setEmail, setDisplayName, setWalletAddress, setWalletCreated, setStep, setAuthenticated } = useOnboardingStore();
  const [authStep, setAuthStep] = useState<AuthStep>('options');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) return;

    if (authenticated && user) {
      setAuthStep('success');
      
      const email = user.email?.address || '';
      const displayName = user.email?.address?.split('@')[0] || 'User';
      const walletAddress = user.wallet?.address || '';

      setEmail(email);
      setDisplayName(displayName);
      if (walletAddress) {
        setWalletAddress(walletAddress);
        setWalletCreated(true);
      }
      setAuthenticated(true, 'privy');
      setStep(3);

      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [authenticated, user, isReady, router, setEmail, setDisplayName, setWalletAddress, setWalletCreated, setStep, setAuthenticated]);

  const handleLogin = async (method: 'email' | 'google' | 'apple' | 'twitter') => {
    try {
      setAuthStep('loading');
      setError(null);
      await login();
    } catch (err) {
      setAuthStep('options');
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-6">
            <Zap className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            Create Your Wallet
          </h1>
          <p className="text-lg text-purple-300">
            Quick, simple, and secure. No seed phrases needed.
          </p>
        </motion.div>

        {/* Main content */}
        {authStep === 'options' && (
          <motion.div
            className="bg-slate-900/50 backdrop-blur rounded-2xl border border-purple-500/20 p-8 mb-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Features */}
            <motion.div
              className="grid grid-cols-3 gap-4 mb-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {[
                { icon: Shield, label: 'Secure', desc: 'Enterprise security' },
                { icon: Zap, label: 'Instant', desc: 'No delays' },
                { icon: Gift, label: 'Free', desc: 'No setup fees' },
              ].map((feature, idx) => (
                <motion.div key={idx} variants={itemVariants} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-500/20 rounded-lg mb-2 mx-auto">
                    <feature.icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="text-sm font-semibold text-white">{feature.label}</div>
                  <div className="text-xs text-purple-300/60">{feature.desc}</div>
                </motion.div>
              ))}
            </motion.div>

            {/* Login Buttons */}
            <motion.div
              className="space-y-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.button
                variants={itemVariants}
                onClick={() => handleLogin('google')}
                className="w-full py-3 px-4 bg-white text-slate-900 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </motion.button>

              <motion.button
                variants={itemVariants}
                onClick={() => handleLogin('apple')}
                className="w-full py-3 px-4 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-all duration-300 border border-purple-500/30 flex items-center justify-center gap-2 group"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.05 13.5c-.1-2.5 2.05-3.74 2.15-3.8-.92-1.35-2.36-1.54-2.87-1.56-.88-.12-1.72.54-2.16.54-.44 0-1.14-.53-1.89-.52-1.18.01-2.27.75-2.87 1.87-1.32 2.29-.33 5.85 1.23 7.77.73.75 1.48 1.43 2.42 1.4.93-.02 1.27-.58 2.39-.58 1.14 0 1.43.57 2.4.56.93-.02 1.53-.78 2.25-1.52 1.05-1.12 1.48-2.2 1.51-2.25-.05-.01-2.08-.8-2.11-3.16z" />
                  <path d="M12.03 5.26c.5-.58.84-1.4.75-2.21-.73.03-1.62.51-2.14 1.12-.47.52-.88 1.35-.77 2.14.83.06 1.68-.42 2.16-1.05z" />
                </svg>
                Continue with Apple
              </motion.button>

              <motion.button
                variants={itemVariants}
                onClick={() => handleLogin('email')}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-500 hover:to-purple-600 transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Continue with Email
              </motion.button>

              <motion.button
                variants={itemVariants}
                onClick={() => handleLogin('twitter')}
                className="w-full py-3 px-4 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-700 transition-all duration-300 border border-purple-500/20 flex items-center justify-center gap-2 group"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 9-2 9-2z" />
                </svg>
                Continue with Twitter
              </motion.button>
            </motion.div>

            {/* Error message */}
            {error && (
              <motion.div
                className="mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {error}
              </motion.div>
            )}

            {/* T&C */}
            <motion.p
              className="text-center text-xs text-purple-300/60 mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              By continuing, you agree to our{' '}
              <button className="underline hover:text-purple-300">Terms</button> and{' '}
              <button className="underline hover:text-purple-300">Privacy Policy</button>
            </motion.p>
          </motion.div>
        )}

        {/* Loading state */}
        {authStep === 'loading' && (
          <motion.div
            className="bg-slate-900/50 backdrop-blur rounded-2xl border border-purple-500/20 p-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Setting up your wallet...</h2>
            <p className="text-purple-300/70">This will only take a moment</p>
          </motion.div>
        )}

        {/* Success state */}
        {authStep === 'success' && (
          <motion.div
            className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur rounded-2xl border border-purple-500/30 p-12 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div
              className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">Wallet Created!</h2>
            <p className="text-purple-300 mb-4">Your secure wallet is ready to use</p>
            <p className="text-sm text-purple-300/60">Redirecting to dashboard...</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
