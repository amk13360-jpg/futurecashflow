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

  // Calculate total value of accepted offers (ensure numeric conversion)
  const totalAcceptedValue = acceptedOffers.reduce((sum: number, o: any) => sum + (Number(o.net_payment_amount) || 0), 0);

  return (
    <div className="min-h-screen bg-muted/30">
      <SupplierHeader supplierName={profile?.name} />
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, <span className="text-primary">{profile?.name}</span></h2>
          <p className="text-muted-foreground">Review your early payment offers and manage your account</p>
        </div>

        {needsCessionAgreement && (
          <div className="mb-8">
            <Card className="border-amber-500/50 bg-amber-500/10">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Action Required</p>
                  <p className="text-sm text-muted-foreground">You must sign or upload your cession agreement before accessing offers or payments.</p>
                </div>
                <Link href="/supplier/cession-agreement">
                  <Button>Sign Agreement</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Stats - Using MetricCard */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
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
              <CardHeader>
                <CardTitle>Pending Offers</CardTitle>
                <CardDescription>Review and accept early payment offers</CardDescription>
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
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-lg">{offer.invoice_number}</h4>
                            <p className="text-sm text-muted-foreground">
                              {offer.buyer_name} ({offer.buyer_code})
                            </p>
                          </div>
                          <Badge>Pending</Badge>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Invoice Amount</p>
                            <p className="text-lg font-semibold">
                              {offer.currency} {offer.invoice_amount.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Early Payment Amount</p>
                            <p className="text-lg font-semibold text-green-600">
                              {offer.currency} {offer.net_payment_amount.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Discount</p>
                            <p className="text-sm font-medium">
                              {offer.currency} {offer.discount_amount.toLocaleString()} ({offer.annual_rate}% p.a.)
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Days to Maturity</p>
                            <p className="text-sm font-medium">{offer.days_to_maturity} days</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t">
                          <p className="text-xs text-muted-foreground">
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
                      <div key={offer.offer_id} className="flex items-center justify-between p-3 border rounded-lg">
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
                          <p className="text-sm text-muted-foreground mt-1">
                            {offer.currency} {offer.net_payment_amount.toLocaleString()} • {offer.buyer_name}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
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
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Company Name</p>
                      <p className="text-base">{profile?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">VAT Number</p>
                      <p className="text-base">{profile?.vat_no || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Contact Email</p>
                      <p className="text-base">{profile?.contact_email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Contact Phone</p>
                      <p className="text-base">{profile?.contact_phone || "N/A"}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Bank Details</p>
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