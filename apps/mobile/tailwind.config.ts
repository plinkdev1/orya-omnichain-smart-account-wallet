import type { Config } from "tailwindcss"

const config = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // ORYA Sui-aligned palette - Light Mode
        "orya-cream": "#FDFCF7",
        "orya-pale-gold": "#D4C29E",
        "orya-charcoal": "#1A1A1A",
        "orya-aqua": "#C0E6FF",

        // ORYA Sui-aligned palette - Dark Mode
        "orya-ocean": "#030F1C",
        "orya-sea-blue": "#4DA2FF",
        "orya-neon-gold": "#FFD700",

        // Legacy colors (for gradual migration)
        "bone-white": "#F8F6F1",
        "pale-gold": "#D4C29E",
        "deep-charcoal": "#1A1A1A",
        "dark-bg": "#111111",

        // Chart colors
        "chart-1": "#22c55e",
        "chart-2": "#3b82f6",
        "chart-3": "#f59e0b",
        "chart-4": "#ef4444",
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        "inter-tight": ['Inter Tight', 'Inter', 'sans-serif'],
      },
      spacing: {
        "safe": "env(safe-area-inset-bottom)",
      },
    },
  },
  plugins: [],
} satisfies Config

export default config