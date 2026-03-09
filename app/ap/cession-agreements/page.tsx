import { getAllBuyerCessions } from "@/lib/actions/buyer-cession"
import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { Shield, Clock, CheckCircle2, XCircle, FileText, ChevronRight } from "lucide-react"
import { cookies } from "next/headers"
import { verifySession } from "@/lib/auth/session"

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "signed":
      return (
        <Badge variant="secondary" className="bg-warning/10 border-warning/30 text-warning">
          <Clock className="mr-1 w-3 h-3" />
          Awaiting Your Approval
        </Badge>
      )
    case "buyer_approved":
      return (
        <Badge variant="secondary" className="bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400">
          <CheckCircle2 className="mr-1 w-3 h-3" />
          Buyer Approved
        </Badge>
      )
    case "approved":
      return (
        <Badge className="bg-success/10 border-success/30 text-success">
          <CheckCircle2 className="mr-1 w-3 h-3" />
          Fully Approved
        </Badge>
      )
    case "rejected":
      return (
        <Badge variant="destructive" className="bg-error/10 border-error/30 text-error">
          <XCircle className="mr-1 w-3 h-3" />
          Rejected
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="capitalize">
          {status}
        </Badge>
      )
  }
}

export default async function BuyerCessionApprovalsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("session")?.value
  const session = token ? await verifySession(token) : null

  if (!session || session.role !== "accounts_payable") {
    redirect("/login/ap")
  }

  const result = await getAllBuyerCessions()
  const cessions = result.data ?? []

  const pending = cessions.filter((c) => c.status === "signed")
  const rest = cessions.filter((c) => c.status !== "signed")

  return (
    <div className="space-y-6 mx-auto max-w-5xl">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/ap/dashboard" },
          { label: "Cession Approvals" },
        ]}
      />

      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-bold text-3xl">Cession Agreement Approvals</h1>
          <p className="mt-1 text-muted-foreground">
            Review and approve supplier cession agreements before they become effective.
          </p>
        </div>
        {pending.length > 0 && (
          <Badge className="px-3 py-1 text-sm" variant="secondary">
            {pending.length} pending
          </Badge>
        )}
      </div>

      {/* Pending approvals */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <Clock className="w-4 h-4 text-warning" />
            Awaiting Your Approval
          </h2>
          {pending.map((c) => (
            <Card
              key={c.cession_id}
              className="border-warning/40 hover:border-warning/70 transition-colors"
            >
              <CardContent className="flex sm:flex-row flex-col justify-between items-start gap-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="bg-warning/10 mt-0.5 p-2 rounded-lg">
                    <Shield className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{c.supplier_name}</p>
                    <p className="text-muted-foreground text-sm">{c.supplier_email}</p>
                    <p className="mt-1 text-muted-foreground text-xs">
                      Submitted{" "}
                      {c.signed_date
                        ? new Date(c.signed_date).toLocaleDateString()
                        : new Date(c.updated_at).toLocaleDateString()}
                      {c.is_standing ? " · Standing Agreement" : " · One-off Agreement"}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col flex-row items-start sm:items-end gap-2">
                  <StatusBadge status={c.status} />
                  <Button asChild size="sm" className="w-full sm:w-auto">
                    <Link href={`/ap/cession-agreements/${c.cession_id}`}>
                      Review
                      <ChevronRight className="ml-1 w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pending.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col justify-center items-center gap-2 py-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-success" />
            <p className="font-medium text-foreground">All up to date</p>
            <p className="text-muted-foreground text-sm">
              No cession agreements are awaiting your approval.
            </p>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {rest.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <FileText className="w-4 h-4 text-muted-foreground" />
            History
          </h2>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">All Agreements</CardTitle>
              <CardDescription>Previously actioned cession agreements</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {rest.map((c) => (
                  <div
                    key={c.cession_id}
                    className="flex sm:flex-row flex-col justify-between items-start gap-3 px-6 py-4"
                  >
                    <div>
                      <p className="font-medium text-foreground text-sm">{c.supplier_name}</p>
                      <p className="text-muted-foreground text-xs">
                        {c.is_standing ? "Standing Agreement" : "One-off Agreement"} ·{" "}
                        {new Date(c.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={c.status} />
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/ap/cession-agreements/${c.cession_id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
