"use client"

import type React from "react"

import { useState } from "react"
import {
  Menu,
  X,
  Wallet,
  ArrowLeftRight,
  Award,
  Headphones,
  Building2,
  Network,
  Repeat,
  BarChart3,
  Settings,
  ImageIcon,
  TrendingUp,
  Blocks,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface MenuItem {
  id: string
  label: string
  icon: React.ElementType
  href: string
}

const menuItems: MenuItem[] = [
  { id: "vault", label: "Vault", icon: Wallet, href: "/" },
  { id: "link", label: "Link", icon: ArrowLeftRight, href: "/?tab=link" },
  { id: "flow", label: "Flow", icon: Repeat, href: "/flow" },
  { id: "insights", label: "Insights", icon: BarChart3, href: "/insights" },
  { id: "curio", label: "Curio", icon: ImageIcon, href: "/curio" },
  { id: "grove", label: "Grove", icon: TrendingUp, href: "/grove" },
  { id: "nexus", label: "Nexus", icon: Blocks, href: "/nexus" },
  { id: "circle", label: "Circle", icon: Award, href: "/?tab=circle" },
  { id: "care", label: "Care", icon: Headphones, href: "/?tab=care" },
  { id: "suite", label: "Suite", icon: Building2, href: "/?tab=suite" },
  { id: "chains", label: "All Chains", icon: Network, href: "/chains" },
  { id: "atrium", label: "Atrium", icon: Sparkles, href: "/atrium" },
  { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
]

export function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2.5 rounded-full hover:bg-secondary/50 transition-smooth"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-muted-foreground" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 transition-smooth"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={cn(
          "fixed top-0 right-0 h-full w-80 bg-background shadow-2xl z-50 transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 pt-12 pb-8 border-b border-border/50">
            <h2 className="text-xl font-bold tracking-tight">ORŸA</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2.5 rounded-full hover:bg-secondary/50 transition-smooth"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-secondary/50 transition-smooth group"
                    >
                      <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-smooth">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-base font-semibold text-foreground">{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="px-6 py-6 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center">
              ORŸA Digital Wallet
              <br />
              Version 1.0.0
            </p>
          </div>
        </div>
      </div>
    </>
  )
}


