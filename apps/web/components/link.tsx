"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, CreditCard, Banknote, ArrowLeftRight } from "lucide-react"
import { useState } from "react"
import { HamburgerMenu } from "@/components/hamburger-menu"
import { ThemeToggle } from "@/components/theme-toggle"

export function CrossChainLink() {
  const [step, setStep] = useState(1)

  return (
    <div className="min-h-screen px-6 pt-8 pb-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <HamburgerMenu />
          <h1 className="text-2xl font-bold">ORŸA</h1>
        </div>
        <ThemeToggle />
      </div>

      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">ORŸA Link</h1>
        <p className="text-muted-foreground font-serif">Cross-chain swaps & transfers</p>
      </header>

      <Card className="card-3d p-6 mb-6 border-0 shadow-xl bg-gradient-to-br from-white to-secondary">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Cross-Chain Transfer</h3>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  s === step ? "bg-primary w-6" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">From Chain</label>
              <select className="w-full h-12 px-4 rounded-xl border border-border bg-white text-sm">
                <option>Ethereum</option>
                <option>Solana</option>
                <option>SUI</option>
                <option>Polygon</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Amount</label>
              <Input type="number" placeholder="0.00" className="h-12 text-lg" />
            </div>
            <Button
              onClick={() => setStep(2)}
              className="w-full h-12 bg-primary hover:bg-primary/90 hover:scale-105 text-primary-foreground transition-all duration-300"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                <ArrowLeftRight className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">To Chain</label>
              <select className="w-full h-12 px-4 rounded-xl border border-border bg-white text-sm">
                <option>Polygon</option>
                <option>Arbitrum</option>
                <option>Base</option>
                <option>Optimism</option>
              </select>
            </div>
            <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Estimated Time</p>
              <p className="text-sm font-semibold">~2-5 minutes</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setStep(1)} variant="outline" className="flex-1 h-12">
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="flex-1 h-12 bg-primary hover:bg-primary/90 hover:scale-105 text-primary-foreground transition-all duration-300"
              >
                Review
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="p-4 rounded-xl bg-secondary/50 border border-border/50 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">From</span>
                <span className="text-sm font-semibold">Ethereum</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">To</span>
                <span className="text-sm font-semibold">Polygon</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="text-sm font-semibold">1.5 ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Fee</span>
                <span className="text-sm font-semibold">0.002 ETH</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center font-serif">
              Your transfer will be processed securely across chains
            </p>
            <div className="flex gap-2">
              <Button onClick={() => setStep(2)} variant="outline" className="flex-1 h-12">
                Back
              </Button>
              <Button
                onClick={() => setStep(1)}
                className="flex-1 h-12 bg-primary hover:bg-primary/90 hover:scale-105 text-primary-foreground transition-all duration-300 glow-gold"
              >
                Confirm Transfer
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="card-3d p-6 mb-6 border-0 shadow-xl bg-gradient-to-br from-white to-secondary">
        <h3 className="text-lg font-semibold mb-4">Quick Swap</h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">From</label>
            <div className="flex gap-2">
              <Input type="number" placeholder="0.00" className="flex-1 h-12 text-lg" />
              <Button variant="outline" className="px-6 bg-transparent hover:bg-secondary">
                ETH
              </Button>
            </div>
          </div>

          <div className="flex justify-center">
            <button className="w-10 h-10 rounded-full bg-primary/20 hover:bg-primary/30 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-180">
              <ArrowLeftRight className="w-5 h-5 text-primary" />
            </button>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">To</label>
            <div className="flex gap-2">
              <Input type="number" placeholder="0.00" className="flex-1 h-12 text-lg" />
              <Button variant="outline" className="px-6 bg-transparent hover:bg-secondary">
                USDC
              </Button>
            </div>
          </div>

          <Button className="w-full h-12 bg-primary hover:bg-primary/90 hover:scale-105 text-primary-foreground transition-all duration-300 glow-gold">
            Swap Now
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>

      {/* Top-up Methods */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Add Funds</h3>
        <div className="grid grid-cols-2 gap-3">
          <Card className="card-3d p-6 border-0 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
            <CreditCard className="w-8 h-8 text-primary mb-3" />
            <h4 className="font-semibold mb-1">Card</h4>
            <p className="text-xs text-muted-foreground">Instant deposit</p>
          </Card>
          <Card className="card-3d p-6 border-0 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
            <Banknote className="w-8 h-8 text-primary mb-3" />
            <h4 className="font-semibold mb-1">Bank</h4>
            <p className="text-xs text-muted-foreground">1-3 business days</p>
          </Card>
        </div>
      </div>

      {/* Exchange Rates */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Live Rates</h3>
        <Card className="p-4 border-0 shadow-md">
          <div className="space-y-3">
            {[
              { from: "USD", to: "ETH", rate: "0.000298" },
              { from: "USD", to: "SOL", rate: "0.007234" },
              { from: "USD", to: "SUI", rate: "0.068421" },
              { from: "EUR", to: "ETH", rate: "0.000324" },
            ].map((rate, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm font-medium">
                  {rate.from} → {rate.to}
                </span>
                <span className="text-sm text-muted-foreground">{rate.rate}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}


