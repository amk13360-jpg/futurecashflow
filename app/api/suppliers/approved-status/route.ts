import { NextResponse } from "next/server"
import { hasApprovedSuppliers } from "@/lib/actions/buyers"

export async function GET() {
  try {
    const result = await hasApprovedSuppliers()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error checking approved suppliers:", error)
    return NextResponse.json(
      { hasApproved: false, approvedCount: 0, totalCount: 0, error: "Failed to check supplier status" },
      { status: 500 }
    )
  }
}
