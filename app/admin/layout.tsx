import AdminShell from '@/components/layouts/admin-shell'
import type React from 'react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
