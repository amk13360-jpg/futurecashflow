import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { createSession, getClientFingerprint } from "@/lib/auth/session"
import { createAuditLog } from "@/lib/auth/audit"
import { generateRandomToken } from "@/lib/security/enhanced"
import { checkRateLimit, clearRateLimit, getClientIP, RATE_LIMITS } from "@/lib/auth/rate-limit"
import { isValidOTP, isPositiveNumber } from "@/lib/utils/validation"
import type { User, Buyer } from "@/lib/types/database"

interface OTPCode {
  otp_id: number
  user_id: number
  code: string
  expires_at: Date
  used_at: Date | null
}

interface UserWithPasswordFlag extends User {
  must_change_password?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - prevent OTP brute force attacks
    const clientIP = getClientIP(request.headers)
    const rateLimitKey = `otp-verify:${clientIP}`
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.OTP)
    
    if (!rateLimit.allowed) {
      await createAuditLog({
        userType: "system",
        action: "RATE_LIMITED",
        details: `OTP verification rate limit exceeded for IP: ${clientIP}`,
        ipAddress: clientIP,
        userAgent: request.headers.get("user-agent") || undefined,
      })
      
      return NextResponse.json(
        { error: "Too many verification attempts. Please try again later." },
        { 
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfter || 900),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateLimit.resetTime)
          }
        }
      )
    }

    const { userId, otp } = await request.json()

    if (!userId || !otp) {
      return NextResponse.json({ error: "User ID and OTP are required" }, { status: 400 })
    }

    // Validate userId is a positive integer
    const parsedUserId = parseInt(userId, 10)
    if (!isPositiveNumber(parsedUserId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // Validate OTP format (exactly 6 digits)
    if (!isValidOTP(otp)) {
      return NextResponse.json({ error: "Invalid OTP format" }, { status: 400 })
    }

    // Get OTP from database
    const otpCodes = await query<OTPCode[]>(
      "SELECT * FROM otp_codes WHERE user_id = ? AND code = ? AND used_at IS NULL ORDER BY created_at DESC LIMIT 1",
      [parsedUserId, otp],
    )

    if (otpCodes.length === 0) {
      await createAuditLog({
        userId: parsedUserId,
        userType: "accounts_payable",
        action: "OTP_VERIFICATION_FAILED",
        details: "Invalid OTP code",
        ipAddress: request.headers.get("x-forwarded-for") || undefined,
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
    const users = await query<UserWithPasswordFlag[]>("SELECT * FROM users WHERE user_id = ?", [parsedUserId])

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = users[0]

    // Check if user must change password (first login with temp password)
    const mustChangePassword = user.must_change_password === 1

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

    // Create session with full_name, buyer_name, and security fields
    const fingerprint = getClientFingerprint(request.headers)
    const token = await createSession({
      userId: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      buyerId: user.buyer_id,
      fullName: user.full_name,
      buyerName: buyerName,
      ipHash: fingerprint.ipHash,
      userAgentHash: fingerprint.userAgentHash,
      sessionId: generateRandomToken(16),
      lastRotation: Date.now(),
      loginTime: Date.now(),
    })

    // Clear rate limit on successful verification
    clearRateLimit(rateLimitKey)

    // Map role to valid audit userType
    const auditUserType = user.role === 'accounts_payable' ? 'accounts_payable' 
      : user.role === 'admin' ? 'admin' : 'accounts_payable';
    
    await createAuditLog({
      userId: user.user_id,
      userType: auditUserType,
      action: "LOGIN_SUCCESS",
      details: mustChangePassword 
        ? "User logged in successfully - password change required" 
        : "User logged in successfully with OTP",
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    })

    // Set cookie on the response object (cookies() from next/headers
    // cannot reliably set cookies in Route Handlers in Next.js 16)
    const response = NextResponse.json({
      success: true,
      mustChangePassword,
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
        buyerId: user.buyer_id,
      },
    })

    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 4, // 4 hours
      path: "/",
    })

    return response
  } catch (error) {
    console.error("[v0] OTP verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
