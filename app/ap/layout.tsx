import React from 'react'
import { DashboardHeader } from '@/components/admin/dashboard-header'

export default function ApLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background min-h-screen text-foreground">
      <DashboardHeader />
      <main className="p-6 pt-16 min-h-[calc(100vh-4rem)] container mx-auto px-4">{children}</main>
    </div>
  )
}
