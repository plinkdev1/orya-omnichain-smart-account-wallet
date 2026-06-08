"use client"

import { useMemo, useState } from "react"
import type { MouseEvent } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, Users, Network, Lock, ArrowRight, Download, FileText, BarChart3, MessageCircle } from "lucide-react"
import { HamburgerMenu } from "@/components/hamburger-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useWalletConnect } from "@orya/wallet-core/hooks"
import type { SessionTypes } from "@walletconnect/types"
import { ConnectExternalWallet } from "@/components/onboarding/ConnectExternalWallet"

export function Suite() {
  const [selectedEntity, setSelectedEntity] = useState(0)
  const [connectDialogOpen, setConnectDialogOpen] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)
  const { sessions, disconnect } = useWalletConnect()
  const activeSessions = useMemo(
    () => Object.values(sessions || {}) as SessionTypes.Struct[],
    [sessions],
  )

  const handleOpenConnect = () => {
    setDialogError(null)
    setConnectDialogOpen(true)
  }

  const handleCloseConnect = () => {
    setDialogError(null)
    setConnectDialogOpen(false)
  }

  const handleWalletConnected = () => {
    setDialogError(null)
    setConnectDialogOpen(false)
  }

  const handleDisconnect = async (event: MouseEvent<HTMLButtonElement>, topic: string) => {
    event.stopPropagation()
    try {
      await disconnect(topic)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to disconnect session"
      setDialogError(message)
      setConnectDialogOpen(true)
    }
  }

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
        <h1 className="text-3xl font-bold mb-2">ORŸA Suite</h1>
        <p className="text-muted-foreground font-serif">Institutional-grade features</p>
      </header>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Your Entities</h3>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
          {[
            { name: "Treasury", balance: "$2.4M", wallets: 3 },
            { name: "Operations", balance: "$850K", wallets: 2 },
            { name: "Development", balance: "$320K", wallets: 1 },
          ].map((entity, index) => (
            <Card
              key={index}
              onClick={() => setSelectedEntity(index)}
              className={`min-w-[200px] p-4 border-0 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer ${
                selectedEntity === index ? "ring-2 ring-primary bg-primary/5" : ""
              }`}
            >
              <h4 className="font-semibold mb-2">{entity.name}</h4>
              <p className="text-2xl font-bold mb-1">{entity.balance}</p>
              <p className="text-xs text-muted-foreground">{entity.wallets} wallet(s)</p>
            </Card>
          ))}
        </div>
      </div>

      <Card className="card-3d p-6 mb-4 border-0 shadow-xl bg-gradient-to-br from-primary/5 to-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-bold">Wallet Connections</h3>
            <p className="text-sm text-muted-foreground">
              Manage WalletConnect sessions across your entities.
            </p>
          </div>
          <Button onClick={handleOpenConnect} className="w-full sm:w-auto">
            Connect Wallet
          </Button>
        </div>
        {activeSessions.length > 0 ? (
          <div className="mt-4 space-y-2">
            {activeSessions.map((session) => (
              <div
                key={session.topic}
                className="flex flex-col gap-2 rounded border border-muted/50 bg-background/80 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium">
                    {session.peer?.metadata?.name || "Wallet"}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground break-all">
                    {session.topic}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(event) => handleDisconnect(event, session.topic)}
                >
                  Disconnect
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No active WalletConnect sessions.
          </p>
        )}
      </Card>

      {/* Multi-Sig Wallet */}
      <Card className="card-3d p-6 mb-4 border-0 shadow-xl bg-gradient-to-br from-white to-secondary">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Multi-Signature Wallet</h3>
              <p className="text-sm text-muted-foreground">Enhanced security for teams</p>
            </div>
          </div>
          <Badge variant="outline">Pro</Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-4 font-serif">
          Require multiple approvals for transactions. Perfect for organizations and DAOs.
        </p>
        <Button className="w-full bg-primary hover:bg-primary/90 hover:scale-105 text-primary-foreground transition-all duration-300">
          Create Multi-Sig
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Card>

      <Card className="card-3d p-6 mb-4 border-0 shadow-xl bg-gradient-to-br from-white to-secondary">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Analytics Dashboard</h3>
          </div>
          <Button size="sm" variant="outline" className="hover:scale-105 transition-transform bg-transparent">
            View Full
          </Button>
        </div>
        <div className="h-48 flex items-center justify-center bg-secondary/30 rounded-xl">
          <p className="text-sm text-muted-foreground">Advanced analytics visualization</p>
        </div>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="card-3d p-6 border-0 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
          <Users className="w-8 h-8 text-primary mb-3" />
          <h4 className="font-semibold mb-1">Team Access</h4>
          <p className="text-xs text-muted-foreground">Role-based permissions</p>
        </Card>
        <Card className="card-3d p-6 border-0 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
          <Network className="w-8 h-8 text-primary mb-3" />
          <h4 className="font-semibold mb-1">Cross-Chain</h4>
          <p className="text-xs text-muted-foreground">Seamless bridging</p>
        </Card>
        <Card className="card-3d p-6 border-0 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
          <Lock className="w-8 h-8 text-primary mb-3" />
          <h4 className="font-semibold mb-1">Cold Storage</h4>
          <p className="text-xs text-muted-foreground">Hardware integration</p>
        </Card>
        <Card className="card-3d p-6 border-0 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
          <Shield className="w-8 h-8 text-primary mb-3" />
          <h4 className="font-semibold mb-1">Audit Logs</h4>
          <p className="text-xs text-muted-foreground">Complete transparency</p>
        </Card>
      </div>

      <Card className="card-3d p-6 mb-6 border-0 shadow-xl bg-gradient-to-br from-primary/5 to-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Dedicated Concierge</h3>
            <p className="text-xs text-muted-foreground">Your institutional support team</p>
          </div>
        </div>
        <Button className="w-full h-11 bg-primary hover:bg-primary/90 hover:scale-105 text-primary-foreground transition-all duration-300">
          Contact Team
        </Button>
      </Card>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Reports & Export</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 hover:scale-105 transition-all duration-300 bg-transparent"
          >
            <Download className="w-5 h-5" />
            <span className="text-sm font-semibold">Export PDF</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 hover:scale-105 transition-all duration-300 bg-transparent"
          >
            <FileText className="w-5 h-5" />
            <span className="text-sm font-semibold">Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Active Wallets */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Active Wallets</h3>
        <Card className="p-4 border-0 shadow-md mb-3 hover:shadow-lg transition-smooth">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-sm mb-1">Treasury Wallet</h4>
              <p className="text-xs text-muted-foreground">3 of 5 signatures required</p>
            </div>
            <Badge className="bg-chart-1 text-white">Active</Badge>
          </div>
        </Card>
        <Card className="p-4 border-0 shadow-md hover:shadow-lg transition-smooth">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-sm mb-1">Operations Wallet</h4>
              <p className="text-xs text-muted-foreground">2 of 3 signatures required</p>
            </div>
            <Badge className="bg-chart-1 text-white">Active</Badge>
          </div>
        </Card>
      </div>

      <Dialog
        open={connectDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseConnect()
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Initiate a WalletConnect session for your suite.
            </p>
          </DialogHeader>
          {dialogError && (
            <div className="mb-4 rounded border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {dialogError}
            </div>
          )}
          <ConnectExternalWallet
            key={connectDialogOpen ? "suite-wallet-dialog" : "suite-wallet-dialog-closed"}
            onConnect={handleWalletConnected}
            onError={setDialogError}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}


