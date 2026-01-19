"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { SupplierHeader } from "@/components/supplier/supplier-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { EmptyState } from "@/components/ui/empty-state"
import { getSupplierOffers, acceptMultipleOffers } from "@/lib/actions/suppliers"
import { 
  CheckCircle, 
  Clock, 
  ArrowLeft, 
  FileText, 
  DollarSign,
  AlertTriangle,
  CheckSquare,
  Square
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface Offer {
  offer_id: number
  invoice_number: string
  buyer_name: string
  buyer_code: string
  invoice_amount: number
  net_payment_amount: number
  discount_amount: number
  annual_rate: number
  days_to_maturity: number
  currency: string
  offer_expiry_date: string
  status: string
}

export default function SupplierOffersPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [offers, setOffers] = useState<Offer[]>([])
  const [selectedOffers, setSelectedOffers] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadOffers() {
      try {
        const data = await getSupplierOffers()
        // Filter only pending (sent) offers
        const pendingOffers = data.filter((o: any) => o.status === "sent")
        setOffers(pendingOffers)
      } catch (error) {
        console.error("Failed to load offers:", error)
        toast.error("Failed to load offers")
      } finally {
        setLoading(false)
      }
    }
    loadOffers()
  }, [])

  const toggleOffer = (offerId: number) => {
    setSelectedOffers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(offerId)) {
        newSet.delete(offerId)
      } else {
        newSet.add(offerId)
      }
      return newSet
    })
  }

  const selectAll = () => {
    if (selectedOffers.size === offers.length) {
      setSelectedOffers(new Set())
    } else {
      setSelectedOffers(new Set(offers.map(o => o.offer_id)))
    }
  }

  const handleAcceptSelected = async () => {
    if (selectedOffers.size === 0) {
      toast.error("Please select at least one offer")
      return
    }

    startTransition(async () => {
      try {
        const result = await acceptMultipleOffers(Array.from(selectedOffers))
        
        if (result.acceptedCount > 0) {
          toast.success(`Successfully accepted ${result.acceptedCount} offer(s)`)
        }
        
        if (result.failedCount > 0) {
          toast.warning(`${result.failedCount} offer(s) could not be accepted`)
        }

        // Redirect to cession agreement if offers were accepted
        if (result.acceptedCount > 0) {
          router.push("/supplier/cession-agreement")
        } else {
          // Refresh the list
          const data = await getSupplierOffers()
          const pendingOffers = data.filter((o: any) => o.status === "sent")
          setOffers(pendingOffers)
          setSelectedOffers(new Set())
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to accept offers")
      }
    })
  }

  // Calculate totals for selected offers
  const selectedTotals = offers
    .filter(o => selectedOffers.has(o.offer_id))
    .reduce(
      (acc, offer) => ({
        invoiceAmount: acc.invoiceAmount + (parseFloat(String(offer.invoice_amount)) || 0),
        discountAmount: acc.discountAmount + (parseFloat(String(offer.discount_amount)) || 0),
        netPayment: acc.netPayment + (parseFloat(String(offer.net_payment_amount)) || 0),
      }),
      { invoiceAmount: 0, discountAmount: 0, netPayment: 0 }
    )

  if (loading) {
    return (
      <div className="bg-muted/30 min-h-screen">
        <SupplierHeader />
        <main className="mx-auto px-4 py-8 container">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-muted-foreground">Loading offers...</div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="bg-muted/30 min-h-screen">
      <SupplierHeader />

      <main className="mx-auto px-4 py-8 container">
        <Link
          href="/supplier/dashboard"
          className="inline-flex items-center mb-6 text-muted-foreground hover:text-foreground text-sm"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to dashboard
        </Link>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-bold text-3xl">Early Payment Offers</h1>
            <p className="text-muted-foreground">Select offers to accept for early payment</p>
          </div>
          {offers.length > 0 && (
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={selectAll}>
                {selectedOffers.size === offers.length ? (
                  <>
                    <Square className="mr-2 w-4 h-4" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <CheckSquare className="mr-2 w-4 h-4" />
                    Select All ({offers.length})
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {offers.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={FileText}
                title="No pending offers"
                description="New early payment offers will appear here when available"
              />
            </CardContent>
          </Card>
        ) : (
          <div className="gap-6 grid lg:grid-cols-3">
            {/* Offers List */}
            <div className="space-y-4 lg:col-span-2">
              {offers.map((offer) => (
                <Card 
                  key={offer.offer_id}
                  className={`cursor-pointer transition-all ${
                    selectedOffers.has(offer.offer_id) 
                      ? "border-primary ring-2 ring-primary/20" 
                      : "hover:border-muted-foreground/50"
                  }`}
                  onClick={() => toggleOffer(offer.offer_id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={selectedOffers.has(offer.offer_id)}
                        onCheckedChange={() => toggleOffer(offer.offer_id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1"
                      />
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium text-lg">{offer.invoice_number}</h4>
                            <p className="text-muted-foreground text-sm">
                              {offer.buyer_name} ({offer.buyer_code})
                            </p>
                          </div>
                          <Badge variant="outline">
                            <Clock className="mr-1 w-3 h-3" />
                            Pending
                          </Badge>
                        </div>
                        
                        <div className="gap-4 grid grid-cols-2 md:grid-cols-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Invoice Amount</p>
                            <p className="font-semibold">
                              {offer.currency} {parseFloat(String(offer.invoice_amount)).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Discount</p>
                            <p className="font-medium text-red-600">
                              -{offer.currency} {parseFloat(String(offer.discount_amount)).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">You Receive</p>
                            <p className="font-semibold text-green-600">
                              {offer.currency} {parseFloat(String(offer.net_payment_amount)).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Tenor</p>
                            <p className="font-medium">{offer.days_to_maturity} days</p>
                            <p className="text-muted-foreground text-xs">Applied to 70% of invoice</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-3 pt-3 border-t text-muted-foreground text-xs">
                          <span>Expires: {new Date(offer.offer_expiry_date).toLocaleDateString()}</span>
                          <Link 
                            href={`/supplier/offers/${offer.offer_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-primary hover:underline"
                          >
                            View Details →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Summary Panel */}
            <div className="lg:col-span-1">
              <Card className="top-4 sticky">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Selection Summary
                  </CardTitle>
                  <CardDescription>
                    {selectedOffers.size} of {offers.length} offers selected
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedOffers.size === 0 ? (
                    <div className="py-6 text-muted-foreground text-center">
                      <Square className="opacity-50 mx-auto mb-2 w-12 h-12" />
                      <p>Select offers to see summary</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Invoice Amount</span>
                          <span className="font-medium">
                            R {selectedTotals.invoiceAmount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Discount</span>
                          <span className="font-medium text-red-600">
                            -R {selectedTotals.discountAmount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="font-semibold">You Will Receive</span>
                          <span className="font-bold text-green-600 text-xl">
                            R {selectedTotals.netPayment.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      <Alert>
                        <AlertTriangle className="w-4 h-4" />
                        <AlertDescription className="text-xs">
                          By accepting, you agree to receive early payment at the discounted amount. 
                          You will need to sign a cession agreement.
                        </AlertDescription>
                      </Alert>

                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={handleAcceptSelected}
                        disabled={isPending || selectedOffers.size === 0}
                      >
                        <CheckCircle className="mr-2 w-4 h-4" />
                        {isPending 
                          ? "Processing..." 
                          : `Accept ${selectedOffers.size} Offer${selectedOffers.size > 1 ? "s" : ""}`
                        }
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
