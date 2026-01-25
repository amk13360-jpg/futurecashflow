import { EmailClient, KnownEmailSendStatus } from "@azure/communication-email"

const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING || ""
const senderAddress = process.env.AZURE_COMMUNICATION_SENDER || "DoNotReply@56279b88-458b-44e2-9d6c-9f867fcdf491.azurecomm.net"

// ============================================================================
// Generic Email Interface
// ============================================================================

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Generic email sending function
 */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const { to, subject, html, text } = params;

  console.log(`[Email Service] Attempting to send email to: ${to}`);
  console.log(`[Email Service] Subject: ${subject}`);
  console.log(`[Email Service] Connection string configured: ${!!connectionString}`);
  console.log(`[Email Service] Sender address: ${senderAddress}`);

  try {
    const client = getEmailClient();
    
    const emailMessage = {
      senderAddress,
      content: {
        subject,
        html,
        plainText: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for plain text
      },
      recipients: {
        to: [{ address: to }],
      },
    };

    const poller = await client.beginSend(emailMessage);
    const result = await poller.pollUntilDone();

    if (result.status === KnownEmailSendStatus.Succeeded) {
      console.log(`[Email Service] Email sent successfully to ${to}`);
      return true;
    } else {
      console.error(`[Email Service] Failed to send email. Status: ${result.status}`);
      return false;
    }
  } catch (error) {
    console.error("[Email Service] Error sending email:", error);
    return false;
  }
}

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
        subject: "Action Required: Sign Your Cession Agreement - Future Cashflow",
        plainText: `
Hello ${supplierName},

Welcome to the Future Cashflow Platform!

You have been registered as a supplier. To complete your onboarding, please sign your cession agreement.

Click the link below to access the portal and sign your agreement:

${accessLink}

This link will expire in 14 days.

Once you have signed your cession agreement, your application will be reviewed by our team.

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
    .steps {
      background: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .step {
      display: flex;
      align-items: center;
      margin: 10px 0;
    }
    .step-number {
      background: #2563eb;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      font-weight: bold;
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
    .expiry {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px;
      margin: 20px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📋 Welcome to Future Cashflow</h1>
  </div>
  <div class="content">
    <h2>Hello ${supplierName},</h2>
    <p>Welcome to the <strong>Future Cashflow Platform</strong>!</p>
    <p>You have been registered as a supplier. To complete your onboarding, please follow these steps:</p>
    
    <div class="steps">
      <div class="step"><span class="step-number">1</span> Click the button below to access the portal</div>
      <div class="step"><span class="step-number">2</span> Sign or upload your cession agreement</div>
      <div class="step"><span class="step-number">3</span> Wait for approval from our team</div>
    </div>
    
    <div style="text-align: center;">
      <a href="${accessLink}" class="button">Sign Cession Agreement</a>
    </div>
    
    <div class="expiry">
      ⏱️ <strong>This link will expire in 14 days.</strong>
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
    console.log(`[Email Service] Sending welcome email to: ${recipientEmail}`)
    console.log(`[Email Service] Sender: ${senderAddress}`)
    console.log(`[Email Service] Access link: ${accessLink}`)
    
    const poller = await client.beginSend(emailMessage)
    const result = await poller.pollUntilDone()

    if (result.status === KnownEmailSendStatus.Succeeded) {
      console.log(`[Email Service] Welcome email sent successfully to ${recipientEmail}`)
      return true
    } else {
      console.error(`[Email Service] Failed to send welcome email. Status: ${result.status}`, result)
      return false
    }
  } catch (error: any) {
    console.error("[Email Service] Error sending welcome email:", error)
    console.error("[Email Service] Error details:", {
      message: error?.message,
      code: error?.code,
      statusCode: error?.statusCode,
      details: error?.details
    })
    return false
  }
}

/**
 * Send approval email to supplier - access to dashboard for early payment offers
 */
export async function sendSupplierApprovalEmail(
  recipientEmail: string,
  supplierName: string,
  accessLink: string,
): Promise<boolean> {
  try {
    const emailMessage = {
      senderAddress,
      content: {
        subject: "🎉 Your Application Has Been Approved - Future Cashflow",
        plainText: `
Hello ${supplierName},

Great news! Your supplier application has been approved.

You can now access your dashboard to view and accept early payment offers.

Click the link below to access your dashboard:

${accessLink}

This link will expire in 14 days.

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
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
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
      background: #059669;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      margin: 20px 0;
    }
    .success-box {
      background: #ecfdf5;
      border: 2px solid #059669;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
    }
    .success-icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .features {
      background: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .feature {
      display: flex;
      align-items: center;
      margin: 10px 0;
    }
    .feature-icon {
      margin-right: 12px;
      font-size: 20px;
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
    <h1>✅ Application Approved!</h1>
  </div>
  <div class="content">
    <h2>Hello ${supplierName},</h2>
    
    <div class="success-box">
      <div class="success-icon">🎉</div>
      <h3 style="margin: 0; color: #059669;">Your supplier application has been approved!</h3>
    </div>
    
    <p>You can now access your dashboard and start receiving early payment offers.</p>
    
    <div class="features">
      <h4 style="margin-top: 0;">What you can do now:</h4>
      <div class="feature"><span class="feature-icon">💰</span> View and accept early payment offers</div>
      <div class="feature"><span class="feature-icon">📊</span> Track your payment history</div>
      <div class="feature"><span class="feature-icon">👤</span> Manage your supplier profile</div>
    </div>
    
    <div style="text-align: center;">
      <a href="${accessLink}" class="button">Access Your Dashboard</a>
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
      console.log(`[Email Service] Approval email sent successfully to ${recipientEmail}`)
      return true
    } else {
      console.error(`[Email Service] Failed to send approval email. Status: ${result.status}`)
      return false
    }
  } catch (error) {
    console.error("[Email Service] Error sending approval email:", error)
    return false
  }
}
