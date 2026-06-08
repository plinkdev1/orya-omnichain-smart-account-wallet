"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Code, Key, TestTube, Activity, Copy, ExternalLink } from "lucide-react"
import { HamburgerMenu } from "@/components/hamburger-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { useState } from "react"

export default function NexusPage() {
  const [apiKey, setApiKey] = useState("orya_live_sk_1234567890abcdef")
  const [showKey, setShowKey] = useState(false)

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
            <h1 className="text-3xl font-bold">Nexus</h1>
            <p className="text-muted-foreground font-serif">B2B Integration Hub</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <HamburgerMenu />
        </div>
      </header>

      {/* API Status */}
      <Card className="card-3d p-6 mb-6 border-0 shadow-xl bg-gradient-to-br from-chart-1/10 to-card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold mb-1">API Status</h3>
            <p className="text-sm text-muted-foreground">All systems operational</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-chart-1 animate-pulse" />
            <span className="text-sm font-semibold text-chart-1">Live</span>
          </div>
        </div>
      </Card>

      {/* API Key Management */}
      <Card className="card-3d p-6 mb-6 border-0 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Key className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold">API Key</h3>
            <p className="text-xs text-muted-foreground">Production environment</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-11 px-4 rounded-2xl border border-border/50 bg-secondary/30 flex items-center font-mono text-sm">
            {showKey ? apiKey : "••••••••••••••••••••••••••••"}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="rounded-2xl bg-transparent"
            onClick={() => setShowKey(!showKey)}
          >
            {showKey ? "👁️" : "👁️‍🗨️"}
          </Button>
          <Button variant="outline" size="icon" className="rounded-2xl bg-transparent">
            <Copy className="w-4 h-4" />
          </Button>
        </div>
        <Button variant="outline" className="w-full rounded-full bg-transparent" size="sm">
          Generate New Key
        </Button>
      </Card>

      {/* SDK Setup */}
      <Card className="card-3d p-6 mb-6 border-0 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Code className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold">SDK Integration</h3>
            <p className="text-xs text-muted-foreground">Quick start guide</p>
          </div>
        </div>
        <div className="bg-secondary/30 rounded-2xl p-4 mb-3 font-mono text-xs overflow-x-auto whitespace-pre">
          {`npm install @orya/payment-sdk

import { OryaClient } from '@orya/payment-sdk'

const client = new OryaClient({
  apiKey: 'your_api_key'
})`}
        </div>
        <Button variant="outline" className="w-full rounded-full bg-transparent" size="sm">
          <ExternalLink className="w-4 h-4 mr-2" />
          View Full Documentation
        </Button>
      </Card>

      {/* Sandbox Testing */}
      <Card className="card-3d p-6 mb-6 border-0 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <TestTube className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold">Sandbox Environment</h3>
            <p className="text-xs text-muted-foreground">Test transactions safely</p>
          </div>
        </div>
        <div className="space-y-3">
          <Button className="w-full rounded-full justify-start bg-transparent" variant="outline">
            <Activity className="w-4 h-4 mr-2" />
            Test Payment Flow
          </Button>
          <Button className="w-full rounded-full justify-start bg-transparent" variant="outline">
            <Activity className="w-4 h-4 mr-2" />
            Test Crypto Conversion
          </Button>
          <Button className="w-full rounded-full justify-start bg-transparent" variant="outline">
            <Activity className="w-4 h-4 mr-2" />
            Test Webhook Events
          </Button>
        </div>
      </Card>

      {/* Oracle Pricing */}
      <Card className="card-3d p-6 border-0 shadow-lg">
        <h3 className="font-bold mb-4">Real-Time Oracle Pricing</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
            <span className="text-sm font-medium">ETH/USD</span>
            <span className="text-sm font-bold">$3,245.67</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
            <span className="text-sm font-medium">BTC/USD</span>
            <span className="text-sm font-bold">$67,890.12</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
            <span className="text-sm font-medium">SOL/USD</span>
            <span className="text-sm font-bold">$142.34</span>
          </div>
        </div>
      </Card>
    </div>
  )
}


