import { type NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/auth/audit";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { newPassword } = await request.json();

    if (!newPassword) {
      return NextResponse.json({ error: "New password is required" }, { status: 400 });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json(
        { error: "Password does not meet requirements" },
        { status: 400 }
      );
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and clear the must_change_password flag
    await query(
      `UPDATE users SET 
        password_hash = ?, 
        must_change_password = 0,
        is_email_verified = 1,
        updated_at = NOW()
       WHERE user_id = ?`,
      [passwordHash, session.userId]
    );

    // Log the password change
    await createAuditLog({
      userId: session.userId,
      userType: session.role === 'accounts_payable' ? 'accounts_payable' : (session.role === 'admin' ? 'admin' : 'accounts_payable'),
      action: "PASSWORD_CHANGED",
      details: "User changed password on first login",
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("[v0] Change password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
