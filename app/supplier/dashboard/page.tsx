import { getSupplierOffers, getSupplierProfile, getSupplierCessionAgreement } from "@/lib/actions/suppliers"
import { SupplierHeader } from "@/components/supplier/supplier-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { use } from "react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, DollarSign, User, Clock, CheckCircle2, AlertTriangle } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import { MetricCard } from "@/components/admin/metric-card"

export default function SupplierDashboardPage() {
  const profilePromise = getSupplierProfile();
  const offersPromise = getSupplierOffers();
  const cessionAgreementPromise = getSupplierCessionAgreement();
  
  const profile = use(profilePromise);
  const offers = use(offersPromise);
  const cessionAgreement = use(cessionAgreementPromise);
  
  const pendingOffers = offers.filter((o: any) => o.status === "sent");
  const acceptedOffers = offers.filter((o: any) => o.status === "accepted");
  const needsCessionAgreement = !cessionAgreement || (cessionAgreement.status !== "signed" && cessionAgreement.status !== "approved");

  // Calculate total value of accepted offers (ensure numeric conversion from Decimal/string)
  const totalAcceptedValue = acceptedOffers.reduce((sum: number, o: any) => {
    const amount = parseFloat(String(o.net_payment_amount)) || 0;
    return sum + amount;
  }, 0);

  return (
    <div className="bg-muted/30 min-h-screen">
      <SupplierHeader supplierName={profile?.name} />
      <main className="mx-auto px-4 py-8 container">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="mb-2 font-bold text-3xl">Welcome back, <span className="text-primary">{profile?.name}</span></h2>
          <p className="text-muted-foreground">Review your early payment offers and manage your account</p>
        </div>

        {needsCessionAgreement && (
          <div className="mb-8">
            <Card className="bg-amber-500/10 border-amber-500/50">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="bg-amber-500/20 p-2 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Action Required</p>
                  <p className="text-muted-foreground text-sm">You must sign or upload your cession agreement before accessing offers or payments.</p>
                </div>
                <Link href="/supplier/cession-agreement">
                  <Button>Sign Agreement</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Stats - Using MetricCard */}
        <div className="gap-4 grid md:grid-cols-4 mb-8">
          <MetricCard
            title="Pending Offers"
            value={pendingOffers.length}
            icon={Clock}
            variant="warning"
          />
          <MetricCard
            title="Accepted Offers"
            value={acceptedOffers.length}
            icon={CheckCircle2}
            variant="success"
          />
          <MetricCard
            title="Total Received"
            value={`R ${totalAcceptedValue.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={DollarSign}
            variant="primary"
          />
          <MetricCard
            title="Status"
            value={profile?.onboarding_status || "pending"}
            icon={User}
            variant={profile?.onboarding_status === "approved" ? "success" : "default"}
          />
        </div>

        {/* Main Content */}
        <Tabs defaultValue="offers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="offers">Offers ({pendingOffers.length})</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="offers">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Pending Offers</CardTitle>
                  <CardDescription>Review and accept early payment offers</CardDescription>
                </div>
                {pendingOffers.length > 1 && (
                  <Link href="/supplier/offers">
                    <Button variant="outline">
                      Select Multiple Offers
                    </Button>
                  </Link>
                )}
              </CardHeader>
              <CardContent>
                {pendingOffers.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="No pending offers"
                    description="New early payment offers will appear here when available"
                  />
                ) : (
                  <div className="space-y-4">
                    {pendingOffers.map((offer: any) => (
                      <div key={offer.offer_id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium text-lg">{offer.invoice_number}</h4>
                            <p className="text-muted-foreground text-sm">
                              {offer.buyer_name} ({offer.buyer_code})
                            </p>
                          </div>
                          <Badge>Pending</Badge>
                        </div>
                        <div className="gap-4 grid md:grid-cols-2 mb-4">
                          <div>
                            <p className="text-muted-foreground text-sm">Invoice Amount</p>
                            <p className="font-semibold text-lg">
                              {offer.currency} {offer.invoice_amount.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-sm">Early Payment Amount</p>
                            <p className="font-semibold text-green-600 text-lg">
                              {offer.currency} {offer.net_payment_amount.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-sm">Discount</p>
                            <p className="font-medium text-sm">
                              {offer.currency} {offer.discount_amount.toLocaleString()} ({offer.annual_rate}% p.a.)
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-sm">Days to Maturity</p>
                            <p className="font-medium text-sm">{offer.days_to_maturity} days</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t">
                          <p className="text-muted-foreground text-xs">
                            Expires: {new Date(offer.offer_expiry_date).toLocaleDateString()}
                          </p>
                          <Link href={`/supplier/offers/${offer.offer_id}`}>
                            <Button>Review Offer</Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Offer History</CardTitle>
                <CardDescription>All offers received</CardDescription>
              </CardHeader>
              <CardContent>
                {offers.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="No offer history"
                    description="Your offer history will appear here"
                  />
                ) : (
                  <div className="space-y-3">
                    {offers.map((offer: any) => (
                      <div key={offer.offer_id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{offer.invoice_number}</h4>
                            <Badge
                              variant={
                                offer.status === "accepted"
                                  ? "default"
                                  : offer.status === "rejected"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {offer.status}
                            </Badge>
                          </div>
                          <p className="mt-1 text-muted-foreground text-sm">
                            {offer.currency} {offer.net_payment_amount.toLocaleString()} • {offer.buyer_name}
                          </p>
                        </div>
                        <span className="text-muted-foreground text-xs">
                          {new Date(offer.sent_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>Track your disbursements</CardDescription>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon={DollarSign}
                  title="No payments yet"
                  description="Payment history will appear here after you accept offers"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Supplier Profile</CardTitle>
                <CardDescription>Your business information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="gap-4 grid md:grid-cols-2">
                    <div>
                      <p className="font-medium text-muted-foreground text-sm">Company Name</p>
                      <p className="text-base">{profile?.name}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground text-sm">VAT Number</p>
                      <p className="text-base">{profile?.vat_no || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground text-sm">Contact Email</p>
                      <p className="text-base">{profile?.contact_email}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground text-sm">Contact Phone</p>
                      <p className="text-base">{profile?.contact_phone || "N/A"}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="font-medium text-muted-foreground text-sm">Bank Details</p>
                      <p className="text-base">
                        {profile?.bank_name} • {profile?.bank_account_no} • {profile?.bank_branch_code}
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <Button variant="outline" className="bg-transparent">
                      Request Bank Detail Change
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}