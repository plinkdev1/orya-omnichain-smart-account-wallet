import { ServiceWorkerRegister } from "@/lib/sw-register"
import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import type React from "react"
import "./globals.css"
import { Providers } from "./providers"
import AppKitModal from "@/components/AppKitModal"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ORŸA — Premium Digital Wallet",
  description: "Multi-chain crypto and fiat wallet with concierge services",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} font-sans antialiased`}>
        <Providers>
          {children}
          <AppKitModal />
          <Analytics />
          <ServiceWorkerRegister />
        </Providers>
      </body>
    </html>
  )
}

