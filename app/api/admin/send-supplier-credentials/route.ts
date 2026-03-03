import { NextResponse } from "next/server"
import { sendCredentialsToApprovedSuppliers } from "@/lib/actions/admin"

export async function POST() {
  try {
    const result = await sendCredentialsToApprovedSuppliers()
    return NextResponse.json(result)
  } catch (err: any) {
    console.error("[API] send-supplier-credentials error:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
