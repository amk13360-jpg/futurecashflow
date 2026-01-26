"use client"
import { useEffect, useState } from "react"
import { ThemeProvider } from "@/components/theme-provider"

export default function ThemeRoot({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Render children immediately but only apply theme after mount to prevent hydration mismatch
  // Using suppressHydrationWarning on the html element instead of returning null
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  )
}
