"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/ui/logo"
import { BRAND } from "@/lib/constants/brand"

// Header
const Header = () => {
  return (
    <header className="top-0 right-0 left-0 z-50 fixed bg-background backdrop-blur-sm border-b">
      <div className="mx-auto px-4 py-4 container">
        <div className="flex justify-end items-center">
          <div className="bg-muted shadow-sm px-2 py-1 border rounded-full">
            <ThemeToggle className="px-3 rounded-full h-9 text-xs" />
          </div>
        </div>
      </div>
    </header>
  )
}

export default function HomePage() {
  return (
    <div className="bg-background h-screen overflow-hidden text-foreground">
      <Header />
      <div className="relative flex flex-col justify-center items-center h-full">
        <main className="flex flex-col justify-center items-center mx-auto p-4 max-w-4xl text-center">
          {/* Hero Logo - Using standardized Logo component */}
          <div className="mb-6">
            <Logo size="xl" variant="blue" className="scale-125" />
          </div>

          {/* Tagline */}
          <p className="mb-10 max-w-md text-muted-foreground text-lg">
            Supply Chain Finance for the Mining Industry
          </p>

          {/* Note: All users access the platform via direct portal links or email invitation */}
        </main>

        {/* Footer - subtle at bottom */}
        <footer className="right-0 bottom-4 left-0 absolute text-center">
          <p className="text-muted-foreground text-xs">
            {BRAND.footerText}
          </p>
        </footer>
      </div>
    </div>
  )
}
