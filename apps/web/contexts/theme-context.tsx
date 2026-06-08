"use client"

import { getStorageItem, setStorageItem } from "@orya/shared-utils"
import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "system" | "dark"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  effectiveTheme: "light" | "dark"
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system")
  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    // Load theme from storage
    const loadTheme = async () => {
      try {
        const stored = await getStorageItem("orya-theme")
        if (stored === "dark") {
          setThemeState("dark")
        } else {
          setThemeState("system")
        }
      } catch (error) {
        console.error("Failed to load theme:", error)
      }
    }
    loadTheme()
  }, [])

  useEffect(() => {
    const effective: "light" | "dark" = theme === "dark" ? "dark" : "light"

    setEffectiveTheme(effective)

    // Apply theme to document
    const root = document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(effective)

    // Save to storage
    setStorageItem("orya-theme", theme)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  return <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}

