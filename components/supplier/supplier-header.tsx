"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Users, LogOut } from "lucide-react"

interface SupplierHeaderProps {
  supplierName?: string
}

export function SupplierHeader({ supplierName }: SupplierHeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
  }

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Modern Logo and branding, matching /login/admin */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <svg aria-hidden="true" className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 80 80">
                  <path d="M40 8L16 32H26L40 18L54 32H64L40 8Z" />
                  <path d="M40 28L16 52H26L40 38L54 52H64L40 28Z" />
                </svg>
              </div>
              <span className="font-bold text-blue-600">Future</span>
              <div className="w-px h-8 bg-blue-600/70" />
              <span className="font-bold whitespace-nowrap text-blue-600">Finance Cashflow</span>
            </div>
            {supplierName && <p className="text-sm text-muted-foreground ml-4">{supplierName}</p>}
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
