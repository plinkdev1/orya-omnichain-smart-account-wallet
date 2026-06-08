"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, TrendingUp, TrendingDown, ChevronRight } from "lucide-react"
import { HamburgerMenu } from "@/components/hamburger-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { useState } from "react"

const stocks = [
  { id: 1, symbol: "AAPL", name: "Apple Inc.", value: "$178.45", change: "+2.3%", positive: true },
  { id: 2, symbol: "GOOGL", name: "Alphabet Inc.", value: "$142.67", change: "+1.5%", positive: true },
  { id: 3, symbol: "MSFT", name: "Microsoft Corp.", value: "$412.89", change: "-0.8%", positive: false },
  { id: 4, symbol: "NVDA", name: "NVIDIA Corp.", value: "$875.23", change: "+4.2%", positive: true },
]

export default function HorizonPage() {
  const [selectedStock, setSelectedStock] = useState<number | null>(null)

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
            <h1 className="text-3xl font-bold">ORŸA Horizon</h1>
            <p className="text-muted-foreground font-serif">Tech & equity stocks</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <HamburgerMenu />
        </div>
      </header>

      {/* Portfolio Value */}
      <Card className="card-3d p-6 mb-6 border-0 shadow-xl bg-gradient-to-br from-blue-500/10 to-white">
        <p className="text-sm text-muted-foreground mb-2 font-serif">Stock Portfolio Value</p>
        <h2 className="text-4xl font-bold mb-4">$1,609.24</h2>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-chart-1" />
          <span className="text-sm font-medium text-chart-1">+1.8% today</span>
        </div>
      </Card>

      {/* Stock Cards */}
      <div className="space-y-3">
        {stocks.map((stock) => (
          <Card
            key={stock.id}
            className="card-3d glow-gold p-5 border-0 shadow-lg hover:shadow-xl transition-smooth cursor-pointer"
            onClick={() => setSelectedStock(selectedStock === stock.id ? null : stock.id)}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold">{stock.symbol}</h3>
                <p className="text-xs text-muted-foreground">{stock.name}</p>
              </div>
              <ChevronRight
                className={`w-5 h-5 text-muted-foreground transition-transform ${selectedStock === stock.id ? "rotate-90" : ""}`}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{stock.value}</span>
              <div className={`flex items-center gap-1 ${stock.positive ? "text-chart-1" : "text-chart-5"}`}>
                {stock.positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="text-sm font-medium">{stock.change}</span>
              </div>
            </div>

            {selectedStock === stock.id && (
              <div className="mt-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Open</p>
                    <p className="text-sm font-semibold">$175.20</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">High</p>
                    <p className="text-sm font-semibold">$179.45</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Low</p>
                    <p className="text-sm font-semibold">$174.80</p>
                  </div>
                </div>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Trade</Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}


