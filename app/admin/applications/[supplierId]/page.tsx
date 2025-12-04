import Link from "next/link"
import { redirect } from "next/navigation"
import { getSupplierApplicationById, reviewSupplierApplication } from "@/lib/actions/admin"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface ApplicationReviewPageProps {
  params: Promise<{
    supplierId: string
  }>
}

export default async function ApplicationReviewPage({ params }: ApplicationReviewPageProps) {
  const { supplierId: supplierParam } = await params
  const supplierId = Number(supplierParam)
  if (Number.isNaN(supplierId)) {
    redirect("/admin/dashboard")
  }

  const supplier = await getSupplierApplicationById(supplierId)
  if (!supplier) {
    redirect("/admin/dashboard")
  }

  const action = async (formData: FormData) => {
    "use server"
    const status = formData.get("status")
    if (typeof status !== "string") {
      return
    }

    await reviewSupplierApplication(supplierId, status as any)
    redirect("/admin/dashboard")
  }

  const resendApprovalEmail = async () => {
    "use server"
    await reviewSupplierApplication(supplierId, "approved")
    redirect(`/admin/applications/${supplierId}`)
  }

  return (
    <div className="bg-muted/30 py-8 min-h-screen">
      <div className="space-y-6 max-w-4xl container">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-muted-foreground text-sm">Application #{supplier.supplier_id}</p>
            <h1 className="font-bold text-3xl">Supplier Application Review</h1>
            <p className="text-muted-foreground">Review supplier details and approve or reject onboarding</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin/dashboard">Back to dashboard</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{supplier.name}</CardTitle>
            <CardDescription>{supplier.contact_email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="gap-4 grid sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground text-sm">Contact Person</p>
                <p className="font-medium">{supplier.contact_person || "N/A"}</p>
                <p className="text-sm">{supplier.contact_phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">VAT Number</p>
                <p className="font-medium">{supplier.vat_no || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Address</p>
                <p className="font-medium">{supplier.address || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Bank Details</p>
                <p className="font-medium">{supplier.bank_name || "N/A"}</p>
                <p className="text-sm">{supplier.bank_account_no || ""}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <p className="text-muted-foreground text-sm">Current Status</p>
              <Badge className="capitalize">{supplier.onboarding_status}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Review Actions</CardTitle>
            <CardDescription>Update application status</CardDescription>
          </CardHeader>
          <CardContent className="flex sm:flex-row flex-col gap-3">
            <form action={action}>
              <input type="hidden" name="status" value="approved" />
              <Button type="submit">Approve</Button>
            </form>
            <form action={action}>
              <input type="hidden" name="status" value="documents_submitted" />
              <Button type="submit" variant="outline">
                Request Documents
              </Button>
            </form>
            <form action={action}>
              <input type="hidden" name="status" value="rejected" />
              <Button type="submit" variant="destructive">
                Reject
              </Button>
            </form>
            <form action={resendApprovalEmail}>
              <Button type="submit" variant="secondary">
                Resend Approval Email
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
