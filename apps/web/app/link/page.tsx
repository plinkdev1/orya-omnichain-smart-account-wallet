'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatNumber } from '@orya/shared-utils'
import { ArrowLeftRight, ArrowRight } from 'lucide-react'
import { useState } from 'react'

export default function LinkPage() {
  const [step, setStep] = useState(1)
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [fromChain, setFromChain] = useState('Ethereum')
  const [toChain, setToChain] = useState('Polygon')

  const chains = ['Ethereum', 'Solana', 'SUI', 'Polygon']
  const toChains = ['Polygon', 'Arbitrum', 'Base', 'Optimism']

  return (
    <div className="min-h-screen bg-bone-white dark:bg-dark-bg">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-deep-charcoal dark:text-bone-white mb-2">
            ORŸA Link
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Cross-chain swaps & transfers</p>
        </div>

        {/* Cross-Chain Transfer Card */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex justify-between items-start mb-8">
            <h2 className="text-2xl font-bold text-deep-charcoal dark:text-bone-white">
              Cross-Chain Transfer
            </h2>
            {/* Step Indicator */}
            <div className="flex gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2 rounded-full transition-all ${
                    s === step
                      ? 'w-6 bg-pale-gold dark:bg-neon-gold'
                      : 'w-2 bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step 1: From Chain */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-3">
                  From Chain
                </label>
                <div className="flex gap-2 flex-wrap">
                  {chains.map((chain) => (
                    <button
                      key={chain}
                      onClick={() => setFromChain(chain)}
                      className={`px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all ${
                        fromChain === chain
                          ? 'bg-pale-gold dark:bg-neon-gold border-pale-gold dark:border-neon-gold text-black'
                          : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-deep-charcoal dark:text-bone-white hover:border-pale-gold dark:hover:border-neon-gold'
                      }`}
                    >
                      {chain}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                  Amount
                </label>
                <Input
                  placeholder="0.00"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  type="number"
                  className="bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-lg font-semibold"
                />
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full h-12 bg-pale-gold dark:bg-neon-gold text-black hover:opacity-90 font-semibold"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: To Chain */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex justify-center mb-6">
                <div className="w-12 h-12 rounded-full bg-pale-gold/20 dark:bg-neon-gold/20 flex items-center justify-center">
                  <ArrowLeftRight className="w-6 h-6 text-pale-gold dark:text-neon-gold" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-3">
                  To Chain
                </label>
                <div className="flex gap-2 flex-wrap">
                  {toChains.map((chain) => (
                    <button
                      key={chain}
                      onClick={() => setToChain(chain)}
                      className={`px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all ${
                        toChain === chain
                          ? 'bg-pale-gold dark:bg-neon-gold border-pale-gold dark:border-neon-gold text-black'
                          : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-deep-charcoal dark:text-bone-white hover:border-pale-gold dark:hover:border-neon-gold'
                      }`}
                    >
                      {chain}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Estimated Time
                </p>
                <p className="font-semibold text-deep-charcoal dark:text-bone-white">~2-5 minutes</p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 h-12"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="flex-1 h-12 bg-pale-gold dark:bg-neon-gold text-black hover:opacity-90 font-semibold"
                >
                  Review
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">From</span>
                  <span className="font-semibold text-deep-charcoal dark:text-bone-white">{fromChain}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">To</span>
                  <span className="font-semibold text-deep-charcoal dark:text-bone-white">{toChain}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Amount</span>
                  <span className="font-semibold text-deep-charcoal dark:text-bone-white">
                    {fromAmount || '0.00'} ETH
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Fee</span>
                  <span className="font-semibold text-deep-charcoal dark:text-bone-white">0.002 ETH</span>
                </div>
              </div>

              <p className="text-xs text-center text-gray-600 dark:text-gray-400">
                Your transfer will be processed securely across chains
              </p>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(2)}
                  variant="outline"
                  className="flex-1 h-12"
                >
                  Back
                </Button>
                <Button
                  onClick={() => {
                    setStep(1)
                    setFromAmount('')
                  }}
                  className="flex-1 h-12 bg-pale-gold dark:bg-neon-gold text-black hover:opacity-90 font-semibold"
                >
                  Confirm Transfer
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Swap Card */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-deep-charcoal dark:text-bone-white mb-6">
            Quick Swap
          </h2>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                  From
                </label>
                <Input
                  placeholder="0.00"
                  type="number"
                  value={toAmount}
                  onChange={(e) => setToAmount(e.target.value)}
                  className="bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                  To
                </label>
                <Input
                  placeholder="0.00"
                  disabled
                  value={toAmount ? formatNumber(parseFloat(toAmount) * 0.95, 4) : '0.00'}
                  className="bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                />
              </div>
            </div>

            <Button className="w-full h-12 bg-pale-gold dark:bg-neon-gold text-black hover:opacity-90 font-semibold">
              Swap Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}