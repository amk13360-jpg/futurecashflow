/**
 * =================================================================
 * BRAND CONSTANTS - FUTURE CASHFLOW / FUTURE MINING FINANCE
 * =================================================================
 * 
 * OFFICIAL NAMES:
 * ─────────────────────────────────────────────────────────────────
 * - Trading Name: "Future Cashflow" (used in UI, marketing)
 * - Legal Entity: "Future Mining Finance (Pty) Ltd" (used in footer, legal)
 * - Credit Provider: "NCRCP18174"
 * 
 * USE CONSISTENTLY EVERYWHERE - DO NOT CREATE LOCAL VARIANTS
 * =================================================================
 */

export const BRAND = {
  // Display name (for headers, UI elements)
  name: "Future Cashflow",
  
  // Platform references
  tagline: "Platform",
  full: "Future Cashflow Platform",
  
  // Legal entity name (for footer, legal documents)
  company: "Future Mining Finance (Pty) Ltd",
  
  // Credit provider registration
  ncrcp: "NCRCP18174",
  
  // Full legal footer text
  legal: "Registered Credit Provider NCRCP18174",
  
  // Copyright notice (use in footer)
  copyright: `© ${new Date().getFullYear()} Future Mining Finance (Pty) Ltd`,
  
  // Full footer text
  footerText: `© ${new Date().getFullYear()} Future Mining Finance (Pty) Ltd · Registered Credit Provider NCRCP18174`,
  
  // Email configuration
  email: {
    team: "Future Cashflow Team",
    support: "support@futurecashflow.co.za",
    noreply: "noreply@futurecashflow.co.za",
  },
  
  // Brand colors (keep in sync with logo.tsx)
  colors: {
    primary: "#2563eb",        // Blue-600
    primaryLight: "#3b82f6",   // Blue-500
    primaryDark: "#1d4ed8",    // Blue-700
  },
} as const;

export const PORTAL_NAMES = {
  admin: "Admin Dashboard",
  ap: "Accounts Payable",
  supplier: "Supplier Portal",
} as const;
