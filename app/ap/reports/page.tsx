"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function APReportsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    let mounted = true
  const fetchStats = async () => {
      setLoading(true)
      try {
        const [invoicesRes, vendorsRes, paymentsRes] = await Promise.all([
          fetch("/api/invoices", { cache: "no-store" }),
          fetch("/api/suppliers", { cache: "no-store" }),
          fetch("/api/payments", { cache: "no-store" })
        ])
        if (!invoicesRes.ok) throw new Error("Failed to fetch invoices")
        if (!vendorsRes.ok) throw new Error("Failed to fetch vendors")
        if (!paymentsRes.ok) throw new Error("Failed to fetch payments")
        const invoices = await invoicesRes.json()
        const vendors = await vendorsRes.json()
        const payments = await paymentsRes.json()
        
        // Debug log to see what data we're getting
        console.log("First invoice:", invoices[0]);
        console.log("Available fields:", invoices[0] ? Object.keys(invoices[0]) : "No invoices");
        
        if (mounted) {
          const totalInvoices = invoices.length
          const totalAmount = invoices.reduce((sum: number, inv: any) => {
            const amount = inv.amount || 0;
            return sum + (isNaN(Number(amount)) ? 0 : Number(amount));
          }, 0)
          setStats({ totalInvoices, totalAmount, invoices, vendors })
          setLoading(false)
        }
      } catch (err: any) {
        if (mounted) {
          toast.error(err.message || "Failed to load reports stats")
          setLoading(false)
        }
      }
    }
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="bg-muted min-h-screen">
      <DashboardHeader />

      <main className="mx-auto px-4 py-8 container">
        <div className="mb-6">
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/ap/dashboard" },
              { label: "Reports" },
            ]}
          />
          <h2 className="font-bold text-3xl">Uploaded Data</h2>
          <p className="text-muted-foreground">View your uploaded vendors and invoice data</p>
        </div>

        <div className="gap-4 grid md:grid-cols-2 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-medium text-muted-foreground text-sm">Total Invoices</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                  <Skeleton className="w-24 h-7" />
                ) : (
                  <div className="font-bold text-2xl">{stats?.totalInvoices || 0}</div>
                )}
              <p className="mt-1 text-muted-foreground text-xs">All uploaded invoices</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-medium text-muted-foreground text-sm">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                  <Skeleton className="w-32 h-7" />
                ) : (
                  <div className="font-bold text-2xl">
                    {`R ${(stats?.totalAmount || 0).toLocaleString()}`}
                  </div>
                )}
              <p className="mt-1 text-muted-foreground text-xs">Total invoice value</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="invoices" className="space-y-4">
          <TabsList>
            <TabsTrigger value="invoices">Uploaded Invoices</TabsTrigger>
            <TabsTrigger value="vendors">Uploaded Vendors</TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Invoices</CardTitle>
                <CardDescription>View all invoices from your AP data uploads</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    <div className="flex gap-4">
                      <Skeleton className="w-24 h-4" />
                      <Skeleton className="w-32 h-4" />
                      <Skeleton className="w-28 h-4" />
                    </div>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={`ap-invoice-skeleton-${index}`} className="flex gap-4">
                        <Skeleton className="w-24 h-4" />
                        <Skeleton className="w-40 h-4" />
                        <Skeleton className="w-24 h-4" />
                        <Skeleton className="w-24 h-4" />
                        <Skeleton className="w-20 h-4" />
                      </div>
                    ))}
                  </div>
                ) : stats && Array.isArray(stats.invoices) && stats.invoices.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-muted-foreground/20 border-b">
                          <th className="px-4 py-3 font-semibold text-muted-foreground text-sm text-left">Invoice #</th>
                          <th className="px-4 py-3 font-semibold text-muted-foreground text-sm text-left">Vendor</th>
                          <th className="px-4 py-3 font-semibold text-muted-foreground text-sm text-left">Amount</th>
                          <th className="px-4 py-3 font-semibold text-muted-foreground text-sm text-left">Due Date</th>
                          <th className="px-4 py-3 font-semibold text-muted-foreground text-sm text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.invoices.map((inv: any) => (
                          <tr key={inv.invoice_id} className="hover:bg-muted/10 border-muted-foreground/10 border-b transition-colors">
                            <td className="px-4 py-3 font-semibold">{inv.reference_invoice || inv.document_number || 'N/A'}</td>
                            <td className="px-4 py-3">{inv.supplier_name || `Vendor ${inv.vendor_number}` || 'Unknown'}</td>
                            <td className="px-4 py-3 font-bold text-accent-green">
                              {inv.currency || 'ZAR'} {(inv.amount && !isNaN(Number(inv.amount))) ? Number(inv.amount).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {inv.due_date && !isNaN(new Date(inv.due_date).getTime()) ? new Date(inv.due_date).toLocaleDateString("en-ZA") : 'N/A'}
                            </td>
                            <td className="px-4 py-3">{inv.status || 'Unknown'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-muted-foreground text-center">
                    <FileText className="opacity-50 mx-auto mb-3 w-12 h-12" />
                    <p>No invoice data available</p>
                    <p className="mt-1 text-sm">Upload AP data to generate reports</p>
                    <Link href="/ap/invoices/upload">
                      <Button className="mt-4">Upload AP Data</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vendors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Vendors</CardTitle>
                <CardDescription>View all vendors from your vendor data uploads</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    <div className="flex gap-4">
                      <Skeleton className="w-24 h-4" />
                      <Skeleton className="w-32 h-4" />
                      <Skeleton className="w-28 h-4" />
                    </div>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={`ap-vendor-skeleton-${index}`} className="flex gap-4">
                        <Skeleton className="w-40 h-4" />
                        <Skeleton className="w-32 h-4" />
                        <Skeleton className="w-32 h-4" />
                        <Skeleton className="w-24 h-4" />
                        <Skeleton className="w-24 h-4" />
                      </div>
                    ))}
                  </div>
                ) : stats && Array.isArray(stats.vendors) && stats.vendors.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-muted-foreground/20 border-b">
                          <th className="px-4 py-3 font-semibold text-muted-foreground text-sm text-left">Vendor Name</th>
                          <th className="px-4 py-3 font-semibold text-muted-foreground text-sm text-left">Contact Person</th>
                          <th className="px-4 py-3 font-semibold text-muted-foreground text-sm text-left">Email</th>
                          <th className="px-4 py-3 font-semibold text-muted-foreground text-sm text-left">Phone</th>
                          <th className="px-4 py-3 font-semibold text-muted-foreground text-sm text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.vendors.map((vendor: any) => (
                          <tr key={vendor.supplier_id} className="hover:bg-muted/10 border-muted-foreground/10 border-b transition-colors">
                            <td className="px-4 py-3 font-semibold">{vendor.name}</td>
                            <td className="px-4 py-3">{vendor.contact_person}</td>
                            <td className="px-4 py-3">{vendor.contact_email}</td>
                            <td className="px-4 py-3">{vendor.contact_phone}</td>
                            <td className="px-4 py-3">{vendor.onboarding_status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-muted-foreground text-center">
                    <FileText className="opacity-50 mx-auto mb-3 w-12 h-12" />
                    <p>No vendor data available</p>
                    <p className="mt-1 text-sm">Upload vendor data to generate reports</p>
                    <Link href="/ap/vendors/upload">
                      <Button className="mt-4">Upload Vendor Data</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  )
}
