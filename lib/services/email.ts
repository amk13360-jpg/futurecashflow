import { EmailClient, KnownEmailSendStatus } from "@azure/communication-email"

const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING || ""
const senderAddress = process.env.AZURE_COMMUNICATION_SENDER || "DoNotReply@ccd12bc5-9970-4050-8117-1aec566c8db9.azurecomm.net"

// Create email client lazily to avoid build-time errors
let emailClient: EmailClient | null = null

function getEmailClient(): EmailClient {
  if (!emailClient) {
    if (!connectionString) {
      throw new Error("AZURE_COMMUNICATION_CONNECTION_STRING is not configured")
    }
    emailClient = new EmailClient(connectionString)
  }
  return emailClient
}

export interface SendOTPEmailParams {
  recipientEmail: string
  recipientName: string
  otp: string
  expiryMinutes?: number
}

/**
 * Send OTP email to user
 */
export async function sendOTPEmail(params: SendOTPEmailParams): Promise<boolean> {
  const { recipientEmail, recipientName, otp, expiryMinutes = 10 } = params

  try {
    const emailMessage = {
      senderAddress,
      content: {
        subject: "Your OTP for Future Cashflow Platform",
        plainText: `
Hello ${recipientName},

Your One-Time Password (OTP) for accessing the Future Cashflow Platform is:

${otp}

This OTP will expire in ${expiryMinutes} minutes.

If you did not request this OTP, please contact your administrator immediately.

Best regards,
Future Cashflow Team
        `.trim(),
        html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      color: white;
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .otp-box {
      background: #f3f4f6;
      border: 2px dashed #2563eb;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
    }
    .otp-code {
      font-size: 32px;
      font-weight: bold;
      color: #2563eb;
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
    }
    .expiry {
      color: #ef4444;
      font-weight: bold;
      margin-top: 10px;
    }
    .footer {
      background: #f9fafb;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-radius: 0 0 8px 8px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .warning {
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔐 Future Cashflow</h1>
  </div>
  <div class="content">
    <h2>Hello ${recipientName},</h2>
    <p>Your One-Time Password (OTP) for accessing the <strong>Future Cashflow Platform</strong> is:</p>
    
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
      <div class="expiry">⏱️ Expires in ${expiryMinutes} minutes</div>
    </div>
    
    <p>Enter this code on the login page to complete your authentication.</p>
    
    <div class="warning">
      <strong>⚠️ Security Notice:</strong><br>
      If you did not request this OTP, please contact your administrator immediately.
    </div>
    
    <p>Best regards,<br><strong>Future Cashflow Team</strong></p>
  </div>
  <div class="footer">
    <p>This is an automated message, please do not reply to this email.</p>
    <p>© 2025 Future Cashflow. All rights reserved.</p>
  </div>
</body>
</html>
        `.trim(),
      },
      recipients: {
        to: [
          {
            address: recipientEmail,
            displayName: recipientName,
          },
        ],
      },
    }

    // Send the email
    const client = getEmailClient()
    const poller = await client.beginSend(emailMessage)

    // Wait for the operation to complete
    const result = await poller.pollUntilDone()

    // Check if email was sent successfully
    if (result.status === KnownEmailSendStatus.Succeeded) {
      console.log(`[Email Service] OTP email sent successfully to ${recipientEmail}`)
      return true
    } else {
      console.error(`[Email Service] Failed to send OTP email. Status: ${result.status}`)
      return false
    }
  } catch (error) {
    console.error("[Email Service] Error sending OTP email:", error)
    return false
  }
}

/**
 * Send welcome email to new supplier
 */
export async function sendSupplierWelcomeEmail(
  recipientEmail: string,
  supplierName: string,
  accessLink: string,
): Promise<boolean> {
  try {
    const emailMessage = {
      senderAddress,
      content: {
        subject: "Welcome to Future Cashflow Platform",
        plainText: `
Hello ${supplierName},

Welcome to the Future Cashflow Platform!

You have been onboarded as a supplier. Please use the following link to access your dashboard:

${accessLink}

Best regards,
Future Cashflow Team
        `.trim(),
        html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      color: white;
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .button {
      display: inline-block;
      padding: 15px 30px;
      background: #2563eb;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      margin: 20px 0;
    }
    .footer {
      background: #f9fafb;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-radius: 0 0 8px 8px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Welcome to Future Cashflow</h1>
  </div>
  <div class="content">
    <h2>Hello ${supplierName},</h2>
    <p>Welcome to the <strong>Future Cashflow Platform</strong>!</p>
    <p>You have been successfully onboarded as a supplier. You can now access your dashboard to view offers and manage your account.</p>
    
    <div style="text-align: center;">
      <a href="${accessLink}" class="button">Access Dashboard</a>
    </div>
    
    <p>If you have any questions, please contact your account manager.</p>
    
    <p>Best regards,<br><strong>Future Cashflow Team</strong></p>
  </div>
  <div class="footer">
    <p>This is an automated message, please do not reply to this email.</p>
    <p>© 2025 Future Cashflow. All rights reserved.</p>
  </div>
</body>
</html>
        `.trim(),
      },
      recipients: {
        to: [
          {
            address: recipientEmail,
            displayName: supplierName,
          },
        ],
      },
    }

    const client = getEmailClient()
    const poller = await client.beginSend(emailMessage)
    const result = await poller.pollUntilDone()

    if (result.status === KnownEmailSendStatus.Succeeded) {
      console.log(`[Email Service] Welcome email sent successfully to ${recipientEmail}`)
      return true
    } else {
      console.error(`[Email Service] Failed to send welcome email. Status: ${result.status}`)
      return false
    }
  } catch (error) {
    console.error("[Email Service] Error sending welcome email:", error)
    return false
  }
}
