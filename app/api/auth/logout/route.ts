import { type NextRequest, NextResponse } from "next/server"
import { clearSession, getSession, getSupplierSession } from "@/lib/auth/session"
import { createAuditLog } from "@/lib/auth/audit"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const supplierSession = await getSupplierSession()

    if (session) {
      // Map session role to audit userType (auditor -> admin for audit purposes)
      const userTypeMap: Record<string, 'admin' | 'accounts_payable' | 'supplier' | 'system'> = {
        admin: 'admin',
        accounts_payable: 'accounts_payable',
        auditor: 'admin' // Map auditor to admin for audit logging
      };
      const userType = userTypeMap[session.role] || 'admin';
      
      await createAuditLog({
        userId: session.userId,
        userType,
        action: "LOGOUT",
        details: "User logged out",
        ipAddress: request.headers.get("x-forwarded-for") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      })
    } else if (supplierSession) {
      await createAuditLog({
        userId: supplierSession.supplierId,
        userType: "supplier",
        action: "LOGOUT",
        details: "Supplier logged out",
        ipAddress: request.headers.get("x-forwarded-for") || undefined,
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
