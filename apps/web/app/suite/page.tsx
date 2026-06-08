'use client'

import { Button } from '@/components/ui/button'
import { BarChart3, Download, FileText, Lock, MessageCircle, Network, Shield, Users } from 'lucide-react'
import { useState } from 'react'

export default function SuitePage() {
  const [selectedEntity, setSelectedEntity] = useState(0)

  const entities = [
    { name: 'Treasury', balance: '$2.4M', wallets: 3 },
    { name: 'Operations', balance: '$850K', wallets: 2 },
    { name: 'Development', balance: '$320K', wallets: 1 },
  ]

  const features = [
    { name: 'Team Access', icon: Users, desc: 'Role-based permissions' },
    { name: 'Cross-Chain', icon: Network, desc: 'Seamless bridging' },
    { name: 'Cold Storage', icon: Lock, desc: 'Hardware integration' },
    { name: 'Audit Logs', icon: Shield, desc: 'Complete transparency' },
  ]

  const wallets = [
    { name: 'Treasury Wallet', sigs: '3 of 5', status: 'Active' },
    { name: 'Operations Wallet', sigs: '2 of 3', status: 'Active' },
  ]

  return (
    <div className="min-h-screen bg-bone-white dark:bg-dark-bg">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-deep-charcoal dark:text-bone-white mb-2">
            ORŸA Suite
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Institutional-grade features</p>
        </div>

        {/* Entities Selection */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-deep-charcoal dark:text-bone-white mb-6">
            Your Entities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {entities.map((entity, index) => (
              <button
                key={index}
                onClick={() => setSelectedEntity(index)}
                className={`p-6 rounded-2xl border-2 text-left transition-all ${
                  selectedEntity === index
                    ? 'bg-white dark:bg-gray-800 border-pale-gold dark:border-neon-gold shadow-lg'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-pale-gold dark:hover:border-neon-gold'
                }`}
              >
                <h4 className="font-semibold text-deep-charcoal dark:text-bone-white">
                  {entity.name}
                </h4>
                <p className="text-3xl font-bold mt-3 text-deep-charcoal dark:text-bone-white">
                  {entity.balance}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {entity.wallets} wallet(s)
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Multi-Sig Wallet */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-pale-gold/20 dark:bg-neon-gold/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-7 h-7 text-pale-gold dark:text-neon-gold" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-deep-charcoal dark:text-bone-white">
                  Multi-Signature Wallet
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Enhanced security for teams
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-pale-gold/20 dark:bg-neon-gold/20 text-pale-gold dark:text-neon-gold text-xs font-semibold">
              Pro
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Require multiple approvals for transactions. Perfect for organizations and DAOs.
          </p>
          <Button className="w-full h-12 bg-pale-gold dark:bg-neon-gold text-black hover:opacity-90 font-semibold">
            Create Multi-Sig
          </Button>
        </div>

        {/* Analytics Dashboard */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-pale-gold/20 dark:bg-neon-gold/20 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-6 h-6 text-pale-gold dark:text-neon-gold" />
              </div>
              <h3 className="text-xl font-bold text-deep-charcoal dark:text-bone-white">
                Analytics Dashboard
              </h3>
            </div>
            <Button variant="outline" className="text-sm">
              View Full
            </Button>
          </div>
          <div className="h-40 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <p className="text-gray-600 dark:text-gray-400">Advanced analytics visualization</p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                >
                  <IconComponent className="w-6 h-6 text-pale-gold dark:text-neon-gold mb-4" />
                  <h4 className="font-bold text-deep-charcoal dark:text-bone-white text-sm">
                    {feature.name}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Concierge */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-pale-gold/20 dark:bg-neon-gold/20 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-6 h-6 text-pale-gold dark:text-neon-gold" />
            </div>
            <div>
              <h3 className="font-bold text-deep-charcoal dark:text-bone-white">
                Dedicated Concierge
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Your institutional support team</p>
            </div>
          </div>
          <Button className="w-full h-12 bg-pale-gold dark:bg-neon-gold text-black hover:opacity-90 font-semibold">
            Contact Team
          </Button>
        </div>

        {/* Reports & Export */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-deep-charcoal dark:text-bone-white mb-6">
            Reports & Export
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <button className="h-24 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-pale-gold dark:hover:border-neon-gold transition-colors flex flex-col items-center justify-center gap-3 bg-white dark:bg-gray-800">
              <Download className="w-6 h-6 text-deep-charcoal dark:text-bone-white" />
              <span className="text-xs font-semibold text-deep-charcoal dark:text-bone-white">
                Export PDF
              </span>
            </button>
            <button className="h-24 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-pale-gold dark:hover:border-neon-gold transition-colors flex flex-col items-center justify-center gap-3 bg-white dark:bg-gray-800">
              <FileText className="w-6 h-6 text-deep-charcoal dark:text-bone-white" />
              <span className="text-xs font-semibold text-deep-charcoal dark:text-bone-white">
                Export CSV
              </span>
            </button>
          </div>
        </div>

        {/* Active Wallets */}
        <div>
          <h2 className="text-2xl font-bold text-deep-charcoal dark:text-bone-white mb-6">
            Active Wallets
          </h2>
          <div className="space-y-3">
            {wallets.map((wallet, index) => (
              <div
                key={index}
                className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-deep-charcoal dark:text-bone-white">{wallet.name}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {wallet.sigs} signatures required
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold">
                  {wallet.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}