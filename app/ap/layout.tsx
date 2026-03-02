import React from 'react'
import { DashboardHeader } from '@/components/admin/dashboard-header'

export default function ApLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4">
        <DashboardHeader />
      </div>
      <main className="pt-16 min-h-[calc(100vh-4rem)] p-6">{children}</main>
    </div>
  )
}
