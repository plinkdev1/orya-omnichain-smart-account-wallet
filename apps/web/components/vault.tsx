"use client"
import { BalanceCard } from "@/components/balance-card"
import { BannerCarousel, type BannerCard } from "@/components/BannerCarousel"
import { ChainHealthIndicator } from "@/components/ChainHealthIndicator"
import { ChainSlider } from "@/components/chain-slider"
import { HamburgerMenu } from "@/components/hamburger-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { TransactionList } from "@/components/transaction-list"
import { VaultCustomizationModal } from "@/components/VaultCustomizationModal"
import { Button } from "@/components/ui/button"
import { useCopy } from "@/hooks/useCopy"
import { useVaultWidgetCustomization } from "@/hooks/useVaultWidgetCustomization"
import { ArrowDownLeft, ArrowUpRight, Bell, Download, Filter, Gift, Info, Layers, MoreHorizontal, Repeat, Search, Send, Settings, Sparkles } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

const ICON_MAP: Record<string, React.ReactNode> = {
  ArrowDownLeft: <ArrowDownLeft className="w-5 h-5" />,
  ArrowUpRight: <ArrowUpRight className="w-5 h-5" />,
  Send: <Send className="w-5 h-5" />,
  Repeat: <Repeat className="w-5 h-5" />,
  Info: <Info className="w-5 h-5" />,
  Layers: <Layers className="w-5 h-5" />,
  Download: <Download className="w-5 h-5" />,
  MoreHorizontal: <MoreHorizontal className="w-5 h-5" />,
};

const SAMPLE_BANNERS: BannerCard[] = [
  {
    id: 'sui-welcome',
    title: 'Welcome to ORŸA on SUI',
    description: 'Experience fast, low-cost transactions on the SUI blockchain',
    gradient: 'linear-gradient(135deg, #4DA2FF 0%, #2774C5 100%)',
    ctaText: 'Learn More',
    icon: <Sparkles className="w-6 h-6" />,
    onCtaClick: () => window.location.href = '/learn/sui',
  },
  {
    id: 'rewards-event',
    title: 'Earn Rewards This Week',
    description: 'Deposit $100+ and unlock exclusive rewards',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    ctaText: 'Deposit Now',
    icon: <Gift className="w-6 h-6" />,
    isDismissible: true,
    onCtaClick: () => console.log('Deposit flow started'),
  },
  {
    id: 'feature-update',
    title: 'New: Multi-chain Swaps',
    description: 'Swap tokens across SUI, EVM, and Solana instantly',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    ctaText: 'Try Now',
    isDismissible: true,
    onCtaClick: () => window.location.href = '/swap',
  },
]

export function Vault() {
  const [showFilters, setShowFilters] = useState(false)
  const [showCustomization, setShowCustomization] = useState(false)
  const [longPressActive, setLongPressActive] = useState(false)
  const [bannerCards, setBannerCards] = useState(SAMPLE_BANNERS)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const buttonsRef = useRef<HTMLDivElement>(null)
  
  const copy = useCopy()
  const { preferences, isLoaded, getVisibleActions } = useVaultWidgetCustomization('standard')

  useEffect(() => {
    const handleMouseDown = () => {
      longPressTimerRef.current = setTimeout(() => {
        setLongPressActive(true)
        setShowCustomization(true)
      }, 500)
    }

    const handleMouseUp = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
      setLongPressActive(false)
    }

    const element = buttonsRef.current
    if (element) {
      element.addEventListener('mousedown', handleMouseDown)
      element.addEventListener('mouseup', handleMouseUp)
      element.addEventListener('mouseleave', handleMouseUp)
      element.addEventListener('touchstart', () => {
        longPressTimerRef.current = setTimeout(() => {
          setLongPressActive(true)
          setShowCustomization(true)
        }, 500)
      })
      element.addEventListener('touchend', handleMouseUp)

      return () => {
        element.removeEventListener('mousedown', handleMouseDown)
        element.removeEventListener('mouseup', handleMouseUp)
        element.removeEventListener('mouseleave', handleMouseUp)
        element.removeEventListener('touchend', handleMouseUp)
      }
    }
  }, [])

  return (
    <div className="min-h-screen pb-24">
      <header className="px-6 pt-12 pb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">ORŸA</h1>
        </div>
        <div className="flex items-center gap-2">
          <ChainHealthIndicator />
          <ThemeToggle />
          <HamburgerMenu />
          <button className="p-2.5 rounded-full hover:bg-secondary/50 transition-smooth">
            <Bell className="w-5 h-5 text-muted-foreground" />
          </button>
          <Link href="/settings">
            <button className="p-2.5 rounded-full hover:bg-secondary/50 transition-smooth">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </button>
          </Link>
        </div>
      </header>

      <div className="px-6 mb-10">
        <p className="text-sm text-muted-foreground mb-3 font-medium">{copy.vault?.overview?.totalBalance || "Total Balance"}</p>
        <h2 className="text-4xl font-bold mb-3 tracking-tight">$124,856.42</h2>
        <p className="text-sm text-chart-1 font-medium">
          +$2,341.28 <span className="text-muted-foreground">(+1.91%)</span>
        </p>
      </div>

      <div className="px-6 mb-10" ref={buttonsRef}>
        {isLoaded && (
          <div className={`grid gap-3 ${preferences.rowLayout === 'three' ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {getVisibleActions().map((action) => (
              <Button
                key={action.id}
                className={`flex flex-col items-center gap-2.5 h-auto py-5 rounded-3xl transition-all duration-300 border-0 shadow-sm hover:shadow-lg ${
                  action.id === 'add-money'
                    ? 'bg-primary hover:bg-primary/90 hover:scale-105 text-primary-foreground'
                    : 'bg-white hover:bg-secondary hover:scale-105 text-foreground border border-border/50'
                }`}
                onClick={() => {
                  if (!longPressActive) {
                    console.log(`Clicked ${action.id}`)
                  }
                }}
              >
                {ICON_MAP[action.icon]}
                <span className="text-xs font-semibold text-center leading-tight">{action.label}</span>
              </Button>
            ))}
          </div>
        )}
      </div>

      <VaultCustomizationModal
        open={showCustomization}
        onOpenChange={setShowCustomization}
        walletType="standard"
      />

      <div className="px-6 mb-8">
        <BannerCarousel
          cards={bannerCards}
          autoScrollInterval={6000}
          showIndicators={true}
          showNavigationArrows={true}
          cardWidth="w-80"
          onCardClick={(cardId) => console.log(`Clicked banner: ${cardId}`)}
        />
      </div>

      <div className="px-6 mb-3">
        <ChainSlider />
      </div>

      <div className="px-6 mb-8 flex justify-end">
        <Link href="/chains" className="text-xs text-muted-foreground hover:text-primary transition-smooth font-medium">
          {copy.actions?.viewAllChains || "View All Chains"}
        </Link>
      </div>

      <div className="px-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={copy.vault?.search?.assets || "Search assets..."}
              className="w-full h-11 pl-10 pr-4 rounded-2xl border border-border/50 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-smooth text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="h-11 px-4 rounded-2xl border border-border/50 bg-white hover:bg-secondary transition-smooth flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">{copy.actions?.filter || "Filter"}</span>
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 p-4 rounded-2xl border border-border/50 bg-white shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-3">
              <button className="w-full text-left px-3 py-2 rounded-2xl hover:bg-secondary transition-smooth text-sm">
                {copy.vault?.filters?.allAssets || "All Assets"}
              </button>
              <button className="w-full text-left px-3 py-2 rounded-2xl hover:bg-secondary transition-smooth text-sm">
                {copy.vault?.filters?.favorites || "Favorites"}
              </button>
              <button className="w-full text-left px-3 py-2 rounded-2xl hover:bg-secondary transition-smooth text-sm">
                {copy.vault?.filters?.layer1 || "Layer 1"}
              </button>
              <button className="w-full text-left px-3 py-2 rounded-2xl hover:bg-secondary transition-smooth text-sm">
                {copy.vault?.filters?.layer2 || "Layer 2"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 mb-8">
        <h3 className="text-base font-semibold mb-4 text-muted-foreground">{copy.vault?.assets || "Assets"}</h3>
        <div className="space-y-2">
          <BalanceCard
            name="Ethereum"
            symbol="ETH"
            balance="12.4582"
            value="$45,234.12"
            change="+2.4%"
            positive={true}
            color="#627EEA"
          />
          <BalanceCard
            name="Solana"
            symbol="SOL"
            balance="234.56"
            value="$32,145.89"
            change="+5.2%"
            positive={true}
            color="#14F195"
          />
          <BalanceCard
            name="SUI"
            symbol="SUI"
            balance="1,245.00"
            value="$18,234.00"
            change="-1.2%"
            positive={false}
            color="#4DA2FF"
          />
          <BalanceCard
            name="USD Coin"
            symbol="USDC"
            balance="29,242.41"
            value="$29,242.41"
            change="0.0%"
            positive={true}
            color="#2775CA"
          />
        </div>
      </div>

      <div className="px-6 pb-6">
        <h3 className="text-base font-semibold mb-4 text-muted-foreground">{copy.vault?.recentActivity || "Recent Activity"}</h3>
        <TransactionList />
      </div>
    </div>
  )
}


