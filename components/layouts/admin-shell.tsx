"use client"

import React from "react"
import Link from "next/link"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Logo } from "@/components/ui/logo"

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background min-h-screen text-foreground">
      <DashboardHeader />
      <main className="p-6 pt-16 min-h-[calc(100vh-4rem)]">{children}</main>
    </div>
  )
}
