"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Bell, TrendingUp, AlertCircle } from "lucide-react"
import { HamburgerMenu } from "@/components/hamburger-menu"
import { ThemeToggle } from "@/components/theme-toggle"

const alerts = [
  {
    id: 1,
    type: "opportunity",
    title: "Tech Sector Dip",
    message: "NVDA down 3.2% - potential buy opportunity",
    time: "2h ago",
  },
  {
    id: 2,
    type: "alert",
    title: "Portfolio Rebalance",
    message: "Your portfolio allocation has shifted. Consider rebalancing.",
    time: "5h ago",
  },
  {
    id: 3,
    type: "insight",
    title: "Market Trend",
    message: "Real estate tokens showing strong momentum this week",
    time: "1d ago",
  },
]

export default function BeaconPage() {
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
            <h1 className="text-3xl font-bold">ORŸA Beacon</h1>
            <p className="text-muted-foreground font-serif">Investment alerts</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <HamburgerMenu />
        </div>
      </header>

      {/* Alert Summary */}
      <Card className="card-3d p-6 mb-6 border-0 shadow-xl bg-gradient-to-br from-orange-500/10 to-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">3 New Alerts</h2>
            <p className="text-sm text-muted-foreground font-serif">Strategic opportunities</p>
          </div>
        </div>
      </Card>

      {/* Alert Cards */}
      <div className="space-y-3">
        {alerts.map((alert) => (
          <Card key={alert.id} className="card-3d glow-gold p-5 border-0 shadow-lg hover:shadow-xl transition-smooth">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  alert.type === "opportunity"
                    ? "bg-chart-1/20"
                    : alert.type === "alert"
                      ? "bg-chart-4/20"
                      : "bg-chart-2/20"
                }`}
              >
                {alert.type === "opportunity" ? (
                  <TrendingUp className="w-5 h-5 text-chart-1" />
                ) : alert.type === "alert" ? (
                  <AlertCircle className="w-5 h-5 text-chart-4" />
                ) : (
                  <Bell className="w-5 h-5 text-chart-2" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold">{alert.title}</h3>
                  <span className="text-xs text-muted-foreground">{alert.time}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{alert.message}</p>
                <Button size="sm" variant="outline" className="h-8 bg-transparent">
                  View Details
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}


