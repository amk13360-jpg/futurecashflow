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
  <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <DashboardHeader />

  <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <Link
            href="/ap/dashboard"
            className="inline-flex items-center text-sm text-lightgray hover:text-accent-red mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-1 bg-accent-red rounded-full" />
                <div className="h-10 w-1 bg-brand-blue rounded-full" />
                <h1 className="text-5xl font-bold text-foreground">Invoices</h1>
              </div>
              <p className="text-xl text-muted-foreground ml-6">View and track your uploaded invoices</p>
            </div>
            <Link href="/ap/invoices/upload">
              <Button size="lg" className="gap-2 bg-accent-red hover:bg-accent-red text-white font-semibold px-6">
                <Upload className="h-5 w-5" />
                Upload Invoices
              </Button>
            </Link>
          </div>
        </div>

        {invoices.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-card border-0 shadow-xl">
              <CardHeader className="bg-card border-0 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <CardDescription className="text-brand-blue-soft font-medium">Total Invoices</CardDescription>
                    <CardTitle className="text-4xl font-bold text-foreground mt-2">{invoices.length}</CardTitle>
                  </div>
                  <FileText className="h-12 w-12 text-muted-foreground" />
                </div>
              </CardHeader>
            </Card>

            <Card className="bg-card border-0 shadow-xl">
              <CardHeader className="bg-card border-0 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <CardDescription className="text-accent-green font-medium">Total Value</CardDescription>
                    <CardTitle className="text-4xl font-bold text-foreground mt-2">
                      R {totalAmount.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </CardTitle>
                  </div>
                  <TrendingUp className="h-12 w-12 text-muted-foreground" />
                </div>
              </CardHeader>
            </Card>

            <Card className="bg-card border-0 shadow-xl">
              <CardHeader className="bg-card border-0 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <CardDescription className="text-accent-yellow font-medium">With Offers</CardDescription>
                    <CardTitle className="text-4xl font-bold text-foreground mt-2">{offeredCount}</CardTitle>
                  </div>
                  <Clock className="h-12 w-12 text-muted-foreground" />
                </div>
              </CardHeader>
            </Card>
          </div>
        )}

        <Card className="bg-card border border-darkgray shadow-xl">
          <CardHeader className="border-b border-darkgray bg-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl text-foreground">All Invoices ({invoices.length})</CardTitle>
                <CardDescription className="text-muted-foreground">Invoices uploaded and their offer status</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search invoices..."
                    className="pl-9 w-64 bg-card border-mediumgray text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                    className="bg-card border-mediumgray hover:bg-card text-foreground"
                >
                  <Filter className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                    className="bg-card border-mediumgray hover:bg-card text-foreground"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {invoices.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-darkgray/50 mb-6">
                  <Upload className="h-12 w-12 text-mediumgray" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">No invoices uploaded yet</h3>
                <p className="text-lightgray mb-8 max-w-md mx-auto text-lg">
                  Get started by uploading your first batch of approved invoices from your ERP system
                </p>
                <Link href="/ap/invoices/upload">
                  <Button size="lg" className="gap-2 bg-accent-red hover:bg-accent-red text-white font-semibold px-8">
                    <Upload className="h-5 w-5" />
                    Upload Your First Invoice
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-mediumgray">
                      <th className="text-left py-4 px-4 font-semibold text-sm text-lightgray">Invoice #</th>
                      <th className="text-left py-4 px-4 font-semibold text-sm text-lightgray">Vendor</th>
                      <th className="text-left py-4 px-4 font-semibold text-sm text-lightgray">Amount</th>
                      <th className="text-left py-4 px-4 font-semibold text-sm text-lightgray">Due Date</th>
                      <th className="text-left py-4 px-4 font-semibold text-sm text-lightgray">Status</th>
                      <th className="text-left py-4 px-4 font-semibold text-sm text-lightgray">Offers</th>
                      <th className="text-right py-4 px-4 font-semibold text-sm text-lightgray">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice: any) => (
                      <tr
                        key={invoice.invoice_id}
                        className="border-b border-mediumgray/50 hover:bg-darkgray/30 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="font-semibold text-white">
                            {invoice.reference_invoice || invoice.document_number}
                          </div>
                          <div className="text-xs text-lightgray">Doc: {invoice.document_number}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-white">
                            {invoice.supplier_name || `Vendor ${invoice.vendor_number}`}
                          </div>
                          <div className="text-xs text-lightgray">#{invoice.vendor_number}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-accent-green">
                            {invoice.currency}{" "}
                            {Number(invoice.amount).toLocaleString("en-ZA", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                          {invoice.payment_terms && (
                            <div className="text-xs text-lightgray">{invoice.payment_terms}</div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-lightgray">
                            {new Date(invoice.due_date).toLocaleDateString("en-ZA")}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge
                            variant={
                              invoice.status === "offered"
                                ? "default"
                                : invoice.status === "matched"
                                  ? "secondary"
                                  : "outline"
                            }
                            className={
                              invoice.status === "offered"
                                ? "bg-accent-red text-white hover:bg-accent-red"
                                : invoice.status === "matched"
                                  ? "bg-accent-green text-white"
                                  : "bg-darkgray text-lightgray border-mediumgray"
                            }
                          >
                            {invoice.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          {invoice.offer_count > 0 ? (
                            <Badge variant="outline" className="gap-1 bg-brand-blue-soft/10 text-brand-blue border-brand-blue-soft/30">
                              {invoice.offer_count} offer{invoice.offer_count !== 1 ? "s" : ""}
                            </Badge>
                          ) : (
                            <span className="text-sm text-mediumgray">No offers</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-accent-red hover:text-accent-red hover:bg-darkgray"
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setDialogOpen(true);
                            }}
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
      </main>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-darkgray text-white">
          <DialogHeader>
            <DialogTitle className="text-accent-red">Invoice Details</DialogTitle>
            <DialogDescription>
              {selectedInvoice ? (
                <span className="block space-y-2 mt-2">
                  <span className="block"><span className="font-semibold text-accent-red">Invoice #:</span> {selectedInvoice.reference_invoice || selectedInvoice.document_number}</span>
                  <span className="block"><span className="font-semibold text-brand-blue">Vendor:</span> {selectedInvoice.supplier_name || `Vendor ${selectedInvoice.vendor_number}`}</span>
                  <span className="block"><span className="font-semibold text-accent-green">Amount:</span> {selectedInvoice.currency} {Number(selectedInvoice.amount).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span className="block"><span className="font-semibold text-lightgray">Due Date:</span> {new Date(selectedInvoice.due_date).toLocaleDateString("en-ZA")}</span>
                  <span className="block"><span className="font-semibold text-lightgray">Status:</span> {selectedInvoice.status}</span>
                  <span className="block"><span className="font-semibold text-brand-blue">Offers:</span> {selectedInvoice.offer_count}</span>
                  {selectedInvoice.text_description && <span className="block"><span className="font-semibold text-lightgray">Description:</span> {selectedInvoice.text_description}</span>}
                  {selectedInvoice.payment_terms && <span className="block"><span className="font-semibold text-lightgray">Payment Terms:</span> {selectedInvoice.payment_terms}</span>}
                </span>
              ) : null}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}
