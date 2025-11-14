import { getSupplierOffers, getSupplierProfile, getSupplierCessionAgreement } from "@/lib/actions/suppliers"
import { SupplierHeader } from "@/components/supplier/supplier-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { use } from "react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, DollarSign, User, Clock } from "lucide-react"

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

  return (
    <div className="min-h-screen bg-muted/30">
      <SupplierHeader supplierName={profile?.name} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome, {profile?.name}</h2>
          <p className="text-muted-foreground">Review your early payment offers and manage your account</p>
        </div>

        {needsCessionAgreement && (
          <div className="mb-8">
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
              <strong>Action Required:</strong> You must sign or upload your cession agreement before accessing offers or payments.<br />
              <Link href="/supplier/cession-agreement">
                <Button className="mt-2">Sign/Upload Cession Agreement</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Offers</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOffers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Accepted Offers</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{acceptedOffers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant={profile?.onboarding_status === "approved" ? "default" : "secondary"}>
                {profile?.onboarding_status}
              </Badge>
            </CardContent>
          </Card>
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
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No pending offers at this time</p>
                  </div>
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
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No offer history</p>
                  </div>
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
                <div className="text-center py-12 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Payment history will appear here</p>
                </div>
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