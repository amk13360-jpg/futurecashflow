import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { createAuditLog } from "@/lib/auth/audit"
import { createSession } from "@/lib/auth/session"
import { checkRateLimit, clearRateLimit, getClientIP, RATE_LIMITS } from "@/lib/auth/rate-limit"
import { verifyTOTP, verifyBackupCode } from "@/lib/auth/totp"
import { isValidOTP } from "@/lib/utils/validation"
import type { User } from "@/lib/types/database"

/**
 * POST /api/auth/2fa/verify
 * Verify TOTP code during login (second factor)
 * Called after password verification for users with 2FA enabled
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request.headers)
    const rateLimitKey = `2fa-verify:${clientIP}`
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.OTP)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please try again later." },
        { 
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfter || 900),
          }
        }
      )
    }

    const { userId, token, isBackupCode } = await request.json()

    // Validate inputs
    if (!userId || !token) {
      return NextResponse.json({ error: "User ID and token are required" }, { status: 400 })
    }

    // Get user's 2FA settings and full profile for session creation
    const users = await query<User[]>(
      `SELECT * FROM users WHERE user_id = ? AND totp_enabled = 1 AND active_status = 'active'`,
      [userId]
    )

    if (users.length === 0) {
      return NextResponse.json({ error: "2FA not enabled for this user" }, { status: 400 })
    }

    const user = users[0]

    let isValid = false
    let usedBackupCode = false

    if (isBackupCode) {
      // Verify backup code
      const backupCodes: string[] = JSON.parse(user.totp_backup_codes || "[]")
      
      for (let i = 0; i < backupCodes.length; i++) {
        if (verifyBackupCode(token, backupCodes[i])) {
          isValid = true
          usedBackupCode = true
          
          // Remove used backup code
          backupCodes.splice(i, 1)
          await query(
            `UPDATE users SET totp_backup_codes = ? WHERE user_id = ?`,
            [JSON.stringify(backupCodes), userId]
          )
          
          break
        }
      }
    } else {
      // Verify TOTP
      if (!isValidOTP(token)) {
        return NextResponse.json({ error: "Invalid token format" }, { status: 400 })
      }
      
      isValid = verifyTOTP(token, user.totp_secret)
    }

    if (!isValid) {
      await createAuditLog({
        userId,
        userType: "admin",
        action: "2FA_VERIFICATION_FAILED",
        details: isBackupCode ? "Invalid backup code" : "Invalid TOTP code",
        ipAddress: clientIP,
        userAgent: request.headers.get("user-agent") || undefined,
      })

      return NextResponse.json({ error: "Invalid verification code" }, { status: 401 })
    }

    await createAuditLog({
      userId,
      userType: "admin",
      action: "2FA_VERIFICATION_SUCCESS",
      details: usedBackupCode ? "Verified with backup code" : "Verified with TOTP",
      ipAddress: clientIP,
      userAgent: request.headers.get("user-agent") || undefined,
    })

    // Clear rate limit on successful 2FA
    clearRateLimit(rateLimitKey)

    // Issue session token now that both factors are verified
    const sessionToken = await createSession({
      userId: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      buyerId: user.buyer_id,
      fullName: user.full_name,
    })

    await createAuditLog({
      userId: user.user_id,
      userType: "admin",
      action: "LOGIN_SUCCESS",
      details: "Admin logged in successfully via 2FA",
      ipAddress: clientIP,
      userAgent: request.headers.get("user-agent") || undefined,
    })

    // Build response with session cookie
    const responseBody: Record<string, unknown> = {
      success: true,
      message: "2FA verification successful",
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
      },
    }

    if (usedBackupCode) {
      const remainingCodes = JSON.parse(user.totp_backup_codes || "[]").length - 1
      responseBody.backupCodesRemaining = remainingCodes
      responseBody.warning = remainingCodes < 3 
        ? "You have few backup codes remaining. Consider regenerating them."
        : undefined
    }

    const response = NextResponse.json(responseBody)

    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 4, // 4 hours
      path: "/",
    })

    return response
  } catch (error) {
    console.error("[2FA] Verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
