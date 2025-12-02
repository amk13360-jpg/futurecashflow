import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { createSession, setSessionCookie } from "@/lib/auth/session"
import { createAuditLog } from "@/lib/auth/audit"
import type { User, Buyer } from "@/lib/types/database"

interface OTPCode {
  otp_id: number
  user_id: number
  code: string
  expires_at: Date
  used_at: Date | null
}

export async function POST(request: NextRequest) {
  try {
    const { userId, otp } = await request.json()

    if (!userId || !otp) {
      return NextResponse.json({ error: "User ID and OTP are required" }, { status: 400 })
    }

    // Get OTP from database
    const otpCodes = await query<OTPCode[]>(
      "SELECT * FROM otp_codes WHERE user_id = ? AND code = ? AND used_at IS NULL ORDER BY created_at DESC LIMIT 1",
      [userId, otp],
    )

    if (otpCodes.length === 0) {
      await createAuditLog({
        userId,
        userType: "accounts_payable",
        action: "OTP_VERIFICATION_FAILED",
        details: "Invalid OTP code",
        ipAddress: request.ip || request.headers.get("x-forwarded-for") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      })

      return NextResponse.json({ error: "Invalid OTP code" }, { status: 401 })
    }

    const otpCode = otpCodes[0]

    // Check if OTP is expired
    if (new Date() > new Date(otpCode.expires_at)) {
      return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 401 })
    }

    // Mark OTP as used
    await query("UPDATE otp_codes SET used_at = NOW() WHERE otp_id = ?", [otpCode.otp_id])

    // Get user details
    const users = await query<User[]>("SELECT * FROM users WHERE user_id = ?", [userId])

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = users[0]

    // Get buyer name if user has a buyer_id
    let buyerName: string | undefined
    if (user.buyer_id) {
      const buyers = await query<Buyer[]>("SELECT name FROM buyers WHERE buyer_id = ?", [user.buyer_id])
      if (buyers.length > 0) {
        buyerName = buyers[0].name
      }
    }

    // Reset failed login attempts and update last login
    await query("UPDATE users SET failed_login_attempts = 0, last_login_at = NOW() WHERE user_id = ?", [user.user_id])

    // Create session with full_name and buyer_name
    const token = await createSession({
      userId: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      buyerId: user.buyer_id,
      fullName: user.full_name,
      buyerName: buyerName,
    })

    await setSessionCookie(token)

    await createAuditLog({
      userId: user.user_id,
      userType: "accounts_payable",
      action: "LOGIN_SUCCESS",
      details: "AP user logged in successfully with OTP",
      ipAddress: request.ip || request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    })

    return NextResponse.json({
      success: true,
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
        buyerId: user.buyer_id,
      },
    })
  } catch (error) {
    console.error("[v0] OTP verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
