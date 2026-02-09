"use client"

import { useRouter } from "next/navigation"
import { LogOut, Bell, ChevronDown, Settings, User } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/ui/logo"
import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface DashboardHeaderProps {
  userName?: string
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const router = useRouter()
  const [sessionRole, setSessionRole] = useState<string | null>(null)
  const [sessionName, setSessionName] = useState<string | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
  }

  useEffect(() => {
    let mounted = true
    fetch('/api/session')
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return
        setSessionRole(data?.role || null)
        setSessionName(data?.fullName || data?.username || null)
      })
      .catch(() => {
        if (!mounted) return
        setSessionRole(null)
      })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const displayName = userName || sessionName || "Admin User"
  const roleLabel =
    sessionRole === 'admin'
      ? 'Administrator'
      : sessionRole === 'accounts_payable'
        ? 'Accounts Payable'
        : sessionRole === 'supplier'
          ? 'Supplier'
          : ''

  const initials = useMemo(() => {
    const source = (displayName || "User").trim()
    const parts = source.split(/\s+/).filter(Boolean)
    if (parts.length === 0) return "U"
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }, [displayName])

  const notifications = [
    { title: "New invoice uploaded", sub: "INV-2025-0048 · Acme Mining", time: "2m ago", unread: true },
    { title: "Payment completed", sub: "R145,000 disbursed", time: "18m ago", unread: true },
    { title: "Approval required", sub: "Cession #CA-2025-12", time: "1h ago", unread: false },
  ]
  const unreadCount = notifications.filter((n) => n.unread).length

  return (
    <header className="top-0 z-50 sticky bg-card supports-[not_(backdrop-filter)]:bg-card backdrop-blur-xl border-border border-b h-16 transition-colors duration-300">
      <div className="flex justify-between items-center mx-auto px-4 sm:px-6 max-w-7xl h-full">
        <div className="flex items-center gap-3">
          <Logo size="sm" variant="adaptive" />
          <span className="text-muted-foreground text-sm">
            {sessionRole === 'admin'
              ? 'Admin Dashboard'
              : sessionRole === 'accounts_payable'
                ? 'Accounts Payable Dashboard'
                : sessionRole === 'supplier'
                  ? 'Supplier Dashboard'
                  : 'Dashboard'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <div ref={bellRef} className="relative flex items-center">
            <button
              type="button"
              onClick={() => { setBellOpen(!bellOpen); setProfileOpen(false) }}
              aria-label="Notifications"
              className="relative flex justify-center items-center bg-card border border-border hover:border-primary rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-10 h-10 text-muted-foreground hover:text-primary transition-colors duration-200 cursor-pointer"
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadCount > 0 && (
                <span className="top-1.5 right-1.5 absolute bg-error border-2 border-card rounded-full w-2 h-2" />
              )}
            </button>

            {bellOpen && (
              <div
                className="top-[calc(100%+4px)] right-0 z-60 absolute bg-popover slide-in-from-top-1 shadow-xl border border-border rounded-xl w-80 text-popover-foreground animate-in fade-in-0 zoom-in-95"
              >
                <div className="flex justify-between items-center px-4 pt-3.5 pb-2.5 border-border border-b">
                  <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">Notifications</span>
                  <button type="button" className="font-semibold text-primary text-xs hover:underline">
                    Mark all read
                  </button>
                </div>
                {notifications.map((n, i) => (
                  <div
                    key={`${n.title}-${i}`}
                    className={cn(
                      "flex gap-3 px-4 py-3 transition-colors duration-100 cursor-pointer",
                      "hover:bg-accent",
                      i < notifications.length - 1 && "border-b border-border",
                      n.unread && "bg-primary/[0.04]"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1.5 rounded-full w-2 h-2 shrink-0",
                        n.unread ? "bg-primary" : "bg-border"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm truncate",
                        n.unread ? "font-semibold text-foreground" : "font-medium text-foreground/70"
                      )}>
                        {n.title}
                      </p>
                      <p className="text-muted-foreground text-xs truncate">{n.sub}</p>
                    </div>
                    <span className="text-muted-foreground text-xs shrink-0">{n.time}</span>
                  </div>
                ))}
                <div className="px-4 py-2.5 border-border border-t text-center">
                  <button type="button" className="font-semibold text-primary text-xs hover:underline">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="self-center mx-1 bg-border w-px h-6" />

          <div ref={profileRef} className="relative flex items-center">
            <button
              type="button"
              onClick={() => { setProfileOpen(!profileOpen); setBellOpen(false) }}
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
                <p className="font-medium text-foreground text-sm leading-none">{displayName}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground leading-none">{roleLabel}</p>
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
                    <p className="font-medium text-foreground text-sm truncate">{displayName}</p>
                    <p className="text-muted-foreground text-xs truncate">{roleLabel}</p>
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
                  <button
                    type="button"
                    className="flex items-center gap-2.5 hover:bg-accent px-4 py-2.5 w-full font-medium text-foreground text-sm transition-colors duration-100 cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    Settings
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
