import { type NextRequest, NextResponse } from "next/server"
import { clearSession, getSession, getSupplierSession } from "@/lib/auth/session"
import { createAuditLog } from "@/lib/auth/audit"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const supplierSession = await getSupplierSession()

    if (session) {
      await createAuditLog({
        userId: session.userId,
        userType: session.role,
        action: "LOGOUT",
        details: "User logged out",
        ipAddress: request.ip || request.headers.get("x-forwarded-for") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      })
    } else if (supplierSession) {
      await createAuditLog({
        userId: supplierSession.supplierId,
        userType: "supplier",
        action: "LOGOUT",
        details: "Supplier logged out",
        ipAddress: request.ip || request.headers.get("x-forwarded-for") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      })
    }

    await clearSession()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Logout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
