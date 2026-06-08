"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Sparkles, TrendingUp } from "lucide-react"
import { HamburgerMenu } from "@/components/hamburger-menu"
import { ThemeToggle } from "@/components/theme-toggle"

const recommendations = [
  {
    id: 1,
    strategy: "Balanced Growth",
    roi: "8-12%",
    risk: "Medium",
    description: "Diversified portfolio across stocks, bonds, and crypto",
  },
  {
    id: 2,
    strategy: "Aggressive Tech",
    roi: "15-20%",
    risk: "High",
    description: "Focus on high-growth technology and innovation sectors",
  },
  {
    id: 3,
    strategy: "Conservative Income",
    roi: "4-6%",
    risk: "Low",
    description: "Stable returns through bonds and dividend stocks",
  },
]

export default function CuratorPage() {
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
            <h1 className="text-3xl font-bold">ORŸA Curator</h1>
            <p className="text-muted-foreground font-serif">Robo-advisory</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <HamburgerMenu />
        </div>
      </header>

      {/* Current Strategy */}
      <Card className="card-3d p-6 mb-6 border-0 shadow-xl bg-gradient-to-br from-yellow-500/10 to-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-serif">Active Strategy</p>
            <h2 className="text-2xl font-bold">Balanced Growth</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-chart-1" />
          <span className="text-sm font-medium text-chart-1">+9.2% YTD performance</span>
        </div>
      </Card>

      {/* Recommendations */}
      <h3 className="text-lg font-semibold mb-4">Recommended Strategies</h3>
      <div className="space-y-3">
        {recommendations.map((rec) => (
          <Card key={rec.id} className="card-3d glow-gold p-5 border-0 shadow-lg hover:shadow-xl transition-smooth">
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold">{rec.strategy}</h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    rec.risk === "Low"
                      ? "bg-chart-1/20 text-chart-1"
                      : rec.risk === "Medium"
                        ? "bg-chart-4/20 text-chart-4"
                        : "bg-chart-5/20 text-chart-5"
                  }`}
                >
                  {rec.risk} Risk
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{rec.description}</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Expected ROI</p>
                <p className="text-lg font-bold text-chart-1">{rec.roi}</p>
              </div>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Apply Strategy
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}


