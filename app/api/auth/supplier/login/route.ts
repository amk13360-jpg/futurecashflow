import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyPassword } from "@/lib/auth/password"
import { createSupplierSession } from "@/lib/auth/session"
import { createAuditLog } from "@/lib/auth/audit"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Find supplier by email
    const suppliers = await query<any[]>(
      `SELECT supplier_id, name, contact_email, password_hash, onboarding_status, active_status
       FROM suppliers WHERE contact_email = ?`,
      [email.toLowerCase().trim()]
    )

    // Generic error to prevent email enumeration
    if (suppliers.length === 0) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const supplier = suppliers[0]

    // Credentials not yet generated — supplier must use their access link first
    if (!supplier.password_hash) {
      return NextResponse.json({
        error: "Login credentials have not been set up yet. Please use your access link from the welcome email, then sign your cession agreement to activate your login.",
      }, { status: 401 })
    }

    // Check account is active
    if (supplier.active_status !== "active") {
      return NextResponse.json(
        { error: "Your account is currently inactive. Please contact support@futureminingfinance.co.za." },
        { status: 401 }
      )
    }

    // Verify password
    const valid = await verifyPassword(password, supplier.password_hash)
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Create supplier session
    const sessionToken = await createSupplierSession(
      {
        supplierId: supplier.supplier_id,
        email: supplier.contact_email,
        name: supplier.name,
      },
      request.headers
    )

    await createAuditLog({
      userType: "supplier",
      action: "SUPPLIER_LOGIN_SUCCESS",
      entityType: "supplier",
      entityId: supplier.supplier_id,
      details: `Supplier ${supplier.name} logged in with email/password credentials`,
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    })

    const response = NextResponse.json({
      success: true,
      supplier: {
        supplierId: supplier.supplier_id,
        name: supplier.name,
        email: supplier.contact_email,
        onboardingStatus: supplier.onboarding_status,
      },
    })

    response.cookies.set("supplier_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 120, // 2 hours
      path: "/",
    })

    return response
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("[Supplier Login] Error:", errorMessage, error)
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 })
  }
}
