import { redirect, notFound } from "next/navigation"
import { getSupplierApplicationById } from "@/lib/actions/admin"
import ApplicationReviewClient from "./client"

interface ApplicationReviewPageProps {
  params: Promise<{
    supplierId: string
  }>
}

export default async function ApplicationReviewPage({ params }: ApplicationReviewPageProps) {
  const { supplierId: supplierParam } = await params
  const supplierId = Number(supplierParam)
  if (Number.isNaN(supplierId)) {
    notFound()
  }

  const supplier = await getSupplierApplicationById(supplierId)
  if (!supplier) {
    notFound()
  }

  return <ApplicationReviewClient supplier={supplier} />
}
