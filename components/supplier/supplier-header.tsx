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
      className="top-0 z-50 sticky bg-card supports-[not_(backdrop-filter)]:bg-card backdrop-blur-xl border-border border-b h-16 transition-colors duration-300"
    >
      <div className="flex justify-between items-center mx-auto px-4 sm:px-6 max-w-7xl h-full">
        <div className="flex items-center gap-3">
          <Logo size="sm" variant="adaptive" />
          <span className="text-muted-foreground text-sm">Supplier Portal</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="self-center bg-border w-px h-6" />
          <div ref={profileRef} className="relative flex items-center">
            <button
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              aria-label="Profile menu"
              className={cn(
                "flex items-center gap-2.5 px-2 py-1.5 border rounded-lg h-10",
                "bg-card text-foreground",
                "transition-colors duration-200 cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                profileOpen ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary"
              )}
            >
              <div className="flex justify-center items-center bg-primary/10 rounded-full w-7 h-7 font-bold text-primary text-xs shrink-0">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="font-medium text-foreground text-sm leading-none">{supplierName || "Supplier"}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground leading-none">Supplier</p>
              </div>
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 shrink-0",
                  profileOpen && "rotate-180"
                )}
              />
            </button>

            {profileOpen && (
              <div
                className="top-[calc(100%+4px)] right-0 z-60 absolute bg-popover slide-in-from-top-1 shadow-xl border border-border rounded-xl w-56 text-popover-foreground animate-in fade-in-0 zoom-in-95"
              >
                <div className="flex items-center gap-3 bg-primary/[0.04] px-4 py-3 border-border border-b rounded-t-xl">
                  <div className="flex justify-center items-center bg-primary/10 rounded-full w-9 h-9 font-bold text-primary text-xs shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{supplierName || "Supplier"}</p>
                    <p className="text-muted-foreground text-xs truncate">Supplier</p>
                  </div>
                </div>
                <div className="py-1">
                  <button
                    type="button"
                    className="flex items-center gap-2.5 hover:bg-accent px-4 py-2.5 w-full font-medium text-foreground text-sm transition-colors duration-100 cursor-pointer"
                  >
                    <User className="w-4 h-4 text-muted-foreground" />
                    Profile
                  </button>
                </div>
                <div className="border-border border-t" />
                <div className="py-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 hover:bg-error/[0.08] px-4 py-2.5 w-full font-medium text-error text-sm transition-colors duration-100 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
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
