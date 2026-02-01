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

export function SupplierHeader({ supplierName }: SupplierHeaderProps) {
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
  }

  const initials = useMemo(() => {
    const source = (supplierName || "Supplier").trim()
    const parts = source.split(/\s+/).filter(Boolean)
    if (parts.length === 0) return "S"
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
    <header
      className="
        sticky top-0 z-50 h-16 border-b border-border
        bg-card/80 backdrop-blur-xl supports-[not_(backdrop-filter)]:bg-card
        transition-colors duration-300
      "
    >
      <div className="mx-auto flex h-full max-w-screen-xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Logo size="sm" variant="adaptive" />
          <span className="text-muted-foreground text-sm">Supplier Portal</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="mx-1 h-6 w-px bg-border" />
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              aria-label="Profile menu"
              className={cn(
                "flex items-center gap-2.5 rounded-lg border px-2 py-1",
                "bg-card text-foreground",
                "transition-colors duration-200 cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                profileOpen ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary"
              )}
            >
              <div className="text-left">
                <p className="text-sm font-semibold leading-tight text-foreground">{supplierName || "Supplier"}</p>
                <p className="text-xs leading-tight text-muted-foreground">Supplier</p>
              </div>
              <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shadow-sm ring-2 ring-card">
                {initials}
              </div>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 flex-shrink-0 text-muted-foreground transition-transform duration-200",
                  profileOpen && "rotate-180"
                )}
              />
            </button>

            {profileOpen && (
              <div
                className="
                  absolute right-0 top-[calc(100%+8px)] z-50
                  w-56 rounded-xl border border-border bg-popover text-popover-foreground
                  shadow-xl animate-in fade-in-0 zoom-in-95
                "
                style={{ backgroundColor: "var(--popover)", opacity: 1 }}
              >
                <div className="flex items-center gap-3 border-b border-border bg-primary/[0.04] px-4 py-3.5">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shadow-sm">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{supplierName || "Supplier"}</p>
                    <p className="truncate text-xs text-muted-foreground">Supplier</p>
                  </div>
                </div>
                <div className="py-1">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors duration-100 cursor-pointer"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    Profile
                  </button>
                </div>
                <div className="border-t border-border" />
                <div className="py-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-error hover:bg-error/[0.08] transition-colors duration-100 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
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
