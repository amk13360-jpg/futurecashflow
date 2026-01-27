/**
 * =================================================================
 * EMAIL TEMPLATE HELPERS - FUTURE CASHFLOW BRANDING
 * =================================================================
 * 
 * These helpers ensure consistent branding across all email templates.
 * Use these functions when building email HTML to maintain brand standards.
 * 
 * USAGE:
 * ─────────────────────────────────────────────────────────────────
 * import { EMAIL_HEADER_HTML, EMAIL_FOOTER_HTML, BRAND_COLORS } from './email-templates';
 * 
 * const html = `
 *   ${EMAIL_HEADER_HTML}
 *   <div class="content">...</div>
 *   ${EMAIL_FOOTER_HTML}
 * `;
 * =================================================================
 */

import { BRAND } from "@/lib/constants/brand";

/**
 * Brand colors for email templates
 * Must use inline styles for email client compatibility
 */
export const BRAND_COLORS = {
  primary: "#2563eb",        // Blue-600
  primaryDark: "#1e40af",    // Blue-700
  danger: "#ef4444",         // Red-500
  success: "#10b981",        // Emerald-500
  warning: "#f59e0b",        // Amber-500
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    500: "#6b7280",
    700: "#374151",
    900: "#111827",
  },
} as const;

/**
 * Standardized email header with logo
 * Uses the blue gradient header with white text logo
 */
export const EMAIL_HEADER_HTML = `
<div style="background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.primaryDark} 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
  <table cellpadding="0" cellspacing="0" border="0" align="center">
    <tr>
      <td style="vertical-align: middle; padding-right: 12px;">
        <svg width="40" height="40" viewBox="0 0 80 80" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
          <path d="M40 8L16 32H26L40 18L54 32H64L40 8Z"/>
          <path d="M40 28L16 52H26L40 38L54 52H64L40 28Z"/>
        </svg>
      </td>
      <td style="vertical-align: middle;">
        <span style="font-size: 24px; font-weight: bold; color: #ffffff; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;">Future</span>
        <span style="display: inline-block; width: 1px; height: 24px; background: #ffffff; margin: 0 10px; vertical-align: middle;"></span>
        <span style="font-size: 24px; font-weight: bold; color: #ffffff; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;">Cashflow</span>
      </td>
    </tr>
  </table>
</div>
`.trim();

/**
 * Alternative text-based header for older email clients
 * Falls back gracefully when SVG is not supported
 */
export const EMAIL_HEADER_TEXT_HTML = `
<div style="background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.primaryDark} 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; font-weight: bold;">
    Future | Cashflow
  </h1>
</div>
`.trim();

/**
 * Standardized email footer with legal text
 * Includes company name and NCRCP registration
 */
export const EMAIL_FOOTER_HTML = `
<div style="background: ${BRAND_COLORS.gray[50]}; padding: 20px; text-align: center; font-size: 12px; color: ${BRAND_COLORS.gray[500]}; border-radius: 0 0 8px 8px; border: 1px solid ${BRAND_COLORS.gray[200]}; border-top: none; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;">
  <p style="margin: 0 0 8px 0;">This is an automated message, please do not reply to this email.</p>
  <p style="margin: 0;">${BRAND.footerText}</p>
</div>
`.trim();

/**
 * Common email styles to include in <head>
 * For email clients that support <style> tags
 */
export const EMAIL_COMMON_STYLES = `
<style>
  body {
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: ${BRAND_COLORS.gray[700]};
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background: ${BRAND_COLORS.gray[100]};
  }
  .content {
    background: #ffffff;
    padding: 30px;
    border: 1px solid ${BRAND_COLORS.gray[200]};
    border-top: none;
  }
  .otp-box {
    background: ${BRAND_COLORS.gray[100]};
    border: 2px dashed ${BRAND_COLORS.primary};
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    margin: 20px 0;
  }
  .otp-code {
    font-size: 32px;
    font-weight: bold;
    color: ${BRAND_COLORS.primary};
    letter-spacing: 8px;
    font-family: 'Courier New', monospace;
  }
  .expiry {
    color: ${BRAND_COLORS.danger};
    font-weight: bold;
    margin-top: 10px;
  }
  .warning {
    background: #fef2f2;
    border-left: 4px solid ${BRAND_COLORS.danger};
    padding: 15px;
    margin: 20px 0;
    border-radius: 4px;
  }
  .success-box {
    background: #ecfdf5;
    border-left: 4px solid ${BRAND_COLORS.success};
    padding: 15px;
    margin: 20px 0;
    border-radius: 4px;
  }
  .info-box {
    background: #eff6ff;
    border-left: 4px solid ${BRAND_COLORS.primary};
    padding: 15px;
    margin: 20px 0;
    border-radius: 4px;
  }
  .btn {
    display: inline-block;
    background: ${BRAND_COLORS.primary};
    color: #ffffff;
    padding: 12px 24px;
    text-decoration: none;
    border-radius: 6px;
    font-weight: bold;
    margin: 10px 0;
  }
  .btn:hover {
    background: ${BRAND_COLORS.primaryDark};
  }
  table.details {
    width: 100%;
    border-collapse: collapse;
    margin: 15px 0;
  }
  table.details td {
    padding: 8px;
    border-bottom: 1px solid ${BRAND_COLORS.gray[200]};
  }
  table.details td:first-child {
    font-weight: bold;
    width: 40%;
    color: ${BRAND_COLORS.gray[500]};
  }
</style>
`.trim();

/**
 * Build a complete email HTML document
 * @param content - The main content HTML to go between header and footer
 * @returns Complete HTML document string
 */
export function buildEmailHtml(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${EMAIL_COMMON_STYLES}
</head>
<body>
  ${EMAIL_HEADER_HTML}
  <div class="content">
    ${content}
    <p style="margin-top: 20px;">Best regards,<br><strong>${BRAND.email.team}</strong></p>
  </div>
  ${EMAIL_FOOTER_HTML}
</body>
</html>
  `.trim();
}

/**
 * Build email signature section
 */
export function getEmailSignatureHtml(): string {
  return `<p style="margin-top: 20px;">Best regards,<br><strong>${BRAND.email.team}</strong></p>`;
}
