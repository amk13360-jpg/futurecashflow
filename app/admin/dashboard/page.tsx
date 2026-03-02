import {
 getDashboardMetrics,
 getPendingApplications,
 getPendingCessions,
 getBankChangeRequests,
} from "@/lib/actions/admin"
import { MetricCard } from "@/components/admin/metric-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState } from "@/components/ui/empty-state"
import { FileText, Users, CheckCircle, Clock, Package, ArrowRight, Building2 } from "lucide-react"
import { RandIcon } from "@/components/ui/rand-icon"
import Link from "next/link"
import { getSession } from "@/lib/auth/session"

export default async function AdminDashboardPage() {
 const session = await getSession()
 const metrics = await getDashboardMetrics()
 const pendingApplications = await getPendingApplications()
 const pendingCessions = await getPendingCessions()
 const bankChangeRequests = await getBankChangeRequests()

 return (
 <div className="bg-muted min-h-screen">
<main className="mx-auto px-4 py-8 max-w-7xl">
 {/* Page Header - Enhanced Typography */}
 <div className="mb-10">
 <h1 className="mb-3 font-bold text-4xl tracking-tight">Dashboard</h1>
 <p className="text-muted-foreground text-lg">Welcome back! Here's your platform overview.</p>
 </div>

 {/* Metrics Overview */}
 <section className="mb-10" aria-labelledby="metrics-heading">
 <h2 id="metrics-heading" className="mb-6 font-semibold text-foreground text-2xl">Key Metrics</h2>
 <div className="gap-6 grid md:grid-cols-2 lg:grid-cols-4">
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
 icon={RandIcon}
 description="Last 48 hours"
 variant="primary"
 />
 </div>
 </section>

 {/* Quick Actions */}
 <section className="mb-10" aria-labelledby="actions-heading">
 <h2 id="actions-heading" className="mb-6 font-semibold text-foreground text-2xl">Quick Actions</h2>
 <div className="gap-6 grid md:grid-cols-2 lg:grid-cols-4">
 <Card className="group hover:shadow-lg border-l-4 border-l-info hover:border-l-info transition-all hover:-translate-y-1 duration-300">
 <CardHeader className="pb-3">
 <div className="flex justify-between items-center">
 <div className="bg-info-bg p-2.5 rounded-lg group-hover:scale-110 transition-transform duration-300">
 <Package className="w-5 h-5 text-info" />
 </div>
 </div>
 <CardTitle className="mt-3 font-semibold text-base">Offer Batches</CardTitle>
 <CardDescription className="text-xs">Create and manage offers for suppliers</CardDescription>
 </CardHeader>
 <CardContent>
 <Button asChild className="w-full" size="sm">
 <Link href="/admin/offer-batches">
 Manage
 <ArrowRight className="ml-2 w-4 h-4" />
 </Link>
 </Button>
 </CardContent>
 </Card>

 <Card className="group hover:shadow-lg border-l-4 border-l-info hover:border-l-info transition-all hover:-translate-y-1 duration-300">
 <CardHeader className="pb-3">
 <div className="flex justify-between items-center">
 <div className="bg-info-bg p-2.5 rounded-lg group-hover:scale-110 transition-transform duration-300">
 <Building2 className="w-5 h-5 text-info" />
 </div>
 </div>
 <CardTitle className="mt-3 font-semibold text-base">Buyers</CardTitle>
 <CardDescription className="text-xs">Manage buyer profiles and settings</CardDescription>
 </CardHeader>
 <CardContent>
 <Button asChild className="w-full" size="sm">
 <Link href="/admin/buyers">
 Manage
 <ArrowRight className="ml-2 w-4 h-4" />
 </Link>
 </Button>
 </CardContent>
 </Card>

 <Card className="group hover:shadow-lg border-l-4 border-l-success hover:border-l-success transition-all hover:-translate-y-1 duration-300">
 <CardHeader className="pb-3">
 <div className="flex justify-between items-center">
 <div className="bg-success-bg p-2.5 rounded-lg group-hover:scale-110 transition-transform duration-300">
 <FileText className="w-5 h-5 text-success" />
 </div>
 </div>
 <CardTitle className="mt-3 font-semibold text-base">Invoices</CardTitle>
 <CardDescription className="text-xs">View and manage all invoices</CardDescription>
 </CardHeader>
 <CardContent>
 <Button asChild className="w-full" size="sm">
 <Link href="/admin/invoices">
 View
 <ArrowRight className="ml-2 w-4 h-4" />
 </Link>
 </Button>
 </CardContent>
 </Card>

 <Card className="group hover:shadow-lg border-l-4 border-l-warning hover:border-l-warning transition-all hover:-translate-y-1 duration-300">
 <CardHeader className="pb-3">
 <div className="flex justify-between items-center">
 <div className="bg-warning-bg p-2.5 rounded-lg group-hover:scale-110 transition-transform duration-300">
 <RandIcon className="w-5 h-5 text-warning" />
 </div>
 </div>
 <CardTitle className="mt-3 font-semibold text-base">Payments</CardTitle>
 <CardDescription className="text-xs">Track and process payments</CardDescription>
 </CardHeader>
 <CardContent>
 <Button asChild className="w-full" size="sm">
 <Link href="/admin/payments">
 View
 <ArrowRight className="ml-2 w-4 h-4" />
 </Link>
 </Button>
 </CardContent>
 </Card>
 </div>
 </section>

 {/* Main Content Tabs */}
 <section aria-labelledby="tabs-heading">
 <h2 id="tabs-heading" className="sr-only">Content Sections</h2>
 <Tabs defaultValue="documents" className="space-y-6">
 <TabsList className="flex flex-wrap gap-2 bg-muted/50 p-1.5 border rounded-xl w-full h-auto">
 <TabsTrigger value="documents" className="px-4 py-2.5 rounded-lg text-sm">
 <FileText className="mr-2 w-4 h-4" />
 Document Review
 {pendingCessions.length > 0 && (
 <Badge variant="secondary" className="bg-warning/15 ml-2 text-warning">{pendingCessions.length}</Badge>
 )}
 {pendingCessions.length === 0 && (
 <span className="ml-1.5 text-muted-foreground">(0)</span>
 )}
 </TabsTrigger>
 <TabsTrigger value="applications" className="px-4 py-2.5 rounded-lg text-sm">
 <Clock className="mr-2 w-4 h-4" />
 Applications
 {pendingApplications.length > 0 && (
 <Badge variant="secondary" className="bg-info/15 ml-2 text-info">{pendingApplications.length}</Badge>
 )}
 {pendingApplications.length === 0 && (
 <span className="ml-1.5 text-muted-foreground">(0)</span>
 )}
 </TabsTrigger>
 <TabsTrigger value="bank-changes" className="px-4 py-2.5 rounded-lg text-sm">
 <Building2 className="mr-2 w-4 h-4" />
 Bank Changes
 {bankChangeRequests.length > 0 && (
 <Badge variant="secondary" className="bg-destructive/15 ml-2 text-destructive">{bankChangeRequests.length}</Badge>
 )}
 {bankChangeRequests.length === 0 && (
 <span className="ml-1.5 text-muted-foreground">(0)</span>
 )}
 </TabsTrigger>
 <TabsTrigger value="suppliers" className="px-4 py-2.5 rounded-lg text-sm">
 <Users className="mr-2 w-4 h-4" />
 All Suppliers
 </TabsTrigger>
 <TabsTrigger value="payments" className="px-4 py-2.5 rounded-lg text-sm">
 <RandIcon className="mr-2 w-4 h-4" />
 Payments
 </TabsTrigger>
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
 <div className="space-y-3">
 {pendingCessions.map((cession: any) => (
 <div key={cession.cession_id} className="flex justify-between items-center hover:bg-muted p-4 border rounded-lg transition-colors duration-200">
 <div className="flex-1">
 <h4 className="font-semibold text-sm">{cession.supplier_name}</h4>
 <p className="mt-1 text-muted-foreground text-xs">{cession.contact_email}</p>
 <div className="flex items-center gap-2 mt-2">
 <Badge variant="outline" className="text-xs">{cession.document_type}</Badge>
 <span className="text-muted-foreground text-xs">
 Submitted {new Date(cession.created_at).toLocaleDateString()}
 </span>
 </div>
 </div>
 <div className="flex gap-2">
 {cession.document_url && (
 <Button size="sm" variant="outline" asChild>
 <Link href={cession.document_url} target="_blank">
 View
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
 <CardHeader className="flex flex-row justify-between items-center">
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
 <CheckCircle className="mx-auto mb-3 w-12 h-12 text-success" />
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
 </section>

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
