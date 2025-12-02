/**
 * Brand constants for Future Cashflow Platform
 * Use these everywhere for consistency
 */

export const BRAND = {
  name: "Future Cashflow",
  tagline: "Platform",
  full: "Future Cashflow Platform",
  company: "Future Cashflow (Pty) Ltd",
  legal: "Future Cashflow (Pty) Ltd is a registered Credit Provider NCRCP18174",
  copyright: `© ${new Date().getFullYear()} Future Cashflow. All Rights Reserved.`,
  email: {
    team: "Future Cashflow Team",
    support: "support@futurecashflow.co.za",
  },
} as const;

export const PORTAL_NAMES = {
  admin: "Admin Dashboard",
  ap: "Accounts Payable",
  supplier: "Supplier Portal",
} as const;
