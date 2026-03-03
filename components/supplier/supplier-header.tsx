"use client"

import { useRouter } from "next/navigation"
import { LogOut, ChevronDown, User } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/ui/logo"
import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface SupplierHeaderProps {
  supplierName?: string
}

export function SupplierHeader({ supplierName: supplierNameProp }: SupplierHeaderProps) {
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)
  const [sessionName, setSessionName] = useState<string | null>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!supplierNameProp) {
      fetch("/api/session")
        .then((res) => res.json())
        .then((data) => setSessionName(data?.fullName || data?.username || null))
        .catch(() => {})
    }
  }, [supplierNameProp])

  const supplierName = supplierNameProp || sessionName || undefined

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
  }

  const initials = useMemo(() => {
    const source = (supplierName || "Supplier").trim()
    const parts = source.split(/\s+/).filter(Boolean)
    if (parts.length === 0) return "SU"
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }, [supplierName])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <header className="top-0 z-50 sticky bg-card/95 backdrop-blur-sm border-border border-b h-16">
      {/* Single-row, full-height flex container — nothing grows vertically */}
      <div className="flex justify-between items-center mx-auto px-4 sm:px-6 max-w-7xl h-full">

        {/* ── LEFT: Logo icon + brand name + portal badge ── */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Logo icon only (no built-in text — we render text ourselves for full control) */}
          <Logo size="sm" variant="adaptive" showText={false} />

          {/* Vertical divider */}
          <div className="bg-border w-px h-5 shrink-0" />

          {/* Brand name + portal sub-label stacked, tightly */}
          <div className="flex flex-col justify-center gap-0 leading-none">
            <span className="font-semibold text-[13px] text-foreground leading-[1.2] tracking-tight">
              Future Cashflow
            </span>
            <span className="text-[11px] text-muted-foreground uppercase leading-[1.3] tracking-wide">
              Supplier Portal
            </span>
          </div>
        </div>

        {/* ── RIGHT: Theme toggle + avatar dropdown ── */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Theme toggle — same height context as the pill */}
          <ThemeToggle />

          {/* Vertical divider */}
          <div className="bg-border w-px h-5 shrink-0" />

          {/* Avatar + name + role pill button */}
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              aria-label="Profile menu"
              aria-expanded={profileOpen}
              aria-haspopup="true"
              className={cn(
                // Base: horizontal flex, fixed height, pill border
                "flex items-center gap-2 h-9 pl-1.5 pr-2.5 rounded-full border transition-colors duration-150 cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                profileOpen
                  ? "bg-accent border-primary ring-2 ring-primary/15"
                  : "bg-card border-border hover:border-primary hover:bg-accent/50"
              )}
            >
              {/* Avatar circle */}
              <div className="flex justify-center items-center bg-primary/10 rounded-full w-6 h-6 font-bold text-[11px] text-primary select-none shrink-0">
                {initials}
              </div>

              {/* Name + role — hidden on xs */}
              <div className="hidden sm:flex flex-col justify-center items-start gap-0 leading-none">
                <span className="font-semibold text-[12px] text-foreground leading-[1.2] whitespace-nowrap">
                  {supplierName || "Supplier"}
                </span>
                <span className="text-[10px] text-muted-foreground leading-[1.3] whitespace-nowrap">
                  Supplier
                </span>
              </div>

              {/* Chevron */}
              <ChevronDown
                className={cn(
                  "w-3 h-3 text-muted-foreground transition-transform duration-200 shrink-0",
                  profileOpen && "rotate-180"
                )}
              />
            </button>

            {/* Dropdown menu */}
            {profileOpen && (
              <div className="top-[calc(100%+6px)] right-0 z-50 absolute bg-popover slide-in-from-top-1 shadow-lg border border-border rounded-xl w-52 animate-in fade-in-0 zoom-in-95">
                {/* User identity header */}
                <div className="flex items-center gap-3 bg-primary/[0.04] px-4 py-3 border-border border-b rounded-t-xl">
                  <div className="flex justify-center items-center bg-primary/10 rounded-full w-9 h-9 font-bold text-primary text-xs shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate leading-none">
                      {supplierName || "Supplier"}
                    </p>
                    <p className="mt-0.5 text-muted-foreground text-xs leading-none">Supplier</p>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    type="button"
                    className="flex items-center gap-2.5 hover:bg-accent px-4 py-2.5 w-full font-medium text-foreground text-sm transition-colors duration-100"
                  >
                    <User className="w-4 h-4 text-muted-foreground shrink-0" />
                    Profile
                  </button>
                </div>

                <div className="border-border border-t" />

                <div className="py-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 hover:bg-destructive/[0.08] px-4 py-2.5 w-full font-medium text-destructive text-sm transition-colors duration-100"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
