"use client"

import BlockchainIcon from "@/components/BlockchainIcon"
import { getBlockchainIconName, hasBlockchainIcon } from "@/lib/blockchainMapping"
import { useRef } from "react"

const chains = [
  { name: "Ethereum" },
  { name: "Solana" },
  { name: "SUI" },
  { name: "Aptos" },
  { name: "Polygon" },
  { name: "Arbitrum" },
  { name: "Optimism" },
  { name: "Bitcoin" },
  { name: "Cardano" },
  { name: "Avalanche" },
  { name: "Fantom" },
  { name: "Near" },
]

export function ChainSlider() {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div className="relative">
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
        {chains.map((chain, index) => (
          <button
            key={index}
            className="flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-secondary transition-smooth group"
          >
            {hasBlockchainIcon(chain.name) ? (
              <div className="w-12 h-12 rounded-full bg-secondary/30 shadow-md flex items-center justify-center group-hover:scale-110 transition-smooth overflow-hidden">
                <BlockchainIcon 
                  chainName={getBlockchainIconName(chain.name)} 
                  size={48}
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-secondary shadow-md flex items-center justify-center group-hover:scale-110 transition-smooth">
                <span className="text-xs font-bold">{chain.name.slice(0, 2).toUpperCase()}</span>
              </div>
            )}
            <span className="text-xs font-medium text-muted-foreground">{chain.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}


