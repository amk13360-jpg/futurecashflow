import { notFound } from "next/navigation"
import { getCessionById } from "@/lib/actions/admin"
import DocumentReviewClient from "./client"

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

  return <DocumentReviewClient cession={cession} />
}
