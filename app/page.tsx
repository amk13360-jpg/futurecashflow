"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

// Logo with brand blue (no animation)
export const LogoIcon = ({ className = "w-12 h-12" }) => (
  <div className="relative">
    <svg aria-hidden="true" className={className} fill="currentColor" viewBox="0 0 80 80">
      <path d="M40 8L16 32H26L40 18L54 32H64L40 8Z" />
      <path d="M40 28L16 52H26L40 38L54 52H64L40 28Z" />
    </svg>
  </div>
)

// Header
const Header = () => {
  return (
    <header className="top-0 right-0 left-0 z-50 fixed bg-background/80 backdrop-blur-sm border-b">
      <div className="mx-auto px-4 py-4 container">
        <div className="flex justify-end items-center">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

export default function HomePage() {
  return (
    <div className="bg-background h-screen overflow-hidden text-foreground">
      <Header />
      <div className="flex flex-col justify-center items-center h-full">
        <main className="flex flex-col justify-center items-center mx-auto p-4 max-w-4xl text-center">
          {/* Hero Logo */}
          <div className="flex justify-center items-center gap-4 mb-6">
            <span className="flex flex-col">
              <svg width="64" height="64" viewBox="0 0 40 40" fill="none">
                <path d="M20 8L12 16H16L20 12L24 16H28L20 8Z" className="fill-primary" />
                <path d="M20 18L12 26H16L20 22L24 26H28L20 18Z" className="fill-primary" />
              </svg>
            </span>
            <span className="font-bold text-primary text-3xl md:text-4xl lg:text-5xl">Future Cashflow</span>
          </div>

          {/* Tagline */}
          <p className="text-muted-foreground text-lg mb-10 max-w-md">
            Supply Chain Finance for the Mining Industry
          </p>

          {/* CTA Buttons */}
          <div className="flex sm:flex-row flex-col justify-center items-center gap-4">
            <Link href="/login/admin" passHref>
              <Button 
                size="lg" 
                className="px-8 py-6 rounded-full min-w-[200px] font-semibold text-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                Admin Login
              </Button>
            </Link>
            <Link href="/login/ap" passHref>
              <Button 
                size="lg" 
                variant="outline" 
                className="px-8 py-6 rounded-full min-w-[200px] font-semibold text-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                AP Login
              </Button>
            </Link>
          </div>
        </main>

        {/* Footer - subtle at bottom */}
        <footer className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-muted-foreground text-xs">
            © 2025 Future Cashflow (Pty) Ltd · Registered Credit Provider NCRCP18174
          </p>
        </footer>
      </div>
    </div>
  )
}
