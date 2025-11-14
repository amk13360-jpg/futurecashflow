import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"
import ThemeRoot from "@/components/ThemeRoot"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  fallback: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
  preload: true,
  adjustFontFallback: true,
})

export const metadata: Metadata = {
  title: {
    default: "Future Mining Finance - African Mining Supply Chain Finance Reimagined",
    template: "%s | Future Mining Finance",
  },
  description:
    "Future Mining Finance is a fintech and funding platform enabling mining companies to offer early payment programs for SMEs in their supply chain. Future Mining Finance (Pty) Ltd is a registered Credit Provider NCRCP18174.",
  keywords: [
    "Future Mining Finance",
    "NCRCP18174",
    "registered credit provider",
    "mining finance",
    "supply chain finance",
    "fintech",
    "African mining",
    "SME financing",
    "early payment programs",
    "invoice factoring",
    "cash flow solutions",
    "mining suppliers",
    "accounts payable integration",
    "South Africa mining",
    "mining technology",
    "supplier development",
  ],
  authors: [{ name: "Future Mining Finance (Pty) Ltd" }],
  creator: "Future Mining Finance",
  publisher: "Future Mining Finance",
  generator: "v0.app",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
  colorScheme: "light",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} font-sans antialiased`}>
        <ThemeRoot>
          {children}
          <Toaster />
          <Analytics />
        </ThemeRoot>
      </body>
    </html>
  )
}
