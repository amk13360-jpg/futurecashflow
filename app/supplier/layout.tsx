import { DashboardHeader } from "@/components/admin/dashboard-header"
import type React from "react"

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background min-h-screen text-foreground">
      <DashboardHeader />
      <main className="p-6 pt-16 min-h-[calc(100vh-4rem)]">{children}</main>
    </div>
  )
}
