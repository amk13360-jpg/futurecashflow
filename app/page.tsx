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
          <div className="rounded-full border bg-muted px-2 py-1 shadow-sm">
            <ThemeToggle className="h-9 rounded-full px-3 text-xs" />
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

          {/* CTA Button - AP Login Only */}
          <div className="flex justify-center items-center">
            <Link href="/login/ap" passHref>
              <Button 
                size="lg" 
                variant="outline" 
                className="hover:shadow-lg px-8 py-6 rounded-full min-w-[200px] font-semibold text-lg hover:scale-105 transition-all duration-200"
              >
                Accounts Payable Login
              </Button>
            </Link>
          </div>
          {/* Note: Suppliers access the platform via email invitation link only */}
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
