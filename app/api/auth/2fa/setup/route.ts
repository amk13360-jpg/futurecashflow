import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSession } from "@/lib/auth/session"
import { createAuditLog } from "@/lib/auth/audit"
import { 
  generateTOTPSecret, 
  generateTOTPUri, 
  verifyTOTP,
  generateBackupCodes,
  hashBackupCode
} from "@/lib/auth/totp"

/**
 * GET /api/auth/2fa/setup
 * Generate TOTP secret and QR code URI for 2FA setup
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can set up 2FA (for now)
    if (session.role !== "admin") {
      return NextResponse.json({ error: "2FA is only available for admin accounts" }, { status: 403 })
    }

    // Generate new TOTP secret
    const secret = generateTOTPSecret()
    const uri = generateTOTPUri(secret, session.email)

    // Store secret temporarily (not yet verified)
    // In production, you might want to encrypt this
    await query(
      `UPDATE users SET totp_secret_pending = ?, totp_pending_at = NOW() WHERE user_id = ?`,
      [secret, session.userId]
    )

    await createAuditLog({
      userId: session.userId,
      userType: "admin",
      action: "2FA_SETUP_INITIATED",
      details: "User initiated 2FA setup",
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    })

    return NextResponse.json({
      success: true,
      secret,
      uri,
      // Client should use this URI to generate QR code
      message: "Scan the QR code with your authenticator app, then verify with a code"
    })
  } catch (error) {
    console.error("[2FA] Setup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/auth/2fa/setup
 * Verify TOTP code and enable 2FA
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { token } = await request.json()

    if (!token || !/^\d{6}$/.test(token)) {
      return NextResponse.json({ error: "Invalid token format" }, { status: 400 })
    }

    // Get pending secret
    const users = await query<any[]>(
      `SELECT totp_secret_pending FROM users WHERE user_id = ? AND totp_secret_pending IS NOT NULL`,
      [session.userId]
    )

    if (users.length === 0 || !users[0].totp_secret_pending) {
      return NextResponse.json({ error: "No pending 2FA setup found" }, { status: 400 })
    }

    const pendingSecret = users[0].totp_secret_pending

    // Verify the token
    if (!verifyTOTP(token, pendingSecret)) {
      await createAuditLog({
        userId: session.userId,
        userType: "admin",
        action: "2FA_SETUP_FAILED",
        details: "Invalid verification code during 2FA setup",
        ipAddress: request.headers.get("x-forwarded-for") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      })

      return NextResponse.json({ error: "Invalid verification code" }, { status: 401 })
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes(10)
    const hashedBackupCodes = backupCodes.map(code => hashBackupCode(code))

    // Enable 2FA
    await query(
      `UPDATE users SET 
        totp_secret = totp_secret_pending,
        totp_secret_pending = NULL,
        totp_pending_at = NULL,
        totp_enabled = 1,
        totp_backup_codes = ?,
        totp_enabled_at = NOW()
       WHERE user_id = ?`,
      [JSON.stringify(hashedBackupCodes), session.userId]
    )

    await createAuditLog({
      userId: session.userId,
      userType: "admin",
      action: "2FA_ENABLED",
      details: "User successfully enabled 2FA",
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    })

    return NextResponse.json({
      success: true,
      message: "Two-factor authentication has been enabled",
      backupCodes, // Return backup codes ONCE - user must save them
    })
  } catch (error) {
    console.error("[2FA] Enable error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE /api/auth/2fa/setup
 * Disable 2FA for the current user
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { password, token } = await request.json()

    // Require current password for security
    if (!password) {
      return NextResponse.json({ error: "Password required to disable 2FA" }, { status: 400 })
    }

    // Get user with password and 2FA info
    const users = await query<any[]>(
      `SELECT password_hash, totp_enabled, totp_secret FROM users WHERE user_id = ?`,
      [session.userId]
    )

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = users[0]

    // Verify password
    const bcrypt = await import("bcryptjs")
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    // If 2FA is enabled, require current TOTP token
    if (user.totp_enabled && user.totp_secret) {
      if (!token || !verifyTOTP(token, user.totp_secret)) {
        return NextResponse.json({ error: "Invalid 2FA code" }, { status: 401 })
      }
    }

    // Disable 2FA
    await query(
      `UPDATE users SET 
        totp_secret = NULL,
        totp_secret_pending = NULL,
        totp_pending_at = NULL,
        totp_enabled = 0,
        totp_backup_codes = NULL,
        totp_enabled_at = NULL
       WHERE user_id = ?`,
      [session.userId]
    )

    await createAuditLog({
      userId: session.userId,
      userType: "admin",
      action: "2FA_DISABLED",
      details: "User disabled 2FA",
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    })

    return NextResponse.json({
      success: true,
      message: "Two-factor authentication has been disabled"
    })
  } catch (error) {
    console.error("[2FA] Disable error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
