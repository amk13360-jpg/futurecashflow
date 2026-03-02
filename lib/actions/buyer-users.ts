'use server';

import { query } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '@/lib/auth/audit';
import { sendEmail } from '@/lib/services/email';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// ============================================================================
// Types
// ============================================================================

export interface CreateUserForBuyerInput {
  buyer_id: number;
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  send_welcome_email?: boolean;
}

// ============================================================================
// Generate Temporary Password
// ============================================================================

function generateTempPassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghjkmnpqrstuvwxyz';
  const numbers = '23456789';
  const special = '!@#$%';
  
  const allChars = uppercase + lowercase + numbers + special;
  
  // Ensure at least one of each type
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// ============================================================================
// Create User for Buyer
// ============================================================================

export async function createUserForBuyer(input: CreateUserForBuyerInput): Promise<{ 
  success: boolean; 
  userId?: number; 
  tempPassword?: string;
  message?: string 
}> {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return { success: false, message: 'Unauthorized' };
    }

    // Check buyer exists
    const buyers = await query(
      'SELECT buyer_id, name, code FROM buyers WHERE buyer_id = ?',
      [input.buyer_id]
    ) as any[];

    if (buyers.length === 0) {
      return { success: false, message: 'Buyer not found' };
    }

    const buyer = buyers[0];

    // Check for duplicate username
    const existingUsername = await query(
      'SELECT user_id FROM users WHERE username = ?',
      [input.username]
    ) as any[];

    if (existingUsername.length > 0) {
      return { success: false, message: 'Username already exists' };
    }

    // Check for duplicate email
    const existingEmail = await query(
      'SELECT user_id FROM users WHERE email = ?',
      [input.email]
    ) as any[];

    if (existingEmail.length > 0) {
      return { success: false, message: 'Email already exists' };
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Generate activation token
    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create user
    const result = await query(
      `INSERT INTO users (
        username, email, password_hash, role, buyer_id,
        full_name, phone, active_status,
        must_change_password, is_email_verified,
        activation_token, activation_expires_at
      ) VALUES (?, ?, ?, 'accounts_payable', ?, ?, ?, 'active', 1, 0, ?, ?)`,
      [
        input.username,
        input.email,
        passwordHash,
        input.buyer_id,
        input.full_name,
        input.phone || null,
        activationToken,
        activationExpires
      ]
    ) as any;

    const userId = result.insertId;

    // Log audit event
    await createAuditLog({
      userId: session.userId,
      userType: 'admin',
      action: 'CREATE_AP_USER',
      entityType: 'user',
      entityId: userId,
      details: JSON.stringify({ 
        username: input.username, 
        buyer_id: input.buyer_id,
        buyer_name: buyer.name
      })
    });

    // Send welcome email if requested
    if (input.send_welcome_email !== false) {
      try {
        console.log(`[Create User] Attempting to send welcome email to: ${input.email}`);
        await sendWelcomeEmailInternal(
          input.email,
          input.full_name,
          input.username,
          buyer.code, // Mine code
          tempPassword,
          buyer.name
        );
        console.log(`[Create User] Welcome email sent successfully`);

        // Log email sent
        await createAuditLog({
          userId: session.userId,
          userType: 'admin',
          action: 'SEND_WELCOME_EMAIL',
          entityType: 'user',
          entityId: userId,
          details: JSON.stringify({ email: input.email })
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the user creation, just note the email failed
      }
    }

    revalidatePath(`/admin/buyers/${input.buyer_id}`);
    revalidatePath('/admin/settings');

    return { 
      success: true, 
      userId, 
      tempPassword,
      message: input.send_welcome_email !== false 
        ? 'User created and welcome email sent' 
        : 'User created (no email sent)'
    };
  } catch (error) {
    console.error('Error creating user for buyer:', error);
    return { success: false, message: 'Failed to create user' };
  }
}

// ============================================================================
// Send Welcome Email
// ============================================================================

async function sendWelcomeEmailInternal(
  email: string,
  fullName: string,
  username: string,
  mineCode: string,
  tempPassword: string,
  buyerName: string
): Promise<void> {
  const loginUrl = process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/login/ap`
    : 'https://your-app-url.com/login/ap';

  const subject = `Welcome to Future Mining Finance (Pty) Ltd - ${buyerName}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .credentials { background: white; border: 1px solid #e5e7eb; padding: 15px; margin: 15px 0; border-radius: 8px; }
        .credential-row { display: flex; margin: 10px 0; }
        .credential-label { font-weight: bold; width: 120px; color: #6b7280; }
        .credential-value { font-family: monospace; background: #f3f4f6; padding: 4px 8px; border-radius: 4px; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 8px; }
        .button { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Future Mining Finance (Pty) Ltd</h1>
        </div>
        <div class="content">
          <p>Dear ${fullName},</p>
          
          <p>Your Accounts Payable user account has been created for <strong>${buyerName}</strong>.</p>
          
          <div class="credentials">
            <h3 style="margin-top: 0;">Your Login Credentials</h3>
            <div class="credential-row">
              <span class="credential-label">Mine Code:</span>
              <span class="credential-value">${mineCode}</span>
            </div>
            <div class="credential-row">
              <span class="credential-label">Username:</span>
              <span class="credential-value">${username}</span>
            </div>
            <div class="credential-row">
              <span class="credential-label">Password:</span>
              <span class="credential-value">${tempPassword}</span>
            </div>
          </div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong> This is a temporary password. You will be required to change it upon your first login.
          </div>
          
          <p>To access the platform:</p>
          <ol>
            <li>Click the button below or navigate to the login page</li>
            <li>Enter your Mine Code and Password</li>
            <li>Complete email OTP verification</li>
            <li>Set your new permanent password</li>
            <li>Start uploading invoices!</li>
          </ol>
          
          <a href="${loginUrl}" class="button">Login to Future Mining Finance</a>
          
          <p>If you have any questions, please contact your administrator or our support team.</p>
          
          <p>Best regards,<br>Future Mining Finance (Pty) Ltd</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply directly to this email.</p>
          <p>&copy; ${new Date().getFullYear()} Future Mining Finance. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Welcome to Future Mining Finance (Pty) Ltd

Dear ${fullName},

Your Accounts Payable user account has been created for ${buyerName}.

Your Login Credentials:
- Mine Code: ${mineCode}
- Username: ${username}
- Password: ${tempPassword}

IMPORTANT: This is a temporary password. You will be required to change it upon your first login.

To access the platform:
1. Navigate to: ${loginUrl}
2. Enter your Mine Code and Password
3. Complete email OTP verification
4. Set your new permanent password
5. Start uploading invoices!

If you have any questions, please contact your administrator.

Best regards,
Future Mining Finance (Pty) Ltd
  `;

  await sendEmail({
    to: email,
    subject,
    html: htmlContent,
    text: textContent
  });
}

// ============================================================================
// Resend Welcome Email
// ============================================================================

export async function sendWelcomeEmail(userId: number): Promise<{ success: boolean; message?: string }> {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return { success: false, message: 'Unauthorized' };
    }

    // Get user details
    const users = await query(
      `SELECT u.*, b.name as buyer_name, b.code as buyer_code
       FROM users u
       LEFT JOIN buyers b ON u.buyer_id = b.buyer_id
       WHERE u.user_id = ?`,
      [userId]
    ) as any[];

    if (users.length === 0) {
      return { success: false, message: 'User not found' };
    }

    const user = users[0];

    // Generate new temporary password
    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Update user with new password and require change
    await query(
      `UPDATE users SET 
        password_hash = ?, 
        must_change_password = 1,
        updated_at = NOW()
       WHERE user_id = ?`,
      [passwordHash, userId]
    );

    // Send welcome email
    await sendWelcomeEmailInternal(
      user.email,
      user.full_name || user.username,
      user.username,
      user.buyer_code || 'N/A',
      tempPassword,
      user.buyer_name || 'Your Company'
    );

    await createAuditLog({
      userId: session.userId,
      userType: 'admin',
      action: 'RESEND_WELCOME_EMAIL',
      entityType: 'user',
      entityId: userId,
      details: JSON.stringify({ email: user.email })
    });

    return { success: true, message: 'Welcome email sent with new temporary password' };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, message: 'Failed to send email' };
  }
}

// ============================================================================
// Reset User Password (Admin initiated)
// ============================================================================

export async function resetUserPassword(userId: number): Promise<{ 
  success: boolean; 
  tempPassword?: string;
  message?: string 
}> {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return { success: false, message: 'Unauthorized' };
    }

    // Generate new temporary password
    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Update user
    await query(
      `UPDATE users SET 
        password_hash = ?, 
        must_change_password = 1,
        failed_login_attempts = 0,
        active_status = 'active',
        updated_at = NOW()
       WHERE user_id = ?`,
      [passwordHash, userId]
    );

    await createAuditLog({
      userId: session.userId,
      userType: 'admin',
      action: 'RESET_USER_PASSWORD',
      entityType: 'user',
      entityId: userId,
      details: ''
    });

    return { success: true, tempPassword, message: 'Password reset successfully' };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { success: false, message: 'Failed to reset password' };
  }
}
