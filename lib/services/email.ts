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

  // Detailed logging for debugging
  console.log(`[Email Service - OTP] ========== SENDING OTP EMAIL ==========`)
  console.log(`[Email Service - OTP] Recipient: ${recipientEmail}`)
  console.log(`[Email Service - OTP] Recipient Name: ${recipientName}`)
  console.log(`[Email Service - OTP] OTP Expiry: ${expiryMinutes} minutes`)
  console.log(`[Email Service - OTP] Sender Address: ${senderAddress}`)
  console.log(`[Email Service - OTP] Connection String Configured: ${!!connectionString}`)
  console.log(`[Email Service - OTP] Connection String Length: ${connectionString?.length || 0}`)

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
    console.log(`[Email Service - OTP] Creating email client...`)
    const client = getEmailClient()
    console.log(`[Email Service - OTP] Email client created, starting send operation...`)
    const poller = await client.beginSend(emailMessage)

    // Wait for the operation to complete
    console.log(`[Email Service - OTP] Polling for send completion...`)
    const result = await poller.pollUntilDone()

    // Check if email was sent successfully
    console.log(`[Email Service - OTP] Send operation completed. Status: ${result.status}`)
    console.log(`[Email Service - OTP] Message ID: ${result.id || 'N/A'}`)
    
    if (result.status === KnownEmailSendStatus.Succeeded) {
      console.log(`[Email Service - OTP] ✅ OTP email sent successfully to ${recipientEmail}`)
      return true
    } else {
      console.error(`[Email Service - OTP] ❌ Failed to send OTP email. Status: ${result.status}`)
      console.error(`[Email Service - OTP] Result details:`, JSON.stringify(result, null, 2))
      return false
    }
  } catch (error) {
    console.error("[Email Service - OTP] ❌ Error sending OTP email:", error)
    if (error instanceof Error) {
      console.error(`[Email Service - OTP] Error name: ${error.name}`)
      console.error(`[Email Service - OTP] Error message: ${error.message}`)
      console.error(`[Email Service - OTP] Error stack: ${error.stack}`)
    }
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
 * Send approval email to supplier - access to dashboard for early payment requests
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
        subject: "🎉 Your Application Has Been Approved - Future Mining Finance (Pty) Ltd",
        plainText: `
Hello ${supplierName},

Great news! Your supplier application has been approved by Future Mining Finance (Pty) Ltd.

You can start requesting early payments.

Early payment will be processed within 2-3 business days.

Click the link below to access your dashboard:

${accessLink}

This link will expire in 14 days.

Best regards,
Future Mining Finance (Pty) Ltd
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
    .info-box {
      background: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #059669;
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

    <p>You can start requesting early payments.</p>

    <div class="info-box">
      <p style="margin: 0;">⏱️ <strong>Early payment will be processed within 2-3 business days.</strong></p>
    </div>

    <div style="text-align: center;">
      <a href="${accessLink}" class="button">Access Your Dashboard</a>
    </div>

    <p>If you have any questions, please contact your account manager.</p>

    <p>Best regards,<br><strong>Future Mining Finance (Pty) Ltd</strong></p>
  </div>
  <div class="footer">
    <p>This is an automated message, please do not reply to this email.</p>
    <p>© 2026 Future Mining Finance (Pty) Ltd. All rights reserved.</p>
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

/**
 * Send offer notification email to supplier - notifies them of new early payment offers
 */
export async function sendOfferNotificationEmail(
  recipientEmail: string,
  supplierName: string,
  accessLink: string,
  offerCount: number,
  totalAmount: number,
): Promise<boolean> {
  try {
    const formattedAmount = `R ${totalAmount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

    const emailMessage = {
      senderAddress,
      content: {
        subject: `💰 You Have ${offerCount} New Early Payment Offer${offerCount > 1 ? "s" : ""} - Future Cashflow`,
        plainText: `
Hello ${supplierName},

Great news! You have ${offerCount} new early payment offer${offerCount > 1 ? "s" : ""} available on the Future Cashflow platform.

Total offer value: ${formattedAmount}

Click the link below to review and accept your offers:

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
      background: linear-gradient(135deg, #0066cc, #004999);
      color: white;
      padding: 30px;
      border-radius: 12px 12px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .offer-summary {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .offer-count {
      font-size: 36px;
      font-weight: bold;
      color: #0066cc;
    }
    .offer-amount {
      font-size: 20px;
      font-weight: bold;
      color: #16a34a;
      margin-top: 8px;
    }
    .button {
      display: inline-block;
      background-color: #0066cc;
      color: white !important;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      font-size: 16px;
      margin: 20px 0;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 0 0 12px 12px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .expiry {
      background: #fef3c7;
      border: 1px solid #fbbf24;
      border-radius: 6px;
      padding: 10px;
      margin: 15px 0;
      font-size: 14px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>💰 New Early Payment Offers</h1>
    <p style="margin: 8px 0 0; opacity: 0.9;">Accelerate your cash flow today</p>
  </div>
  <div class="content">
    <p>Hello <strong>${supplierName}</strong>,</p>
    <p>You have new early payment offers waiting for your review on the Future Cashflow platform.</p>

    <div class="offer-summary">
      <div class="offer-count">${offerCount}</div>
      <div>Early Payment Offer${offerCount > 1 ? "s" : ""} Available</div>
      <div class="offer-amount">${formattedAmount}</div>
      <div style="font-size: 13px; color: #666; margin-top: 4px;">Total offer value</div>
    </div>

    <div style="text-align: center;">
      <a href="${accessLink}" class="button">Review Your Offers</a>
    </div>

    <div class="expiry">
      ⏱️ <strong>This link will expire in 14 days.</strong> Review your offers before they expire.
    </div>

    <p style="font-size: 14px; color: #666;">
      Accept the offers you'd like to receive early payment on. The discounted amount will be paid directly to your bank account.
    </p>

    <p>Best regards,<br><strong>Future Cashflow Team</strong></p>
  </div>
  <div class="footer">
    <p>This is an automated message, please do not reply to this email.</p>
    <p>&copy; 2025 Future Cashflow. All rights reserved.</p>
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
      console.log(`[Email Service] Offer notification email sent successfully to ${recipientEmail}`)
      return true
    } else {
      console.error(`[Email Service] Failed to send offer notification email. Status: ${result.status}`)
      return false
    }
  } catch (error) {
    console.error("[Email Service] Error sending offer notification email:", error)
    return false
  }
}
