"use client"

import { HamburgerMenu } from "@/components/hamburger-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, GitMerge, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function ConfluxPage() {
  const [lendAmount, setLendAmount] = useState("")

  return (
    <div className="min-h-screen px-6 pt-8 pb-24">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/atrium">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">ORŸA Conflux</h1>
            <p className="text-muted-foreground font-serif">Crypto-equity hybrid</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <HamburgerMenu />
        </div>
      </header>

      {/* Portfolio Overview */}
      <Card className="card-3d p-6 mb-6 border-0 shadow-xl bg-gradient-to-br from-teal-500/10 to-white">
        <p className="text-sm text-muted-foreground mb-2 font-serif">Hybrid Portfolio Value</p>
        <h2 className="text-4xl font-bold mb-4">$245,680.00</h2>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-chart-1" />
          <span className="text-sm font-medium text-chart-1">+5.8% this month</span>
        </div>
      </Card>

      {/* Lending Panel */}
      <Card className="card-3d glow-gold p-6 mb-4 border-0 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <GitMerge className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold">DeFi Lending</h3>
            <p className="text-xs text-muted-foreground">Earn up to 8.5% APY</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Amount to Lend</label>
            <Input
              type="number"
              placeholder="0.00"
              value={lendAmount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLendAmount(e.target.value)}
              className="h-12 text-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-secondary/50">
              <p className="text-xs text-muted-foreground mb-1">Est. APY</p>
              <p className="text-lg font-bold text-chart-1">8.5%</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50">
              <p className="text-xs text-muted-foreground mb-1">Monthly Earnings</p>
              <p className="text-lg font-bold">$142.50</p>
            </div>
          </div>
          <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground">Start Lending</Button>
        </div>
      </Card>

      {/* Liquidity Pools */}
      <Card className="card-3d glow-gold p-6 border-0 shadow-lg">
        <h3 className="text-lg font-bold mb-4">Active Liquidity Pools</h3>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-secondary/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">ETH/USDC Pool</span>
              <span className="text-sm font-bold text-chart-1">12.3% APY</span>
            </div>
            <p className="text-xs text-muted-foreground">Your position: $45,230</p>
          </div>
          <div className="p-4 rounded-xl bg-secondary/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">BTC/DAI Pool</span>
              <span className="text-sm font-bold text-chart-1">9.8% APY</span>
            </div>
            <p className="text-xs text-muted-foreground">Your position: $32,100</p>
          </div>
        </div>
      </Card>
    </div>
  )
}


