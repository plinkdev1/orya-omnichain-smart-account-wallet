"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Landmark, TrendingUp, TrendingDown, ChevronRight } from "lucide-react"
import { HamburgerMenu } from "@/components/hamburger-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { useState } from "react"

const assets = [
  { id: 1, name: "Gold Tokens", value: "$45,230.00", change: "+2.4%", positive: true, type: "Commodity" },
  { id: 2, name: "Silver Certificates", value: "$12,450.00", change: "+1.8%", positive: true, type: "Commodity" },
  { id: 3, name: "Real Estate Bonds", value: "$89,100.00", change: "-0.5%", positive: false, type: "Bond" },
  { id: 4, name: "Oil Futures", value: "$23,670.00", change: "+3.2%", positive: true, type: "Commodity" },
]

export default function VaultlinePage() {
  const [selectedAsset, setSelectedAsset] = useState<number | null>(null)

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
            <h1 className="text-3xl font-bold">ORŸA Vaultline</h1>
            <p className="text-muted-foreground font-serif">Real-world assets</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <HamburgerMenu />
        </div>
      </header>

      {/* Portfolio Value */}
      <Card className="card-3d p-6 mb-6 border-0 shadow-xl bg-gradient-to-br from-amber-500/10 to-white">
        <p className="text-sm text-muted-foreground mb-2 font-serif">Total RWA Portfolio</p>
        <h2 className="text-4xl font-bold mb-4">$170,450.00</h2>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-chart-1" />
          <span className="text-sm font-medium text-chart-1">+2.1% this month</span>
        </div>
      </Card>

      {/* Asset Cards */}
      <div className="space-y-3">
        {assets.map((asset) => (
          <Card
            key={asset.id}
            className="card-3d glow-gold p-5 border-0 shadow-lg hover:shadow-xl transition-smooth cursor-pointer"
            onClick={() => setSelectedAsset(selectedAsset === asset.id ? null : asset.id)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Landmark className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold">{asset.name}</h3>
                  <p className="text-xs text-muted-foreground">{asset.type}</p>
                </div>
              </div>
              <ChevronRight
                className={`w-5 h-5 text-muted-foreground transition-transform ${selectedAsset === asset.id ? "rotate-90" : ""}`}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{asset.value}</span>
              <div className={`flex items-center gap-1 ${asset.positive ? "text-chart-1" : "text-chart-5"}`}>
                {asset.positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="text-sm font-medium">{asset.change}</span>
              </div>
            </div>

            {selectedAsset === asset.id && (
              <div className="mt-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">24h Volume</p>
                    <p className="text-sm font-semibold">$2.4M</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Market Cap</p>
                    <p className="text-sm font-semibold">$156M</p>
                  </div>
                </div>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">View Details</Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}


