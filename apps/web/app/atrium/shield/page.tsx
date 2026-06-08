"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Shield, CheckCircle2 } from "lucide-react"
import { HamburgerMenu } from "@/components/hamburger-menu"
import { ThemeToggle } from "@/components/theme-toggle"

const policies = [
  { id: 1, name: "Asset Protection Plan", coverage: "$500,000", premium: "$125/mo", active: true },
  { id: 2, name: "Crypto Insurance", coverage: "$250,000", premium: "$89/mo", active: true },
  { id: 3, name: "Identity Theft Protection", coverage: "$100,000", premium: "$45/mo", active: false },
]

export default function ShieldPage() {
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
            <h1 className="text-3xl font-bold">ORŸA Shield</h1>
            <p className="text-muted-foreground font-serif">Insurance & protection</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <HamburgerMenu />
        </div>
      </header>

      {/* Coverage Summary */}
      <Card className="card-3d p-6 mb-6 border-0 shadow-xl bg-gradient-to-br from-blue-500/10 to-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-serif">Total Coverage</p>
            <h2 className="text-4xl font-bold">$750,000</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-chart-1" />
          <span className="text-sm font-medium text-chart-1">2 active policies</span>
        </div>
      </Card>

      {/* Policy Cards */}
      <div className="space-y-3">
        {policies.map((policy) => (
          <Card key={policy.id} className="card-3d glow-gold p-5 border-0 shadow-lg hover:shadow-xl transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold mb-1">{policy.name}</h3>
                <p className="text-xs text-muted-foreground">Coverage: {policy.coverage}</p>
              </div>
              {policy.active && (
                <div className="px-3 py-1 rounded-full bg-chart-1/20">
                  <span className="text-xs font-medium text-chart-1">Active</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Premium</p>
                <p className="text-lg font-bold">{policy.premium}</p>
              </div>
              <Button
                size="sm"
                variant={policy.active ? "outline" : "default"}
                className={!policy.active ? "bg-primary hover:bg-primary/90 text-primary-foreground" : ""}
              >
                {policy.active ? "Manage" : "Activate"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}


