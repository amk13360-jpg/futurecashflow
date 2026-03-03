import { type NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/auth/audit";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { validatePasswordStrength } from "@/lib/utils/validation";

interface UserRow {
  password_hash: string;
  must_change_password: number;
}

export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!newPassword) {
      return NextResponse.json({ error: "New password is required" }, { status: 400 });
    }

    // Fetch current user data to check must_change_password flag
    const users = await query<UserRow[]>(
      `SELECT password_hash, must_change_password FROM users WHERE user_id = ?`,
      [session.userId]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = users[0];
    const isForced = user.must_change_password === 1;

    // Require current password verification unless this is a forced first-login change
    if (!isForced) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required" },
          { status: 400 }
        );
      }

      const isCurrentValid = await verifyPassword(currentPassword, user.password_hash);
      if (!isCurrentValid) {
        await createAuditLog({
          userId: session.userId,
          userType: session.role === 'accounts_payable' ? 'accounts_payable' : 'admin',
          action: "PASSWORD_CHANGE_FAILED",
          details: "Incorrect current password provided",
          ipAddress: request.headers.get("x-forwarded-for") || undefined,
          userAgent: request.headers.get("user-agent") || undefined,
        });

        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 403 }
        );
      }
    }

    // Validate password strength using centralized validation
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: "Password does not meet requirements", issues: passwordValidation.issues },
        { status: 400 }
      );
    }

    // Hash the new password using secure hashing function
    const passwordHash = await hashPassword(newPassword);

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
      userType: session.role === 'accounts_payable' ? 'accounts_payable' : 'admin',
      action: "PASSWORD_CHANGED",
      details: isForced ? "User changed password on first login" : "User changed password voluntarily",
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
