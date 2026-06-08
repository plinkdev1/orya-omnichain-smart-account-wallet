"use client"

import { HamburgerMenu } from "@/components/hamburger-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, ExternalLink, Filter, Grid3x3, List, Search, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const nfts = [
  { id: 1, name: "Cosmic Dreams #142", chain: "Ethereum", price: "2.5 ETH", image: "/abstract-cosmic-art.jpg" },
  { id: 2, name: "Digital Essence #89", chain: "Solana", price: "45 SOL", image: "/digital-abstract.png" },
  { id: 3, name: "Quantum Realm #301", chain: "Polygon", price: "150 MATIC", image: "/quantum-abstract.jpg" },
  { id: 4, name: "Ethereal Waves #56", chain: "Base", price: "0.8 ETH", image: "/ethereal-waves.jpg" },
  { id: 5, name: "Neon Genesis #234", chain: "Arbitrum", price: "1.2 ETH", image: "/neon-abstract.jpg" },
  { id: 6, name: "Prism Shift #78", chain: "Optimism", price: "0.95 ETH", image: "/prism-colors.jpg" },
]

export default function CurioPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedNFT, setSelectedNFT] = useState<number | null>(null)

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
            <h1 className="text-3xl font-bold">Curio</h1>
            <p className="text-muted-foreground font-serif">NFT Gallery</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <HamburgerMenu />
        </div>
      </header>

      {/* Featured NFT Carousel */}
      <Card className="card-3d p-6 mb-6 border-0 shadow-xl bg-gradient-to-br from-primary/10 to-card overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-chart-2 to-chart-3 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">Featured Collection</p>
            <h3 className="text-xl font-bold mb-2">Cosmic Dreams</h3>
            <p className="text-sm text-muted-foreground mb-3">Limited edition digital art collection</p>
            <Button size="sm" className="rounded-full">
              View Collection
            </Button>
          </div>
        </div>
      </Card>

      {/* Search and Filters */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search NFTs..."
            className="w-full h-11 pl-10 pr-4 rounded-2xl border border-border/50 bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 transition-smooth text-sm"
          />
        </div>
        <Button variant="outline" size="icon" className="rounded-2xl bg-transparent">
          <Filter className="w-4 h-4" />
        </Button>
        <div className="flex gap-1 p-1 rounded-2xl border border-border/50 bg-card">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            className="rounded-xl h-9 w-9"
            onClick={() => setViewMode("grid")}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            className="rounded-xl h-9 w-9"
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* NFT Grid */}
      <div className={viewMode === "grid" ? "grid grid-cols-2 gap-4" : "space-y-3"}>
        {nfts.map((nft) => (
          <Card
            key={nft.id}
            className="card-3d border-0 shadow-lg overflow-hidden cursor-pointer group"
            onClick={() => setSelectedNFT(nft.id)}
          >
            <div className="aspect-square bg-gradient-to-br from-chart-2/20 to-chart-3/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
              <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-smooth">
                <Button size="sm" className="w-full rounded-full">
                  <ShoppingCart className="w-3 h-3 mr-2" />
                  Quick Buy
                </Button>
              </div>
            </div>
            <div className="p-4">
              <h4 className="font-semibold mb-1 text-sm">{nft.name}</h4>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{nft.chain}</span>
                <span className="text-sm font-bold text-primary">{nft.price}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Expanded NFT Detail Modal */}
      {selectedNFT && (
        <div
          className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setSelectedNFT(null)}
        >
          <Card className="max-w-md w-full p-6 border-0 shadow-2xl" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="aspect-square bg-gradient-to-br from-chart-2/20 to-chart-3/20 rounded-2xl mb-4" />
            <h3 className="text-2xl font-bold mb-2">{nfts.find((n) => n.id === selectedNFT)?.name}</h3>
            <p className="text-muted-foreground mb-4">Chain: {nfts.find((n) => n.id === selectedNFT)?.chain}</p>
            <div className="flex gap-3">
              <Button className="flex-1 rounded-full">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Buy Now
              </Button>
              <Button variant="outline" className="flex-1 rounded-full bg-transparent">
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Marketplace
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}


