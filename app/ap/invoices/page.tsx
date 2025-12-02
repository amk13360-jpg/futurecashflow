"use client"

import { getInvoicesForBuyer } from "@/lib/actions/invoices"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Upload, ArrowLeft, Search, Filter, Download, FileText, TrendingUp, Clock } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { MetricCard } from "@/components/admin/metric-card"

export const dynamic = "force-dynamic"

async function fetchInvoices() {
  const res = await fetch("/api/invoices", { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch invoices")
  return res.json()
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    const loadInvoices = () => {
      setLoading(true)
      fetchInvoices()
        .then(data => {
          if (mounted) {
            setInvoices(data)
            setLoading(false)
          }
        })
        .catch(() => {
          if (mounted) {
            setError("Failed to load invoices")
            setLoading(false)
          }
        })
    }
    loadInvoices()
    const interval = setInterval(loadInvoices, 30000) // 30 seconds
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  const totalAmount = invoices.reduce((sum: number, inv: any) => sum + Number(inv.amount || 0), 0)
  const offeredCount = invoices.filter((inv: any) => inv.status === "offered").length
  const matchedCount = invoices.filter((inv: any) => inv.status === "matched").length

  return (
  <div className="min-h-screen bg-muted/30 text-foreground">
      <DashboardHeader />

  <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <Link
            href="/ap/dashboard"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Invoices</h1>
              <p className="text-lg text-muted-foreground mt-1">View and track your uploaded invoices</p>
            </div>
            <Link href="/ap/invoices/upload">
              <Button size="lg" className="gap-2 font-semibold px-6">
                <Upload className="h-5 w-5" />
                Upload Invoices
              </Button>
            </Link>
          </div>
        </div>

        {loading && <SkeletonTable rows={5} />}

        {!loading && invoices.length > 0 && (
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <MetricCard
              title="Total Invoices"
              value={invoices.length}
              icon={FileText}
              variant="info"
            />
            <MetricCard
              title="Total Value"
              value={`R ${totalAmount.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
              icon={TrendingUp}
              variant="success"
            />
            <MetricCard
              title="With Offers"
              value={offeredCount}
              icon={Clock}
              variant="warning"
            />
          </div>
        )}

        {!loading && (
        <Card className="shadow-lg">
          <CardHeader className="border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">All Invoices ({invoices.length})</CardTitle>
                <CardDescription>Invoices uploaded and their offer status</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search invoices..." className="pl-9 w-64" />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {invoices.length === 0 ? (
              <EmptyState
                icon={Upload}
                title="No invoices uploaded yet"
                description="Get started by uploading your first batch of approved invoices from your ERP system"
              >
                <Link href="/ap/invoices/upload">
                  <Button size="lg" className="gap-2">
                    <Upload className="h-5 w-5" />
                    Upload Your First Invoice
                  </Button>
                </Link>
              </EmptyState>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-4 px-4 font-semibold text-sm text-muted-foreground">Invoice #</th>
                      <th className="text-left py-4 px-4 font-semibold text-sm text-muted-foreground">Vendor</th>
                      <th className="text-left py-4 px-4 font-semibold text-sm text-muted-foreground">Amount</th>
                      <th className="text-left py-4 px-4 font-semibold text-sm text-muted-foreground">Due Date</th>
                      <th className="text-left py-4 px-4 font-semibold text-sm text-muted-foreground">Status</th>
                      <th className="text-left py-4 px-4 font-semibold text-sm text-muted-foreground">Offers</th>
                      <th className="text-right py-4 px-4 font-semibold text-sm text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice: any) => (
                      <tr key={invoice.invoice_id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-semibold">{invoice.reference_invoice || invoice.document_number}</div>
                          <div className="text-xs text-muted-foreground">Doc: {invoice.document_number}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium">{invoice.supplier_name || `Vendor ${invoice.vendor_number}`}</div>
                          <div className="text-xs text-muted-foreground">#{invoice.vendor_number}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-emerald-600 dark:text-emerald-400">
                            {invoice.currency}{" "}
                            {Number(invoice.amount).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          {invoice.payment_terms && (
                            <div className="text-xs text-muted-foreground">{invoice.payment_terms}</div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-muted-foreground">
                            {new Date(invoice.due_date).toLocaleDateString("en-ZA")}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge
                            variant={invoice.status === "offered" ? "default" : invoice.status === "matched" ? "secondary" : "outline"}
                          >
                            {invoice.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          {invoice.offer_count > 0 ? (
                            <Badge variant="outline" className="gap-1">
                              {invoice.offer_count} offer{invoice.offer_count !== 1 ? "s" : ""}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">No offers</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSelectedInvoice(invoice); setDialogOpen(true); }}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
        )}
      </main>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription asChild>
              {selectedInvoice ? (
                <div className="space-y-3 mt-4">
                  <div><span className="font-semibold text-foreground">Invoice #:</span> {selectedInvoice.reference_invoice || selectedInvoice.document_number}</div>
                  <div><span className="font-semibold text-foreground">Vendor:</span> {selectedInvoice.supplier_name || `Vendor ${selectedInvoice.vendor_number}`}</div>
                  <div><span className="font-semibold text-foreground">Amount:</span> <span className="text-emerald-600 dark:text-emerald-400">{selectedInvoice.currency} {Number(selectedInvoice.amount).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                  <div><span className="font-semibold text-foreground">Due Date:</span> {new Date(selectedInvoice.due_date).toLocaleDateString("en-ZA")}</div>
                  <div><span className="font-semibold text-foreground">Status:</span> <Badge variant="outline">{selectedInvoice.status}</Badge></div>
                  <div><span className="font-semibold text-foreground">Offers:</span> {selectedInvoice.offer_count}</div>
                  {selectedInvoice.text_description && <div><span className="font-semibold text-foreground">Description:</span> {selectedInvoice.text_description}</div>}
                  {selectedInvoice.payment_terms && <div><span className="font-semibold text-foreground">Payment Terms:</span> {selectedInvoice.payment_terms}</div>}
                </div>
              ) : <div />}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}
