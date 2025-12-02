import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyPassword } from "@/lib/auth/password"
import { createSession, setSessionCookie } from "@/lib/auth/session"
import { createAuditLog } from "@/lib/auth/audit"
import type { User } from "@/lib/types/database"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    // Get user from database
    const users = await query<User[]>("SELECT * FROM users WHERE username = ? AND role = ? AND active_status = ?", [
      username,
      "admin",
      "active",
    ])

    if (users.length === 0) {
      await createAuditLog({
        userType: "system",
        action: "LOGIN_FAILED",
        details: `Failed admin login attempt for username: ${username}`,
        ipAddress: request.ip || request.headers.get("x-forwarded-for") || undefined,
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
        ipAddress: request.ip || request.headers.get("x-forwarded-for") || undefined,
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

    await createAuditLog({
      userId: user.user_id,
      userType: "admin",
      action: "LOGIN_SUCCESS",
      details: "Admin logged in successfully",
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
      },
    })
  } catch (error) {
    console.error("[v0] Admin login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
