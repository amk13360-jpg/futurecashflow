"use client"

import { getInvoicesForBuyer } from "@/lib/actions/invoices"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Upload, ArrowLeft, Search, Filter, Download, FileText, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { MetricCard } from "@/components/admin/metric-card"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { toast } from "sonner"

export const dynamic = "force-dynamic"

async function fetchInvoices() {
 const res = await fetch("/api/invoices", { cache: "no-store" })
 if (!res.ok) throw new Error("Failed to fetch invoices")
 return res.json()
}

export default function InvoicesPage() {
 const [invoices, setInvoices] = useState<any[]>([])
 const [loading, setLoading] = useState(true)
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
 toast.error("Failed to load invoices")
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

 function getOfferStatus(invoice: any): { label: string; className: string } {
 const status = (invoice.status || '').toLowerCase()
 const offerCount = Number(invoice.offer_count || 0)
 if (status === 'paid') {
 return { label: 'Paid', className: 'bg-success-bg text-success-foreground border border-success-border' }
 }
 if (status === 'accepted') {
 return { label: 'Accepted', className: 'bg-info-bg text-info-foreground border border-info-border' }
 }
 if (offerCount > 0 || status === 'offered') {
 return { label: 'Offer Sent', className: 'bg-warning-bg text-warning-foreground border border-warning-border' }
 }
 if (status === 'available' || status === 'matched') {
 return { label: 'Eligible', className: 'bg-info-bg text-info-foreground border border-info-border' }
 }
 return { label: 'Not Eligible', className: 'bg-muted text-muted-foreground border' }
 }

 return (
 <div className="bg-muted min-h-screen text-foreground">

 <main className="mx-auto px-4 py-8 max-w-7xl container">
 <div className="mb-8">
 <Breadcrumbs
 items={[
 { label: "Dashboard", href: "/ap/dashboard" },
 { label: "Invoices" },
 ]}
 />
 <Link
 href="/ap/dashboard"
 className="inline-flex items-center mb-4 text-muted-foreground hover:text-foreground text-sm transition-colors"
 >
 <ArrowLeft className="mr-2 w-4 h-4" />
 Back to dashboard
 </Link>
 <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-4">
 <div>
 <h1 className="font-bold text-foreground text-4xl">Invoices</h1>
 <p className="mt-1 text-muted-foreground text-lg">View and track your uploaded invoices</p>
 </div>
 <Link href="/ap/invoices/upload">
 <Button size="lg" className="gap-2 px-6 font-semibold">
 <Upload className="w-5 h-5" />
 Upload Invoices
 </Button>
 </Link>
 </div>
 </div>

 {loading && <SkeletonTable rows={5} />}

 {!loading && invoices.length > 0 && (
 <div className="gap-4 grid md:grid-cols-2 mb-8">
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
 </div>
 )}

 {!loading && (
 <Card className="shadow-lg">
 <CardHeader className="border-b">
 <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-4">
 <div>
 <CardTitle className="text-2xl">All Invoices ({invoices.length})</CardTitle>
 <CardDescription>View all uploaded invoices</CardDescription>
 </div>
 <div className="flex gap-2">
 <div className="relative">
 <Search className="top-1/2 left-3 absolute w-4 h-4 text-muted-foreground -translate-y-1/2" />
 <Input placeholder="Search invoices..." className="pl-9 w-64" />
 </div>
 <Button variant="outline" size="icon">
 <Filter className="w-4 h-4" />
 </Button>
 <Button variant="outline" size="icon">
 <Download className="w-4 h-4" />
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
 <Upload className="w-5 h-5" />
 Upload Your First Invoice
 </Button>
 </Link>
 </EmptyState>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead>
 <tr className="border-b">
 <th className="px-4 py-4 font-semibold text-muted-foreground text-sm text-left">Invoice #</th>
 <th className="px-4 py-4 font-semibold text-muted-foreground text-sm text-left">Vendor</th>
 <th className="px-4 py-4 font-semibold text-muted-foreground text-sm text-left">Amount</th>
 <th className="px-4 py-4 font-semibold text-muted-foreground text-sm text-left">Due Date</th>
 <th className="px-4 py-4 font-semibold text-muted-foreground text-sm text-left">Upload Date</th>
 <th className="px-4 py-4 font-semibold text-muted-foreground text-sm text-left">Offer Status</th>
 <th className="px-4 py-4 font-semibold text-muted-foreground text-sm text-right">Actions</th>
 </tr>
 </thead>
 <tbody>
 {invoices.map((invoice: any) => (
 <tr key={invoice.invoice_id} className="hover:bg-muted border-b transition-colors">
 <td className="px-4 py-4">
 <div className="font-semibold">{invoice.reference_invoice || invoice.document_number}</div>
 <div className="text-muted-foreground text-xs">Doc: {invoice.document_number}</div>
 </td>
 <td className="px-4 py-4">
 <div className="font-medium">{invoice.supplier_name || `Vendor ${invoice.vendor_number}`}</div>
 <div className="text-muted-foreground text-xs">#{invoice.vendor_number}</div>
 </td>
 <td className="px-4 py-4">
 <div className="font-bold text-success">
 {invoice.currency}{" "}
 {Number(invoice.amount).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
 </div>
 {invoice.payment_terms && (
 <div className="text-muted-foreground text-xs">{invoice.payment_terms}</div>
 )}
 </td>
 <td className="px-4 py-4">
 <div className="text-muted-foreground text-sm">
 {new Date(invoice.due_date).toLocaleDateString("en-ZA")}
 </div>
 </td>
 <td className="px-4 py-4">
 <div className="text-muted-foreground text-sm">
 {invoice.uploaded_at ? new Date(invoice.uploaded_at).toLocaleDateString("en-ZA") : '—'}
 </div>
 </td>
 <td className="px-4 py-4">
 {(() => {
 const { label, className } = getOfferStatus(invoice);
 return <Badge className={className}>{label}</Badge>;
 })()}
 </td>
 <td className="px-4 py-4 text-right">
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
 <DialogContent className="bg-popover max-w-lg text-popover-foreground">
 <DialogHeader>
 <DialogTitle>Invoice Details</DialogTitle>
 <DialogDescription asChild>
 {selectedInvoice ? (
 <div className="space-y-3 mt-4">
 <div><span className="font-semibold text-foreground">Invoice #:</span> {selectedInvoice.reference_invoice || selectedInvoice.document_number}</div>
 <div><span className="font-semibold text-foreground">Vendor:</span> {selectedInvoice.supplier_name || `Vendor ${selectedInvoice.vendor_number}`}</div>
 <div><span className="font-semibold text-foreground">Amount:</span> <span className="text-success">{selectedInvoice.currency} {Number(selectedInvoice.amount).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
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
