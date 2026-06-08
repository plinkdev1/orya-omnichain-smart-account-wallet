"use client"

import { Sun, Moon } from "lucide-react"
import { useTheme } from "@/contexts/theme-context"
import { useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [isAnimating, setIsAnimating] = useState(false)

  const handleThemeChange = (newTheme: "system" | "dark") => {
    if (newTheme === theme) return

    setIsAnimating(true)

    // Create ripple effect
    const ripple = document.createElement("div")
    ripple.className = "theme-ripple"
    document.body.appendChild(ripple)

    setTimeout(() => {
      setTheme(newTheme)
      setTimeout(() => {
        ripple.remove()
        setIsAnimating(false)
      }, 600)
    }, 100)
  }

  return (
    <div className="flex items-center gap-1 p-1 rounded-full bg-secondary/50 backdrop-blur-sm">
      <button
        onClick={() => handleThemeChange("system")}
        className={`p-2 rounded-full transition-all duration-300 ${
          theme === "system"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        }`}
        aria-label="Light mode"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleThemeChange("dark")}
        className={`p-2 rounded-full transition-all duration-300 ${
          theme === "dark"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        }`}
        aria-label="Dark mode"
      >
        <Moon className="w-4 h-4" />
      </button>
    </div>
  )
}


