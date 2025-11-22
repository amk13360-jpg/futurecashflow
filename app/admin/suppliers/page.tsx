import { getAllSuppliers } from "@/lib/actions/admin"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, Download, Eye } from "lucide-react"
import { getSession } from "@/lib/auth/session"
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
      <Badge variant="default" className="bg-green-600">
        Active
      </Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    )
  }

  return (
    <div className="bg-muted/30 min-h-screen">
      <DashboardHeader userName={session?.username} />

      <main className="mx-auto px-4 py-8 container">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="font-bold text-3xl">All Suppliers</h1>
              <p className="text-muted-foreground">Manage and view all registered suppliers</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="mr-2 w-4 h-4" />
                Export
              </Button>
              <Link href="/admin/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="top-1/2 left-3 absolute w-4 h-4 text-muted-foreground -translate-y-1/2 transform" />
                  <Input placeholder="Search by name, VAT number, or email..." className="pl-10" />
                </div>
                <Button variant="outline">
                  <Filter className="mr-2 w-4 h-4" />
                  Filter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Suppliers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Supplier List ({suppliers.length})</CardTitle>
            <CardDescription>Complete list of all suppliers in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
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
                      <TableCell colSpan={9} className="py-8 text-muted-foreground text-center">
                        No suppliers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    suppliers.map((supplier: any) => (
                      <TableRow key={supplier.supplier_id}>
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell>{supplier.vat_no || "N/A"}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{supplier.contact_email}</div>
                            <div className="text-muted-foreground">{supplier.contact_phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{supplier.bank_name || "N/A"}</div>
                            <div className="text-muted-foreground">{supplier.bank_account_no || ""}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{supplier.risk_tier || "N/A"}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(supplier.onboarding_status)}</TableCell>
                        <TableCell>{getActiveStatusBadge(supplier.active_status)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(supplier.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
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
