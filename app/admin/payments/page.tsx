"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getPaymentQueue,
  getAllPayments,
  queuePayments,
  generatePaymentBatch,
  markPaymentsCompleted,
  getRepayments,
} from "@/lib/actions/payments"
import { DollarSign, Download, CheckCircle, ArrowLeft, Clock } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

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

    setProcessing(true)
    try {
      const result = await queuePayments(selectedOffers)
      toast.success(`Queued ${result.queued.length} payments`)
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} errors occurred`)
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
          <h2 className="text-3xl font-bold">Payment Processing</h2>
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Payment Queue</CardTitle>
                    <CardDescription>Accepted offers ready for payment processing</CardDescription>
                  </div>
                  <Button onClick={handleQueuePayments} disabled={selectedOffers.length === 0 || processing}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {processing ? "Processing..." : `Queue Payments (${selectedOffers.length})`}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12 text-muted-foreground">Loading...</div>
                ) : queue.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No offers in payment queue</p>
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
                          <p className="text-sm text-muted-foreground">
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Payments</CardTitle>
                    <CardDescription>
                      {queuedPayments.length} queued • {processingPayments.length} processing
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleGenerateBatch}
                      disabled={selectedPayments.length === 0 || processing}
                      variant="outline"
                      className="bg-transparent"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generate Batch
                    </Button>
                    <Button onClick={handleMarkCompleted} disabled={selectedPayments.length === 0 || processing}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Completed
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12 text-muted-foreground">Loading...</div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No payments to display</p>
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
                          <p className="text-sm text-muted-foreground">
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
                <CardTitle>Repayment Tracking</CardTitle>
                <CardDescription>Track buyer repayments on invoice due dates</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12 text-muted-foreground">Loading...</div>
                ) : repayments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No repayments to track</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {repayments.map((repayment: any) => (
                      <div key={repayment.repayment_id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
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
                          <span className="text-sm text-muted-foreground">
                            Due: {new Date(repayment.due_date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
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
