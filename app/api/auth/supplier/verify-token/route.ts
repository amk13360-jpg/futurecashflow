import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { createSupplierSession, setSupplierSessionCookie } from "@/lib/auth/session"
import { createAuditLog } from "@/lib/auth/audit"
import type { Supplier } from "@/lib/types/database"

interface SupplierToken {
  token_id: number
  supplier_id: number
  token: string
  token_type: string
  expires_at: Date
  used_at: Date | null
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    // Get token from database
    const tokens = await query<SupplierToken[]>("SELECT * FROM supplier_tokens WHERE token = ? AND used_at IS NULL", [
      token,
    ])

    if (tokens.length === 0) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    const supplierToken = tokens[0]

    // Check if token is expired
    if (new Date() > new Date(supplierToken.expires_at)) {
      return NextResponse.json({ error: "Token has expired. Please contact support." }, { status: 401 })
    }

    // Get supplier details
    const suppliers = await query<Supplier[]>("SELECT * FROM suppliers WHERE supplier_id = ?", [
      supplierToken.supplier_id,
    ])

    if (suppliers.length === 0) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
    }

    const supplier = suppliers[0]

    // Mark token as used
    await query("UPDATE supplier_tokens SET used_at = NOW() WHERE token_id = ?", [supplierToken.token_id])

    // Create supplier session
    const sessionToken = await createSupplierSession({
      supplierId: supplier.supplier_id,
      email: supplier.contact_email,
      name: supplier.name,
    })

    await setSupplierSessionCookie(sessionToken)

    await createAuditLog({
      userType: "supplier",
      action: "SUPPLIER_LOGIN_SUCCESS",
      entityType: "supplier",
      entityId: supplier.supplier_id,
      details: `Supplier ${supplier.name} accessed portal via token`,
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    })

    return NextResponse.json({
      success: true,
      supplier: {
        supplierId: supplier.supplier_id,
        name: supplier.name,
        email: supplier.contact_email,
        onboardingStatus: supplier.onboarding_status,
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("[v0] Supplier token verification error:", errorMessage, error)
    return NextResponse.json({ error: `Verification failed: ${errorMessage}` }, { status: 500 })
  }
}
