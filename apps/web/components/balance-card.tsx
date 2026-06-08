"use client"

import BlockchainIcon from "@/components/BlockchainIcon"
import { getBlockchainIconName, hasBlockchainIcon } from "@/lib/blockchainMapping"
import { TrendingDown, TrendingUp } from "lucide-react"

interface BalanceCardProps {
  name: string
  symbol: string
  balance: string
  value: string
  change: string
  positive: boolean
  color?: string
}

export function BalanceCard({ name, symbol, balance, value, change, positive }: BalanceCardProps) {
  return (
    <div className="bg-card p-4 rounded-2xl hover:bg-secondary/30 transition-smooth cursor-pointer border border-transparent hover:border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {hasBlockchainIcon(name) ? (
            <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center overflow-hidden">
              <BlockchainIcon 
                chainName={getBlockchainIconName(name)} 
                size={40}
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-sm font-bold text-card-foreground">{symbol.slice(0, 2).toUpperCase()}</span>
            </div>
          )}
          <div>
            <h4 className="font-semibold text-base text-card-foreground">{name}</h4>
            <p className="text-sm text-muted-foreground">
              {balance} {symbol}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold text-base mb-0.5 text-card-foreground">{value}</p>
          <div
            className={`flex items-center justify-end gap-1 text-sm ${positive ? "text-chart-1" : "text-destructive"}`}
          >
            {positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span className="font-medium">{change}</span>
          </div>
        </div>
      </div>
    </div>
  )
}


