import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyPassword, generateOTP } from "@/lib/auth/password"
import { createAuditLog } from "@/lib/auth/audit"
import { sendOTPEmail } from "@/lib/services/email"
import type { User, Buyer } from "@/lib/types/database"

export async function POST(request: NextRequest) {
  try {
    const { mineCode, password } = await request.json()

    if (!mineCode || !password) {
      return NextResponse.json({ error: "Mine code and password are required" }, { status: 400 })
    }

    // Get buyer by code
    const buyers = await query<Buyer[]>("SELECT * FROM buyers WHERE code = ? AND active_status = ?", [
      mineCode,
      "active",
    ])

    if (buyers.length === 0) {
      return NextResponse.json({ error: "Invalid mine code" }, { status: 401 })
    }

    const buyer = buyers[0]

    // Get AP user for this buyer
    const users = await query<User[]>("SELECT * FROM users WHERE buyer_id = ? AND role = ? AND active_status = ?", [
      buyer.buyer_id,
      "accounts_payable",
      "active",
    ])

    if (users.length === 0) {
      return NextResponse.json({ error: "No AP user found for this mine" }, { status: 401 })
    }

    const user = users[0]

    // Check if account is locked
    if (user.failed_login_attempts >= 3) {
      return NextResponse.json({ error: "Account is locked. Please contact administrator." }, { status: 403 })
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash)

    if (!isValid) {
      await query("UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE user_id = ?", [
        user.user_id,
      ])

      await createAuditLog({
        userId: user.user_id,
        userType: "accounts_payable",
        action: "LOGIN_FAILED",
        details: "Invalid password",
        ipAddress: request.ip || request.headers.get("x-forwarded-for") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      })

      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Generate OTP
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store OTP in database
    await query("INSERT INTO otp_codes (user_id, code, expires_at) VALUES (?, ?, ?)", [user.user_id, otp, expiresAt])

    // Send OTP via Azure Communication Services
    const emailSent = await sendOTPEmail({
      recipientEmail: user.email,
      recipientName: user.full_name || user.username,
      otp,
      expiryMinutes: 10,
    })

    if (!emailSent) {
      console.error(`[v0] Failed to send OTP email to ${user.email}`)
      // Continue anyway - OTP is stored in database
    } else {
      console.log(`[v0] OTP email sent successfully to ${user.email}`)
    }

    await createAuditLog({
      userId: user.user_id,
      userType: "accounts_payable",
      action: "OTP_GENERATED",
      details: emailSent ? "OTP sent to email successfully" : "OTP generated but email failed",
      ipAddress: request.ip || request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    })

    return NextResponse.json({
      success: true,
      message: "OTP sent to your email",
      userId: user.user_id,
      email: user.email,
      // For testing only - show OTP in development
      otp: process.env.NODE_ENV === "development" ? otp : undefined,
    })
  } catch (error) {
    console.error("[v0] AP login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
