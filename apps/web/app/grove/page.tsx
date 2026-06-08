"use client"

import { HamburgerMenu } from "@/components/hamburger-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Clock, Info, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const stakingOptions = [
  { id: 1, name: "Ethereum 2.0", apy: "4.2%", minStake: "0.1 ETH", lockPeriod: "Flexible", color: "#627EEA" },
  { id: 2, name: "Solana", apy: "7.5%", minStake: "1 SOL", lockPeriod: "Flexible", color: "#14F195" },
  { id: 3, name: "Cardano", apy: "5.1%", minStake: "10 ADA", lockPeriod: "Flexible", color: "#0033AD" },
  { id: 4, name: "Polkadot", apy: "12.3%", minStake: "1 DOT", lockPeriod: "28 days", color: "#E6007A" },
]

export default function GrovePage() {
  const [selectedStake, setSelectedStake] = useState<number | null>(null)
  const [stakeAmount, setStakeAmount] = useState("")

  return (
    <div className="min-h-screen px-6 pt-8 pb-24">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Grove</h1>
            <p className="text-muted-foreground font-serif">Staking & Yield</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <HamburgerMenu />
        </div>
      </header>

      {/* Rewards Dashboard */}
      <Card className="card-3d p-6 mb-6 border-0 shadow-xl bg-gradient-to-br from-chart-1/10 to-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Staked Value</p>
            <h2 className="text-3xl font-bold">$45,234.12</h2>
          </div>
          <div className="w-16 h-16 rounded-full bg-chart-1/20 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-chart-1" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Accrued Rewards</p>
            <p className="text-lg font-bold text-chart-1">+$1,234.56</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Avg. APY</p>
            <p className="text-lg font-bold">6.8%</p>
          </div>
        </div>
      </Card>

      {/* Staking Options */}
      <h3 className="text-lg font-semibold mb-4">Available Staking</h3>
      <div className="space-y-3 mb-6">
        {stakingOptions.map((option) => (
          <Card
            key={option.id}
            className="card-3d p-5 border-0 shadow-lg cursor-pointer hover:scale-[1.02] transition-all"
            onClick={() => setSelectedStake(option.id)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${option.color}20` }}
                >
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: option.color }} />
                </div>
                <div>
                  <h4 className="font-bold">{option.name}</h4>
                  <p className="text-xs text-muted-foreground">Min: {option.minStake}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-chart-1">{option.apy}</p>
                <p className="text-xs text-muted-foreground">APY</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{option.lockPeriod}</span>
              </div>
              <div className="flex items-center gap-1">
                <Info className="w-3 h-3" />
                <span>Auto-compound</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Stake Modal */}
      {selectedStake && (
        <div
          className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setSelectedStake(null)}
        >
          <Card className="max-w-md w-full p-6 border-0 shadow-2xl" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold mb-4">
              Stake {stakingOptions.find((s) => s.id === selectedStake)?.name}
            </h3>
            <div className="mb-4">
              <label className="text-sm text-muted-foreground mb-2 block">Amount to Stake</label>
              <div className="relative">
                <input
                  type="text"
                  value={stakeAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStakeAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-14 px-4 rounded-2xl border border-border/50 bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 transition-smooth text-lg font-semibold"
                />
                <Button variant="ghost" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full">
                  MAX
                </Button>
              </div>
            </div>
            <div className="bg-secondary/50 rounded-2xl p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">APY</span>
                <span className="font-semibold text-chart-1">
                  {stakingOptions.find((s) => s.id === selectedStake)?.apy}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Lock Period</span>
                <span className="font-semibold">{stakingOptions.find((s) => s.id === selectedStake)?.lockPeriod}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Est. Annual Rewards</span>
                <span className="font-semibold">~$2,450</span>
              </div>
            </div>
            <Button className="w-full rounded-full h-12 text-base font-semibold">Confirm Stake</Button>
          </Card>
        </div>
      )}
    </div>
  )
}


