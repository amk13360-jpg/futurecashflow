"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SupplierHeader } from "@/components/supplier/supplier-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { acceptOffer, rejectOffer } from "@/lib/actions/suppliers"
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function OfferDetailPage({ params }: { params: Promise<{ offerId: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [offer, setOffer] = useState<any>(null)

  useEffect(() => {
    // In a real app, fetch offer details here
    // For now, we'll handle this in the accept/reject actions
  }, [resolvedParams.offerId])

  const handleAccept = async () => {
    setLoading(true)
    try {
      await acceptOffer(Number.parseInt(resolvedParams.offerId), [])
      toast.success("Offer accepted successfully!")
      router.push("/supplier/dashboard")
    } catch (error: any) {
      toast.error(error.message || "Failed to accept offer")
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    setLoading(true)
    try {
      await rejectOffer(Number.parseInt(resolvedParams.offerId))
      toast.success("Offer rejected")
      router.push("/supplier/dashboard")
    } catch (error: any) {
      toast.error(error.message || "Failed to reject offer")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <SupplierHeader />

      <main className="container mx-auto px-4 py-8">
        <Link
          href="/supplier/dashboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to dashboard
        </Link>

        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Early Payment Offer</CardTitle>
                  <CardDescription>Review the offer details carefully before accepting</CardDescription>
                </div>
                <Badge>Pending</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  By accepting this offer, you agree to receive early payment at a discounted amount. The buyer will
                  repay the full invoice amount on the due date.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Offer Summary</h3>
                  <div className="grid gap-3">
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Invoice Amount</span>
                      <span className="font-medium">R 50,000.00</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Discount Rate</span>
                      <span className="font-medium">12.5% per annum</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Days to Maturity</span>
                      <span className="font-medium">30 days</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Discount Amount</span>
                      <span className="font-medium text-red-600">- R 513.70</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between py-2">
                      <span className="font-semibold">You Will Receive</span>
                      <span className="font-bold text-green-600 text-xl">R 49,486.30</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Invoice Details</h3>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Invoice Number</span>
                      <span>INV-2025-001</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Buyer</span>
                      <span>Anglo American Platinum</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Invoice Date</span>
                      <span>15 Jan 2025</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due Date</span>
                      <span>15 Feb 2025</span>
                    </div>
                  </div>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <strong>Next Steps:</strong> After accepting, you will need to sign a cession agreement. Payment
                    will be processed within 2-3 business days.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleAccept} disabled={loading} className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {loading ? "Processing..." : "Accept Offer"}
                </Button>
                <Button onClick={handleReject} disabled={loading} variant="outline" className="flex-1 bg-transparent">
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Offer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
