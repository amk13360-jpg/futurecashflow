"use client"

import React from "react"
import Link from "next/link"
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Logo } from "@/components/ui/logo"

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="bg-background min-h-screen text-foreground">
        <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
          <SidebarHeader className="px-3 py-2">
            <div className="flex items-center gap-2">
              <Logo size="sm" variant="adaptive" />
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarMenu className="p-2">
              <SidebarMenuItem>
                <Link href="/admin/dashboard" className="no-underline">
                  <SidebarMenuButton asChild>
                    <a>Dashboard</a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/admin/buyers" className="no-underline">
                  <SidebarMenuButton asChild>
                    <a>Buyers</a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/admin/offer-batches" className="no-underline">
                  <SidebarMenuButton asChild>
                    <a>Offer Batches</a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-2">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <SidebarRail />
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="md:pl-64"> {/* offset for fixed sidebar (16rem) */}
          <DashboardHeader />
          <main className="p-6 pt-16 min-h-[calc(100vh-4rem)]">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
