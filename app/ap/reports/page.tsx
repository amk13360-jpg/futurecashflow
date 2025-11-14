"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BarChart3, TrendingUp, DollarSign, FileText, AlertCircle } from "lucide-react"

export default function APReportsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

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
          const pendingInvoices = invoices.filter((inv: any) => inv.status === "pending").length
          const processedInvoices = invoices.filter((inv: any) => inv.status === "matched" || inv.status === "offered").length
          setStats({ totalInvoices, totalAmount, pendingInvoices, processedInvoices, invoices, vendors, payments })
          setLoading(false)
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || "Failed to load reports stats")
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
    <div className="min-h-screen bg-muted/30">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold">AP Reports & Analytics</h2>
          <p className="text-muted-foreground">View reports and analytics for accounts payable operations</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats?.totalInvoices || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">All uploaded invoices</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : `R ${(stats?.totalAmount || 0).toLocaleString()}`}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total invoice value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats?.pendingInvoices || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting processing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Processed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats?.processedInvoices || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Successfully processed</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="invoices">Invoice Reports</TabsTrigger>
            <TabsTrigger value="vendors">Vendor Reports</TabsTrigger>
            <TabsTrigger value="payments">Payment Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reports Overview</CardTitle>
                <CardDescription>Summary of available reports and analytics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    Reports are generated based on your uploaded AP data and vendor information. Upload data to see
                    detailed analytics.
                  </AlertDescription>
                </Alert>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <BarChart3 className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-semibold mb-1">Invoice Analytics</h3>
                    <p className="text-sm text-muted-foreground">
                      Track invoice volumes, amounts, and processing times
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <TrendingUp className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-semibold mb-1">Vendor Performance</h3>
                    <p className="text-sm text-muted-foreground">Monitor vendor activity and payment patterns</p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <DollarSign className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-semibold mb-1">Payment Reports</h3>
                    <p className="text-sm text-muted-foreground">Analyze payment schedules and cash flow</p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <FileText className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-semibold mb-1">Compliance Reports</h3>
                    <p className="text-sm text-muted-foreground">Audit trails and regulatory compliance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Reports</CardTitle>
                <CardDescription>Detailed invoice analytics and reports</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : stats && Array.isArray(stats.invoices) && stats.invoices.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-muted-foreground/20">
                          <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Invoice #</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Vendor</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Amount</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Due Date</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.invoices.map((inv: any) => (
                          <tr key={inv.invoice_id} className="border-b border-muted-foreground/10 hover:bg-muted/10 transition-colors">
                            <td className="py-3 px-4 font-semibold">{inv.reference_invoice || inv.document_number || 'N/A'}</td>
                            <td className="py-3 px-4">{inv.supplier_name || `Vendor ${inv.vendor_number}` || 'Unknown'}</td>
                            <td className="py-3 px-4 font-bold text-accent-green">
                              {inv.currency || 'ZAR'} {(inv.amount && !isNaN(Number(inv.amount))) ? Number(inv.amount).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {inv.due_date && !isNaN(new Date(inv.due_date).getTime()) ? new Date(inv.due_date).toLocaleDateString("en-ZA") : 'N/A'}
                            </td>
                            <td className="py-3 px-4">{inv.status || 'Unknown'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No invoice data available</p>
                    <p className="text-sm mt-1">Upload AP data to generate reports</p>
                    <Button className="mt-4" onClick={() => (window.location.href = "/ap/invoices/upload")}> 
                      Upload AP Data
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vendors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Reports</CardTitle>
                <CardDescription>Vendor analytics and performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : stats && Array.isArray(stats.vendors) && stats.vendors.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-muted-foreground/20">
                          <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Vendor Name</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Contact Person</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Email</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Phone</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.vendors.map((vendor: any) => (
                          <tr key={vendor.supplier_id} className="border-b border-muted-foreground/10 hover:bg-muted/10 transition-colors">
                            <td className="py-3 px-4 font-semibold">{vendor.name}</td>
                            <td className="py-3 px-4">{vendor.contact_person}</td>
                            <td className="py-3 px-4">{vendor.contact_email}</td>
                            <td className="py-3 px-4">{vendor.contact_phone}</td>
                            <td className="py-3 px-4">{vendor.onboarding_status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No vendor data available</p>
                    <p className="text-sm mt-1">Upload vendor data to generate reports</p>
                    <Button className="mt-4" onClick={() => (window.location.href = "/ap/vendors/upload")}> 
                      Upload Vendor Data
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Reports</CardTitle>
                <CardDescription>Payment analytics and cash flow reports</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : stats && Array.isArray(stats.payments) && stats.payments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-muted-foreground/20">
                          <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Payment Ref</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Amount</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Currency</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Scheduled</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Completed</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Buyer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.payments.map((pay: any) => (
                          <tr key={pay.payment_id} className="border-b border-muted-foreground/10 hover:bg-muted/10 transition-colors">
                            <td className="py-3 px-4 font-semibold">{pay.payment_reference}</td>
                            <td className="py-3 px-4 font-bold text-accent-green">{pay.amount}</td>
                            <td className="py-3 px-4">{pay.currency}</td>
                            <td className="py-3 px-4">{pay.status}</td>
                            <td className="py-3 px-4 text-sm">{pay.scheduled_date ? new Date(pay.scheduled_date).toLocaleDateString("en-ZA") : "-"}</td>
                            <td className="py-3 px-4 text-sm">{pay.completed_date ? new Date(pay.completed_date).toLocaleDateString("en-ZA") : "-"}</td>
                            <td className="py-3 px-4">{pay.buyer_name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No payment data available</p>
                    <p className="text-sm mt-1">Process invoices to generate payment reports</p>
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
