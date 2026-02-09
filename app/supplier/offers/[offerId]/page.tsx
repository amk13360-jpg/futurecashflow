"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SupplierHeader } from "@/components/supplier/supplier-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { Skeleton } from "@/components/ui/skeleton"
import { acceptOffer, rejectOffer, getSupplierOfferById } from "@/lib/actions/suppliers"
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface OfferData {
  offer_id: number
  invoice_number: string
  buyer_name: string
  buyer_code: string
  invoice_amount: number
  invoice_date: string
  due_date: string
  net_payment_amount: number
  discount_amount: number
  annual_rate: number
  days_to_maturity: number
  currency: string
  offer_expiry_date: string
  status: string
}

export default function OfferDetailPage({ params }: { params: Promise<{ offerId: string }> }) {
 const resolvedParams = use(params)
 const router = useRouter()
 const [loading, setLoading] = useState(false)
 const [pageLoading, setPageLoading] = useState(true)
 const [offer, setOffer] = useState<OfferData | null>(null)

 useEffect(() => {
   async function loadOffer() {
     try {
       const data = await getSupplierOfferById(Number.parseInt(resolvedParams.offerId))
       if (data) {
         setOffer(data)
       } else {
         toast.error("Offer not found")
         router.push("/supplier/offers")
       }
     } catch (error) {
       console.error("Failed to load offer:", error)
       toast.error("Failed to load offer details")
       router.push("/supplier/offers")
     } finally {
       setPageLoading(false)
     }
   }
   loadOffer()
 }, [resolvedParams.offerId, router])

 const handleAccept = async () => {
 setLoading(true)
 try {
 await acceptOffer(Number.parseInt(resolvedParams.offerId), [])
 toast.success("Offer accepted successfully!")
 router.push("/supplier/cession-agreement")
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
 router.push("/supplier/offers")
 } catch (error: any) {
 toast.error(error.message || "Failed to reject offer")
 } finally {
 setLoading(false)
 }
 }

 // Calculate derived values
 const invoiceAmount = offer ? parseFloat(String(offer.invoice_amount)) : 0
 const immediatePayment = invoiceAmount * 0.8
 const deferredPayment = invoiceAmount * 0.2
 const discountAmount = offer ? parseFloat(String(offer.discount_amount)) : 0
 const netPayment = offer ? parseFloat(String(offer.net_payment_amount)) : 0
 const currency = offer?.currency || "ZAR"

 if (pageLoading) {
   return (
     <div className="min-h-screen bg-muted">
       <SupplierHeader />
       <main className="container mx-auto px-4 py-8">
         <div className="space-y-4 max-w-3xl mx-auto">
           {Array.from({ length: 4 }).map((_, index) => (
             <div key={`offer-detail-skeleton-${index}`} className="p-4 border rounded-lg bg-background space-y-3">
               <div className="flex items-center justify-between">
                 <Skeleton className="w-40 h-4" />
                 <Skeleton className="w-20 h-5" />
               </div>
               <Skeleton className="w-56 h-3" />
               <div className="flex items-center gap-4">
                 <Skeleton className="w-24 h-3" />
                 <Skeleton className="w-24 h-3" />
                 <Skeleton className="w-20 h-3" />
               </div>
             </div>
           ))}
         </div>
       </main>
     </div>
   )
 }

 if (!offer) {
   return null
 }

 return (
 <div className="min-h-screen bg-muted">
 <SupplierHeader />

 <main className="container mx-auto px-4 py-8">
 <Breadcrumbs
 items={[
 { label: "Dashboard", href: "/supplier/dashboard" },
 { label: "Offers", href: "/supplier/offers" },
 { label: "Offer Details" },
 ]}
 />
 <Link
 href="/supplier/offers"
 className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
 >
 <ArrowLeft className="h-4 w-4 mr-2" />
 Back to offers
 </Link>

 <div className="max-w-3xl mx-auto space-y-6">
 <Card>
 <CardHeader>
 <div className="flex items-center justify-between">
 <div>
 <CardTitle className="text-2xl">Early Payment Offer</CardTitle>
 <CardDescription>Review the offer details carefully before accepting</CardDescription>
 </div>
 <Badge variant={offer.status === "sent" ? "outline" : "secondary"}>
   {offer.status === "sent" ? "Pending" : offer.status}
 </Badge>
 </div>
 </CardHeader>
 <CardContent className="space-y-6">
 <Alert>
 <Info className="h-4 w-4" />
 <AlertDescription>
 <strong>How it works:</strong> You will receive 80% of the invoice value immediately and the remaining 20% on the invoice due date.
 </AlertDescription>
 </Alert>

 <div className="space-y-4">
 <div>
 <h3 className="font-semibold text-lg mb-3">Offer Breakdown</h3>
 <div className="grid gap-3 bg-muted/50 rounded-lg p-4">
 <div className="flex justify-between py-2">
 <span className="text-muted-foreground">Invoice Amount</span>
 <span className="font-medium">{currency} {invoiceAmount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</span>
 </div>
 <div className="flex justify-between py-2">
 <span className="text-muted-foreground">Your Fee ({offer.days_to_maturity} days)</span>
 <span className="font-medium text-error">- {currency} {discountAmount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</span>
 </div>
 <Separator />
 <div className="flex justify-between py-2">
 <span className="font-semibold">You Will Receive</span>
 <span className="font-bold text-foreground text-xl">{currency} {netPayment.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</span>
 </div>
 <Separator />
 <div className="flex justify-between py-2 bg-success/10 rounded px-2 -mx-2">
 <span className="font-semibold">Paid Immediately (80%)</span>
 <span className="font-bold text-success text-xl">{currency} {immediatePayment.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</span>
 </div>
 <div className="flex justify-between py-2">
 <span className="text-muted-foreground">Paid in {offer.days_to_maturity} days (20%)</span>
 <span className="font-medium text-muted-foreground">{currency} {deferredPayment.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</span>
 </div>
 </div>
 </div>

 <div>
 <h3 className="font-semibold text-lg mb-3">Invoice Details</h3>
 <div className="grid gap-2 text-sm">
 <div className="flex justify-between">
 <span className="text-muted-foreground">Invoice Number</span>
 <span>{offer.invoice_number}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Buyer</span>
 <span>{offer.buyer_name} ({offer.buyer_code})</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Invoice Date</span>
 <span>{new Date(offer.invoice_date).toLocaleDateString("en-ZA")}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Due Date</span>
 <span>{new Date(offer.due_date).toLocaleDateString("en-ZA")}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Offer Expires</span>
 <span>{new Date(offer.offer_expiry_date).toLocaleDateString("en-ZA")}</span>
 </div>
 </div>
 </div>

 <Alert>
 <CheckCircle className="h-4 w-4 text-success" />
 <AlertDescription>
 <strong>Next Steps:</strong> After accepting, you will need to sign a cession agreement. Early payment
 will be processed within 2-3 business days.
 </AlertDescription>
 </Alert>
 </div>

 {offer.status === "sent" && (
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
 )}
 </CardContent>
 </Card>
 </div>
 </main>
 </div>
 )
}
