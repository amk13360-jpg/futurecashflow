"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/ui/logo"

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
    <header className="bg-card border-b">
      <div className="mx-auto px-4 py-4 container">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <span className="ml-2 text-muted-foreground text-sm">Admin Dashboard</span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {userName && (
              <div className="text-right">
                <p className="font-medium text-foreground text-sm">{userName}</p>
                <p className="text-muted-foreground text-xs">Administrator</p>
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
