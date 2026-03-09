"use client"

import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { approveCessionAsBuyer, rejectCessionAsBuyer, type BuyerCessionItem } from "@/lib/actions/buyer-cession"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { CheckCircle2, XCircle, FileText, ExternalLink, Shield, Clock } from "lucide-react"

interface Props {
  cession: BuyerCessionItem
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "approved" || status === "buyer_approved") return "default"
  if (status === "rejected") return "destructive"
  return "secondary"
}

function statusLabel(status: string): string {
  switch (status) {
    case "signed":       return "Awaiting Buyer Approval"
    case "buyer_approved": return "Buyer Approved"
    case "approved":     return "Fully Approved"
    case "rejected":     return "Rejected"
    default:             return status.charAt(0).toUpperCase() + status.slice(1)
  }
}

export default function BuyerCessionReviewClient({ cession }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [rejectReason, setRejectReason] = useState("")

  const canAction = cession.status === "signed"

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveCessionAsBuyer(cession.cession_id)
      if (result.success) {
        toast.success("✓ Cession agreement approved successfully!")
        router.push("/ap/cession-agreements")
      } else {
        toast.error("✗ " + (result.error || "Failed to approve cession agreement"))
      }
    })
  }

  const handleReject = () => {
    startTransition(async () => {
      const result = await rejectCessionAsBuyer(cession.cession_id, rejectReason || undefined)
      if (result.success) {
        toast.success("✓ Cession agreement rejected. The supplier will be notified.")
        router.push("/ap/cession-agreements")
      } else {
        toast.error("✗ " + (result.error || "Failed to reject cession agreement"))
      }
    })
  }

  return (
    <div className="space-y-6 mx-auto max-w-3xl">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/ap/dashboard" },
          { label: "Cession Approvals", href: "/ap/cession-agreements" },
          { label: "Review" },
        ]}
      />

      <div className="flex sm:flex-row flex-col justify-between gap-3 sm:items-center">
        <div>
          <p className="text-muted-foreground text-sm">Cession Agreement #{cession.cession_id}</p>
          <h1 className="font-bold text-3xl">Review Agreement</h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/ap/cession-agreements">Back to list</Link>
        </Button>
      </div>

      {/* Supplier & document info */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>{cession.supplier_name}</CardTitle>
              <CardDescription>Supplier cession agreement details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="gap-4 grid sm:grid-cols-2 text-sm">
            <div>
              <p className="text-muted-foreground">Supplier Email</p>
              <p className="font-medium">{cession.supplier_email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Agreement Type</p>
              <p className="font-medium capitalize">
                {cession.is_standing ? "Standing Cession Agreement" : "One-off Cession Agreement"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Document Type</p>
              <p className="font-medium capitalize">{cession.document_type.replace("_", " ")}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Signed / Submitted</p>
              <p className="font-medium">
                {cession.signed_date
                  ? new Date(cession.signed_date).toLocaleDateString()
                  : new Date(cession.updated_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Current Status</p>
              <Badge className="mt-1 capitalize" variant={statusVariant(cession.status)}>
                {cession.status === "signed" && <Clock className="mr-1 w-3 h-3" />}
                {(cession.status === "buyer_approved" || cession.status === "approved") && (
                  <CheckCircle2 className="mr-1 w-3 h-3" />
                )}
                {cession.status === "rejected" && <XCircle className="mr-1 w-3 h-3" />}
                {statusLabel(cession.status)}
              </Badge>
            </div>
            {cession.buyer_approved_at && (
              <div>
                <p className="text-muted-foreground">Buyer Approved</p>
                <p className="font-medium">
                  {new Date(cession.buyer_approved_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {cession.document_url ? (
            <Button asChild variant="outline" className="gap-2">
              <Link href={cession.document_url} target="_blank" rel="noopener noreferrer">
                <FileText className="w-4 h-4" />
                View Signed Document
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>
            </Button>
          ) : (
            <p className="text-muted-foreground text-sm italic">No document attached.</p>
          )}
        </CardContent>
      </Card>

      {/* Review actions */}
      <Card>
        <CardHeader>
          <CardTitle>Your Decision</CardTitle>
          <CardDescription>
            {canAction
              ? "Approve this cession agreement to allow the supplier to participate in early payment, or reject it to send it back."
              : `This cession agreement has already been actioned (status: ${statusLabel(cession.status)}).`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex sm:flex-row flex-col gap-3">
          {canAction ? (
            <>
              {/* Approve */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={isPending} className="flex-1 gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {isPending ? "Processing…" : "Approve"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Approve Cession Agreement?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You are approving the cession agreement for{" "}
                      <strong>{cession.supplier_name}</strong>. This will allow them to
                      participate in early payment offers on your invoices. This action will be
                      logged.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleApprove} disabled={isPending}>
                      Confirm Approval
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Reject */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isPending} className="flex-1 gap-2">
                    <XCircle className="w-4 h-4" />
                    {isPending ? "Processing…" : "Reject"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reject Cession Agreement?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You are rejecting the cession agreement submitted by{" "}
                      <strong>{cession.supplier_name}</strong>. They will need to resubmit a
                      revised agreement. Optionally provide a reason below.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="px-6 pb-2">
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Reason for rejection (optional)"
                      rows={3}
                      className="bg-background px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring w-full text-foreground text-sm resize-none"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleReject}
                      disabled={isPending}
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                      Confirm Rejection
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">No further action required.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
