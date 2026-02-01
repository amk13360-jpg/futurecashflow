"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/ui/logo"
import { useEffect, useState } from "react"

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

  return (
    <header className="bg-card border-b">
      <div className="mx-auto px-4 py-4 container">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo size="md" variant="default" />
            <span className="ml-2 text-muted-foreground text-sm">
              {sessionRole === 'admin' ? 'Admin Dashboard' : sessionRole === 'accounts_payable' ? 'Accounts Payable Dashboard' : sessionRole === 'supplier' ? 'Supplier Dashboard' : 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {(userName || sessionName) && (
              <div className="text-right">
                <p className="font-medium text-foreground text-sm">{userName || sessionName}</p>
                <p className="text-muted-foreground text-xs">
                  {sessionRole === 'admin' ? 'Administrator' : sessionRole === 'accounts_payable' ? 'Accounts Payable' : sessionRole === 'supplier' ? 'Supplier' : ''}
                </p>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
