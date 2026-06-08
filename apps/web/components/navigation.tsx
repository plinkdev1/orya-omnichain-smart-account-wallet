"use client"

import { useCopy } from "@/hooks/useCopy"
import { cn } from "@/lib/utils"
import { ArrowLeftRight, Award, Building2, Headphones, Wallet } from "lucide-react"

interface NavigationProps {
  activeTab: "vault" | "link" | "circle" | "care" | "suite"
  setActiveTab: (tab: "vault" | "link" | "circle" | "care" | "suite") => void
}

export function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  const copy = useCopy()

  const tabs = [
    { id: "vault" as const, label: copy.nav?.vault || "Vault", icon: Wallet },
    { id: "link" as const, label: copy.nav?.link || "Link", icon: ArrowLeftRight },
    { id: "circle" as const, label: copy.nav?.circle || "Circle", icon: Award },
    { id: "care" as const, label: copy.nav?.care || "Care", icon: Headphones },
    { id: "suite" as const, label: copy.nav?.suite || "Suite", icon: Building2 },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-border/50 shadow-sm">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 px-5 py-2.5 rounded-2xl transition-smooth",
                isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-semibold">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}


