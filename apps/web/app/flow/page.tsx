"use client"

import { HamburgerMenu } from "@/components/hamburger-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PortfolioOverview } from "@/components/dashboard/PortfolioOverview"
import { TransactionHistory } from "@/components/dashboard/TransactionHistory"
import { formatCurrency, formatNumber } from "@orya/shared-utils"
import { AlertCircle, ArrowLeft, ArrowLeftRight, ArrowRight, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useWallet } from "@orya/wallet-core"

export default function FlowPage() {
  const { selectedWallet } = useWallet()
  const [transferType, setTransferType] = useState<"fiat-to-crypto" | "crypto-to-fiat">("fiat-to-crypto")
  const [step, setStep] = useState(1)
  const [amount, setAmount] = useState("")

  if (!selectedWallet) {
    return (
      <div className="min-h-screen px-6 pt-8 pb-24 flex items-center justify-center">
        <p className="text-muted-foreground">Please connect a wallet</p>
      </div>
    )
  }

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
            <h1 className="text-3xl font-bold">Flow</h1>
            <p className="text-muted-foreground font-serif">Portfolio & Fiat ↔ Crypto Bridge</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <HamburgerMenu />
        </div>
      </header>

      <Tabs defaultValue="portfolio" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="flow">Flow</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="space-y-6">
          <PortfolioOverview
            address={selectedWallet.address}
            chainId={selectedWallet.chainId}
          />
          <TransactionHistory
            address={selectedWallet.address}
            chainId={selectedWallet.chainId}
          />
        </TabsContent>

        <TabsContent value="flow" className="space-y-6">
          {/* Transfer Type Selector */}
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setTransferType("fiat-to-crypto")
                setStep(1)
              }}
              className={`flex-1 h-12 rounded-2xl transition-all duration-300 ${
                transferType === "fiat-to-crypto"
                  ? "bg-primary text-primary-foreground"
                  : "bg-white text-foreground border border-border hover:bg-secondary"
              }`}
            >
              Fiat → Crypto
            </Button>
            <Button
              onClick={() => {
                setTransferType("crypto-to-fiat")
                setStep(1)
              }}
              className={`flex-1 h-12 rounded-2xl transition-all duration-300 ${
                transferType === "crypto-to-fiat"
                  ? "bg-primary text-primary-foreground"
                  : "bg-white text-foreground border border-border hover:bg-secondary"
              }`}
            >
              Crypto → Fiat
            </Button>
          </div>

          {/* Transfer Wizard */}
          <Card className="card-3d p-6 mb-6 border-0 shadow-xl bg-gradient-to-br from-white to-secondary">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">{transferType === "fiat-to-crypto" ? "Buy Crypto" : "Sell Crypto"}</h3>
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      s === step ? "bg-primary w-6" : s < step ? "bg-primary/50" : "bg-border"
                    }`}
                  />
                ))}
              </div>
            </div>

            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    {transferType === "fiat-to-crypto" ? "You Pay (Fiat)" : "You Sell (Crypto)"}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                      className="flex-1 h-12 text-lg"
                    />
                    <select className="h-12 px-4 rounded-xl border border-border bg-white text-sm font-semibold">
                      {transferType === "fiat-to-crypto" ? (
                        <>
                          <option>USD</option>
                          <option>EUR</option>
                          <option>GBP</option>
                        </>
                      ) : (
                        <>
                          <option>ETH</option>
                          <option>SOL</option>
                          <option>USDC</option>
                        </>
                      )}
                    </select>
                  </div>
                  {amount && Number.parseFloat(amount) > 0 && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-chart-1" />
                      Amount validated
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    {transferType === "fiat-to-crypto" ? "You Receive (Crypto)" : "You Receive (Fiat)"}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="0.00"
                      value={amount ? formatNumber(Number.parseFloat(amount) * 0.000298, 6) : ""}
                      disabled
                      className="flex-1 h-12 text-lg bg-secondary/50"
                    />
                    <select className="h-12 px-4 rounded-xl border border-border bg-white text-sm font-semibold">
                      {transferType === "fiat-to-crypto" ? (
                        <>
                          <option>ETH</option>
                          <option>SOL</option>
                          <option>USDC</option>
                        </>
                      ) : (
                        <>
                          <option>USD</option>
                          <option>EUR</option>
                          <option>GBP</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Exchange Rate</span>
                    <span className="text-xs font-semibold">1 ETH = $3,356.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Processing Fee</span>
                    <span className="text-xs font-semibold">0.5%</span>
                  </div>
                </div>

                <Button
                  onClick={() => setStep(2)}
                  disabled={!amount || Number.parseFloat(amount) <= 0}
                  className="w-full h-12 bg-primary hover:bg-primary/90 hover:scale-105 text-primary-foreground transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed glow-gold"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                    <ArrowLeftRight className="w-8 h-8 text-primary" />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    {transferType === "fiat-to-crypto" ? "Payment Method" : "Withdrawal Method"}
                  </label>
                  <select className="w-full h-12 px-4 rounded-xl border border-border bg-white text-sm">
                    {transferType === "fiat-to-crypto" ? (
                      <>
                        <option>Credit/Debit Card •••• 4242</option>
                        <option>Bank Account •••• 1234</option>
                        <option>Apple Pay</option>
                      </>
                    ) : (
                      <>
                        <option>Bank Account •••• 1234</option>
                        <option>PayPal</option>
                      </>
                    )}
                  </select>
                </div>

                {transferType === "fiat-to-crypto" && (
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Destination Chain</label>
                    <select className="w-full h-12 px-4 rounded-xl border border-border bg-white text-sm">
                      <option>Ethereum (ERC-20)</option>
                      <option>Polygon</option>
                      <option>Arbitrum</option>
                      <option>Base</option>
                    </select>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Estimated Time</p>
                  <p className="text-sm font-semibold">
                    {transferType === "fiat-to-crypto" ? "Instant - 5 minutes" : "1-3 business days"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => setStep(1)} variant="outline" className="flex-1 h-12">
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    className="flex-1 h-12 bg-primary hover:bg-primary/90 hover:scale-105 text-primary-foreground transition-all duration-300"
                  >
                    Review
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="p-4 rounded-xl bg-secondary/50 border border-border/50 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">You Pay</span>
                    <span className="text-sm font-semibold">{amount} USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">You Receive</span>
                    <span className="text-sm font-semibold">
                      {amount ? formatNumber(Number.parseFloat(amount) * 0.000298, 6) : "0"} ETH
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Fee</span>
                    <span className="text-sm font-semibold">
                      {amount ? formatCurrency(Number.parseFloat(amount) * 0.005) : "$0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="text-sm font-semibold">
                      {amount ? formatCurrency(Number.parseFloat(amount) * 1.005) : "$0.00"}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <p className="text-xs text-foreground font-serif leading-relaxed">
                    Your {transferType === "fiat-to-crypto" ? "crypto purchase" : "withdrawal"} will be processed securely.
                    You'll receive a confirmation once complete.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => setStep(2)} variant="outline" className="flex-1 h-12">
                    Back
                  </Button>
                  <Button
                    onClick={() => {
                      // Reset wizard
                      setStep(1)
                      setAmount("")
                    }}
                    className="flex-1 h-12 bg-primary hover:bg-primary/90 hover:scale-105 text-primary-foreground transition-all duration-300 glow-gold"
                  >
                    Confirm
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
        </Card>

          {/* Transaction History */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
            <div className="space-y-2">
              {[
                { type: "Buy", amount: "$500.00", crypto: "0.149 ETH", date: "Today, 2:30 PM", status: "completed" },
                { type: "Sell", amount: "$1,200.00", crypto: "8.5 SOL", date: "Yesterday", status: "completed" },
                { type: "Buy", amount: "$250.00", crypto: "250 USDC", date: "Oct 27", status: "pending" },
              ].map((tx, index) => (
                <Card key={index} className="p-4 border-0 shadow-sm hover:shadow-md transition-smooth">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.status === "completed" ? "bg-chart-1/20" : "bg-primary/20"
                        }`}
                      >
                        {tx.status === "completed" ? (
                          <CheckCircle2 className="w-5 h-5 text-chart-1" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {tx.type} {tx.crypto}
                        </p>
                        <p className="text-xs text-muted-foreground">{tx.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{tx.amount}</p>
                      <p className="text-xs text-muted-foreground capitalize">{tx.status}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}


