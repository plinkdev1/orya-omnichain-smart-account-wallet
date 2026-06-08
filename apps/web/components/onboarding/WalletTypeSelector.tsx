'use client';

import { WalletSecurityLevel } from '@/lib/onboardingStore';
import { Card } from '@/components/ui/card';

interface WalletTypeSelectorProps {
  onSelect: (type: WalletSecurityLevel) => void;
  selectedType?: WalletSecurityLevel;
}

export function WalletTypeSelector({ onSelect, selectedType }: WalletTypeSelectorProps) {
  const walletOptions = [
    {
      type: 'human-network' as WalletSecurityLevel,
      emoji: '👤',
      title: 'Beginner-Friendly Wallet',
      description: 'Social login. Automatic setup. Perfect for newcomers.',
      features: [
        'Google/Apple login',
        'No recovery phrase needed',
        'Automatic backup',
      ],
      badge: 'Recommended for Beginners',
      badgeColor: 'bg-green-100 text-green-800',
    },
    {
      type: 'orya-standard' as WalletSecurityLevel,
      emoji: '🔐',
      title: 'Standard Secure Wallet',
      description: 'MPC security. Recovery phrase backup. Good for most users.',
      features: [
        'MPC key management (Privy)',
        'Multi-chain support',
        'Recovery phrase backup',
        'Biometric authentication',
      ],
      badge: 'Recommended for Most Users',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      type: 'orya-enhanced' as WalletSecurityLevel,
      emoji: '🛡️',
      title: 'Enhanced Zero-Trust Wallet',
      description: 'Enterprise-grade security. Zero-trust architecture. IKA 2PC-MPC.',
      features: [
        'Two-Party Computation (2PC) signing',
        'Threshold signatures (2-of-2)',
        'Keys never exist in full',
        'Perfect for large holdings',
        'Institutional-grade security',
      ],
      badge: 'PREMIUM',
      badgeColor: 'bg-neon-gold text-deep-charcoal',
      isPremium: true,
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-deep-charcoal dark:text-bone-white">
        Choose Wallet Security Level
      </h2>

      {walletOptions.map((option) => (
        <Card
          key={option.type}
          className={`p-6 cursor-pointer hover:border-sui-blue transition ${
            selectedType === option.type
              ? 'border-2 border-sui-blue bg-sui-blue/5'
              : option.isPremium
              ? 'border-2 border-neon-gold/50 hover:border-neon-gold'
              : ''
          }`}
          onClick={() => onSelect(option.type)}
        >
          <div className="flex items-start gap-4">
            <div className="text-4xl flex-shrink-0">{option.emoji}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg text-deep-charcoal dark:text-bone-white">
                  {option.title}
                </h3>
                {selectedType === option.type && (
                  <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-sui-blue">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {option.description}
              </p>
              <ul className="mt-3 space-y-1 text-sm">
                {option.features.map((feature, idx) => (
                  <li key={idx} className="text-gray-700 dark:text-gray-300">
                    ✓ {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-4 space-y-2">
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-medium ${option.badgeColor}`}
                >
                  {option.badge}
                </span>
                {option.isPremium && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Recommended for: Power users, institutions, large portfolios ($10K+)
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}

      <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        You can upgrade security level anytime from Settings
      </div>
    </div>
  );
}
