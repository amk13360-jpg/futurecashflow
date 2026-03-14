"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { EmptyState } from "@/components/ui/empty-state"
import {
  getPaymentQueue,
  getAllPayments,
  queuePayments,
  generatePaymentBatch,
  markPaymentsCompleted,
  getRepayments,
} from "@/lib/actions/payments"
import { Download, CheckCircle, ArrowLeft, Clock, FileSpreadsheet } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import ExcelJS from "exceljs"

export default function PaymentsPage() {
  const [queue, setQueue] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [repayments, setRepayments] = useState<any[]>([])
  const [selectedOffers, setSelectedOffers] = useState<number[]>([])
  const [selectedPayments, setSelectedPayments] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [queueData, paymentsData, repaymentsData] = await Promise.all([
        getPaymentQueue(),
        getAllPayments(),
        getRepayments(),
      ])
      setQueue(queueData)
      setPayments(paymentsData)
      setRepayments(repaymentsData)
    } catch (error) {
      toast.error("Failed to load payment data")
    } finally {
      setLoading(false)
    }
  }

  const handleQueuePayments = async () => {
    if (selectedOffers.length === 0) {
      toast.error("Please select at least one offer")
      return
    }

    // Validate bank details for selected offers
    const selectedItems = queue.filter((item: any) => selectedOffers.includes(item.offer_id))
    const missingBank = selectedItems.filter((item: any) => !item.bank_account_no || !item.bank_name)
    if (missingBank.length > 0) {
      toast.error(
        `${missingBank.length} selected offer(s) are missing bank details. Please resolve before queuing.`
      )
      return
    }

    setProcessing(true)
    try {
      const result = await queuePayments(selectedOffers)
      
      if (result.queued.length > 0) {
        toast.success(`Successfully queued ${result.queued.length} payments`)
      }
      
      if (result.errors.length > 0) {
        console.error("Payment queuing errors:", result.errors)
        // Show first few errors to user
        const errorSummary = result.errors.length <= 3 
          ? result.errors.join('; ') 
          : `${result.errors.slice(0, 2).join('; ')} and ${result.errors.length - 2} more...`
        toast.error(`Failed to queue ${result.errors.length} payments: ${errorSummary}`)
      }
      
      if (result.queued.length === 0 && result.errors.length === 0) {
        toast.warning("No payments were queued - no eligible offers found")
      }
      
      setSelectedOffers([])
      loadData()
    } catch (error: any) {
      toast.error(error.message || "Failed to queue payments")
    } finally {
      setProcessing(false)
    }
  }

  const handleGenerateBatch = async () => {
    if (selectedPayments.length === 0) {
      toast.error("Please select at least one payment")
      return
    }

    setProcessing(true)
    try {
      const result = await generatePaymentBatch(selectedPayments)

      // Download CSV
      const blob = new Blob([result.csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `payment_batch_${result.batchId}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      toast.success(`Generated batch with ${result.paymentCount} payments`)
      setSelectedPayments([])
      loadData()
    } catch (error: any) {
      toast.error(error.message || "Failed to generate batch")
    } finally {
      setProcessing(false)
    }
  }

  const handleMarkCompleted = async () => {
    if (selectedPayments.length === 0) {
      toast.error("Please select at least one payment")
      return
    }

    setProcessing(true)
    try {
      const result = await markPaymentsCompleted(selectedPayments)
      toast.success(`Marked ${result.count} payments as completed`)
      setSelectedPayments([])
      loadData()
    } catch (error: any) {
      toast.error(error.message || "Failed to mark payments completed")
    } finally {
      setProcessing(false)
    }
  }

  const queuedPayments = payments.filter((p) => p.status === "queued")
  const processingPayments = payments.filter((p) => p.status === "processing")

  // Excel Export Functions
  const exportPaymentQueueToExcel = async () => {
    if (queue.length === 0) {
      toast.error("No data to export")
      return
    }

    // Warn if any records are missing critical bank details
    const missingBank = queue.filter((item: any) => !item.bank_account_no || !item.bank_name)
    if (missingBank.length > 0) {
      toast.warning(`${missingBank.length} record(s) are missing bank details and may not be processable`)
    }

    const exportData = queue.map((item: any) => ({
      "Offer ID": item.offer_id,
      "Invoice Number": item.invoice_number,
      "Supplier Name": item.supplier_name,
      "Buyer Name": item.buyer_name,
      "Net Payment Amount": item.net_payment_amount,
      "Currency": item.currency,
      "Bank Name": item.bank_name,
      "Account Number": item.bank_account_no,
      "Branch Code": item.bank_branch_code || "",
      "Accepted Date": item.accepted_at ? new Date(item.accepted_at).toLocaleDateString() : "",
    }))

    try {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet("Payment Queue")
      
      // Add headers
      const headers = Object.keys(exportData[0] || {})
      worksheet.addRow(headers)
      
      // Add data rows
      exportData.forEach(row => {
        worksheet.addRow(Object.values(row))
      })
      
      // Auto-size columns
      headers.forEach((header, index) => {
        const columnIndex = index + 1
        const maxLength = Math.max(header.length, 15)
        worksheet.getColumn(columnIndex).width = maxLength
      })
      
      // Export to blob and download
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Payment_Queue_${new Date().toISOString().split("T")[0]}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
      
      toast.success(`Exported ${queue.length} records to Excel`)
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export data to Excel")
    }
  }

  const exportPaymentsToExcel = async () => {
    if (payments.length === 0) {
      toast.error("No data to export")
      return
    }

    const exportData = payments.map((payment: any) => ({
      "Payment ID": payment.payment_id,
      "Payment Reference": payment.payment_reference,
      "Status": payment.status,
      "Supplier Name": payment.supplier_name,
      "Invoice Number": payment.invoice_number,
      "Amount": payment.amount,
      "Currency": payment.currency,
      "Payment Method": payment.payment_method || "EFT",
      "Batch ID": payment.batch_id || "",
      "Scheduled Date": payment.scheduled_date ? new Date(payment.scheduled_date).toLocaleDateString() : "",
      "Completed Date": payment.completed_date ? new Date(payment.completed_date).toLocaleDateString() : "",
      "Created At": payment.created_at ? new Date(payment.created_at).toLocaleDateString() : "",
    }))

    try {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet("All Payments")
      
      // Add headers
      const headers = Object.keys(exportData[0] || {})
      worksheet.addRow(headers)
      
      // Add data rows
      exportData.forEach(row => {
        worksheet.addRow(Object.values(row))
      })
      
      // Auto-size columns
      headers.forEach((header, index) => {
        const columnIndex = index + 1
        const maxLength = Math.max(header.length, 15)
        worksheet.getColumn(columnIndex).width = maxLength
      })
      
      // Export to blob and download
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `All_Payments_${new Date().toISOString().split("T")[0]}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
      
      toast.success(`Exported ${payments.length} records to Excel`)
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export data to Excel")
    }
  }

  const exportRepaymentsToExcel = async () => {
    if (repayments.length === 0) {
      toast.error("No data to export")
      return
    }

    const exportData = repayments.map((repayment: any) => ({
      "Repayment ID": repayment.repayment_id,
      "Invoice Number": repayment.invoice_number,
      "Buyer Name": repayment.buyer_name,
      "Buyer Code": repayment.buyer_code,
      "Supplier Name": repayment.supplier_name,
      "Status": repayment.status,
      "Expected Amount": repayment.expected_amount,
      "Received Amount": repayment.received_amount || 0,
      "Due Date": repayment.due_date ? new Date(repayment.due_date).toLocaleDateString() : "",
      "Received Date": repayment.received_date ? new Date(repayment.received_date).toLocaleDateString() : "",
      "Reconciliation Reference": repayment.reconciliation_reference || "",
    }))

    try {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet("Repayments")
      
      // Add headers
      const headers = Object.keys(exportData[0] || {})
      worksheet.addRow(headers)
      
      // Add data rows
      exportData.forEach(row => {
        worksheet.addRow(Object.values(row))
      })
      
      // Auto-size columns
      headers.forEach((header, index) => {
        const columnIndex = index + 1
        const maxLength = Math.max(header.length, 15)
        worksheet.getColumn(columnIndex).width = maxLength
      })
      
      // Export to blob and download
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Repayments_${new Date().toISOString().split("T")[0]}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
      
      toast.success(`Exported ${repayments.length} records to Excel`)
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export data to Excel")
    }
  }

  return (
    <div className="bg-muted min-h-screen">

      <main className="mx-auto px-4 py-8 container">
        <div className="mb-6">
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Payments" },
            ]}
          />
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center mb-4 text-muted-foreground hover:text-foreground text-sm"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to dashboard
          </Link>
          <h2 className="font-bold text-3xl">Payment Processing</h2>
          <p className="text-muted-foreground">Manage disbursements and track repayments</p>
        </div>

        <Tabs defaultValue="queue" className="space-y-4">
          <TabsList>
            <TabsTrigger value="queue">Payment Queue ({queue.length})</TabsTrigger>
            <TabsTrigger value="payments">All Payments ({payments.length})</TabsTrigger>
            <TabsTrigger value="repayments">Repayments ({repayments.length})</TabsTrigger>
          </TabsList>

          {/* Payment Queue Tab */}
          <TabsContent value="queue">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Payment Queue</CardTitle>
                    <CardDescription>Accepted offers ready for payment processing</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={exportPaymentQueueToExcel} 
                      variant="outline" 
                      disabled={queue.length === 0}
                      className="bg-transparent"
                    >
                      <FileSpreadsheet className="mr-2 w-4 h-4" />
                      Export Excel
                    </Button>
                    <Button onClick={handleQueuePayments} disabled={selectedOffers.length === 0 || processing}>
                      <CheckCircle className="mr-2 w-4 h-4" />
                      {processing ? "Processing..." : `Queue Payments (${selectedOffers.length})`}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={`queue-skeleton-${index}`} className="flex items-center gap-4 p-4 border rounded-lg">
                        <Skeleton className="w-4 h-4" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="w-32 h-4" />
                          <Skeleton className="w-48 h-3" />
                          <div className="flex items-center gap-4">
                            <Skeleton className="w-24 h-3" />
                            <Skeleton className="w-20 h-3" />
                            <Skeleton className="w-24 h-3" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : queue.length === 0 ? (
                  <div className="py-12">
                    <EmptyState
                      icon={Clock}
                      title="No offers in payment queue"
                      description="Accepted offers ready for payment will appear here"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {queue.map((item: any) => (
                      <div key={item.offer_id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <Checkbox
                          checked={selectedOffers.includes(item.offer_id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedOffers([...selectedOffers, item.offer_id])
                            } else {
                              setSelectedOffers(selectedOffers.filter((id) => id !== item.offer_id))
                            }
                          }}
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{item.invoice_number}</h4>
                          <p className="text-muted-foreground text-sm">
                            {item.supplier_name} • {item.buyer_name}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="font-medium">
                              {item.currency} {item.net_payment_amount.toLocaleString()}
                            </span>
                            <span className="text-muted-foreground">{item.bank_name}</span>
                            <span className="text-muted-foreground">{item.bank_account_no}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>All Payments</CardTitle>
                    <CardDescription>
                      {queuedPayments.length} queued • {processingPayments.length} processing
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={exportPaymentsToExcel}
                      variant="outline"
                      disabled={payments.length === 0}
                      className="bg-transparent"
                    >
                      <FileSpreadsheet className="mr-2 w-4 h-4" />
                      Export Excel
                    </Button>
                    <Button
                      onClick={handleGenerateBatch}
                      disabled={selectedPayments.length === 0 || processing}
                      variant="outline"
                      className="bg-transparent"
                    >
                      <Download className="mr-2 w-4 h-4" />
                      Generate Batch
                    </Button>
                    <Button onClick={handleMarkCompleted} disabled={selectedPayments.length === 0 || processing}>
                      <CheckCircle className="mr-2 w-4 h-4" />
                      Mark Completed
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={`payment-skeleton-${index}`} className="flex items-center gap-4 p-4 border rounded-lg">
                        <Skeleton className="w-4 h-4" />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Skeleton className="w-32 h-4" />
                            <Skeleton className="w-16 h-5" />
                          </div>
                          <Skeleton className="w-40 h-3" />
                          <div className="flex items-center gap-4">
                            <Skeleton className="w-24 h-3" />
                            <Skeleton className="w-28 h-3" />
                            <Skeleton className="w-24 h-3" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : payments.length === 0 ? (
                  <div className="py-12">
                    <EmptyState
                      icon={CheckCircle}
                      title="No payments to display"
                      description="Queued and processed payments will appear here"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payments.map((payment: any) => (
                      <div key={payment.payment_id} className="flex items-center gap-4 p-4 border rounded-lg">
                        {(payment.status === "queued" || payment.status === "processing") && (
                          <Checkbox
                            checked={selectedPayments.includes(payment.payment_id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedPayments([...selectedPayments, payment.payment_id])
                              } else {
                                setSelectedPayments(selectedPayments.filter((id) => id !== payment.payment_id))
                              }
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{payment.payment_reference}</h4>
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
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {payment.supplier_name} • {payment.invoice_number}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="font-medium">
                              {payment.currency} {payment.amount.toLocaleString()}
                            </span>
                            {payment.batch_id && (
                              <span className="text-muted-foreground">Batch: {payment.batch_id}</span>
                            )}
                            {payment.completed_date && (
                              <span className="text-muted-foreground">
                                Completed: {new Date(payment.completed_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Repayments Tab */}
          <TabsContent value="repayments">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Repayment Tracking</CardTitle>
                    <CardDescription>Track buyer repayments on invoice due dates</CardDescription>
                  </div>
                  <Button 
                    onClick={exportRepaymentsToExcel} 
                    variant="outline" 
                    disabled={repayments.length === 0}
                    className="bg-transparent"
                  >
                    <FileSpreadsheet className="mr-2 w-4 h-4" />
                    Export Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={`repayment-skeleton-${index}`} className="space-y-3 p-4 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Skeleton className="w-28 h-4" />
                            <Skeleton className="w-16 h-5" />
                          </div>
                          <Skeleton className="w-24 h-3" />
                        </div>
                        <Skeleton className="w-56 h-3" />
                        <div className="flex items-center gap-4">
                          <Skeleton className="w-24 h-3" />
                          <Skeleton className="w-28 h-3" />
                          <Skeleton className="w-20 h-3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : repayments.length === 0 ? (
                  <div className="py-12">
                    <EmptyState
                      icon={Clock}
                      title="No repayments to track"
                      description="Repayment activity will appear here once available"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {repayments.map((repayment: any) => (
                      <div key={repayment.repayment_id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{repayment.invoice_number}</h4>
                            <Badge
                              variant={
                                repayment.status === "completed"
                                  ? "default"
                                  : repayment.status === "overdue"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {repayment.status}
                            </Badge>
                          </div>
                          <span className="text-muted-foreground text-sm">
                            Due: {new Date(repayment.due_date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="mb-2 text-muted-foreground text-sm">
                          {repayment.buyer_name} ({repayment.buyer_code}) • {repayment.supplier_name}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span>
                            Expected: <strong>R {repayment.expected_amount.toLocaleString()}</strong>
                          </span>
                          <span>
                            Received: <strong>R {(repayment.received_amount || 0).toLocaleString()}</strong>
                          </span>
                          {repayment.reconciliation_reference && (
                            <span className="text-muted-foreground">Ref: {repayment.reconciliation_reference}</span>
                          )}
                        </div>
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
