import { NextResponse } from "next/server"
import { getSession, getSupplierSession } from "@/lib/auth/session"
import { createErrorResponse, secureLog } from "@/lib/security/enhanced"

export async function GET() {
  try {
    // Try admin/AP session first
    const session = await getSession()
    if (session) {
      return NextResponse.json({
        userId: session.userId,
        username: session.username,
        email: session.email,
        role: session.role,
        buyerId: session.buyerId,
        fullName: session.fullName,
        buyerName: session.buyerName,
      })
    }

    // Fall back to supplier session
    const supplierSession = await getSupplierSession()
    if (supplierSession) {
      return NextResponse.json({
        userId: supplierSession.supplierId,
        username: supplierSession.email,
        email: supplierSession.email,
        role: "supplier",
        fullName: supplierSession.name,
      })
    }

    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  } catch (error) {
    secureLog('error', 'Session API error', { error: error instanceof Error ? error.message : String(error) })
    return createErrorResponse(error, "Session validation")
  }
}
