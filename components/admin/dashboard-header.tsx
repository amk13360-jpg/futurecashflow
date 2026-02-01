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

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <div ref={bellRef} className="relative">
            <button
              type="button"
              onClick={() => { setBellOpen(!bellOpen); setProfileOpen(false) }}
              aria-label="Notifications"
              className="
                relative h-9 w-9 rounded-lg border border-border bg-card
                text-muted-foreground
                hover:border-primary hover:text-primary
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                transition-colors duration-200 cursor-pointer
                flex items-center justify-center
              "
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-error border-2 border-card" />
              )}
            </button>

            {bellOpen && (
              <div
                className="
                  absolute right-0 top-[calc(100%+8px)] z-50
                  w-80 rounded-xl border border-border bg-popover/100 text-popover-foreground
                  shadow-lg animate-in fade-in-0 zoom-in-95
                "
              >
                <div className="flex items-center justify-between border-b border-border px-4 pb-2.5 pt-3.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notifications</span>
                  <button type="button" className="text-xs font-semibold text-primary hover:underline">
                    Mark all read
                  </button>
                </div>
                {notifications.map((n, i) => (
                  <div
                    key={`${n.title}-${i}`}
                    className={cn(
                      "flex cursor-pointer gap-3 px-4 py-3 transition-colors duration-100",
                      "hover:bg-accent",
                      i < notifications.length - 1 && "border-b border-border",
                      n.unread && "bg-primary/[0.04]"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 flex-shrink-0 rounded-full",
                        n.unread ? "bg-primary" : "bg-border"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        "truncate text-sm",
                        n.unread ? "font-semibold text-foreground" : "font-medium text-foreground/70"
                      )}>
                        {n.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{n.sub}</p>
                    </div>
                    <span className="flex-shrink-0 text-xs text-muted-foreground">{n.time}</span>
                  </div>
                ))}
                <div className="border-t border-border px-4 py-2.5 text-center">
                  <button type="button" className="text-xs font-semibold text-primary hover:underline">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mx-1 h-6 w-px bg-border" />

          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => { setProfileOpen(!profileOpen); setBellOpen(false) }}
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
                <p className="text-sm font-semibold leading-tight text-foreground">{displayName}</p>
                <p className="text-xs leading-tight text-muted-foreground">{roleLabel}</p>
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
                  w-56 rounded-xl border border-border bg-popover/100 text-popover-foreground
                  shadow-lg animate-in fade-in-0 zoom-in-95
                "
              >
                <div className="flex items-center gap-3 border-b border-border bg-primary/[0.04] px-4 py-3.5">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shadow-sm">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
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
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors duration-100 cursor-pointer"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Settings
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
