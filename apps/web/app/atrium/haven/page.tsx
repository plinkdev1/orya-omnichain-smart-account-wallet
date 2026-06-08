"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Vault, TrendingUp } from "lucide-react"
import { HamburgerMenu } from "@/components/hamburger-menu"
import { ThemeToggle } from "@/components/theme-toggle"

const accounts = [
  { id: 1, name: "High-Yield Savings", balance: "$125,450.00", rate: "4.5%", growth: "$471.94" },
  { id: 2, name: "Premium Reserve", balance: "$89,200.00", rate: "5.2%", growth: "$387.07" },
  { id: 3, name: "Flexible Savings", balance: "$45,000.00", rate: "3.8%", growth: "$142.50" },
]

export default function HavenPage() {
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
            <h1 className="text-3xl font-bold">ORŸA Haven</h1>
            <p className="text-muted-foreground font-serif">Savings & interest</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <HamburgerMenu />
        </div>
      </header>

      {/* Total Savings */}
      <Card className="card-3d p-6 mb-6 border-0 shadow-xl bg-gradient-to-br from-emerald-500/10 to-white">
        <p className="text-sm text-muted-foreground mb-2 font-serif">Total Savings</p>
        <h2 className="text-4xl font-bold mb-4">$259,650.00</h2>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-chart-1" />
          <span className="text-sm font-medium text-chart-1">+$1,001.51 this month</span>
        </div>
      </Card>

      {/* Account Cards */}
      <div className="space-y-3">
        {accounts.map((account) => (
          <Card key={account.id} className="card-3d glow-gold p-5 border-0 shadow-lg hover:shadow-xl transition-smooth">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Vault className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-bold">{account.name}</h3>
                <p className="text-xs text-muted-foreground">APY: {account.rate}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Balance</p>
                <p className="text-lg font-bold">{account.balance}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Monthly Interest</p>
                <p className="text-lg font-bold text-chart-1">{account.growth}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Button className="w-full mt-6 h-12 bg-primary hover:bg-primary/90 text-primary-foreground">
        Open New Account
      </Button>
    </div>
  )
}


