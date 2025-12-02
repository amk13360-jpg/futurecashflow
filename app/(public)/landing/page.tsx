"use client"
import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

// Logo with brand blue (solid, no animation)
export const LogoIcon = ({ className = "w-12 h-12" }) => (
  <div className="relative">
    <svg aria-hidden="true" className={className} fill="currentColor" viewBox="0 0 80 80">
      {/* Top arrow */}
      <path d="M40 8L16 32H26L40 18L54 32H64L40 8Z" />
      {/* Bottom arrow */}
      <path d="M40 28L16 52H26L40 38L54 52H64L40 28Z" />
    </svg>
  </div>
)

// Footer
const Footer = () => {
  return (
    <footer className="bg-gray-900 py-16 text-gray-300">
      <div className="mx-auto px-4 container">
        <div className="text-center">
          <div className="flex justify-center items-center gap-3 mb-6">
            <LogoIcon className="w-8 h-8 text-primary" />
            <span className="font-bold text-white text-xl">Future Cashflow</span>
          </div>
          <p className="mb-6 text-base">Future Cashflow (Pty) Ltd is a registered Credit Provider NCRCP18174</p>
          <div className="text-sm">&copy; 2025 Future Cashflow. All Rights Reserved.</div>
        </div>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <div className="bg-background text-foreground">
      <div className="flex flex-col justify-center items-center min-h-screen">
        <main className="flex flex-col justify-center items-center mx-auto p-4 max-w-4xl text-center">
          <div className="flex justify-center items-center gap-4 mb-12">
            {/* Static chevrons (no animation) */}
            <span className="flex flex-col">
              <svg width="56" height="56" viewBox="0 0 40 40" fill="none">
                <path d="M20 8L12 16H16L20 12L24 16H28L20 8Z" className="fill-primary" />
                <path d="M20 18L12 26H16L20 22L24 26H28L20 18Z" className="fill-primary" />
              </svg>
            </span>
            <span className="font-bold text-primary text-3xl md:text-4xl lg:text-5xl">Future Cashflow</span>
          </div>

          <div className="flex sm:flex-row flex-col justify-center items-center gap-4">
            <Link href="/login/admin" passHref>
              <Button size="lg" className="px-8 py-6 rounded-full min-w-[200px] font-semibold text-lg">
                Admin Login
              </Button>
            </Link>
            <Link href="/login/ap" passHref>
              <Button size="lg" variant="outline" className="px-8 py-6 rounded-full min-w-[200px] font-semibold text-lg">
                AP Login
              </Button>
            </Link>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
