"use client"

import { HamburgerMenu } from "@/components/hamburger-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatNumber } from "@orya/shared-utils"
import { ArrowLeft, Gift, Star } from "lucide-react"
import Link from "next/link"

const rewards = [
  { id: 1, name: "Premium Concierge Access", points: 5000, available: true },
  { id: 2, name: "0.5% Trading Fee Discount", points: 2500, available: true },
  { id: 3, name: "Exclusive Investment Report", points: 10000, available: false },
]

export default function LumenPage() {
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
            <h1 className="text-3xl font-bold">ORŸA Lumen</h1>
            <p className="text-muted-foreground font-serif">Rewards & loyalty</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <HamburgerMenu />
        </div>
      </header>

      {/* Points Balance */}
      <Card className="card-3d p-6 mb-6 border-0 shadow-xl bg-gradient-to-br from-pink-500/10 to-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Gift className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-serif">Available Points</p>
            <h2 className="text-4xl font-bold">12,450</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-primary fill-primary" />
          <span className="text-sm font-medium">Gold Tier Member</span>
        </div>
      </Card>

      {/* Rewards */}
      <h3 className="text-lg font-semibold mb-4">Available Rewards</h3>
      <div className="space-y-3">
        {rewards.map((reward) => (
          <Card key={reward.id} className="card-3d glow-gold p-5 border-0 shadow-lg hover:shadow-xl transition-smooth">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold mb-1">{reward.name}</h3>
                <p className="text-sm text-muted-foreground">{formatNumber(reward.points)} points</p>
              </div>
            </div>
            <Button
              className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={!reward.available}
            >
              {reward.available ? "Redeem" : "Not Enough Points"}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}


