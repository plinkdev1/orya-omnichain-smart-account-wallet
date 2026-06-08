'use client'

import { Button } from '@/components/ui/button'
import { Check, Crown, Gift, MessageCircle, Sparkles, Star, Users } from 'lucide-react'
import { useState } from 'react'

export default function CirclePage() {
  const [selectedOffer, setSelectedOffer] = useState<number | null>(null)

  const offers = [
    { title: '0% Trading Fees', desc: 'This weekend only', icon: Gift },
    { title: 'Priority Support', desc: '24/7 concierge access', icon: MessageCircle },
    { title: 'Exclusive Events', desc: 'Web3 summit invite', icon: Users },
  ]

  const tiers = [
    {
      name: 'Platinum',
      icon: Crown,
      volume: '$250,000+',
      color: 'text-purple-500',
      benefits: ['24/7 Concierge', '0% Trading Fees', 'Priority Support', 'Exclusive Events'],
      isCurrent: false,
    },
    {
      name: 'Gold',
      icon: Star,
      volume: '$50,000+',
      color: 'text-amber-500',
      benefits: ['Concierge Hours', '0.1% Trading Fees', 'Priority Support'],
      isCurrent: true,
    },
    {
      name: 'Silver',
      icon: Sparkles,
      volume: '$10,000+',
      color: 'text-gray-500',
      benefits: ['Email Support', '0.25% Trading Fees'],
      isCurrent: false,
    },
  ]

  return (
    <div className="min-h-screen bg-bone-white dark:bg-dark-bg">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-deep-charcoal dark:text-bone-white mb-2">
            ORŸA Circle
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Exclusive membership benefits</p>
        </div>

        {/* Member Status Card */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-pale-gold/20 dark:bg-neon-gold/20 flex items-center justify-center">
                <Star className="w-7 h-7 text-pale-gold dark:text-neon-gold" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-deep-charcoal dark:text-bone-white">
                  Gold Member
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Since January 2024</p>
              </div>
            </div>
            <span className="px-4 py-2 rounded-full bg-pale-gold dark:bg-neon-gold text-black text-xs font-semibold">
              Active
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Progress to Platinum
              </span>
              <span className="font-semibold text-deep-charcoal dark:text-bone-white">
                $75,000 / $250,000
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-pale-gold dark:bg-neon-gold rounded-full" />
            </div>
          </div>
        </div>

        {/* Exclusive Offers */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-deep-charcoal dark:text-bone-white mb-6">
            Exclusive Offers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {offers.map((offer, index) => {
              const IconComponent = offer.icon
              return (
                <button
                  key={index}
                  onClick={() => setSelectedOffer(index)}
                  className={`p-6 rounded-2xl border-2 text-left transition-all ${
                    selectedOffer === index
                      ? 'bg-white dark:bg-gray-700 border-pale-gold dark:border-neon-gold shadow-lg'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-pale-gold dark:hover:border-neon-gold'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-pale-gold/20 dark:bg-neon-gold/20 flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-5 h-5 text-pale-gold dark:text-neon-gold" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-deep-charcoal dark:text-bone-white">
                        {offer.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{offer.desc}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Membership Tiers */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-deep-charcoal dark:text-bone-white mb-6">
            Membership Tiers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier, index) => {
              const TierIcon = tier.icon
              return (
                <div
                  key={index}
                  className={`p-6 rounded-2xl border-2 transition-all ${
                    tier.isCurrent
                      ? 'bg-white dark:bg-gray-800 border-pale-gold dark:border-neon-gold shadow-lg'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-opacity-20 flex items-center justify-center ${tier.color}`}>
                        <TierIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-deep-charcoal dark:text-bone-white">
                          {tier.name}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{tier.volume} volume</p>
                      </div>
                    </div>
                    {tier.isCurrent && (
                      <span className="px-3 py-1 rounded-full bg-pale-gold dark:bg-neon-gold text-black text-xs font-semibold">
                        Current
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {tier.benefits.map((benefit) => (
                      <div key={benefit} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-deep-charcoal dark:text-bone-white">
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Concierge Chat */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-pale-gold/20 dark:bg-neon-gold/20 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-6 h-6 text-pale-gold dark:text-neon-gold" />
            </div>
            <div>
              <h3 className="font-bold text-deep-charcoal dark:text-bone-white">Concierge Chat</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Available 9 AM - 9 PM EST</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Get personalized assistance with your portfolio, transactions, and membership benefits.
          </p>
          <Button className="w-full h-12 bg-pale-gold dark:bg-neon-gold text-black hover:opacity-90 font-semibold">
            Start Chat
          </Button>
        </div>

        {/* Upgrade CTA */}
        <Button className="w-full h-12 bg-pale-gold dark:bg-neon-gold text-black hover:opacity-90 font-semibold text-lg">
          Upgrade Membership
        </Button>
      </div>
    </div>
  )
}