import { getAllSuppliers } from "@/lib/actions/admin"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { Search, Filter, Download, Eye, Users } from "lucide-react"
import { getSession } from "@/lib/auth/session"
import { EmptyState } from "@/components/ui/empty-state"
import Link from "next/link"

export default async function SuppliersPage() {
  const session = await getSession()
  const suppliers = await getAllSuppliers()

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      approved: { variant: "default", label: "Approved" },
      pending: { variant: "secondary", label: "Pending" },
      documents_submitted: { variant: "outline", label: "Documents Submitted" },
      rejected: { variant: "destructive", label: "Rejected" },
    }

    const config = statusMap[status] || { variant: "outline" as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getActiveStatusBadge = (status: string) => {
    const isActive = (status || "").toLowerCase() === "active"
    return isActive ? (
      <Badge variant="default" className="bg-success-bg border border-success-border text-success-foreground">
        Active
      </Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    )
  }

  return (
    <div className="bg-background min-h-screen">

      <main className="mx-auto px-4 py-8 container">
        {/* Page Header */}
        <div className="mb-8">
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Suppliers" },
            ]}
          />
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="font-bold text-3xl tracking-tight">All Suppliers</h1>
              <p className="mt-1 text-muted-foreground">Manage and view all registered suppliers across the platform</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 w-4 h-4" />
                Export
              </Button>
              <Link href="/admin/dashboard">
                <Button variant="outline" size="sm">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <Card className="mb-6 border-t-2 border-t-primary/20">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="top-1/2 left-3 absolute w-4 h-4 text-muted-foreground -translate-y-1/2 transform" />
                <Input placeholder="Search by name, VAT number, or email..." className="pl-10" />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filter</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Suppliers Table */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Supplier List ({suppliers.length})</CardTitle>
            <CardDescription>Complete list of all suppliers in the system with their current status</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier Name</TableHead>
                    <TableHead>VAT Number</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Risk Tier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8">
                        <EmptyState
                          icon={Users}
                          title="No suppliers yet"
                          description="Get started by inviting your first supplier to the platform"
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    suppliers.map((supplier: any) => (
                      <TableRow key={supplier.supplier_id} className="group">
                        <TableCell className="font-semibold text-sm">{supplier.name}</TableCell>
                        <TableCell className="text-sm">{supplier.vat_no || "—"}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{supplier.contact_email}</div>
                            <div className="text-muted-foreground text-xs">{supplier.contact_phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{supplier.bank_name || "—"}</div>
                            <div className="text-muted-foreground text-xs">{supplier.bank_account_no || ""}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium text-xs">{supplier.risk_tier || "N/A"}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(supplier.onboarding_status)}</TableCell>
                        <TableCell>{getActiveStatusBadge(supplier.active_status)}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {new Date(supplier.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/admin/applications/${supplier.supplier_id}`}>
                              <Eye className="mr-1 w-4 h-4" />
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
