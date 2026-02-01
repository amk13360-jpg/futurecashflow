"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
 <div className="min-h-screen bg-muted/30">
 <DashboardHeader />

 <main className="container mx-auto px-4 py-8">
 <div className="mb-6">
 <Link
 href="/admin/dashboard"
 className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
 >
 <ArrowLeft className="h-4 w-4 mr-2" />
 Back to dashboard
 </Link>
 <h2 className="text-3xl font-bold">Reports & Analytics</h2>
 <p className="text-muted-foreground">Comprehensive reporting and audit trails</p>
 </div>

 {/* System Statistics */}
 {stats && (
 <div className="grid md:grid-cols-4 gap-4 mb-6">
 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-sm font-medium text-muted-foreground">Active Suppliers</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{stats.active_suppliers}</div>
 <p className="text-xs text-muted-foreground">{stats.pending_suppliers} pending approval</p>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-sm font-medium text-muted-foreground">Pending Offers</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{stats.pending_offers}</div>
 <p className="text-xs text-muted-foreground">{stats.accepted_offers} accepted</p>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-sm font-medium text-muted-foreground">Total Disbursed</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">R {(stats.total_disbursed || 0).toLocaleString()}</div>
 <p className="text-xs text-muted-foreground">{stats.completed_payments} payments</p>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-sm font-medium text-muted-foreground">Pending Items</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{stats.pending_bank_changes + stats.pending_cessions}</div>
 <p className="text-xs text-muted-foreground">
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
 <div className="grid md:grid-cols-4 gap-4">
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
 <TrendingUp className="h-4 w-4 mr-2" />
 Offer Acceptance
 </TabsTrigger>
 <TabsTrigger value="disbursements">
 <RandIcon className="h-4 w-4 mr-2" />
 Disbursements
 </TabsTrigger>
 <TabsTrigger value="suppliers">
 <Users className="h-4 w-4 mr-2" />
 Supplier Status
 </TabsTrigger>
 <TabsTrigger value="audit">
 <Activity className="h-4 w-4 mr-2" />
 Audit Logs
 </TabsTrigger>
 </TabsList>

 {/* Offer Acceptance Summary */}
 <TabsContent value="offers">
 <Card>
 <CardHeader>
 <div className="flex items-center justify-between">
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
 <Download className="h-4 w-4 mr-2" />
 Export CSV
 </Button>
 </div>
 </CardHeader>
 <CardContent>
 {loading ? (
 <div className="text-center py-12 text-muted-foreground">Loading...</div>
 ) : offerSummary.length === 0 ? (
 <div className="text-center py-12 text-muted-foreground">
 <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
 <p>No offer data available</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b">
 <th className="text-left p-2">Date</th>
 <th className="text-left p-2">Buyer</th>
 <th className="text-left p-2">Supplier</th>
 <th className="text-right p-2">Total Offers</th>
 <th className="text-right p-2">Accepted</th>
 <th className="text-right p-2">Rejected</th>
 <th className="text-right p-2">Expired</th>
 <th className="text-right p-2">Acceptance Rate</th>
 <th className="text-right p-2">Total Value</th>
 </tr>
 </thead>
 <tbody>
 {offerSummary.map((row: any, idx: number) => (
 <tr key={idx} className="border-b hover:bg-muted/50">
 <td className="p-2">{new Date(row.date).toLocaleDateString()}</td>
 <td className="p-2">{row.buyer_name}</td>
 <td className="p-2">{row.supplier_name}</td>
 <td className="text-right p-2">{row.total_offers}</td>
 <td className="text-right p-2 text-success">{row.accepted_offers}</td>
 <td className="text-right p-2 text-error">{row.rejected_offers}</td>
 <td className="text-right p-2 text-muted-foreground">{row.expired_offers}</td>
 <td className="text-right p-2">
 {((row.accepted_offers / row.total_offers) * 100).toFixed(1)}%
 </td>
 <td className="text-right p-2">R {row.accepted_value.toLocaleString()}</td>
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
 <div className="flex items-center justify-between">
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
 <Download className="h-4 w-4 mr-2" />
 Export CSV
 </Button>
 </div>
 </CardHeader>
 <CardContent>
 {loading ? (
 <div className="text-center py-12 text-muted-foreground">Loading...</div>
 ) : disbursements.length === 0 ? (
 <div className="text-center py-12 text-muted-foreground">
 <RandIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
 <p>No disbursement data available</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b">
 <th className="text-left p-2">Reference</th>
 <th className="text-left p-2">Batch ID</th>
 <th className="text-left p-2">Supplier</th>
 <th className="text-left p-2">Invoice</th>
 <th className="text-right p-2">Amount</th>
 <th className="text-left p-2">Status</th>
 <th className="text-left p-2">Scheduled</th>
 <th className="text-left p-2">Completed</th>
 </tr>
 </thead>
 <tbody>
 {disbursements.map((payment: any) => (
 <tr key={payment.payment_id} className="border-b hover:bg-muted/50">
 <td className="p-2 font-mono text-xs">{payment.payment_reference}</td>
 <td className="p-2 text-xs">{payment.batch_id || "-"}</td>
 <td className="p-2">{payment.supplier_name}</td>
 <td className="p-2">{payment.invoice_number}</td>
 <td className="text-right p-2">
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
 <div className="flex items-center justify-between">
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
 <Download className="h-4 w-4 mr-2" />
 Export CSV
 </Button>
 </div>
 </CardHeader>
 <CardContent>
 {loading ? (
 <div className="text-center py-12 text-muted-foreground">Loading...</div>
 ) : suppliers.length === 0 ? (
 <div className="text-center py-12 text-muted-foreground">
 <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
 <p>No supplier data available</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b">
 <th className="text-left p-2">Vendor #</th>
 <th className="text-left p-2">Name</th>
 <th className="text-left p-2">Status</th>
 <th className="text-left p-2">Cession</th>
 <th className="text-right p-2">Invoices</th>
 <th className="text-right p-2">Offers</th>
 <th className="text-right p-2">Accepted</th>
 <th className="text-right p-2">Disbursed</th>
 <th className="text-left p-2">Bank</th>
 </tr>
 </thead>
 <tbody>
 {suppliers.map((supplier: any) => (
 <tr key={supplier.supplier_id} className="border-b hover:bg-muted/50">
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
 <td className="text-right p-2">{supplier.invoice_count}</td>
 <td className="text-right p-2">{supplier.offer_count}</td>
 <td className="text-right p-2">{supplier.accepted_offers}</td>
 <td className="text-right p-2">R {(supplier.total_disbursed || 0).toLocaleString()}</td>
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
 <div className="flex items-center justify-between">
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
 <Download className="h-4 w-4 mr-2" />
 Export CSV
 </Button>
 </div>
 </CardHeader>
 <CardContent>
 {loading ? (
 <div className="text-center py-12 text-muted-foreground">Loading...</div>
 ) : auditLogs.length === 0 ? (
 <div className="text-center py-12 text-muted-foreground">
 <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
 <p>No audit logs available</p>
 </div>
 ) : (
 <div className="space-y-2 max-h-96 overflow-y-auto">
 {auditLogs.map((log: any) => (
 <div key={log.log_id} className="p-3 border rounded-lg text-sm">
 <div className="flex items-center justify-between mb-1">
 <div className="flex items-center gap-2">
 <Badge variant="outline">{log.user_type}</Badge>
 <span className="font-medium">{log.action}</span>
 </div>
 <span className="text-xs text-muted-foreground">
 {new Date(log.created_at).toLocaleString()}
 </span>
 </div>
 <div className="text-muted-foreground">
 {log.full_name || log.username || "System"} • {log.details}
 </div>
 {log.ip_address && (
 <div className="text-xs text-muted-foreground mt-1">IP: {log.ip_address}</div>
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
