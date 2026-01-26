"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  getEligibleInvoicesForBatching,
  getOfferBatches,
  getBatchOffers,
  createOfferBatch,
  sendOfferBatch,
  cancelOfferBatch,
  excludeFromBatch,
  type EligibleInvoiceGroup,
  type OfferBatch,
  type BatchOffer,
} from "@/lib/actions/offer-batches"
import { 
  ArrowLeft, Package, Send, Clock, CheckCircle2, XCircle, 
  Users, FileText, DollarSign, Eye, Trash2, RefreshCw 
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function OfferBatchesPage() {
  const [loading, setLoading] = useState(true)
  const [eligibleGroups, setEligibleGroups] = useState<EligibleInvoiceGroup[]>([])
  const [batches, setBatches] = useState<OfferBatch[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<EligibleInvoiceGroup | null>(null)
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([])
  const [sendMode, setSendMode] = useState<"auto" | "review" | "scheduled">("review")
  const [scheduledDate, setScheduledDate] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [viewBatchDialogOpen, setViewBatchDialogOpen] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<OfferBatch | null>(null)
  const [batchOffers, setBatchOffers] = useState<BatchOffer[]>([])
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [groupsData, batchesData] = await Promise.all([
        getEligibleInvoicesForBatching(),
        getOfferBatches(),
      ])
      setEligibleGroups(groupsData)
      setBatches(batchesData)
    } catch (error: any) {
      console.error("[OfferBatches UI] Load error:", error)
      toast.error(error.message || "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCreateDialog = (group: EligibleInvoiceGroup) => {
    setSelectedSupplier(group)
    setSelectedInvoices(group.invoices.map((i) => i.invoice_id))
    setSendMode("review")
    setScheduledDate("")
    setCreateDialogOpen(true)
  }

  const handleCreateBatch = async () => {
    if (!selectedSupplier || selectedInvoices.length === 0) return

    setProcessing(true)
    try {
      // Validate and normalize scheduled date
      if (sendMode === "scheduled" && !scheduledDate) {
        toast.error("Please select a scheduled date/time")
        setProcessing(false)
        return
      }
      // Only pass a date when in scheduled mode, else force null
      const scheduledAt = sendMode === "scheduled"
        ? (scheduledDate ? new Date(scheduledDate) : null)
        : null
      // Log the payload before submit for verification
      const payload = {
        supplierId: selectedSupplier.supplier_id,
        invoiceIds: selectedInvoices,
        sendMode,
        scheduledSendAt: scheduledAt,
      }
      console.log("[OfferBatches UI] CreateBatch payload", payload)
      const result = await createOfferBatch(
        selectedSupplier.supplier_id,
        selectedInvoices,
        sendMode,
        scheduledAt
      )

      toast.success(`Batch created with ${result.offersCreated} offers`)
      if (result.errors.length > 0) {
        // Show each error as a separate toast
        result.errors.forEach((err) => {
          toast.warning(err)
        })
      }

      setCreateDialogOpen(false)
      loadData()
    } catch (error: any) {
      console.error('[OfferBatches UI] Error creating batch:', error)
      toast.error(error.message || "Failed to create batch")
    } finally {
      setProcessing(false)
    }
  }

  const handleViewBatch = async (batch: OfferBatch) => {
    setSelectedBatch(batch)
    try {
      const offers = await getBatchOffers(batch.batch_id)
      setBatchOffers(offers)
      setViewBatchDialogOpen(true)
    } catch (error: any) {
      toast.error("Failed to load batch details")
    }
  }

  const handleSendBatch = async (batchId: number) => {
    setProcessing(true)
    try {
      const result = await sendOfferBatch(batchId)
      toast.success(result.message)
      setViewBatchDialogOpen(false)
      loadData()
    } catch (error: any) {
      toast.error(error.message || "Failed to send batch")
    } finally {
      setProcessing(false)
    }
  }

  const handleCancelBatch = async (batchId: number) => {
    if (!confirm("Are you sure you want to cancel this batch? This will revert all invoices.")) return

    setProcessing(true)
    try {
      await cancelOfferBatch(batchId)
      toast.success("Batch cancelled")
      setViewBatchDialogOpen(false)
      loadData()
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel batch")
    } finally {
      setProcessing(false)
    }
  }

  const toggleInvoiceSelection = (invoiceId: number) => {
    setSelectedInvoices((prev) =>
      prev.includes(invoiceId)
        ? prev.filter((id) => id !== invoiceId)
        : [...prev, invoiceId]
    )
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-gray-500",
      pending_review: "bg-amber-500",
      sent: "bg-blue-500",
      partial_accepted: "bg-purple-500",
      accepted: "bg-green-500",
      expired: "bg-red-500",
      cancelled: "bg-gray-400",
    }
    return (
      <Badge className={`${styles[status] || "bg-gray-500"} text-white`}>
        {status.replace("_", " ")}
      </Badge>
    )
  }

  const pendingBatches = batches.filter((b) => b.status === "pending_review")
  const sentBatches = batches.filter((b) => b.status === "sent")
  const completedBatches = batches.filter((b) => 
    ["accepted", "partial_accepted", "expired", "cancelled"].includes(b.status)
  )

  return (
    <div className="bg-muted/30 min-h-screen">
      <DashboardHeader />

      <main className="mx-auto px-4 py-8 container">
        <div className="mb-6">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center mb-4 text-muted-foreground hover:text-foreground text-sm"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to dashboard
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-bold text-3xl">Offer Batches</h2>
              <p className="text-muted-foreground">
                Group and send early payment offers to suppliers
              </p>
            </div>
            <Button onClick={loadData} variant="outline" size="sm">
              <RefreshCw className="mr-2 w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="gap-4 grid md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-500/10 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Eligible Suppliers</p>
                  <p className="font-bold text-2xl">{eligibleGroups.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="bg-amber-500/10 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Pending Review</p>
                  <p className="font-bold text-2xl">{pendingBatches.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-500/10 p-3 rounded-lg">
                  <Send className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Sent</p>
                  <p className="font-bold text-2xl">{sentBatches.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-500/10 p-3 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Completed</p>
                  <p className="font-bold text-2xl">{completedBatches.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="eligible" className="space-y-4">
          <TabsList>
            <TabsTrigger value="eligible">
              <Package className="mr-2 w-4 h-4" />
              Eligible for Batching ({eligibleGroups.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              <Clock className="mr-2 w-4 h-4" />
              Pending Review ({pendingBatches.length})
            </TabsTrigger>
            <TabsTrigger value="sent">
              <Send className="mr-2 w-4 h-4" />
              Sent ({sentBatches.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              <FileText className="mr-2 w-4 h-4" />
              History ({completedBatches.length})
            </TabsTrigger>
          </TabsList>

          {/* Eligible for Batching */}
          <TabsContent value="eligible">
            <Card>
              <CardHeader>
                <CardTitle>Suppliers with Eligible Invoices</CardTitle>
                <CardDescription>
                  These suppliers have matched invoices ready for offer generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-8 text-muted-foreground text-center">Loading...</div>
                ) : eligibleGroups.length === 0 ? (
                  <div className="py-8 text-muted-foreground text-center">
                    No eligible invoices for batching
                  </div>
                ) : (
                  <div className="space-y-4">
                    {eligibleGroups.map((group) => (
                      <div
                        key={group.supplier_id}
                        className="flex justify-between items-center hover:bg-muted/50 p-4 border rounded-lg transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{group.supplier_name}</h4>
                            <Badge variant="outline">{group.buyer_name}</Badge>
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {group.supplier_email}
                          </p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span className="flex items-center gap-1">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              {group.invoice_count} invoices
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                              R {group.total_amount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                        <Button onClick={() => handleOpenCreateDialog(group)}>
                          <Package className="mr-2 w-4 h-4" />
                          Create Batch
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Review */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Batches Pending Review</CardTitle>
                <CardDescription>
                  Review and send these batches to suppliers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingBatches.length === 0 ? (
                  <div className="py-8 text-muted-foreground text-center">
                    No pending batches
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingBatches.map((batch) => (
                      <div
                        key={batch.batch_id}
                        className="flex justify-between items-center p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{batch.supplier_name}</h4>
                            {getStatusBadge(batch.status)}
                          </div>
                          <div className="flex gap-4 mt-2 text-muted-foreground text-sm">
                            <span>{batch.invoice_count} invoices</span>
                            <span>R {Number(batch.total_net_payment || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</span>
                            <span>Created: {new Date(batch.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewBatch(batch)}>
                            <Eye className="mr-1 w-4 h-4" />
                            Review
                          </Button>
                          <Button size="sm" onClick={() => handleSendBatch(batch.batch_id)} disabled={processing}>
                            <Send className="mr-1 w-4 h-4" />
                            Send
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sent */}
          <TabsContent value="sent">
            <Card>
              <CardHeader>
                <CardTitle>Sent Batches</CardTitle>
                <CardDescription>
                  Batches awaiting supplier response
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sentBatches.length === 0 ? (
                  <div className="py-8 text-muted-foreground text-center">
                    No sent batches
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sentBatches.map((batch) => (
                      <div
                        key={batch.batch_id}
                        className="flex justify-between items-center p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{batch.supplier_name}</h4>
                            {getStatusBadge(batch.status)}
                          </div>
                          <div className="flex gap-4 mt-2 text-muted-foreground text-sm">
                            <span>{batch.invoice_count} invoices</span>
                            <span>R {Number(batch.total_net_payment || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</span>
                            <span>Sent: {batch.sent_at ? new Date(batch.sent_at).toLocaleDateString() : "—"}</span>
                            <span>Expires: {batch.expires_at ? new Date(batch.expires_at).toLocaleDateString() : "—"}</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleViewBatch(batch)}>
                          <Eye className="mr-1 w-4 h-4" />
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Batch History</CardTitle>
                <CardDescription>
                  Completed, expired, and cancelled batches
                </CardDescription>
              </CardHeader>
              <CardContent>
                {completedBatches.length === 0 ? (
                  <div className="py-8 text-muted-foreground text-center">
                    No batch history
                  </div>
                ) : (
                  <div className="space-y-4">
                    {completedBatches.map((batch) => (
                      <div
                        key={batch.batch_id}
                        className="flex justify-between items-center p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{batch.supplier_name}</h4>
                            {getStatusBadge(batch.status)}
                          </div>
                          <div className="flex gap-4 mt-2 text-muted-foreground text-sm">
                            <span>{batch.invoice_count} invoices</span>
                            <span>R {Number(batch.total_net_payment || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleViewBatch(batch)}>
                          <Eye className="mr-1 w-4 h-4" />
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Batch Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Offer Batch</DialogTitle>
            <DialogDescription>
              Create an offer batch for {selectedSupplier?.supplier_name}
            </DialogDescription>
          </DialogHeader>

          {selectedSupplier && (
            <div className="space-y-4">
              {/* Supplier Info */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold">{selectedSupplier.supplier_name}</p>
                    <p className="text-muted-foreground text-sm">{selectedSupplier.supplier_email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground text-sm">Buyer</p>
                    <p className="font-medium">{selectedSupplier.buyer_name}</p>
                  </div>
                </div>
              </div>

              {/* Send Mode */}
              <div className="space-y-2">
                <Label>Send Mode</Label>
                <Select 
                  value={sendMode} 
                  onValueChange={(v) => {
                    const mode = v as "auto" | "review" | "scheduled"
                    setSendMode(mode)
                    if (mode !== "scheduled") setScheduledDate("")
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="review">Review & Approve (recommended)</SelectItem>
                    <SelectItem value="auto">Auto-send immediately</SelectItem>
                    <SelectItem value="scheduled">Schedule for later</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  {sendMode === "review" && "Batch will be created for your review before sending"}
                  {sendMode === "auto" && "Batch will be sent to supplier immediately"}
                  {sendMode === "scheduled" && "Batch will be sent at the scheduled time"}
                </p>
              </div>

              {sendMode === "scheduled" && (
                <div className="space-y-2">
                  <Label>Scheduled Send Date/Time</Label>
                  <Input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>
              )}

              {/* Invoice Selection */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Select Invoices ({selectedInvoices.length} of {selectedSupplier.invoices.length})</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedInvoices(selectedSupplier.invoices.map((i) => i.invoice_id))}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedInvoices([])}
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {selectedSupplier.invoices.map((invoice) => (
                    <div
                      key={invoice.invoice_id}
                      className="flex items-center gap-3 hover:bg-muted/50 p-3 border-b last:border-b-0"
                    >
                      <Checkbox
                        checked={selectedInvoices.includes(invoice.invoice_id)}
                        onCheckedChange={() => toggleInvoiceSelection(invoice.invoice_id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{invoice.invoice_number}</p>
                        <p className="text-muted-foreground text-xs">
                          Due: {new Date(invoice.due_date).toLocaleDateString()} ({invoice.days_to_maturity} days)
                        </p>
                      </div>
                      <p className="font-semibold">
                        R {invoice.amount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-primary/5 p-4 rounded-lg">
                <p className="mb-2 font-medium text-sm">Batch Summary</p>
                <div className="gap-2 grid grid-cols-2 text-sm">
                  <span className="text-muted-foreground">Selected Invoices:</span>
                  <span className="font-medium">{selectedInvoices.length}</span>
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="font-medium">
                    R {selectedSupplier.invoices
                      .filter((i) => selectedInvoices.includes(i.invoice_id))
                      .reduce((sum, i) => sum + i.amount, 0)
                      .toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateBatch} 
              disabled={processing || selectedInvoices.length === 0}
            >
              {processing ? "Creating..." : "Create Batch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Batch Dialog */}
      <Dialog open={viewBatchDialogOpen} onOpenChange={setViewBatchDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Batch Details</DialogTitle>
            <DialogDescription>
              {selectedBatch?.supplier_name} - {getStatusBadge(selectedBatch?.status || "")}
            </DialogDescription>
          </DialogHeader>

          {selectedBatch && (
            <div className="space-y-4">
              {/* Batch Info */}
              <div className="gap-4 grid grid-cols-2 bg-muted p-4 rounded-lg">
                <div>
                  <p className="text-muted-foreground text-sm">Invoices</p>
                  <p className="font-semibold">{selectedBatch.invoice_count}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Net Payment</p>
                  <p className="font-semibold">
                    R {Number(selectedBatch.total_net_payment || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Created</p>
                  <p className="font-medium">{new Date(selectedBatch.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Expires</p>
                  <p className="font-medium">
                    {selectedBatch.expires_at ? new Date(selectedBatch.expires_at).toLocaleDateString() : "—"}
                  </p>
                </div>
              </div>

              {/* Offers */}
              <div>
                <p className="mb-2 font-medium">Offers in Batch</p>
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {batchOffers.map((offer) => (
                    <div
                      key={offer.offer_id}
                      className="flex justify-between items-center p-3 border-b last:border-b-0"
                    >
                      <div>
                        <p className="font-medium">{offer.invoice_number}</p>
                        <p className="text-muted-foreground text-xs">
                          {offer.days_to_maturity} days to maturity
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          R {Number(offer.net_payment_amount).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Discount: R {Number(offer.discount_amount).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedBatch?.status === "pending_review" && (
              <>
                <Button 
                  variant="destructive" 
                  onClick={() => handleCancelBatch(selectedBatch.batch_id)}
                  disabled={processing}
                >
                  <Trash2 className="mr-1 w-4 h-4" />
                  Cancel Batch
                </Button>
                <Button 
                  onClick={() => handleSendBatch(selectedBatch.batch_id)}
                  disabled={processing}
                >
                  <Send className="mr-1 w-4 h-4" />
                  Send to Supplier
                </Button>
              </>
            )}
            {selectedBatch?.status !== "pending_review" && (
              <Button variant="outline" onClick={() => setViewBatchDialogOpen(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
