"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { reviewSupplierApplication } from "@/lib/actions/admin"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"

interface ApplicationReviewClientProps {
  supplier: any
}

export default function ApplicationReviewClient({ supplier }: ApplicationReviewClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleApprove = async () => {
    startTransition(async () => {
      try {
        await reviewSupplierApplication(supplier.supplier_id, "approved")
        toast.success("✓ Supplier approved successfully! Email sent to supplier.")
        router.push("/admin/dashboard")
      } catch (error: any) {
        toast.error("✗ " + (error.message || "Failed to approve supplier"))
      }
    })
  }

  const handleRequestDocuments = async () => {
    startTransition(async () => {
      try {
        await reviewSupplierApplication(supplier.supplier_id, "documents_submitted")
        toast.info("→ Supplier notified to submit documents")
        router.push("/admin/dashboard")
      } catch (error: any) {
        toast.error("✗ " + (error.message || "Failed to request documents"))
      }
    })
  }

  const handleReject = async () => {
    if (!window.confirm("Are you sure you want to reject this application? This cannot be undone.")) {
      return
    }

    startTransition(async () => {
      try {
        await reviewSupplierApplication(supplier.supplier_id, "rejected")
        toast.success("✓ Application rejected. Supplier has been notified.")
        router.push("/admin/dashboard")
      } catch (error: any) {
        toast.error("✗ " + (error.message || "Failed to reject application"))
      }
    })
  }

  const handleResendEmail = async () => {
    startTransition(async () => {
      try {
        await reviewSupplierApplication(supplier.supplier_id, "approved")
        toast.success("✓ Approval email resent to supplier")
      } catch (error: any) {
        toast.error("✗ " + (error.message || "Failed to resend email"))
      }
    })
  }

  return (
    <div className="flex justify-center items-center bg-background py-8 min-h-screen">
      <div className="space-y-6 w-full max-w-3xl">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/admin/dashboard" },
            { label: "Applications", href: "/admin/applications" },
            { label: supplier.name || "Application" },
          ]}
        />
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
            <Button onClick={handleApprove} disabled={isPending} className="flex-1 border border-primary">
              {isPending ? "Processing..." : "Approve"}
            </Button>
            <Button onClick={handleRequestDocuments} variant="outline" disabled={isPending} className="flex-1 border border-border">
              Request Documents
            </Button>
            <Button onClick={handleReject} variant="destructive" disabled={isPending} className="flex-1 border border-destructive">
              Reject
            </Button>
            <Button onClick={handleResendEmail} variant="secondary" disabled={isPending} className="flex-1 border border-secondary-foreground/30">
              Resend Email
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
