import {
  getDashboardMetrics,
  getPendingApplications,
  getPendingCessions,
  getBankChangeRequests,
} from "@/lib/actions/admin"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { MetricCard } from "@/components/admin/metric-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState } from "@/components/ui/empty-state"
import { FileText, Users, DollarSign, CheckCircle, Clock, Package, ArrowRight } from "lucide-react"
import Link from "next/link"
import { getSession } from "@/lib/auth/session"

export default async function AdminDashboardPage() {
  const session = await getSession()
  const metrics = await getDashboardMetrics()
  const pendingApplications = await getPendingApplications()
  const pendingCessions = await getPendingCessions()
  const bankChangeRequests = await getBankChangeRequests()

  return (
    <div className="bg-muted/30 min-h-screen">
      <DashboardHeader userName={session?.fullName || session?.username} />

      <main className="mx-auto px-4 py-8 container">
        {/* Metrics Overview */}
        <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-4 mb-8">
          <MetricCard
            title="Pending Documents"
            value={metrics.pendingDocuments}
            icon={FileText}
            description="Cession agreements awaiting review"
            variant="warning"
          />
          <MetricCard
            title="Total Applications"
            value={metrics.totalApplications}
            icon={Clock}
            description="Supplier onboarding in progress"
            variant="info"
          />
          <MetricCard
            title="Registered Suppliers"
            value={metrics.registeredSuppliers}
            icon={Users}
            description="Approved and active suppliers"
            variant="success"
          />
          <MetricCard
            title="48h Payments Issued"
            value={`R ${metrics.paymentsIssued48h.toLocaleString()}`}
            icon={DollarSign}
            description="Last 48 hours"
            variant="primary"
          />
        </div>

        {/* Quick Actions */}
        <div className="gap-4 grid md:grid-cols-3 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 dark:from-blue-950 to-transparent border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="w-5 h-5 text-blue-600" />
                Offer Batches
              </CardTitle>
              <CardDescription>Create and manage offers for suppliers</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/admin/offer-batches">
                  Manage Offer Batches
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5" />
                Invoices
              </CardTitle>
              <CardDescription>View and manage all invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full">
                <Link href="/admin/invoices">
                  View Invoices
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="w-5 h-5" />
                Payments
              </CardTitle>
              <CardDescription>Track and process payments</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full">
                <Link href="/admin/payments">
                  View Payments
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="documents" className="space-y-4">
          <TabsList>
            <TabsTrigger value="documents">Document Review ({pendingCessions.length})</TabsTrigger>
            <TabsTrigger value="applications">Applications ({pendingApplications.length})</TabsTrigger>
            <TabsTrigger value="bank-changes">Bank Changes ({bankChangeRequests.length})</TabsTrigger>
            <TabsTrigger value="suppliers">All Suppliers</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          {/* Document Review Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Pending Cession Agreements</CardTitle>
                <CardDescription>Review and approve supplier cession agreements</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingCessions.length === 0 ? (
                  <EmptyState
                    icon={CheckCircle}
                    title="All caught up!"
                    description="No pending documents to review"
                    variant="success"
                  />
                ) : (
                  <div className="space-y-4">
                    {pendingCessions.map((cession: any) => (
                      <div key={cession.cession_id} className="flex justify-between items-center p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{cession.supplier_name}</h4>
                          <p className="text-muted-foreground text-sm">{cession.contact_email}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{cession.document_type}</Badge>
                            <span className="text-muted-foreground text-xs">
                              Submitted {new Date(cession.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {cession.document_url && (
                            <Button size="sm" variant="outline" asChild>
                              <Link href={cession.document_url} target="_blank">
                                View Document
                              </Link>
                            </Button>
                          )}
                          <Button size="sm" asChild>
                            <Link href={`/admin/documents/${cession.cession_id}`}>Review</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>Supplier Applications</CardTitle>
                <CardDescription>Review and approve new supplier registrations</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingApplications.length === 0 ? (
                  <EmptyState
                    icon={CheckCircle}
                    title="All caught up!"
                    description="No pending applications to review"
                    variant="success"
                  />
                ) : (
                  <div className="space-y-4">
                    {pendingApplications.map((app: any) => (
                      <div key={app.supplier_id} className="flex justify-between items-center p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{app.name}</h4>
                          <p className="text-muted-foreground text-sm">
                            VAT: {app.vat_no || "N/A"} • {app.contact_email}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className="capitalize">{app.onboarding_status.replace(/_/g, " ")}</Badge>
                            <span className="text-muted-foreground text-xs">
                              Applied {new Date(app.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/admin/applications/${app.supplier_id}`}>View Details</Link>
                          </Button>
                          <Button size="sm" asChild>
                            <Link href={`/admin/applications/${app.supplier_id}`}>Review</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bank Changes Tab */}
          <TabsContent value="bank-changes">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Bank Detail Change Requests</CardTitle>
                  <CardDescription>Review and approve supplier bank account changes</CardDescription>
                </div>
                <Link href="/admin/bank-changes">
                  <Button variant="outline">View All Requests</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {bankChangeRequests.length === 0 ? (
                  <div className="py-8 text-muted-foreground text-center">
                    <CheckCircle className="mx-auto mb-3 w-12 h-12 text-green-500" />
                    <p>No pending bank change requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bankChangeRequests.map((request: any) => (
                      <div key={request.request_id} className="flex justify-between items-center p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{request.supplier_name}</h4>
                          <p className="text-muted-foreground text-sm">{request.contact_email}</p>
                          <div className="mt-2 text-sm">
                            <p className="font-medium">New Bank Details:</p>
                            <p className="text-muted-foreground">
                              {request.new_bank_name} • {request.new_account_no} • {request.new_branch_code}
                            </p>
                          </div>
                          <span className="text-muted-foreground text-xs">
                            Requested {new Date(request.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <Link href="/admin/bank-changes">
                          <Button size="sm">Review</Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>All Suppliers</CardTitle>
                    <CardDescription>Manage supplier accounts and settings</CardDescription>
                  </div>
                  <Link href="/admin/suppliers">
                    <Button>View All Suppliers</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Click "View All Suppliers" to see the complete supplier list with filtering and search capabilities.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Payment Processing</CardTitle>
                    <CardDescription>Manage disbursements and track repayments</CardDescription>
                  </div>
                  <Link href="/admin/payments">
                    <Button>Manage Payments</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Access the payment processing module to queue payments, generate batches, and track repayments.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="gap-4 grid md:grid-cols-3 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground text-sm">View and manage uploaded invoices and offers</p>
              <Link href="/admin/invoices">
                <Button variant="outline" className="bg-transparent w-full">
                  Manage Invoices
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reports & Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground text-sm">Generate reports and view audit logs</p>
              <Link href="/admin/reports">
                <Button variant="outline" className="bg-transparent w-full">
                  View Reports
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">System Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground text-sm">Configure rates, users, and system parameters</p>
              <Link href="/admin/settings">
                <Button variant="outline" className="bg-transparent w-full">
                  Settings
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
