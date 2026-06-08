"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, BarChart4, TrendingUp } from "lucide-react"
import { HamburgerMenu } from "@/components/hamburger-menu"
import { ThemeToggle } from "@/components/theme-toggle"

const holdings = [
  { id: 1, name: "S&P 500 ETF", symbol: "SPY", value: "$45,230", change: "+1.2%", positive: true },
  { id: 2, name: "Tech Sector ETF", symbol: "XLK", value: "$23,450", change: "+2.8%", positive: true },
  { id: 3, name: "Bond Index", symbol: "AGG", value: "$12,100", change: "+0.3%", positive: true },
]

export default function PanoramaPage() {
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
            <h1 className="text-3xl font-bold">ORŸA Panorama</h1>
            <p className="text-muted-foreground font-serif">Stock & ETF tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <HamburgerMenu />
        </div>
      </header>

      {/* Portfolio Overview */}
      <Card className="card-3d p-6 mb-6 border-0 shadow-xl bg-gradient-to-br from-green-500/10 to-white">
        <p className="text-sm text-muted-foreground mb-2 font-serif">Total Portfolio Value</p>
        <h2 className="text-4xl font-bold mb-4">$80,780.00</h2>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-chart-1" />
          <span className="text-sm font-medium text-chart-1">+1.5% overall</span>
        </div>
      </Card>

      {/* Holdings */}
      <div className="space-y-3">
        {holdings.map((holding) => (
          <Card key={holding.id} className="card-3d glow-gold p-5 border-0 shadow-lg hover:shadow-xl transition-smooth">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BarChart4 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-bold">{holding.name}</h3>
                <p className="text-xs text-muted-foreground">{holding.symbol}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{holding.value}</span>
              <span className="text-sm font-medium text-chart-1">{holding.change}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}


