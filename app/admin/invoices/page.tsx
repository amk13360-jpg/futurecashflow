"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { getAllInvoices, generateOffers } from "@/lib/actions/invoices"
import { FileText, Send, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    try {
      const data = await getAllInvoices()
      setInvoices(data)
    } catch (error) {
      toast.error("Failed to load invoices")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateOffers = async () => {
    if (selectedInvoices.length === 0) {
      toast.error("Please select at least one invoice")
      return
    }

    setGenerating(true)
    try {
      const result = await generateOffers(selectedInvoices)
      if (result.created.length > 0) {
        toast.success(`Generated ${result.created.length} offers`)
      }
      if (result.errors.length > 0) {
        // Show each error as a separate toast for better visibility
        result.errors.forEach((error: string) => {
          toast.error(error)
        })
      }
      if (result.created.length === 0 && result.errors.length === 0) {
        toast.warning("No offers were generated. Invoices may not be eligible.")
      }
      setSelectedInvoices([])
      loadInvoices()
    } catch (error: any) {
      console.error("Generate offers error:", error)
      toast.error(error.message || "Failed to generate offers")
    } finally {
      setGenerating(false)
    }
  }

  const eligibleInvoices = invoices.filter((inv) => inv.status === "matched")

  return (
    <div className="bg-muted min-h-screen">

      <main className="mx-auto px-4 py-8 container">
        <div className="mb-6">
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Invoices" },
            ]}
          />
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center mb-4 text-muted-foreground hover:text-foreground text-sm"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to dashboard
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-bold text-3xl">Invoice Management</h2>
              <p className="text-muted-foreground">Review invoices and generate offers</p>
            </div>
            <Button onClick={handleGenerateOffers} disabled={selectedInvoices.length === 0 || generating}>
              <Send className="mr-2 w-4 h-4" />
              {generating ? "Generating..." : `Generate Offers (${selectedInvoices.length})`}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Invoices ({invoices.length})</CardTitle>
            <CardDescription>
              {eligibleInvoices.length} eligible for offer generation • {selectedInvoices.length} selected
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <SkeletonTable rows={5} />
            ) : invoices.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No invoices in the system"
                description="Upload AP data to see invoices here"
              >
                <Link href="/ap/invoices/upload">
                  <Button>Upload Invoices</Button>
                </Link>
              </EmptyState>
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice: any) => (
                  <div key={invoice.invoice_id} className="flex items-center gap-4 p-4 border rounded-lg">
                    {invoice.status === "matched" && (
                      <Checkbox
                        checked={selectedInvoices.includes(invoice.invoice_id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedInvoices([...selectedInvoices, invoice.invoice_id])
                          } else {
                            setSelectedInvoices(selectedInvoices.filter((id) => id !== invoice.invoice_id))
                          }
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{invoice.invoice_number}</h4>
                        <Badge variant={invoice.status === "offered" ? "default" : "secondary"}>{invoice.status}</Badge>
                      </div>
                      <p className="mt-1 text-muted-foreground text-sm">
                        {invoice.supplier_name} • {invoice.buyer_name} ({invoice.company_code})
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="font-medium">
                          {invoice.currency} {typeof invoice.amount === "number" ? invoice.amount.toLocaleString() : (invoice.amount !== undefined && invoice.amount !== null ? Number(invoice.amount).toLocaleString() : "N/A")}
                        </span>
                        <span className="text-muted-foreground">
                          Due: {invoice.due_date && !isNaN(Date.parse(invoice.due_date)) ? new Date(invoice.due_date).toLocaleDateString() : "N/A"}
                        </span>
                        {invoice.offer_count > 0 && (
                          <span className="text-muted-foreground">{invoice.offer_count} offer(s)</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
