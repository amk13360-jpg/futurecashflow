"use client"

import { usePathname } from "next/navigation"
import { DashboardHeader } from "@/components/admin/dashboard-header"

// Pages that are pre-authentication — no header should appear here.
const PUBLIC_SUPPLIER_PATHS = ["/supplier/login", "/supplier/access"]

export function SupplierHeaderGuard() {
  const pathname = usePathname()
  const isPublic = PUBLIC_SUPPLIER_PATHS.some((p) => pathname === p || pathname?.startsWith(p + "?"))
  if (isPublic) return null
  return <DashboardHeader />
}
