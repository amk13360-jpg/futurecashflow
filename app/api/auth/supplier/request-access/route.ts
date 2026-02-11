import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { randomUUID } from "crypto"
import { createAuditLog } from "@/lib/auth/audit"
import { sendEmail } from "@/lib/services/email"

interface Supplier {
  supplier_id: number
  name: string
  contact_email: string
  status: string
  onboarding_status: string
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Find supplier by email
    const suppliers = await query<Supplier[]>(
      "SELECT supplier_id, name, contact_email, onboarding_status FROM suppliers WHERE contact_email = ?",
      [email.toLowerCase().trim()]
    )

    // Always return success to prevent email enumeration attacks
    if (suppliers.length === 0) {
      console.log(`[v0] Access request for unknown email: ${email}`)
      return NextResponse.json({ 
        success: true, 
        message: "If an account exists with this email, a new access link will be sent." 
      })
    }

    const supplier = suppliers[0]

    // Check if supplier is approved
    if (supplier.onboarding_status !== 'approved') {
      console.log(`[v0] Access request for non-approved supplier: ${supplier.name} (status: ${supplier.onboarding_status})`)
      return NextResponse.json({ 
        success: true, 
        message: "If an account exists with this email, a new access link will be sent." 
      })
    }

    // Check for rate limiting - max 3 requests per hour
    const recentTokens = await query<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM supplier_tokens 
       WHERE supplier_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
      [supplier.supplier_id]
    )

    if (recentTokens[0]?.count >= 3) {
      return NextResponse.json({ 
        error: "Too many access requests. Please try again later or contact support." 
      }, { status: 429 })
    }

    // Generate new token using Node.js crypto (no external dependency)
    const token = randomUUID()
    const shortCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const tokenExpiry = new Date()
    tokenExpiry.setDate(tokenExpiry.getDate() + 14) // 14 days expiry

    // Insert new token - use 'offer_access' type which is valid in the enum
    await query(
      `INSERT INTO supplier_tokens (supplier_id, token, token_type, expires_at, short_code)
       VALUES (?, ?, 'offer_access', ?, ?)`,
      [supplier.supplier_id, token, tokenExpiry, shortCode]
    )

    // Get base URL for access link
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const accessLink = `${baseUrl}/supplier/access?token=${token}`

    // Send email with new access link
    try {
      const emailSent = await sendEmail({
        to: supplier.contact_email,
        subject: "Your New SCF Platform Access Link",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #0066cc;">SCF Platform Access</h2>
              <p>Hi ${supplier.name},</p>
              <p>You requested a new access link to the SCF Platform. Click the button below to access your account:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${accessLink}" 
                   style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Access SCF Platform
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">
                Or use this short code: <strong>${shortCode}</strong>
              </p>
              <p style="color: #666; font-size: 14px;">
                This link will expire in 14 days. If you did not request this, please ignore this email.
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="color: #999; font-size: 12px;">
                This is an automated message from the SCF Platform.
              </p>
            </div>
          `,
      })

      if (!emailSent) {
        console.error("[v0] Failed to send access email to", supplier.contact_email)
      }
    } catch (emailError) {
      console.error("[v0] Email send error:", emailError)
      // Continue even if email fails - we'll show success anyway
    }

    // Audit log
    await createAuditLog({
      userType: "supplier",
      action: "ACCESS_LINK_REQUESTED",
      entityType: "supplier",
      entityId: supplier.supplier_id,
      details: `Supplier ${supplier.name} requested new access link`,
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    })

    return NextResponse.json({ 
      success: true, 
      message: "If an account exists with this email, a new access link will be sent." 
    })

  } catch (error) {
    console.error("[v0] Request access error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
