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
import { FileText, Users, DollarSign, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"
import { getSession } from "@/lib/auth/session"

export default async function AdminDashboardPage() {
  const session = await getSession()
  const metrics = await getDashboardMetrics()
  const pendingApplications = await getPendingApplications()
  const pendingCessions = await getPendingCessions()
  const bankChangeRequests = await getBankChangeRequests()

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardHeader userName={session?.username} />

      <main className="container mx-auto px-4 py-8">
        {/* Metrics Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <MetricCard
            title="Pending Documents"
            value={metrics.pendingDocuments}
            icon={FileText}
            description="Cession agreements awaiting review"
          />
          <MetricCard
            title="Total Applications"
            value={metrics.totalApplications}
            icon={Clock}
            description="Supplier onboarding in progress"
          />
          <MetricCard
            title="Registered Suppliers"
            value={metrics.registeredSuppliers}
            icon={Users}
            description="Approved and active suppliers"
          />
          <MetricCard
            title="48h Payments Issued"
            value={`R ${metrics.paymentsIssued48h.toLocaleString()}`}
            icon={DollarSign}
            description="Last 48 hours"
          />
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
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                    <p>No pending documents to review</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingCessions.map((cession: any) => (
                      <div key={cession.cession_id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{cession.supplier_name}</h4>
                          <p className="text-sm text-muted-foreground">{cession.contact_email}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{cession.document_type}</Badge>
                            <span className="text-xs text-muted-foreground">
                              Submitted {new Date(cession.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            View Document
                          </Button>
                          <Button size="sm">Review</Button>
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
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                    <p>No pending applications</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingApplications.map((app: any) => (
                      <div key={app.supplier_id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{app.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            VAT: {app.vat_no || "N/A"} • {app.contact_email}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge>{app.onboarding_status.replace("_", " ")}</Badge>
                            <span className="text-xs text-muted-foreground">
                              Applied {new Date(app.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                          <Button size="sm">Review</Button>
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
              <CardHeader>
                <CardTitle>Bank Detail Change Requests</CardTitle>
                <CardDescription>Review and approve supplier bank account changes</CardDescription>
              </CardHeader>
              <CardContent>
                {bankChangeRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                    <p>No pending bank change requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bankChangeRequests.map((request: any) => (
                      <div key={request.request_id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{request.supplier_name}</h4>
                          <p className="text-sm text-muted-foreground">{request.contact_email}</p>
                          <div className="mt-2 text-sm">
                            <p className="font-medium">New Bank Details:</p>
                            <p className="text-muted-foreground">
                              {request.new_bank_name} • {request.new_account_no} • {request.new_branch_code}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Requested {new Date(request.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                          <Button size="sm">Review</Button>
                        </div>
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
                <div className="flex items-center justify-between">
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
                <p className="text-sm text-muted-foreground">
                  Click "View All Suppliers" to see the complete supplier list with filtering and search capabilities.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
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
                <p className="text-sm text-muted-foreground">
                  Access the payment processing module to queue payments, generate batches, and track repayments.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">View and manage uploaded invoices and offers</p>
              <Link href="/admin/invoices">
                <Button variant="outline" className="w-full bg-transparent">
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
              <p className="text-sm text-muted-foreground mb-4">Generate reports and view audit logs</p>
              <Link href="/admin/reports">
                <Button variant="outline" className="w-full bg-transparent">
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
              <p className="text-sm text-muted-foreground mb-4">Configure rates, users, and system parameters</p>
              <Link href="/admin/settings">
                <Button variant="outline" className="w-full bg-transparent">
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
