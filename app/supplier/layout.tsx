import { SupplierHeaderGuard } from "@/components/supplier/header-guard"
import type React from "react"

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background min-h-screen text-foreground">
      <SupplierHeaderGuard />
      <main>{children}</main>
    </div>
  )
}
