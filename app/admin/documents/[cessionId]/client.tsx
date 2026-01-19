"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { reviewCessionAgreement } from "@/lib/actions/admin"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface DocumentReviewClientProps {
  cession: any
}

export default function DocumentReviewClient({ cession }: DocumentReviewClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleApprove = async () => {
    startTransition(async () => {
      try {
        await reviewCessionAgreement(cession.cession_id, "approved")
        toast.success("✓ Cession agreement approved successfully!")
        router.push(`/admin/applications/${cession.supplier_id}`)
      } catch (error: any) {
        toast.error("✗ " + (error.message || "Failed to approve cession agreement"))
      }
    })
  }

  const handleReject = async () => {
    if (!window.confirm("Are you sure you want to reject this cession agreement? This cannot be undone.")) {
      return
    }

    startTransition(async () => {
      try {
        await reviewCessionAgreement(cession.cession_id, "rejected")
        toast.success("✓ Cession agreement rejected. Supplier has been notified.")
        router.push("/admin/dashboard")
      } catch (error: any) {
        toast.error("✗ " + (error.message || "Failed to reject cession agreement"))
      }
    })
  }

  return (
    <div className="bg-background flex items-center justify-center min-h-screen py-8">
      <div className="space-y-6 w-full max-w-3xl">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-muted-foreground text-sm">Cession Agreement #{cession.cession_id}</p>
            <h1 className="font-bold text-3xl">Document Review</h1>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/dashboard">Back to dashboard</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{cession.supplier_name}</CardTitle>
            <CardDescription>Uploaded document details and history</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="gap-4 grid sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground text-sm">Supplier Contact</p>
                <p className="font-medium">{cession.contact_person || "N/A"}</p>
                <p className="text-sm">{cession.contact_email}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Document Type</p>
                <Badge variant="outline" className="mt-1 capitalize">
                  {cession.document_type.replace("_", " ")}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Uploaded</p>
                <p className="font-medium">{new Date(cession.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Current Status</p>
                <Badge className="mt-1 capitalize">{cession.status}</Badge>
              </div>
            </div>

            <Separator />

            <div className="flex flex-wrap gap-3">
              {cession.document_url && (
                <Button asChild variant="outline">
                  <Link href={cession.document_url} target="_blank">
                    View Document
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Review Actions</CardTitle>
            <CardDescription>Approve or reject this cession agreement</CardDescription>
          </CardHeader>
          <CardContent className="flex sm:flex-row flex-col gap-3">
            <Button onClick={handleApprove} disabled={isPending} className="flex-1">
              {isPending ? "Processing..." : "Approve"}
            </Button>
            <Button onClick={handleReject} variant="destructive" disabled={isPending} className="flex-1">
              Reject
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
