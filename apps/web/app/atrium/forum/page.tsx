"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Users, ThumbsUp, ThumbsDown } from "lucide-react"
import { HamburgerMenu } from "@/components/hamburger-menu"
import { ThemeToggle } from "@/components/theme-toggle"

const proposals = [
  { id: 1, title: "Increase Staking Rewards", status: "Active", votes: { for: 1245, against: 342 }, ends: "3 days" },
  { id: 2, title: "Add New Asset Class", status: "Active", votes: { for: 892, against: 567 }, ends: "5 days" },
  { id: 3, title: "Fee Structure Update", status: "Passed", votes: { for: 2103, against: 456 }, ends: "Closed" },
]

export default function ForumPage() {
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
            <h1 className="text-3xl font-bold">ORŸA Forum</h1>
            <p className="text-muted-foreground font-serif">Governance & voting</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <HamburgerMenu />
        </div>
      </header>

      {/* Voting Power */}
      <Card className="card-3d p-6 mb-6 border-0 shadow-xl bg-gradient-to-br from-violet-500/10 to-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-serif">Your Voting Power</p>
            <h2 className="text-4xl font-bold">1,250</h2>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Based on your holdings and participation</p>
      </Card>

      {/* Proposals */}
      <h3 className="text-lg font-semibold mb-4">Active Proposals</h3>
      <div className="space-y-3">
        {proposals.map((proposal) => (
          <Card
            key={proposal.id}
            className="card-3d glow-gold p-5 border-0 shadow-lg hover:shadow-xl transition-smooth"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold">{proposal.title}</h3>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  proposal.status === "Active" ? "bg-chart-2/20 text-chart-2" : "bg-chart-1/20 text-chart-1"
                }`}
              >
                {proposal.status}
              </span>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-chart-1" />
                  <span className="font-medium">For: {proposal.votes.for}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ThumbsDown className="w-4 h-4 text-chart-5" />
                  <span className="font-medium">Against: {proposal.votes.against}</span>
                </div>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-chart-1"
                  style={{ width: `${(proposal.votes.for / (proposal.votes.for + proposal.votes.against)) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Ends in {proposal.ends}</span>
              {proposal.status === "Active" && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 bg-transparent">
                    Vote For
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 bg-transparent">
                    Vote Against
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}


