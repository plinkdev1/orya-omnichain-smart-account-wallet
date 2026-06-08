"use client"

import { useCopy } from "@/hooks/useCopy"
import { ArrowDownLeft, ArrowUpRight, Repeat } from "lucide-react"

const getTransactions = (copy: any) => [
  {
    type: "send",
    title: copy.flow?.transactionTypes?.sent || "Sent ETH",
    address: "0x742d...3f4a",
    amount: "-2.45 ETH",
    value: "-$8,234.50",
    time: copy.vault?.timeAgo?.twoHoursAgo || "2 hours ago",
  },
  {
    type: "receive",
    title: copy.flow?.transactionTypes?.received || "Received USDC",
    address: "0x8a3c...9d2b",
    amount: "+5,000 USDC",
    value: "+$5,000.00",
    time: copy.vault?.timeAgo?.fiveHoursAgo || "5 hours ago",
  },
  {
    type: "swap",
    title: copy.flow?.transactionTypes?.swapped || "Swapped SOL → ETH",
    address: "1inch",
    amount: "50 SOL → 0.8 ETH",
    value: "$2,145.00",
    time: copy.vault?.timeAgo?.oneDayAgo || "1 day ago",
  },
  {
    type: "receive",
    title: copy.flow?.transactionTypes?.received || "Received SUI",
    address: "0x1f2e...7c8d",
    amount: "+125 SUI",
    value: "+$1,825.00",
    time: copy.vault?.timeAgo?.twoDaysAgo || "2 days ago",
  },
]

export function TransactionList() {
  const copy = useCopy()
  const transactions = getTransactions(copy)

  return (
    <div className="space-y-2">
      {transactions.map((tx, index) => {
        const Icon = tx.type === "send" ? ArrowUpRight : tx.type === "receive" ? ArrowDownLeft : Repeat
        const isNegative = tx.type === "send"

        return (
          <div
            key={index}
            className="bg-card p-4 rounded-2xl hover:bg-secondary/30 transition-smooth cursor-pointer border border-transparent hover:border-border/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <Icon className="w-5 h-5 text-card-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold text-base text-card-foreground">{tx.title}</h4>
                  <p className="text-sm text-muted-foreground">{tx.address}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold text-base ${isNegative ? "text-card-foreground" : "text-chart-1"}`}>
                  {tx.value}
                </p>
                <p className="text-sm text-muted-foreground">{tx.time}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}


