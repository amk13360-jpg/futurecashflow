"use client"

import { cn } from "@/lib/utils"

/**
 * =================================================================
 * FUTURE CASHFLOW LOGO SYSTEM - BRAND GUIDELINES
 * =================================================================
 * 
 * OFFICIAL LOGO VARIANTS:
 * ─────────────────────────────────────────────────────────────────
 * 1. Primary (Blue on Light) - Default for light backgrounds
 * 2. White Logo - For dark/colored backgrounds  
 * 3. Dark Logo - For special high-contrast needs
 * 
 * LOGO SIZING STANDARDS:
 * ─────────────────────────────────────────────────────────────────
 * | Context        | Size  | Icon    | Text      | Min Height |
 * |----------------|-------|---------|-----------|------------|
 * | Login screens  | xl    | 56x56px | 30px      | 56px       |
 * | Dashboard hdr  | md    | 40x40px | 20px      | 40px       |
 * | Footer         | sm    | 32x32px | 18px      | 32px       |
 * | Email headers  | lg    | 48x48px | 24px      | 48px       |
 * 
 * SPACING RULES:
 * ─────────────────────────────────────────────────────────────────
 * - Minimum clear space around logo: 16px (1rem)
 * - Gap between icon and text: 12px (0.75rem)
 * - Divider padding: 4px each side
 * 
 * USAGE RULES:
 * ─────────────────────────────────────────────────────────────────
 * ✅ Always use the Logo component - never recreate inline
 * ✅ Use variant="light" on dark backgrounds
 * ✅ Use variant="dark" or default on light backgrounds
 * ❌ Never stretch, crop, or distort the logo
 * ❌ Never change the brand colors
 * ❌ Never place logo on low-contrast backgrounds
 * 
 * COMPANY NAME (Footer):
 * ─────────────────────────────────────────────────────────────────
 * Legal: "Future Mining Finance (Pty) Ltd"
 * Credit Provider: "Registered Credit Provider NCRCP18174"
 * 
 * =================================================================
 */

// Brand color constants
const BRAND_COLORS = {
  primary: "text-blue-600",
  primaryBg: "bg-blue-600",
  light: "text-white",
  lightBg: "bg-white",
  dark: "text-gray-900",
  muted: "text-gray-400",
} as const

type LogoVariant = "default" | "light" | "dark"

interface LogoIconProps {
  className?: string
  variant?: LogoVariant
}

/**
 * Future Cashflow Logo Icon (Chevron Mark)
 * ─────────────────────────────────────────
 * The iconic double-chevron representing upward momentum and growth.
 * Use as standalone icon or paired with text in the Logo component.
 */
export function LogoIcon({ 
  className = "h-10 w-10", 
  variant = "default" 
}: LogoIconProps) {
  const colorClass = variant === "light" 
    ? BRAND_COLORS.light 
    : variant === "dark" 
      ? BRAND_COLORS.dark 
      : BRAND_COLORS.primary

  return (
    <svg 
      aria-hidden="true" 
      className={cn("shrink-0", colorClass, className)} 
      fill="currentColor" 
      viewBox="0 0 80 80"
      role="img"
      aria-label="Future Cashflow Logo"
    >
      <path d="M40 8L16 32H26L40 18L54 32H64L40 8Z" />
      <path d="M40 28L16 52H26L40 38L54 52H64L40 28Z" />
    </svg>
  )
}

interface LogoProps {
  className?: string
  iconClassName?: string
  showText?: boolean
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  variant?: LogoVariant
}

/**
 * Size configuration for logo components
 * Ensures consistent sizing across all usage contexts
 */
const sizeClasses = {
  xs: { 
    icon: "h-6 w-6",      // 24px - Compact/inline use
    text: "text-sm",       // 14px
    divider: "h-4",        // 16px
    gap: "gap-2"           // 8px
  },
  sm: { 
    icon: "h-8 w-8",      // 32px - Footer
    text: "text-lg",       // 18px
    divider: "h-5",        // 20px
    gap: "gap-2"           // 8px
  },
  md: { 
    icon: "h-10 w-10",    // 40px - Dashboard headers
    text: "text-xl",       // 20px
    divider: "h-6",        // 24px
    gap: "gap-3"           // 12px
  },
  lg: { 
    icon: "h-12 w-12",    // 48px - Email headers
    text: "text-2xl",      // 24px
    divider: "h-8",        // 32px
    gap: "gap-3"           // 12px
  },
  xl: { 
    icon: "h-14 w-14",    // 56px - Login screens
    text: "text-3xl",      // 30px
    divider: "h-10",       // 40px
    gap: "gap-4"           // 16px
  },
}

/**
 * Full Logo with Icon and Text
 * ─────────────────────────────
 * The complete Future | Cashflow logo with the chevron icon,
 * brand name text, and vertical divider.
 * 
 * @param size - Logo size preset (xs, sm, md, lg, xl)
 * @param variant - Color variant (default, light, dark)
 * @param showText - Whether to show text (false = icon only)
 */
export function Logo({ 
  className, 
  iconClassName, 
  showText = true, 
  size = "md",
  variant = "default"
}: LogoProps) {
  const sizes = sizeClasses[size]
  
  const textColorClass = variant === "light" 
    ? BRAND_COLORS.light 
    : variant === "dark" 
      ? BRAND_COLORS.dark 
      : BRAND_COLORS.primary

  const dividerColorClass = variant === "light"
    ? BRAND_COLORS.lightBg
    : variant === "dark"
      ? "bg-gray-900"
      : BRAND_COLORS.primaryBg

  return (
    <div className={cn("flex items-center", sizes.gap, className)}>
      <LogoIcon 
        className={cn(sizes.icon, iconClassName)} 
        variant={variant}
      />
      {showText && (
        <>
          <span className={cn(sizes.text, "font-bold", textColorClass)}>
            Future
          </span>
          <div className={cn("w-px", sizes.divider, dividerColorClass)} />
          <span className={cn(sizes.text, "font-bold", textColorClass)}>
            Cashflow
          </span>
        </>
      )}
    </div>
  )
}

/**
 * Footer Logo Component
 * ─────────────────────
 * Specialized footer logo with company legal name.
 * Use at the bottom of pages for consistent branding.
 */
interface FooterLogoProps {
  className?: string
  showLegal?: boolean
  variant?: LogoVariant
}

export function FooterLogo({ 
  className, 
  showLegal = true,
  variant = "default" 
}: FooterLogoProps) {
  const textColorClass = variant === "light" 
    ? "text-gray-300" 
    : "text-muted-foreground"

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <Logo size="sm" variant={variant} />
      {showLegal && (
        <p className={cn("text-xs text-center", textColorClass)}>
          © {new Date().getFullYear()} Future Mining Finance (Pty) Ltd · Registered Credit Provider NCRCP18174
        </p>
      )}
    </div>
  )
}

/**
 * Email Logo Component (HTML string for email templates)
 * ──────────────────────────────────────────────────────
 * Returns HTML string for use in email templates.
 * Includes inline styles for email client compatibility.
 */
export function getEmailLogoHtml(variant: "light" | "dark" = "dark"): string {
  const bgColor = variant === "light" ? "#1e40af" : "#ffffff"
  const textColor = variant === "light" ? "#ffffff" : "#2563eb"
  const borderColor = variant === "light" ? "#ffffff" : "#2563eb"
  
  return `
    <div style="text-align: center; padding: 20px;">
      <table cellpadding="0" cellspacing="0" border="0" align="center">
        <tr>
          <td style="vertical-align: middle; padding-right: 12px;">
            <svg width="48" height="48" viewBox="0 0 80 80" fill="${textColor}">
              <path d="M40 8L16 32H26L40 18L54 32H64L40 8Z"/>
              <path d="M40 28L16 52H26L40 38L54 52H64L40 28Z"/>
            </svg>
          </td>
          <td style="vertical-align: middle; padding-right: 8px;">
            <span style="font-size: 24px; font-weight: bold; color: ${textColor}; font-family: system-ui, -apple-system, sans-serif;">Future</span>
          </td>
          <td style="vertical-align: middle; padding: 0 8px;">
            <div style="width: 1px; height: 32px; background-color: ${borderColor};"></div>
          </td>
          <td style="vertical-align: middle; padding-left: 8px;">
            <span style="font-size: 24px; font-weight: bold; color: ${textColor}; font-family: system-ui, -apple-system, sans-serif;">Cashflow</span>
          </td>
        </tr>
      </table>
    </div>
  `.trim()
}

/**
 * Email Footer HTML (for email templates)
 */
export function getEmailFooterHtml(): string {
  return `
    <div style="background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
      <p style="margin: 0 0 8px 0;">This is an automated message, please do not reply to this email.</p>
      <p style="margin: 0;">© ${new Date().getFullYear()} Future Mining Finance (Pty) Ltd · Registered Credit Provider NCRCP18174</p>
    </div>
  `.trim()
}
