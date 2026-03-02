"use client"

import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { LogOut, Bell, ChevronDown, Settings, User, ChevronRight } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/ui/logo"
import { useEffect, useMemo, useRef, useState } from "react"

interface DashboardHeaderProps {
  userName?: string
}

/**
 * Redesigned DashboardHeader
 * - Single brand anchor via `Logo` (no duplicate product title)
 * - Clear page context (small, lower-weight secondary label)
 * - Grouped icon buttons (theme + notifications)
 * - Avatar + name becomes a single dropdown trigger (role moved inside menu)
 * - Improved dark-mode separation via subtle border/shadow
 */
export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [sessionRole, setSessionRole] = useState<string | null>(null)
  const [sessionName, setSessionName] = useState<string | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLDivElement>(null)

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

  const pageContextSection = sessionRole === 'admin'
    ? 'Admin'
    : sessionRole === 'accounts_payable'
      ? 'Accounts Payable'
      : sessionRole === 'supplier'
        ? 'Supplier'
        : 'Dashboard'

  const pageTitle = 'Dashboard'

  // Role-aware navigation: each role gets its own set of primary links and home URL
  const homeHref = sessionRole === 'supplier'
    ? '/supplier/dashboard'
    : sessionRole === 'accounts_payable'
      ? '/ap/dashboard'
      : '/admin'

  const navLinks = useMemo(() => {
    if (sessionRole === 'supplier') {
      return [
        { href: '/supplier/dashboard', label: 'Dashboard' },
        { href: '/supplier/offers', label: 'Offers' },
        { href: '/supplier/cession-agreement', label: 'Cession Agreement' },
      ]
    }
    if (sessionRole === 'accounts_payable') {
      return [
        { href: '/ap/dashboard', label: 'Dashboard' },
        { href: '/ap/invoices', label: 'Invoices' },
        { href: '/ap/vendors', label: 'Vendors' },
      ]
    }
    // Default: admin
    return [
      { href: '/admin/dashboard', label: 'Dashboard' },
      { href: '/admin/buyers', label: 'Buyers' },
      { href: '/admin/offer-batches', label: 'Offer Batches' },
    ]
  }, [sessionRole])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  return (
    <header className="top-0 z-50 sticky bg-card/95 shadow-sm backdrop-blur-sm border-border border-b">
      <div className="flex justify-between items-center mx-auto px-4 sm:px-6 max-w-7xl h-16">
        {/* Left: Brand anchor + page context */}
        <div className="flex items-center gap-4">
          <a href={homeHref} aria-label="Future Cashflow home" className="inline-flex items-center no-underline">
            <Logo size="md" variant="adaptive" showText={true} />
          </a>

          <div className="hidden sm:flex flex-col">
            <span className="text-muted-foreground text-sm">{pageContextSection}</span>
            <span className="font-medium text-foreground text-sm">{pageTitle}</span>
          </div>
        </div>

        {/* Center: optional breadcrumb for larger screens (screen-reader includes product for full path) */}
        <div className="hidden md:flex items-center gap-6">
          <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-4">
            {navLinks.map((link) => {
              const active = pathname?.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${active ? 'font-medium text-foreground bg-accent' : 'text-muted-foreground hover:text-foreground hover:bg-transparent'}`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          <nav aria-label="Breadcrumb" className="hidden md:flex items-center text-muted-foreground text-sm">
            <ol className="flex items-center gap-2">
              <li className="sr-only">Future Cashflow</li>
              <li className="flex items-center gap-2">
                <span className="text-muted-foreground">{pageContextSection}</span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
              </li>
              <li className="font-medium text-foreground">{pageTitle}</li>
            </ol>
          </nav>
        </div>

        {/* Right: Icon group + profile dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ThemeToggle />

            <div ref={bellRef} className="relative">
              <button
                type="button"
                onClick={() => { setBellOpen(!bellOpen); setProfileOpen(false) }}
                aria-label="Notifications"
                aria-expanded={bellOpen}
                aria-haspopup="true"
                className="relative flex justify-center items-center bg-card border border-border hover:border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 w-10 h-10 text-muted-foreground"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="inline-flex -top-0.5 -right-0.5 absolute justify-center items-center bg-error rounded-full w-4 h-4 text-[10px] text-white">{unreadCount}</span>
                )}
              </button>

              {bellOpen && (
                <div className="top-[calc(100%+8px)] right-0 absolute bg-popover shadow-lg border border-border rounded-lg w-80">
                  <div className="flex justify-between items-center px-4 py-3 border-border border-b">
                    <span className="text-muted-foreground text-xs uppercase tracking-wide">Notifications</span>
                    <button type="button" className="text-primary text-xs">Mark all read</button>
                  </div>
                  <div className="max-h-64 overflow-auto">
                    {notifications.map((n, i) => (
                      <div key={i} className={`flex gap-3 px-4 py-3 ${n.unread ? 'bg-primary/[0.04]' : ''} ${i < notifications.length - 1 ? 'border-b border-border' : ''}`}>
                        <span className={`${n.unread ? 'bg-primary' : 'bg-border'} mt-1.5 rounded-full w-2 h-2`} />
                        <div className="flex-1 min-w-0">
                          <p className={`${n.unread ? 'font-semibold text-foreground' : 'font-medium text-foreground/70'} text-sm truncate`}>{n.title}</p>
                          <p className="text-muted-foreground text-xs truncate">{n.sub}</p>
                        </div>
                        <span className="text-muted-foreground text-xs shrink-0">{n.time}</span>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 border-border border-t text-center">
                    <button type="button" className="text-primary text-xs">View all</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => { setProfileOpen(!profileOpen); setBellOpen(false) }}
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              className="flex items-center gap-2.5 bg-card px-2 py-1.5 border border-border hover:border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <div className="flex justify-center items-center bg-primary/10 rounded-full w-8 h-8 font-semibold text-primary">{initials}</div>
              <span className="hidden sm:inline font-medium text-foreground text-sm">{displayName}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileOpen && (
              <div className="top-[calc(100%+8px)] right-0 absolute bg-popover shadow-lg border border-border rounded-lg w-56">
                <div className="flex items-center gap-3 bg-primary/[0.04] px-4 py-3 border-border border-b">
                  <div className="flex justify-center items-center bg-primary/10 rounded-full w-9 h-9 font-bold text-primary">{initials}</div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{displayName}</p>
                    <p className="text-muted-foreground text-xs truncate">{roleLabel}</p>
                  </div>
                </div>
                <div className="py-1">
                  <button type="button" className="flex items-center gap-2.5 hover:bg-accent px-4 py-2.5 w-full font-medium text-foreground text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    Profile
                  </button>
                  <button type="button" className="flex items-center gap-2.5 hover:bg-accent px-4 py-2.5 w-full font-medium text-foreground text-sm">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    Settings
                  </button>
                </div>
                <div className="border-border border-t">
                  <button onClick={handleLogout} type="button" className="flex items-center gap-2.5 hover:bg-error/[0.08] px-4 py-2.5 w-full font-medium text-error text-sm">
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
