"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Layers, TrendingUp } from "lucide-react"
import { HamburgerMenu } from "@/components/hamburger-menu"
import { ThemeToggle } from "@/components/theme-toggle"

const fractionalShares = [
  { id: 1, name: "Tesla Inc.", owned: "0.25 shares", value: "$62.50", underlying: "$250.00" },
  { id: 2, name: "Amazon.com", owned: "0.15 shares", value: "$24.75", underlying: "$165.00" },
  { id: 3, name: "Berkshire Hathaway", owned: "0.05 shares", value: "$28.50", underlying: "$570.00" },
]

export default function FragmentPage() {
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
            <h1 className="text-3xl font-bold">ORŸA Fragment</h1>
            <p className="text-muted-foreground font-serif">Fractional shares</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <HamburgerMenu />
        </div>
      </header>

      {/* Total Value */}
      <Card className="card-3d p-6 mb-6 border-0 shadow-xl bg-gradient-to-br from-purple-500/10 to-white">
        <p className="text-sm text-muted-foreground mb-2 font-serif">Total Fractional Holdings</p>
        <h2 className="text-4xl font-bold mb-4">$115.75</h2>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-chart-1" />
          <span className="text-sm font-medium text-chart-1">+3.2% this week</span>
        </div>
      </Card>

      {/* Fractional Share Cards */}
      <div className="space-y-3">
        {fractionalShares.map((share) => (
          <Card key={share.id} className="card-3d glow-gold p-5 border-0 shadow-lg hover:shadow-xl transition-smooth">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Layers className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-bold">{share.name}</h3>
                <p className="text-xs text-muted-foreground">{share.owned}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Your Value</p>
                <p className="text-lg font-bold">{share.value}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Full Share Price</p>
                <p className="text-lg font-bold">{share.underlying}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Button className="w-full mt-6 h-12 bg-primary hover:bg-primary/90 text-primary-foreground">
        Buy More Fractions
      </Button>
    </div>
  )
}


