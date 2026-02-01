"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/ui/logo"
import { useEffect, useMemo, useState } from "react"

interface DashboardHeaderProps {
  userName?: string
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const router = useRouter()
  const [sessionRole, setSessionRole] = useState<string | null>(null)
  const [sessionName, setSessionName] = useState<string | null>(null)

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

  const displayName = userName || sessionName
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

  return (
    <header className="bg-card border-b">
      <div className="mx-auto px-4 py-4 container">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo size="md" variant="adaptive" />
            <span className="ml-2 text-muted-foreground text-sm">
              {sessionRole === 'admin' ? 'Admin Dashboard' : sessionRole === 'accounts_payable' ? 'Accounts Payable Dashboard' : sessionRole === 'supplier' ? 'Supplier Dashboard' : 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle className="h-9 rounded-full px-3 text-xs" />
            {displayName && (
              <div className="flex items-center gap-3 rounded-full border bg-muted/30 px-3 py-1.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  {initials}
                </div>
                <div className="leading-tight">
                  <p className="font-medium text-foreground text-sm">{displayName}</p>
                  <p className="text-muted-foreground text-xs">{roleLabel}</p>
                </div>
              </div>
            )}
            <Button variant="outline" size="sm" className="h-9 rounded-full" onClick={handleLogout}>
              <LogOut className="mr-2 w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
