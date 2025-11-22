import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { getCessionById, reviewCessionAgreement } from "@/lib/actions/admin"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface DocumentReviewPageProps {
  params: Promise<{
    cessionId: string
  }>
}

export default async function DocumentReviewPage({ params }: DocumentReviewPageProps) {
  const { cessionId: cessionParam } = await params
  const cessionId = Number(cessionParam)
  if (Number.isNaN(cessionId)) {
    notFound()
  }

  const cession = await getCessionById(cessionId)
  if (!cession) {
    notFound()
  }

  const reviewAction = async (formData: FormData) => {
    "use server"
    const status = formData.get("status")
    if (status !== "approved" && status !== "rejected") {
      throw new Error("Invalid review status")
    }

    await reviewCessionAgreement(cessionId, status)
    redirect("/admin/dashboard")
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Cession Agreement #{cession.cession_id}</p>
            <h1 className="text-3xl font-bold">Document Review</h1>
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Supplier Contact</p>
                <p className="font-medium">{cession.contact_person || "N/A"}</p>
                <p className="text-sm">{cession.contact_email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Document Type</p>
                <Badge variant="outline" className="mt-1 capitalize">
                  {cession.document_type.replace("_", " ")}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Uploaded</p>
                <p className="font-medium">{new Date(cession.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Status</p>
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
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <form action={reviewAction}>
              <input type="hidden" name="status" value="approved" />
              <Button type="submit">Approve</Button>
            </form>
            <form action={reviewAction}>
              <input type="hidden" name="status" value="rejected" />
              <Button type="submit" variant="destructive">
                Reject
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
