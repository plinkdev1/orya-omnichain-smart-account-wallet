"use client"

import BlockchainIcon from "@/components/BlockchainIcon"
import { HamburgerMenu } from "@/components/hamburger-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { getBlockchainIconName, hasBlockchainIcon } from "@/lib/blockchainMapping"
import { ArrowLeft, ExternalLink, Search } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const chains = [
  { name: "Ethereum", symbol: "ETH", color: "#627EEA", category: "Layer 1" },
  { name: "Solana", symbol: "SOL", color: "#14F195", category: "Layer 1" },
  { name: "BSC", symbol: "BNB", color: "#F3BA2F", category: "Layer 1" },
  { name: "Bitcoin", symbol: "BTC", color: "#F7931A", category: "Layer 1" },
  { name: "Tron", symbol: "TRX", color: "#FF0013", category: "Layer 1" },
  { name: "Base", symbol: "BASE", color: "#0052FF", category: "Layer 2" },
  { name: "Plasma", symbol: "PLASMA", color: "#8B5CF6", category: "Layer 2" },
  { name: "Arbitrum", symbol: "ARB", color: "#28A0F0", category: "Layer 2" },
  { name: "Hyperliquid L1", symbol: "HYPE", color: "#00D4AA", category: "Layer 1" },
  { name: "Avalanche", symbol: "AVAX", color: "#E84142", category: "Layer 1" },
  { name: "Sui", symbol: "SUI", color: "#4DA2FF", category: "Layer 1" },
  { name: "Polygon", symbol: "MATIC", color: "#8247E5", category: "Layer 2" },
  { name: "Linea", symbol: "LINEA", color: "#121212", category: "Layer 2" },
  { name: "Aptos", symbol: "APT", color: "#00D4AA", category: "Layer 1" },
  { name: "Katana", symbol: "KATANA", color: "#FF6B6B", category: "Layer 2" },
  { name: "Cronos", symbol: "CRO", color: "#002D74", category: "Layer 1" },
  { name: "Sei", symbol: "SEI", color: "#FF0000", category: "Layer 1" },
  { name: "Mantle", symbol: "MNT", color: "#000000", category: "Layer 2" },
  { name: "Berachain", symbol: "BERA", color: "#FF8C00", category: "Layer 1" },
  { name: "Vaulta", symbol: "VAULTA", color: "#D4C29E", category: "Layer 1" },
  { name: "OP Mainnet", symbol: "OP", color: "#FF0420", category: "Layer 2" },
  { name: "Cardano", symbol: "ADA", color: "#0033AD", category: "Layer 1" },
  { name: "Unichain", symbol: "UNI", color: "#FF007A", category: "Layer 2" },
  { name: "BOB", symbol: "BOB", color: "#FFA500", category: "Layer 2" },
  { name: "Hemi", symbol: "HEMI", color: "#6366F1", category: "Layer 2" },
  { name: "Movement", symbol: "MOVE", color: "#00C9A7", category: "Layer 1" },
  { name: "Hydration", symbol: "HDX", color: "#00D4FF", category: "Layer 1" },
  { name: "Plume Mainnet", symbol: "PLUME", color: "#9333EA", category: "Layer 1" },
  { name: "Ink", symbol: "INK", color: "#1E293B", category: "Layer 2" },
  { name: "Scroll", symbol: "SCR", color: "#FFEEDA", category: "Layer 2" },
  { name: "Starknet", symbol: "STRK", color: "#EC796B", category: "Layer 2" },
  { name: "PulseChain", symbol: "PLS", color: "#00D4AA", category: "Layer 1" },
  { name: "Rootstock", symbol: "RBTC", color: "#00A651", category: "Layer 2" },
  { name: "Flare", symbol: "FLR", color: "#E31F26", category: "Layer 1" },
  { name: "Sonic", symbol: "S", color: "#0066FF", category: "Layer 1" },
  { name: "Gnosis", symbol: "GNO", color: "#04795B", category: "Layer 1" },
  { name: "Provenance", symbol: "HASH", color: "#5B21B6", category: "Layer 1" },
  { name: "CORE", symbol: "CORE", color: "#FF9500", category: "Layer 1" },
  { name: "dYdX", symbol: "DYDX", color: "#6966FF", category: "Layer 1" },
  { name: "GOAT", symbol: "GOAT", color: "#8B4513", category: "Layer 1" },
  { name: "Stellar", symbol: "XLM", color: "#000000", category: "Layer 1" },
  { name: "Stacks", symbol: "STX", color: "#5546FF", category: "Layer 2" },
  { name: "TON", symbol: "TON", color: "#0088CC", category: "Layer 1" },
  { name: "Near", symbol: "NEAR", color: "#000000", category: "Layer 1" },
  { name: "Flow", symbol: "FLOW", color: "#00EF8B", category: "Layer 1" },
  { name: "Hedera", symbol: "HBAR", color: "#000000", category: "Layer 1" },
  { name: "Mixin", symbol: "XIN", color: "#0066FF", category: "Layer 1" },
  { name: "XRPL", symbol: "XRP", color: "#23292F", category: "Layer 1" },
  { name: "Etherlink", symbol: "XTZ", color: "#2C7DF7", category: "Layer 2" },
  { name: "Soneium", symbol: "SONE", color: "#FF6B9D", category: "Layer 2" },
  { name: "XPR Network", symbol: "XPR", color: "#784FFE", category: "Layer 1" },
  { name: "Kava", symbol: "KAVA", color: "#FF564F", category: "Layer 1" },
  { name: "Fraxtal", symbol: "FRAX", color: "#000000", category: "Layer 2" },
  { name: "Algorand", symbol: "ALGO", color: "#000000", category: "Layer 1" },
  { name: "Blast", symbol: "BLAST", color: "#FCFC03", category: "Layer 2" },
  { name: "Thorchain", symbol: "RUNE", color: "#00CCFF", category: "Layer 1" },
  { name: "Celo", symbol: "CELO", color: "#FBCC5C", category: "Layer 1" },
  { name: "World Chain", symbol: "WLD", color: "#000000", category: "Layer 2" },
  { name: "BSquared", symbol: "B²", color: "#FF6B00", category: "Layer 2" },
  { name: "Merlin", symbol: "MERL", color: "#7C3AED", category: "Layer 2" },
  { name: "Osmosis", symbol: "OSMO", color: "#5E12A0", category: "Layer 1" },
  { name: "Abstract", symbol: "ABS", color: "#6366F1", category: "Layer 2" },
  { name: "TAC", symbol: "TAC", color: "#00D4AA", category: "Layer 1" },
  { name: "ZKsync Era", symbol: "ZK", color: "#8C8DFC", category: "Layer 2" },
  { name: "Reya Chain", symbol: "REYA", color: "#FF0080", category: "Layer 1" },
  { name: "Verus", symbol: "VRSC", color: "#3165D4", category: "Layer 1" },
  { name: "Ronin", symbol: "RON", color: "#1273EA", category: "Layer 2" },
  { name: "Tezos", symbol: "XTZ", color: "#2C7DF7", category: "Layer 1" },
  { name: "ENI", symbol: "ENI", color: "#00C9A7", category: "Layer 1" },
  { name: "Neutron", symbol: "NTRN", color: "#000000", category: "Layer 1" },
  { name: "MultiversX", symbol: "EGLD", color: "#000000", category: "Layer 1" },
  { name: "Metis", symbol: "METIS", color: "#00DACC", category: "Layer 2" },
  { name: "Bifrost Network", symbol: "BFC", color: "#5B21B6", category: "Layer 1" },
  { name: "Botanix", symbol: "BTC", color: "#00D4AA", category: "Layer 2" },
  { name: "Injective", symbol: "INJ", color: "#00D4AA", category: "Layer 1" },
  { name: "opBNB", symbol: "BNB", color: "#F3BA2F", category: "Layer 2" },
  { name: "Kaia", symbol: "KAIA", color: "#FF6B6B", category: "Layer 1" },
  { name: "X Layer", symbol: "OKB", color: "#000000", category: "Layer 2" },
  { name: "Filecoin", symbol: "FIL", color: "#0090FF", category: "Layer 1" },
  { name: "Swellchain", symbol: "SWELL", color: "#0066FF", category: "Layer 2" },
  { name: "Corn", symbol: "CORN", color: "#FFD700", category: "Layer 2" },
  { name: "Rollux", symbol: "SYS", color: "#0066FF", category: "Layer 2" },
  { name: "Story", symbol: "STORY", color: "#8B5CF6", category: "Layer 1" },
  { name: "Doge", symbol: "DOGE", color: "#C3A634", category: "Layer 1" },
  { name: "Waves", symbol: "WAVES", color: "#0055FF", category: "Layer 1" },
  { name: "ICP", symbol: "ICP", color: "#29ABE2", category: "Layer 1" },
  { name: "Chainflip", symbol: "FLIP", color: "#00D4AA", category: "Layer 1" },
  { name: "IOTA", symbol: "IOTA", color: "#000000", category: "Layer 1" },
  { name: "Cronos zkEVM", symbol: "CRO", color: "#002D74", category: "Layer 2" },
  { name: "Immutable zkEVM", symbol: "IMX", color: "#0B0E11", category: "Layer 2" },
  { name: "Manta", symbol: "MANTA", color: "#000000", category: "Layer 2" },
  { name: "XDC", symbol: "XDC", color: "#00D4AA", category: "Layer 1" },
  { name: "FSC", symbol: "FSC", color: "#FF6B00", category: "Layer 1" },
  { name: "WEMIX3.0", symbol: "WEMIX", color: "#FF0080", category: "Layer 1" },
  { name: "Moonbeam", symbol: "GLMR", color: "#53CBC9", category: "Layer 1" },
  { name: "Lisk", symbol: "LSK", color: "#0D47A1", category: "Layer 2" },
  { name: "Sophon", symbol: "SOPH", color: "#6366F1", category: "Layer 2" },
  { name: "Icon", symbol: "ICX", color: "#00D4AA", category: "Layer 1" },
  { name: "NEO", symbol: "NEO", color: "#58BF00", category: "Layer 1" },
  { name: "ZetaChain", symbol: "ZETA", color: "#00D4AA", category: "Layer 1" },
  { name: "Bitlayer", symbol: "BTR", color: "#FF6B00", category: "Layer 2" },
  { name: "Mayachain", symbol: "CACAO", color: "#00CCFF", category: "Layer 1" },
  { name: "Conflux", symbol: "CFX", color: "#00D4AA", category: "Layer 1" },
  { name: "Bitcoincash", symbol: "BCH", color: "#8DC351", category: "Layer 1" },
  { name: "Morph", symbol: "MORPH", color: "#8B5CF6", category: "Layer 2" },
  { name: "IoTeX", symbol: "IOTX", color: "#00D4AA", category: "Layer 1" },
  { name: "Initia", symbol: "INIT", color: "#FF0080", category: "Layer 1" },
  { name: "ApeChain", symbol: "APE", color: "#0052FF", category: "Layer 2" },
  { name: "Fantom", symbol: "FTM", color: "#1969FF", category: "Layer 1" },
  { name: "MAP Protocol", symbol: "MAP", color: "#00D4AA", category: "Layer 1" },
  { name: "aelf", symbol: "ELF", color: "#2B5DF0", category: "Layer 1" },
  { name: "Zircuit", symbol: "ZRC", color: "#8B5CF6", category: "Layer 2" },
  { name: "Ontology", symbol: "ONT", color: "#00D4AA", category: "Layer 1" },
  { name: "Radix", symbol: "XRD", color: "#052CC0", category: "Layer 1" },
  { name: "Fuel Ignition", symbol: "FUEL", color: "#00D4AA", category: "Layer 2" },
  { name: "Nibiru", symbol: "NIBI", color: "#8B5CF6", category: "Layer 1" },
  { name: "Saga", symbol: "SAGA", color: "#000000", category: "Layer 1" },
  { name: "Chiliz", symbol: "CHZ", color: "#CD0124", category: "Layer 1" },
  { name: "Secret", symbol: "SCRT", color: "#000000", category: "Layer 1" },
  { name: "K2", symbol: "K2", color: "#00D4AA", category: "Layer 1" },
  { name: "Telos", symbol: "TLOS", color: "#571AFF", category: "Layer 1" },
  { name: "Vite", symbol: "VITE", color: "#007AFF", category: "Layer 1" },
  { name: "IOTA EVM", symbol: "IOTA", color: "#000000", category: "Layer 2" },
  { name: "Venom", symbol: "VENOM", color: "#00D4AA", category: "Layer 1" },
  { name: "DFS Network", symbol: "DFS", color: "#FF6B00", category: "Layer 1" },
  { name: "VeChain", symbol: "VET", color: "#15BDFF", category: "Layer 1" },
  { name: "Wanchain", symbol: "WAN", color: "#136AAD", category: "Layer 1" },
  { name: "Gravity by Galxe", symbol: "G", color: "#8B5CF6", category: "Layer 1" },
  { name: "Terra2", symbol: "LUNA", color: "#FFD83D", category: "Layer 1" },
  { name: "Eclipse", symbol: "ECLP", color: "#000000", category: "Layer 2" },
  { name: "Aurora", symbol: "AURORA", color: "#70D44B", category: "Layer 2" },
  { name: "Vision", symbol: "VS", color: "#00D4AA", category: "Layer 1" },
  { name: "Canto", symbol: "CANTO", color: "#06FC99", category: "Layer 1" },
  { name: "Boba", symbol: "BOBA", color: "#CBFF00", category: "Layer 2" },
  { name: "KUB", symbol: "KUB", color: "#00D4AA", category: "Layer 1" },
  { name: "Elys", symbol: "ELYS", color: "#8B5CF6", category: "Layer 1" },
  { name: "Ethereal", symbol: "ETH", color: "#627EEA", category: "Layer 2" },
  { name: "Mode", symbol: "MODE", color: "#DFFE00", category: "Layer 2" },
  { name: "Polynomial", symbol: "POLY", color: "#8B5CF6", category: "Layer 2" },
  { name: "Somnia", symbol: "SOM", color: "#FF0080", category: "Layer 1" },
  { name: "Dexalot", symbol: "ALOT", color: "#E31F71", category: "Layer 2" },
  { name: "Fluence", symbol: "FLT", color: "#00D4AA", category: "Layer 1" },
  { name: "Gala", symbol: "GALA", color: "#000000", category: "Layer 1" },
  { name: "Peaq", symbol: "PEAQ", color: "#00D4AA", category: "Layer 1" },
  { name: "OKTChain", symbol: "OKT", color: "#000000", category: "Layer 1" },
  { name: "Nuls", symbol: "NULS", color: "#82C341", category: "Layer 1" },
  { name: "Ergo", symbol: "ERG", color: "#FF6B00", category: "Layer 1" },
  { name: "Astar", symbol: "ASTR", color: "#0066FF", category: "Layer 1" },
  { name: "Echelon Initia", symbol: "ECH", color: "#8B5CF6", category: "Layer 2" },
  { name: "HashKey Chain", symbol: "HSK", color: "#000000", category: "Layer 1" },
  { name: "Taiko", symbol: "TAIKO", color: "#E81899", category: "Layer 2" },
]

export default function ChainsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("All")

  const categories = ["All", "Layer 1", "Layer 2"]

  const filteredChains = chains.filter((chain) => {
    const matchesSearch =
      chain.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chain.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || chain.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">All Chains</h1>
              <p className="text-sm text-muted-foreground font-serif">{filteredChains.length} supported networks</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <HamburgerMenu />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search chains..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-2xl border-border/50 focus:border-primary transition-smooth"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mt-4 overflow-x-auto hide-scrollbar">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full whitespace-nowrap transition-smooth ${
                selectedCategory === category ? "bg-primary text-primary-foreground glow-gold" : "hover:bg-secondary"
              }`}
            >
              {category}
            </Button>
          ))}
        </div>
      </header>

      {/* Chains Grid */}
      <div className="px-6 pt-6">
        <div className="grid grid-cols-1 gap-3">
          {filteredChains.map((chain) => (
            <Card
              key={chain.name}
              className="card-3d p-4 border-border/50 hover:border-primary/30 transition-smooth cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Chain Icon - Using BlockchainIcon component */}
                  {hasBlockchainIcon(chain.name) ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center bg-secondary/50">
                      <BlockchainIcon 
                        chainName={getBlockchainIconName(chain.name)} 
                        size={48}
                        className="w-12 h-12"
                      />
                    </div>
                  ) : (
                    /* Fallback for chains without dedicated icons */
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm"
                      style={{ backgroundColor: chain.color }}
                      title={`No dedicated icon for ${chain.name}`}
                    >
                      {chain.symbol.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  {/* Chain Info */}
                  <div>
                    <h3 className="font-semibold text-base">{chain.name}</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">{chain.symbol}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        {chain.category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 transition-smooth">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredChains.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground font-serif">No chains found</p>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  )
}


