import { getBuyerCessionById } from "@/lib/actions/buyer-cession"
import { redirect, notFound } from "next/navigation"
import { cookies } from "next/headers"
import { verifySession } from "@/lib/auth/session"
import BuyerCessionReviewClient from "./client"

interface Props {
  params: Promise<{ cessionId: string }>
}

export default async function BuyerCessionReviewPage({ params }: Props) {
  const { cessionId } = await params

  const cookieStore = await cookies()
  const token = cookieStore.get("session")?.value
  const session = token ? await verifySession(token) : null

  if (!session || session.role !== "accounts_payable") {
    redirect("/login/ap")
  }

  const id = parseInt(cessionId, 10)
  if (isNaN(id)) notFound()

  const result = await getBuyerCessionById(id)
  if (!result.success || !result.data) notFound()

  return <BuyerCessionReviewClient cession={result.data} />
}
