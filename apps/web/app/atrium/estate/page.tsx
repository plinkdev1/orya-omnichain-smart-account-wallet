"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Building, MapPin } from "lucide-react"
import { HamburgerMenu } from "@/components/hamburger-menu"
import { ThemeToggle } from "@/components/theme-toggle"

const properties = [
  { id: 1, name: "Manhattan Luxury Condo", location: "New York, NY", value: "$125,000", shares: "2.5%", roi: "+8.2%" },
  { id: 2, name: "Miami Beach Resort", location: "Miami, FL", value: "$89,500", shares: "1.8%", roi: "+6.5%" },
  { id: 3, name: "Silicon Valley Office", location: "San Jose, CA", value: "$156,000", shares: "3.1%", roi: "+9.1%" },
]

export default function EstatePage() {
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
            <h1 className="text-3xl font-bold">ORŸA Estate</h1>
            <p className="text-muted-foreground font-serif">Tokenized real estate</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <HamburgerMenu />
        </div>
      </header>

      {/* Total Investment */}
      <Card className="card-3d p-6 mb-6 border-0 shadow-xl bg-gradient-to-br from-orange-500/10 to-white">
        <p className="text-sm text-muted-foreground mb-2 font-serif">Total Real Estate Value</p>
        <h2 className="text-4xl font-bold mb-4">$370,500.00</h2>
        <p className="text-sm text-muted-foreground">Across 3 properties</p>
      </Card>

      {/* Property Cards */}
      <div className="space-y-3">
        {properties.map((property) => (
          <Card
            key={property.id}
            className="card-3d glow-gold p-5 border-0 shadow-lg hover:shadow-xl transition-smooth"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold">{property.name}</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>{property.location}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Value</p>
                <p className="text-sm font-bold">{property.value}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Ownership</p>
                <p className="text-sm font-bold">{property.shares}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">ROI</p>
                <p className="text-sm font-bold text-chart-1">{property.roi}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Button className="w-full mt-6 h-12 bg-primary hover:bg-primary/90 text-primary-foreground">
        Explore Properties
      </Button>
    </div>
  )
}


