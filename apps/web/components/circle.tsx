"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, Star, Sparkles, Check, Gift, MessageCircle, Users, ChevronRight } from "lucide-react"
import { useState } from "react"
import { HamburgerMenu } from "@/components/hamburger-menu"
import { ThemeToggle } from "@/components/theme-toggle"

export function Circle() {
  const [selectedOffer, setSelectedOffer] = useState<number | null>(null)

  return (
    <div className="min-h-screen px-6 pt-8 pb-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <HamburgerMenu />
          <h1 className="text-2xl font-bold">ORŸA</h1>
        </div>
        <ThemeToggle />
      </div>

      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">ORŸA Circle</h1>
        <p className="text-muted-foreground font-serif">Exclusive membership benefits</p>
      </header>

      <Card className="card-3d p-6 mb-6 border-0 shadow-xl bg-gradient-to-br from-primary/10 to-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center animate-pulse">
              <Star className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Gold Member</h3>
              <p className="text-sm text-muted-foreground">Since January 2024</p>
            </div>
          </div>
          <Badge className="bg-primary text-primary-foreground">Active</Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress to Platinum</span>
            <span className="font-semibold">$75,000 / $250,000</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary w-[30%] rounded-full transition-all duration-500" />
          </div>
        </div>
      </Card>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Exclusive Offers</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
          {[
            { title: "0% Trading Fees", desc: "This weekend only", icon: Gift },
            { title: "Priority Support", desc: "24/7 concierge access", icon: MessageCircle },
            { title: "Exclusive Events", desc: "Web3 summit invite", icon: Users },
          ].map((offer, index) => (
            <Card
              key={index}
              onClick={() => setSelectedOffer(index)}
              className={`min-w-[280px] p-5 border-0 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer ${
                selectedOffer === index ? "ring-2 ring-primary" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <offer.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{offer.title}</h4>
                  <p className="text-xs text-muted-foreground">{offer.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Membership Tiers */}
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold">Membership Tiers</h3>

        {/* Platinum */}
        <Card className="card-3d p-6 border-0 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-300 to-slate-100 flex items-center justify-center">
                <Crown className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <h4 className="font-bold">Platinum</h4>
                <p className="text-xs text-muted-foreground">$250,000+ volume</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="hover:scale-105 transition-transform bg-transparent">
              Learn More
            </Button>
          </div>
          <ul className="space-y-2">
            {["24/7 Concierge", "0% Trading Fees", "Priority Support", "Exclusive Events"].map((benefit) => (
              <li key={benefit} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-chart-1" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Gold (Current) */}
        <Card className="card-3d p-6 border-2 border-primary shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Star className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h4 className="font-bold">Gold</h4>
                <p className="text-xs text-muted-foreground">$50,000+ volume</p>
              </div>
            </div>
            <Badge className="bg-primary text-primary-foreground">Current</Badge>
          </div>
          <ul className="space-y-2">
            {["Concierge Hours", "0.1% Trading Fees", "Priority Support"].map((benefit) => (
              <li key={benefit} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-chart-1" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Silver */}
        <Card className="card-3d p-6 border-0 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 opacity-60">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h4 className="font-bold">Silver</h4>
                <p className="text-xs text-muted-foreground">$10,000+ volume</p>
              </div>
            </div>
          </div>
          <ul className="space-y-2">
            {["Email Support", "0.25% Trading Fees"].map((benefit) => (
              <li key={benefit} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-muted-foreground" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="card-3d p-6 mb-6 border-0 shadow-xl bg-gradient-to-br from-white to-secondary">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Concierge Chat</h3>
              <p className="text-xs text-muted-foreground">Available 9 AM - 9 PM EST</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground font-serif mb-4">
          Get personalized assistance with your portfolio, transactions, and membership benefits.
        </p>
        <Button className="w-full h-11 bg-primary hover:bg-primary/90 hover:scale-105 text-primary-foreground transition-all duration-300">
          Start Chat
        </Button>
      </Card>

      <Card className="card-3d p-6 mb-6 border-0 shadow-xl bg-gradient-to-br from-primary/5 to-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Invite Friends</h3>
            <p className="text-xs text-muted-foreground">Earn rewards for referrals</p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-border/50 mb-4">
          <p className="text-xs text-muted-foreground mb-1">Your Referral Code</p>
          <p className="text-lg font-bold tracking-wider">ORYA-GOLD-2024</p>
        </div>
        <Button variant="outline" className="w-full h-11 hover:scale-105 transition-transform bg-transparent">
          Share Code
        </Button>
      </Card>

      {/* Apply CTA */}
      <Button className="w-full h-12 bg-primary hover:bg-primary/90 hover:scale-105 text-primary-foreground transition-all duration-300 glow-gold">
        Upgrade Membership
      </Button>
    </div>
  )
}


