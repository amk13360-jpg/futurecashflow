"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/ui/logo"
import { useMemo } from "react"

interface SupplierHeaderProps {
  supplierName?: string
}

export function SupplierHeader({ supplierName }: SupplierHeaderProps) {
  const router = useRouter()

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

  return (
    <header className="bg-card border-b">
      <div className="mx-auto px-4 py-4 container">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo size="md" variant="adaptive" />
            <span className="ml-2 text-muted-foreground text-sm">Supplier Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle className="h-9 rounded-full px-3 text-xs" />
            {supplierName && (
              <div className="flex items-center gap-3 rounded-full border bg-muted/30 px-3 py-1.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  {initials}
                </div>
                <div className="leading-tight">
                  <p className="font-medium text-foreground text-sm">{supplierName}</p>
                  <p className="text-muted-foreground text-xs">Supplier</p>
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
