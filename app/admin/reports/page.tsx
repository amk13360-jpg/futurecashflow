"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { Skeleton } from "@/components/ui/skeleton"
import {
 getOfferAcceptanceSummary,
 getDisbursementTracker,
 getSupplierStatusReport,
 getAuditHistory,
 getSystemStatistics,
 exportReportToCSV,
} from "@/lib/actions/reports"
import { FileText, Download, ArrowLeft, TrendingUp, Users, Activity } from "lucide-react"
import { RandIcon } from "@/components/ui/rand-icon"
import Link from "next/link"
import { toast } from "sonner"

export default function ReportsPage() {
 const [loading, setLoading] = useState(true)
 const [stats, setStats] = useState<any>(null)
 const [offerSummary, setOfferSummary] = useState<any[]>([])
 const [disbursements, setDisbursements] = useState<any[]>([])
 const [suppliers, setSuppliers] = useState<any[]>([])
 const [auditLogs, setAuditLogs] = useState<any[]>([])

 // Filters
 const [dateRange, setDateRange] = useState({ start: "", end: "" })
 const [statusFilter, setStatusFilter] = useState("all")

 useEffect(() => {
 loadData()
 }, [])

 const loadData = async () => {
 try {
 const [statsData, offerData, disbursementData, supplierData, auditData] = await Promise.all([
 getSystemStatistics(),
 getOfferAcceptanceSummary(),
 getDisbursementTracker(),
 getSupplierStatusReport(),
 getAuditHistory(),
 ])

 setStats(statsData)
 setOfferSummary(offerData)
 setDisbursements(disbursementData)
 setSuppliers(supplierData)
 setAuditLogs(auditData)
 } catch (error) {
 toast.error("Failed to load reports")
 } finally {
 setLoading(false)
 }
 }

 const handleExport = async (reportType: string, data: any[]) => {
 try {
 const result = await exportReportToCSV(reportType, data)

 // Download CSV
 const blob = new Blob([result.content], { type: "text/csv" })
 const url = window.URL.createObjectURL(blob)
 const a = document.createElement("a")
 a.href = url
 a.download = result.filename
 a.click()
 window.URL.revokeObjectURL(url)

 toast.success("Report exported successfully")
 } catch (error: any) {
 toast.error(error.message || "Failed to export report")
 }
 }

 const applyFilters = async () => {
 setLoading(true)
 try {
 const [offerData, disbursementData] = await Promise.all([
 getOfferAcceptanceSummary({
 startDate: dateRange.start || undefined,
 endDate: dateRange.end || undefined,
 }),
 getDisbursementTracker({
 startDate: dateRange.start || undefined,
 endDate: dateRange.end || undefined,
 status: statusFilter === "all" ? undefined : statusFilter,
 }),
 ])

 setOfferSummary(offerData)
 setDisbursements(disbursementData)
 toast.success("Filters applied")
 } catch (error) {
 toast.error("Failed to apply filters")
 } finally {
 setLoading(false)
 }
 }

 return (
 <div className="bg-muted min-h-screen">

 <main className="mx-auto px-4 py-8 container">
 <div className="mb-6">
 <Breadcrumbs
 items={[
 { label: "Dashboard", href: "/admin/dashboard" },
 { label: "Reports" },
 ]}
 />
 <Link
 href="/admin/dashboard"
 className="inline-flex items-center mb-4 text-muted-foreground hover:text-foreground text-sm"
 >
 <ArrowLeft className="mr-2 w-4 h-4" />
 Back to dashboard
 </Link>
 <h2 className="font-bold text-3xl">Reports & Analytics</h2>
 <p className="text-muted-foreground">Comprehensive reporting and audit trails</p>
 </div>

 {/* System Statistics */}
 {stats && (
 <div className="gap-4 grid md:grid-cols-4 mb-6">
 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="font-medium text-muted-foreground text-sm">Active Suppliers</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="font-bold text-2xl">{stats.active_suppliers}</div>
 <p className="text-muted-foreground text-xs">{stats.pending_suppliers} pending approval</p>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="font-medium text-muted-foreground text-sm">Pending Offers</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="font-bold text-2xl">{stats.pending_offers}</div>
 <p className="text-muted-foreground text-xs">{stats.accepted_offers} accepted</p>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="font-medium text-muted-foreground text-sm">Total Disbursed</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="font-bold text-2xl">R {(stats.total_disbursed || 0).toLocaleString()}</div>
 <p className="text-muted-foreground text-xs">{stats.completed_payments} payments</p>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="font-medium text-muted-foreground text-sm">Pending Items</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="font-bold text-2xl">{stats.pending_bank_changes + stats.pending_cessions}</div>
 <p className="text-muted-foreground text-xs">
 {stats.pending_bank_changes} bank changes, {stats.pending_cessions} cessions
 </p>
 </CardContent>
 </Card>
 </div>
 )}

 {/* Filters */}
 <Card className="mb-6">
 <CardHeader>
 <CardTitle>Report Filters</CardTitle>
 <CardDescription>Filter reports by date range and status</CardDescription>
 </CardHeader>
 <CardContent>
 <div className="gap-4 grid md:grid-cols-4">
 <div className="space-y-2">
 <Label htmlFor="start-date">Start Date</Label>
 <Input
 id="start-date"
 type="date"
 value={dateRange.start}
 onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
 />
 </div>

 <div className="space-y-2">
 <Label htmlFor="end-date">End Date</Label>
 <Input
 id="end-date"
 type="date"
 value={dateRange.end}
 onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
 />
 </div>

 <div className="space-y-2">
 <Label htmlFor="status">Payment Status</Label>
 <Select value={statusFilter} onValueChange={setStatusFilter}>
 <SelectTrigger id="status">
 <SelectValue placeholder="All statuses" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All statuses</SelectItem>
 <SelectItem value="queued">Queued</SelectItem>
 <SelectItem value="processing">Processing</SelectItem>
 <SelectItem value="completed">Completed</SelectItem>
 </SelectContent>
 </Select>
 </div>

 <div className="flex items-end">
 <Button onClick={applyFilters} disabled={loading} className="w-full">
 Apply Filters
 </Button>
 </div>
 </div>
 </CardContent>
 </Card>

 {/* Reports Tabs */}
 <Tabs defaultValue="offers" className="space-y-4">
 <TabsList>
 <TabsTrigger value="offers">
 <TrendingUp className="mr-2 w-4 h-4" />
 Offer Acceptance
 </TabsTrigger>
 <TabsTrigger value="disbursements">
 <RandIcon className="mr-2 w-4 h-4" />
 Disbursements
 </TabsTrigger>
 <TabsTrigger value="suppliers">
 <Users className="mr-2 w-4 h-4" />
 Supplier Status
 </TabsTrigger>
 <TabsTrigger value="audit">
 <Activity className="mr-2 w-4 h-4" />
 Audit Logs
 </TabsTrigger>
 </TabsList>

 {/* Offer Acceptance Summary */}
 <TabsContent value="offers">
 <Card>
 <CardHeader>
 <div className="flex justify-between items-center">
 <div>
 <CardTitle>Offer Acceptance Summary</CardTitle>
 <CardDescription>Track offer performance by buyer and supplier</CardDescription>
 </div>
 <Button
 onClick={() => handleExport("offer_acceptance_summary", offerSummary)}
 variant="outline"
 size="sm"
 className="bg-transparent"
 >
 <Download className="mr-2 w-4 h-4" />
 Export CSV
 </Button>
 </div>
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
 <div key={`offer-summary-skeleton-${index}`} className="flex gap-4">
 <Skeleton className="w-24 h-4" />
 <Skeleton className="w-40 h-4" />
 <Skeleton className="w-40 h-4" />
 <Skeleton className="w-16 h-4" />
 <Skeleton className="w-16 h-4" />
 </div>
 ))}
 </div>
 ) : offerSummary.length === 0 ? (
 <div className="py-12 text-muted-foreground text-center">
 <FileText className="opacity-50 mx-auto mb-3 w-12 h-12" />
 <p>No offer data available</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b">
 <th className="p-2 text-left">Date</th>
 <th className="p-2 text-left">Buyer</th>
 <th className="p-2 text-left">Supplier</th>
 <th className="p-2 text-right">Total Offers</th>
 <th className="p-2 text-right">Accepted</th>
 <th className="p-2 text-right">Rejected</th>
 <th className="p-2 text-right">Expired</th>
 <th className="p-2 text-right">Acceptance Rate</th>
 <th className="p-2 text-right">Total Value</th>
 </tr>
 </thead>
 <tbody>
 {offerSummary.map((row: any, idx: number) => (
 <tr key={idx} className="hover:bg-muted border-b">
 <td className="p-2">{new Date(row.date).toLocaleDateString()}</td>
 <td className="p-2">{row.buyer_name}</td>
 <td className="p-2">{row.supplier_name}</td>
 <td className="p-2 text-right">{row.total_offers}</td>
 <td className="p-2 text-success text-right">{row.accepted_offers}</td>
 <td className="p-2 text-error text-right">{row.rejected_offers}</td>
 <td className="p-2 text-muted-foreground text-right">{row.expired_offers}</td>
 <td className="p-2 text-right">
 {((row.accepted_offers / row.total_offers) * 100).toFixed(1)}%
 </td>
 <td className="p-2 text-right">R {row.accepted_value.toLocaleString()}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </CardContent>
 </Card>
 </TabsContent>

 {/* Disbursement Tracker */}
 <TabsContent value="disbursements">
 <Card>
 <CardHeader>
 <div className="flex justify-between items-center">
 <div>
 <CardTitle>Disbursement Tracker</CardTitle>
 <CardDescription>Monitor payment batches and disbursement status</CardDescription>
 </div>
 <Button
 onClick={() => handleExport("disbursement_tracker", disbursements)}
 variant="outline"
 size="sm"
 className="bg-transparent"
 >
 <Download className="mr-2 w-4 h-4" />
 Export CSV
 </Button>
 </div>
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
 <div key={`disbursement-skeleton-${index}`} className="flex gap-4">
 <Skeleton className="w-24 h-4" />
 <Skeleton className="w-40 h-4" />
 <Skeleton className="w-40 h-4" />
 <Skeleton className="w-20 h-4" />
 <Skeleton className="w-24 h-4" />
 </div>
 ))}
 </div>
 ) : disbursements.length === 0 ? (
 <div className="py-12 text-muted-foreground text-center">
 <RandIcon className="opacity-50 mx-auto mb-3 w-12 h-12" />
 <p>No disbursement data available</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b">
 <th className="p-2 text-left">Reference</th>
 <th className="p-2 text-left">Batch ID</th>
 <th className="p-2 text-left">Supplier</th>
 <th className="p-2 text-left">Invoice</th>
 <th className="p-2 text-right">Amount</th>
 <th className="p-2 text-left">Status</th>
 <th className="p-2 text-left">Scheduled</th>
 <th className="p-2 text-left">Completed</th>
 </tr>
 </thead>
 <tbody>
 {disbursements.map((payment: any) => (
 <tr key={payment.payment_id} className="hover:bg-muted border-b">
 <td className="p-2 font-mono text-xs">{payment.payment_reference}</td>
 <td className="p-2 text-xs">{payment.batch_id || "-"}</td>
 <td className="p-2">{payment.supplier_name}</td>
 <td className="p-2">{payment.invoice_number}</td>
 <td className="p-2 text-right">
 {payment.currency} {payment.amount.toLocaleString()}
 </td>
 <td className="p-2">
 <Badge
 variant={
 payment.status === "completed"
 ? "default"
 : payment.status === "processing"
 ? "secondary"
 : "outline"
 }
 >
 {payment.status}
 </Badge>
 </td>
 <td className="p-2 text-xs">
 {payment.scheduled_date ? new Date(payment.scheduled_date).toLocaleDateString() : "-"}
 </td>
 <td className="p-2 text-xs">
 {payment.completed_date ? new Date(payment.completed_date).toLocaleDateString() : "-"}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </CardContent>
 </Card>
 </TabsContent>

 {/* Supplier Status */}
 <TabsContent value="suppliers">
 <Card>
 <CardHeader>
 <div className="flex justify-between items-center">
 <div>
 <CardTitle>Supplier Status Report</CardTitle>
 <CardDescription>Complete supplier onboarding and activity overview</CardDescription>
 </div>
 <Button
 onClick={() => handleExport("supplier_status", suppliers)}
 variant="outline"
 size="sm"
 className="bg-transparent"
 >
 <Download className="mr-2 w-4 h-4" />
 Export CSV
 </Button>
 </div>
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
 <div key={`supplier-status-skeleton-${index}`} className="flex gap-4">
 <Skeleton className="w-40 h-4" />
 <Skeleton className="w-24 h-4" />
 <Skeleton className="w-24 h-4" />
 <Skeleton className="w-20 h-4" />
 </div>
 ))}
 </div>
 ) : suppliers.length === 0 ? (
 <div className="py-12 text-muted-foreground text-center">
 <Users className="opacity-50 mx-auto mb-3 w-12 h-12" />
 <p>No supplier data available</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b">
 <th className="p-2 text-left">Vendor #</th>
 <th className="p-2 text-left">Name</th>
 <th className="p-2 text-left">Status</th>
 <th className="p-2 text-left">Cession</th>
 <th className="p-2 text-right">Invoices</th>
 <th className="p-2 text-right">Offers</th>
 <th className="p-2 text-right">Accepted</th>
 <th className="p-2 text-right">Disbursed</th>
 <th className="p-2 text-left">Bank</th>
 </tr>
 </thead>
 <tbody>
 {suppliers.map((supplier: any) => (
 <tr key={supplier.supplier_id} className="hover:bg-muted border-b">
 <td className="p-2 font-mono text-xs">{supplier.vendor_number || "-"}</td>
 <td className="p-2">{supplier.name}</td>
 <td className="p-2">
 <Badge
 variant={
 supplier.onboarding_status === "approved"
 ? "default"
 : supplier.onboarding_status === "pending"
 ? "secondary"
 : "outline"
 }
 >
 {supplier.onboarding_status}
 </Badge>
 </td>
 <td className="p-2">
 <Badge variant={supplier.cession_status === "signed" ? "default" : "outline"}>
 {supplier.cession_status || "none"}
 </Badge>
 </td>
 <td className="p-2 text-right">{supplier.invoice_count}</td>
 <td className="p-2 text-right">{supplier.offer_count}</td>
 <td className="p-2 text-right">{supplier.accepted_offers}</td>
 <td className="p-2 text-right">R {(supplier.total_disbursed || 0).toLocaleString()}</td>
 <td className="p-2 text-xs">{supplier.bank_name || "-"}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </CardContent>
 </Card>
 </TabsContent>

 {/* Audit Logs */}
 <TabsContent value="audit">
 <Card>
 <CardHeader>
 <div className="flex justify-between items-center">
 <div>
 <CardTitle>Audit History</CardTitle>
 <CardDescription>Complete activity log for compliance and security</CardDescription>
 </div>
 <Button
 onClick={() => handleExport("audit_logs", auditLogs)}
 variant="outline"
 size="sm"
 className="bg-transparent"
 >
 <Download className="mr-2 w-4 h-4" />
 Export CSV
 </Button>
 </div>
 </CardHeader>
 <CardContent>
 {loading ? (
 <div className="space-y-3">
 <div className="flex gap-4">
 <Skeleton className="w-24 h-4" />
 <Skeleton className="w-32 h-4" />
 <Skeleton className="w-28 h-4" />
 </div>
 {Array.from({ length: 6 }).map((_, index) => (
 <div key={`audit-skeleton-${index}`} className="flex gap-4">
 <Skeleton className="w-24 h-4" />
 <Skeleton className="w-48 h-4" />
 <Skeleton className="w-32 h-4" />
 <Skeleton className="w-24 h-4" />
 </div>
 ))}
 </div>
 ) : auditLogs.length === 0 ? (
 <div className="py-12 text-muted-foreground text-center">
 <Activity className="opacity-50 mx-auto mb-3 w-12 h-12" />
 <p>No audit logs available</p>
 </div>
 ) : (
 <div className="space-y-2 max-h-96 overflow-y-auto">
 {auditLogs.map((log: any) => (
 <div key={log.log_id} className="p-3 border rounded-lg text-sm">
 <div className="flex justify-between items-center mb-1">
 <div className="flex items-center gap-2">
 <Badge variant="outline">{log.user_type}</Badge>
 <span className="font-medium">{log.action}</span>
 </div>
 <span className="text-muted-foreground text-xs">
 {new Date(log.created_at).toLocaleString()}
 </span>
 </div>
 <div className="text-muted-foreground">
 {log.full_name || log.username || "System"} • {log.details}
 </div>
 {log.ip_address && (
 <div className="mt-1 text-muted-foreground text-xs">IP: {log.ip_address}</div>
 )}
 </div>
 ))}
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
