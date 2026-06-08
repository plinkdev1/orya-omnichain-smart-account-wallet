"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, FileText } from "lucide-react"
import { HamburgerMenu } from "@/components/hamburger-menu"
import { ThemeToggle } from "@/components/theme-toggle"

const bonds = [
  { id: 1, name: "US Treasury 10Y", maturity: "2034", yield: "4.2%", value: "$50,000" },
  { id: 2, name: "Corporate Bond AAA", maturity: "2030", yield: "5.1%", value: "$75,000" },
  { id: 3, name: "Municipal Bond", maturity: "2028", yield: "3.8%", value: "$25,000" },
]

export default function LedgerPage() {
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
            <h1 className="text-3xl font-bold">ORŸA Ledger</h1>
            <p className="text-muted-foreground font-serif">Bonds & fixed income</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <HamburgerMenu />
        </div>
      </header>

      {/* Total Holdings */}
      <Card className="card-3d p-6 mb-6 border-0 shadow-xl bg-gradient-to-br from-slate-500/10 to-white">
        <p className="text-sm text-muted-foreground mb-2 font-serif">Total Bond Holdings</p>
        <h2 className="text-4xl font-bold mb-4">$150,000.00</h2>
        <p className="text-sm text-muted-foreground">Average yield: 4.4%</p>
      </Card>

      {/* Bond Cards */}
      <div className="space-y-3">
        {bonds.map((bond) => (
          <Card key={bond.id} className="card-3d glow-gold p-5 border-0 shadow-lg hover:shadow-xl transition-smooth">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-bold">{bond.name}</h3>
                <p className="text-xs text-muted-foreground">Maturity: {bond.maturity}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Value</p>
                <p className="text-lg font-bold">{bond.value}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Yield</p>
                <p className="text-lg font-bold text-chart-1">{bond.yield}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}


