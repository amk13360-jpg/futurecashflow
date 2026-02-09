import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyPassword } from "@/lib/auth/password"
import { createSession, setSessionCookie } from "@/lib/auth/session"
import { createAuditLog } from "@/lib/auth/audit"
import { checkRateLimit, clearRateLimit, getClientIP, RATE_LIMITS } from "@/lib/auth/rate-limit"
import { isValidUsername, sanitizeString } from "@/lib/utils/validation"
import type { User } from "@/lib/types/database"

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - prevent brute force attacks
    const clientIP = getClientIP(request.headers)
    const rateLimitKey = `admin-login:${clientIP}`
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.AUTH)
    
    if (!rateLimit.allowed) {
      await createAuditLog({
        userType: "system",
        action: "RATE_LIMITED",
        details: `Admin login rate limit exceeded for IP: ${clientIP}`,
        ipAddress: clientIP,
        userAgent: request.headers.get("user-agent") || undefined,
      })
      
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
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

    const { username, password } = await request.json()

    // Input validation
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    // Sanitize and validate username
    const sanitizedUsername = sanitizeString(username, 50)
    if (!isValidUsername(sanitizedUsername)) {
      return NextResponse.json({ error: "Invalid username format" }, { status: 400 })
    }

    // Validate password length (prevent DoS via extremely long passwords)
    if (password.length > 128) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Get user from database
    const users = await query<User[]>("SELECT * FROM users WHERE username = ? AND role = ? AND active_status = ?", [
      sanitizedUsername,
      "admin",
      "active",
    ])

    if (users.length === 0) {
      await createAuditLog({
        userType: "system",
        action: "LOGIN_FAILED",
        details: `Failed admin login attempt for username: ${username}`,
        ipAddress: request.headers.get("x-forwarded-for") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      })

      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const user = users[0]

    // Check if account is locked
    if (user.failed_login_attempts >= 3) {
      return NextResponse.json({ error: "Account is locked. Please contact administrator." }, { status: 403 })
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash)

    if (!isValid) {
      // Increment failed login attempts
      await query("UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE user_id = ?", [
        user.user_id,
      ])

      await createAuditLog({
        userId: user.user_id,
        userType: "admin",
        action: "LOGIN_FAILED",
        details: "Invalid password",
        ipAddress: request.headers.get("x-forwarded-for") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      })

      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Reset failed login attempts and update last login
    await query("UPDATE users SET failed_login_attempts = 0, last_login_at = NOW() WHERE user_id = ?", [user.user_id])

    // Create session
    const token = await createSession({
      userId: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      buyerId: user.buyer_id,
      fullName: user.full_name,
    })

    await setSessionCookie(token)

    // Clear rate limit on successful login
    clearRateLimit(rateLimitKey)

    await createAuditLog({
      userId: user.user_id,
      userType: "admin",
      action: "LOGIN_SUCCESS",
      details: "Admin logged in successfully",
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
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
      },
    })
  } catch (error) {
    console.error("[v0] Admin login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
