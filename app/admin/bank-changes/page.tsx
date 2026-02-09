"use client"

import { useState, useEffect, useTransition } from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { Skeleton } from "@/components/ui/skeleton"
import { 
 ArrowLeft, 
 CheckCircle, 
 XCircle, 
 Clock, 
 Building2, 
 CreditCard,
 AlertTriangle,
 ArrowRightLeft
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { 
 getAllBankChangeRequests, 
 approveBankChangeRequest, 
 rejectBankChangeRequest 
} from "@/lib/actions/admin"

interface BankChangeRequest {
 request_id: number
 supplier_id: number
 supplier_name: string
 contact_email: string
 current_bank_name: string | null
 current_account_no: string | null
 current_branch_code: string | null
 new_bank_name: string
 new_account_no: string
 new_branch_code: string
 reason: string | null
 status: "pending" | "approved" | "rejected"
 created_at: string
 reviewed_at: string | null
 reviewed_by_username: string | null
 rejection_reason: string | null
}

export default function BankChangesPage() {
 const [isPending, startTransition] = useTransition()
 const [requests, setRequests] = useState<BankChangeRequest[]>([])
 const [loading, setLoading] = useState(true)
 const [selectedRequest, setSelectedRequest] = useState<BankChangeRequest | null>(null)
 const [showRejectDialog, setShowRejectDialog] = useState(false)
 const [rejectionReason, setRejectionReason] = useState("")

 useEffect(() => {
 loadRequests()
 }, [])

 const loadRequests = async () => {
 try {
 const data = await getAllBankChangeRequests()
 setRequests(data as unknown as BankChangeRequest[])
 } catch (error) {
 console.error("Failed to load requests:", error)
 toast.error("Failed to load bank change requests")
 } finally {
 setLoading(false)
 }
 }

 const handleApprove = async (requestId: number) => {
 startTransition(async () => {
 const result = await approveBankChangeRequest(requestId)
 if (result.success) {
 toast.success("Bank change approved successfully")
 loadRequests()
 } else {
 toast.error(result.error || "Failed to approve request")
 }
 })
 }

 const handleReject = async () => {
 if (!selectedRequest) return
 
 startTransition(async () => {
 const result = await rejectBankChangeRequest(selectedRequest.request_id, rejectionReason)
 if (result.success) {
 toast.success("Bank change rejected")
 setShowRejectDialog(false)
 setSelectedRequest(null)
 setRejectionReason("")
 loadRequests()
 } else {
 toast.error(result.error || "Failed to reject request")
 }
 })
 }

 const pendingRequests = requests.filter(r => r.status === "pending")
 const processedRequests = requests.filter(r => r.status !== "pending")

 if (loading) {
 return (
 <div className="bg-muted min-h-screen">
 <DashboardHeader />
 <main className="mx-auto px-4 py-8 container">
 <div className="space-y-3">
 {Array.from({ length: 4 }).map((_, index) => (
 <div key={`bank-change-skeleton-${index}`} className="space-y-2 p-4 border rounded-lg">
 <div className="flex justify-between items-center">
 <Skeleton className="w-40 h-4" />
 <Skeleton className="w-20 h-4" />
 </div>
 <Skeleton className="w-56 h-3" />
 <div className="flex gap-4">
 <Skeleton className="w-24 h-3" />
 <Skeleton className="w-24 h-3" />
 </div>
 </div>
 ))}
 </div>
 </main>
 </div>
 )
 }

 return (
 <div className="bg-muted min-h-screen">
 <DashboardHeader />

 <main className="mx-auto px-4 py-8 container">
 <div className="mb-6">
 <Breadcrumbs
 items={[
 { label: "Dashboard", href: "/admin/dashboard" },
 { label: "Bank Changes" },
 ]}
 />
 <Link
 href="/admin/dashboard"
 className="inline-flex items-center mb-4 text-muted-foreground hover:text-foreground text-sm"
 >
 <ArrowLeft className="mr-2 w-4 h-4" />
 Back to dashboard
 </Link>
 <h2 className="font-bold text-3xl">Bank Change Requests</h2>
 <p className="text-muted-foreground">Review and approve supplier bank account changes</p>
 </div>

 <Tabs defaultValue="pending" className="space-y-4">
 <TabsList>
 <TabsTrigger value="pending">
 <Clock className="mr-2 w-4 h-4" />
 Pending ({pendingRequests.length})
 </TabsTrigger>
 <TabsTrigger value="processed">
 <CheckCircle className="mr-2 w-4 h-4" />
 Processed ({processedRequests.length})
 </TabsTrigger>
 </TabsList>

 {/* Pending Requests */}
 <TabsContent value="pending">
 {pendingRequests.length === 0 ? (
 <Card>
 <CardContent className="py-12">
 <EmptyState
 icon={CheckCircle}
 title="All caught up!"
 description="No pending bank change requests to review"
 variant="success"
 />
 </CardContent>
 </Card>
 ) : (
 <div className="space-y-4">
 {pendingRequests.map((request) => (
 <Card key={request.request_id}>
 <CardHeader>
 <div className="flex justify-between items-center">
 <div className="flex items-center gap-3">
 <div className="bg-warning-bg p-2 rounded-lg">
 <CreditCard className="w-5 h-5 text-warning" />
 </div>
 <div>
 <CardTitle className="text-lg">{request.supplier_name}</CardTitle>
 <CardDescription>{request.contact_email}</CardDescription>
 </div>
 </div>
 <Badge variant="secondary">
 <Clock className="mr-1 w-3 h-3" />
 Pending Review
 </Badge>
 </div>
 </CardHeader>
 <CardContent className="space-y-4">
 {/* Bank Details Comparison */}
 <div className="gap-4 grid md:grid-cols-2">
 <div className="bg-muted p-4 rounded-lg">
 <div className="flex items-center gap-2 mb-3">
 <Building2 className="w-4 h-4 text-muted-foreground" />
 <span className="font-medium text-sm">Current Bank Details</span>
 </div>
 <div className="space-y-2 text-sm">
 <div className="flex justify-between">
 <span className="text-muted-foreground">Bank Name</span>
 <span>{request.current_bank_name || "Not set"}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Account No</span>
 <span>{request.current_account_no || "Not set"}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Branch Code</span>
 <span>{request.current_branch_code || "Not set"}</span>
 </div>
 </div>
 </div>

 <div className="bg-success-bg p-4 border border-success-border rounded-lg">
 <div className="flex items-center gap-2 mb-3">
 <ArrowRightLeft className="w-4 h-4 text-success" />
 <span className="font-medium text-success-foreground text-sm">New Bank Details</span>
 </div>
 <div className="space-y-2 text-sm">
 <div className="flex justify-between">
 <span className="text-muted-foreground">Bank Name</span>
 <span className="font-medium">{request.new_bank_name}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Account No</span>
 <span className="font-medium">{request.new_account_no}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Branch Code</span>
 <span className="font-medium">{request.new_branch_code}</span>
 </div>
 </div>
 </div>
 </div>

 {/* Reason */}
 {request.reason && (
 <div className="bg-muted p-3 rounded-lg">
 <span className="text-muted-foreground text-sm">Reason for change: </span>
 <span className="text-sm">{request.reason}</span>
 </div>
 )}

 {/* Warning */}
 <div className="flex items-start gap-2 bg-warning-bg p-3 border border-warning-border rounded-lg">
 <AlertTriangle className="mt-0.5 w-4 h-4 text-warning" />
 <p className="text-warning-foreground text-sm">
 Approving this request will update the supplier's bank details for all future payments. 
 Please verify the new account details before approving.
 </p>
 </div>

 {/* Actions */}
 <div className="flex justify-between items-center pt-4 border-t">
 <span className="text-muted-foreground text-xs">
 Requested: {new Date(request.created_at).toLocaleString()}
 </span>
 <div className="flex gap-2">
 <Button
 variant="outline"
 onClick={() => {
 setSelectedRequest(request)
 setShowRejectDialog(true)
 }}
 disabled={isPending}
 >
 <XCircle className="mr-2 w-4 h-4" />
 Reject
 </Button>
 <Button
 onClick={() => handleApprove(request.request_id)}
 disabled={isPending}
 >
 <CheckCircle className="mr-2 w-4 h-4" />
 Approve Change
 </Button>
 </div>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 )}
 </TabsContent>

 {/* Processed Requests */}
 <TabsContent value="processed">
 {processedRequests.length === 0 ? (
 <Card>
 <CardContent className="py-12">
 <EmptyState
 icon={Clock}
 title="No processed requests"
 description="Processed bank change requests will appear here"
 />
 </CardContent>
 </Card>
 ) : (
 <div className="space-y-4">
 {processedRequests.map((request) => (
 <Card key={request.request_id}>
 <CardContent className="p-4">
 <div className="flex justify-between items-center">
 <div className="flex items-center gap-4">
 <div className={`p-2 rounded-lg ${
 request.status === "approved" 
 ? "bg-success-bg" 
 : "bg-error-bg"
 }`}>
 {request.status === "approved" ? (
 <CheckCircle className="w-5 h-5 text-success" />
 ) : (
 <XCircle className="w-5 h-5 text-error" />
 )}
 </div>
 <div>
 <p className="font-medium">{request.supplier_name}</p>
 <p className="text-muted-foreground text-sm">
 {request.new_bank_name} - {request.new_account_no}
 </p>
 </div>
 </div>
 <div className="text-right">
 <Badge variant={request.status === "approved" ? "default" : "destructive"} className="capitalize">
 {request.status}
 </Badge>
 <p className="mt-1 text-muted-foreground text-xs">
 {request.reviewed_at ? new Date(request.reviewed_at).toLocaleString() : ""}
 </p>
 {request.reviewed_by_username && (
 <p className="text-muted-foreground text-xs">
 by {request.reviewed_by_username}
 </p>
 )}
 </div>
 </div>
 {request.rejection_reason && (
 <div className="bg-error-bg mt-3 p-2 rounded text-error-foreground text-sm">
 Rejection reason: {request.rejection_reason}
 </div>
 )}
 </CardContent>
 </Card>
 ))}
 </div>
 )}
 </TabsContent>
 </Tabs>

 {/* Reject Dialog */}
 <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
 <DialogContent className="bg-popover text-popover-foreground">
 <DialogHeader>
 <DialogTitle>Reject Bank Change Request</DialogTitle>
 <DialogDescription>
 Please provide a reason for rejecting this bank change request. 
 This will be visible to the supplier.
 </DialogDescription>
 </DialogHeader>
 <div className="space-y-4 py-4">
 <div className="space-y-2">
 <Label htmlFor="rejection-reason">Rejection Reason</Label>
 <Input
 id="rejection-reason"
 value={rejectionReason}
 onChange={(e) => setRejectionReason(e.target.value)}
 placeholder="e.g., Invalid account number format"
 />
 </div>
 </div>
 <DialogFooter>
 <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
 Cancel
 </Button>
 <Button variant="destructive" onClick={handleReject} disabled={isPending}>
 Reject Request
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </main>
 </div>
 )
}
