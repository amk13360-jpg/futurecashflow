"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
// Modern Logo Component (copied from /login/admin)
const LogoIcon = ({ className = "h-8 w-8 text-blue-600" }) => (
  <div className="relative">
    <svg aria-hidden="true" className={className} fill="currentColor" viewBox="0 0 80 80">
      <path d="M40 8L16 32H26L40 18L54 32H64L40 8Z" />
      <path d="M40 28L16 52H26L40 38L54 52H64L40 28Z" />
    </svg>
  </div>
)
import { ThemeToggle } from "@/components/theme-toggle"

interface DashboardHeaderProps {
  userName?: string
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
  }

  return (
    <header className="border-b bg-brand-blue text-primary-foreground">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoIcon className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-blue-600">Future</span>
            <div className="w-px h-8 bg-blue-600/70" />
            <span className="text-xl font-bold whitespace-nowrap text-blue-600">Finance Cashflow</span>
            <p className="text-sm text-brand-blue-soft ml-4">Admin Dashboard</p>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {userName && (
              <div className="text-right">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
