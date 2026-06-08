"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import Link from "next/link"
import {
  ArrowLeft,
  Landmark,
  TrendingUp,
  Layers,
  BarChart4,
  Building,
  Palette,
  FileText,
  GitMerge,
  Vault,
  Sparkles,
  Bell,
  Gift,
  Shield,
  Users,
} from "lucide-react"
import { HamburgerMenu } from "@/components/hamburger-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"

interface AtriumFeature {
  id: string
  name: string
  description: string
  icon: React.ElementType
  href: string
  gradient: string
}

const atriumFeatures: AtriumFeature[] = [
  {
    id: "vaultline",
    name: "ORŸA Vaultline",
    description: "Real-world assets & tokenized commodities",
    icon: Landmark,
    href: "/atrium/vaultline",
    gradient: "from-amber-500/10 to-yellow-500/10",
  },
  {
    id: "horizon",
    name: "ORŸA Horizon",
    description: "Tech & equity stocks portfolio",
    icon: TrendingUp,
    href: "/atrium/horizon",
    gradient: "from-blue-500/10 to-cyan-500/10",
  },
  {
    id: "fragment",
    name: "ORŸA Fragment",
    description: "Fractional shares & precision investing",
    icon: Layers,
    href: "/atrium/fragment",
    gradient: "from-purple-500/10 to-pink-500/10",
  },
  {
    id: "panorama",
    name: "ORŸA Panorama",
    description: "Stock & ETF tracking dashboard",
    icon: BarChart4,
    href: "/atrium/panorama",
    gradient: "from-green-500/10 to-emerald-500/10",
  },
  {
    id: "estate",
    name: "ORŸA Estate",
    description: "Tokenized real estate opportunities",
    icon: Building,
    href: "/atrium/estate",
    gradient: "from-orange-500/10 to-red-500/10",
  },
  {
    id: "atelier",
    name: "ORŸA Atelier",
    description: "Alternative & private equity investments",
    icon: Palette,
    href: "/atrium/atelier",
    gradient: "from-indigo-500/10 to-violet-500/10",
  },
  {
    id: "ledger",
    name: "ORŸA Ledger",
    description: "Bonds & fixed income securities",
    icon: FileText,
    href: "/atrium/ledger",
    gradient: "from-slate-500/10 to-gray-500/10",
  },
  {
    id: "conflux",
    name: "ORŸA Conflux",
    description: "Crypto-equity hybrid & DeFi lending",
    icon: GitMerge,
    href: "/atrium/conflux",
    gradient: "from-teal-500/10 to-cyan-500/10",
  },
  {
    id: "haven",
    name: "ORŸA Haven",
    description: "Savings & interest-earning accounts",
    icon: Vault,
    href: "/atrium/haven",
    gradient: "from-emerald-500/10 to-green-500/10",
  },
  {
    id: "curator",
    name: "ORŸA Curator",
    description: "Robo-advisory & portfolio optimization",
    icon: Sparkles,
    href: "/atrium/curator",
    gradient: "from-yellow-500/10 to-amber-500/10",
  },
  {
    id: "beacon",
    name: "ORŸA Beacon",
    description: "Investment alerts & strategic insights",
    icon: Bell,
    href: "/atrium/beacon",
    gradient: "from-orange-500/10 to-yellow-500/10",
  },
  {
    id: "lumen",
    name: "ORŸA Lumen",
    description: "Rewards & loyalty points program",
    icon: Gift,
    href: "/atrium/lumen",
    gradient: "from-pink-500/10 to-rose-500/10",
  },
  {
    id: "shield",
    name: "ORŸA Shield",
    description: "Insurance & asset protection",
    icon: Shield,
    href: "/atrium/shield",
    gradient: "from-blue-500/10 to-indigo-500/10",
  },
  {
    id: "forum",
    name: "ORŸA Forum",
    description: "Governance & DAO voting platform",
    icon: Users,
    href: "/atrium/forum",
    gradient: "from-violet-500/10 to-purple-500/10",
  },
]

export default function AtriumPage() {
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
            <h1 className="text-3xl font-bold">Atrium</h1>
            <p className="text-muted-foreground font-serif">Advanced investment portal</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <HamburgerMenu />
        </div>
      </header>

      {/* Hero Section */}
      <Card className="card-3d p-8 mb-8 border-0 shadow-xl bg-gradient-to-br from-primary/20 via-white to-secondary">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Welcome to the Atrium</h2>
            <p className="text-muted-foreground font-serif">Your gateway to sophisticated investing</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Explore curated investment opportunities across real-world assets, equities, DeFi, and alternative
          investments—all in one premium portal.
        </p>
      </Card>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 gap-4">
        {atriumFeatures.map((feature) => {
          const Icon = feature.icon
          return (
            <Link key={feature.id} href={feature.href}>
              <Card
                className={`card-3d glow-gold p-6 border-0 shadow-lg hover:shadow-xl transition-smooth bg-gradient-to-br ${feature.gradient} to-white cursor-pointer`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/80 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1">{feature.name}</h3>
                    <p className="text-sm text-muted-foreground font-serif">{feature.description}</p>
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Footer Note */}
      <div className="mt-8 text-center">
        <p className="text-xs text-muted-foreground font-serif">
          All investments carry risk. Please review each opportunity carefully.
        </p>
      </div>
    </div>
  )
}


