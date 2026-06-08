"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Palette, TrendingUp } from "lucide-react"
import { HamburgerMenu } from "@/components/hamburger-menu"
import { ThemeToggle } from "@/components/theme-toggle"

const investments = [
  { id: 1, name: "Tech Startup Fund", type: "Venture Capital", value: "$50,000", roi: "+15.2%" },
  { id: 2, name: "Private Equity Series B", type: "Private Equity", value: "$75,000", roi: "+12.8%" },
  { id: 3, name: "Art Collection Token", type: "Alternative", value: "$35,000", roi: "+8.5%" },
]

export default function AtelierPage() {
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
            <h1 className="text-3xl font-bold">ORŸA Atelier</h1>
            <p className="text-muted-foreground font-serif">Alternative investments</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <HamburgerMenu />
        </div>
      </header>

      {/* Portfolio Value */}
      <Card className="card-3d p-6 mb-6 border-0 shadow-xl bg-gradient-to-br from-indigo-500/10 to-white">
        <p className="text-sm text-muted-foreground mb-2 font-serif">Alternative Portfolio</p>
        <h2 className="text-4xl font-bold mb-4">$160,000.00</h2>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-chart-1" />
          <span className="text-sm font-medium text-chart-1">+12.2% average ROI</span>
        </div>
      </Card>

      {/* Investment Cards */}
      <div className="space-y-3">
        {investments.map((investment) => (
          <Card
            key={investment.id}
            className="card-3d glow-gold p-5 border-0 shadow-lg hover:shadow-xl transition-smooth"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Palette className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-bold">{investment.name}</h3>
                <p className="text-xs text-muted-foreground">{investment.type}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Investment Value</p>
                <p className="text-xl font-bold">{investment.value}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">ROI</p>
                <p className="text-xl font-bold text-chart-1">{investment.roi}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}


