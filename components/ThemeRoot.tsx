"use client"
import { useEffect, useState } from "react"
import { ThemeProvider } from "@/components/theme-provider"

export default function ThemeRoot({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) return null

  return <ThemeProvider attribute="class" defaultTheme="system" enableSystem>{children}</ThemeProvider>
}
