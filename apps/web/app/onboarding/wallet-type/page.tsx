'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sparkles, Zap, Link2, Building2 } from 'lucide-react';
import { useOnboardingStore } from '@/lib/onboarding-store';
import { WalletType, WalletRouter } from '@/lib/wallet/wallet-router';

interface WalletOption {
  type: WalletType;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  details: string[];
}

const walletOptions: WalletOption[] = [
  {
    type: WalletType.NORMIE,
    title: 'Get Started',
    description: 'New to crypto',
    icon: <Sparkles className="w-8 h-8" />,
    route: '/onboarding/normie',
    details: ['Social login', 'Instant wallet', 'No seed phrases'],
  },
  {
    type: WalletType.POWER_USER,
    title: 'Power User',
    description: 'Advanced features',
    icon: <Zap className="w-8 h-8" />,
    route: '/onboarding/power-onboard',
    details: ['Multi-chain', 'MPC security', 'Smart accounts'],
  },
  {
    type: WalletType.EOA,
    title: 'Connect Wallet',
    description: 'Import existing',
    icon: <Link2 className="w-8 h-8" />,
    route: '/onboarding/eoa-onboard',
    details: ['Import wallet', 'Enhance features', 'Full control'],
  },
  {
    type: WalletType.INSTITUTIONAL,
    title: 'For Teams',
    description: 'Enterprise setup',
    icon: <Building2 className="w-8 h-8" />,
    route: '/onboarding/institutional-onboard',
    details: ['Multi-sig', 'KYB verified', 'Compliance tools'],
  },
];

export default function WalletTypeSelector() {
  const router = useRouter();
  const { setWalletType, setStep } = useOnboardingStore();

  const handleSelect = (option: WalletOption) => {
    setWalletType(option.type);
    setStep(2);
    localStorage.setItem('orya-wallet-type', option.type);
    router.push(option.route);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Choose Your Wallet Type
          </h1>
          <p className="text-xl text-purple-300">
            Select the experience that best fits your needs
          </p>
        </motion.div>

        {/* Cards Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {walletOptions.map((option, idx) => (
            <motion.button
              key={idx}
              variants={itemVariants}
              onClick={() => handleSelect(option)}
              className="relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-500" />

              <div className="relative px-6 py-8 bg-slate-900/80 backdrop-blur rounded-xl border border-purple-500/20 hover:border-purple-400/50 transition-all duration-300">
                {/* Icon */}
                <div className="mb-4 flex justify-center text-purple-400 group-hover:text-purple-300 transition-colors">
                  {option.icon}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-purple-200 transition-colors">
                  {option.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-purple-300/70 mb-4">
                  {option.description}
                </p>

                {/* Details */}
                <ul className="space-y-2 mb-6">
                  {option.details.map((detail, i) => (
                    <li key={i} className="text-xs text-purple-200/60 flex items-center">
                      <span className="w-1 h-1 bg-purple-400 rounded-full mr-2" />
                      {detail}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="text-purple-400 text-sm font-semibold group-hover:text-purple-300 transition-colors">
                  Get Started →
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Help Section */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <p className="text-purple-300/70 text-sm">
            Not sure which one? Start with "Get Started" for a guided experience.
          </p>
          <p className="text-purple-300/50 text-xs mt-2">
            You can always upgrade later
          </p>
        </motion.div>
      </div>
    </div>
  );
}
