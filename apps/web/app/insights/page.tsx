"use client"

import { HamburgerMenu } from "@/components/hamburger-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, BarChart3, ChevronDown, LineChart, PieChart, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function InsightsPage() {
  const [timeRange, setTimeRange] = useState("7d")
  const [chartType, setChartType] = useState<"line" | "bar" | "pie">("line")
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null)

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
            <h1 className="text-3xl font-bold">Insights</h1>
            <p className="text-muted-foreground font-serif">Portfolio analytics & performance</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <HamburgerMenu />
        </div>
      </header>

      {/* Portfolio Summary */}
      <Card className="card-3d p-6 mb-6 border-0 shadow-xl bg-gradient-to-br from-white to-secondary">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Portfolio Value</p>
            <h2 className="text-4xl font-bold">$124,856.42</h2>
          </div>
          <div className="text-right">
            <p className="text-sm text-chart-1 font-semibold flex items-center gap-1 justify-end">
              <TrendingUp className="w-4 h-4" />
              +8.4%
            </p>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
          <div>
            <p className="text-xs text-muted-foreground mb-1">24h Change</p>
            <p className="text-sm font-semibold text-chart-1">+$1,234</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Best Performer</p>
            <p className="text-sm font-semibold">SOL +12%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Assets</p>
            <p className="text-sm font-semibold">12 tokens</p>
          </div>
        </div>
      </Card>

      {/* Chart Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <Button
            onClick={() => setChartType("line")}
            size="sm"
            className={`transition-all duration-300 ${
              chartType === "line" ? "bg-primary text-primary-foreground" : "bg-white text-foreground border"
            }`}
          >
            <LineChart className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setChartType("bar")}
            size="sm"
            className={`transition-all duration-300 ${
              chartType === "bar" ? "bg-primary text-primary-foreground" : "bg-white text-foreground border"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setChartType("pie")}
            size="sm"
            className={`transition-all duration-300 ${
              chartType === "pie" ? "bg-primary text-primary-foreground" : "bg-white text-foreground border"
            }`}
          >
            <PieChart className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          {["24h", "7d", "30d", "1y"].map((range) => (
            <Button
              key={range}
              onClick={() => setTimeRange(range)}
              size="sm"
              className={`transition-all duration-300 ${
                timeRange === range
                  ? "bg-primary text-primary-foreground"
                  : "bg-white text-foreground border hover:bg-secondary"
              }`}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* Chart Placeholder */}
      <Card className="card-3d p-6 mb-6 border-0 shadow-xl bg-gradient-to-br from-white to-secondary">
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            {chartType === "line" && <LineChart className="w-16 h-16 mx-auto mb-3 opacity-20" />}
            {chartType === "bar" && <BarChart3 className="w-16 h-16 mx-auto mb-3 opacity-20" />}
            {chartType === "pie" && <PieChart className="w-16 h-16 mx-auto mb-3 opacity-20" />}
            <p className="text-sm">
              {chartType === "line" && "Line chart visualization"}
              {chartType === "bar" && "Bar chart visualization"}
              {chartType === "pie" && "Portfolio distribution"}
            </p>
          </div>
        </div>
      </Card>

      {/* Asset Breakdown */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Asset Performance</h3>
        <div className="space-y-2">
          {[
            { name: "Ethereum", symbol: "ETH", value: "$45,234", change: "+2.4%", positive: true, allocation: "36%" },
            { name: "Solana", symbol: "SOL", value: "$32,145", change: "+12.1%", positive: true, allocation: "26%" },
            { name: "SUI", symbol: "SUI", value: "$18,234", change: "-1.2%", positive: false, allocation: "15%" },
            { name: "USD Coin", symbol: "USDC", value: "$29,242", change: "0.0%", positive: true, allocation: "23%" },
          ].map((asset) => (
            <Card
              key={asset.symbol}
              className="border-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden"
              onClick={() => setExpandedAsset(expandedAsset === asset.symbol ? null : asset.symbol)}
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold">{asset.symbol.slice(0, 2)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{asset.name}</p>
                      <p className="text-xs text-muted-foreground">{asset.symbol}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold">{asset.value}</p>
                      <p className={`text-xs font-medium ${asset.positive ? "text-chart-1" : "text-destructive"}`}>
                        {asset.change}
                      </p>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${
                        expandedAsset === asset.symbol ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>
              </div>

              {expandedAsset === asset.symbol && (
                <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="pt-4 border-t border-border/50 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Portfolio Allocation</span>
                      <span className="text-xs font-semibold">{asset.allocation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">24h Volume</span>
                      <span className="text-xs font-semibold">$2.4M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Avg. Buy Price</span>
                      <span className="text-xs font-semibold">$3,234.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Unrealized P&L</span>
                      <span className={`text-xs font-semibold ${asset.positive ? "text-chart-1" : "text-destructive"}`}>
                        {asset.positive ? "+" : ""}$1,234.56
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Projection Panel */}
      <Card className="card-3d p-6 mt-6 border-0 shadow-xl bg-gradient-to-br from-primary/5 to-white">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-1">AI Insights</h3>
            <p className="text-sm text-muted-foreground font-serif">
              Based on your portfolio performance and market trends
            </p>
          </div>
        </div>
        <ul className="space-y-2">
          <li className="text-sm flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Your SOL holdings have outperformed the market by 8% this week</span>
          </li>
          <li className="text-sm flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Consider rebalancing: ETH allocation is 11% above target</span>
          </li>
          <li className="text-sm flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Projected 30-day return: +$3,200 - $4,800 (based on current trends)</span>
          </li>
        </ul>
      </Card>
    </div>
  )
}


