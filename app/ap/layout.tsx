import React from 'react'
import { DashboardHeader } from '@/components/admin/dashboard-header'

export default function ApLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background min-h-screen text-foreground">
      <DashboardHeader />
      <main className="mx-auto p-6 px-4 pt-16 min-h-[calc(100vh-4rem)] container">{children}</main>
    </div>
  )
}
