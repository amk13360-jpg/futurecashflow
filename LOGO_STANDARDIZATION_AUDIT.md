# Future Cashflow Logo Standardization Audit Report

**Date:** 2026-02-01  
**Prepared by:** Development Team  
**Platform:** Future Cashflow SCF Platform

---

## 1. Executive Summary

This audit documents the finalized logo system and enforces consistent usage across landing/login, navigation, email, and shared components. The primary issues addressed were:

- **Duplicate logo implementations** (inline SVG vs shared component)
- **Company name inconsistency** (Trading vs Legal entity)
- **Incorrect variant usage** (landing/login vs nav)
- **Theme mismatch on adaptive logos** (icon/divider and wordmark not aligned)

---

## 2. Official Brand Identity

### Company Names

| Usage Context | Name |
|---------------|------|
| **Trading/Display Name** | Future Cashflow |
| **Legal Entity** | Future Mining Finance (Pty) Ltd |
| **Credit Provider** | NCRCP18174 |

### Primary Logo

The official logo consists of:
- **Icon:** Double chevron (upward arrows) symbolizing growth and progress
- **Text:** "Future | Cashflow" with vertical divider
- **Primary Color:** Brand blue (`#2563eb` / `--brand-blue`)

### Official Variants (FINAL)

| Variant | Background | Icon + Divider | Wordmark | Usage |
|---------|------------|----------------|----------|-------|
| **blue** | Light/White | Blue | Blue | Landing + Login screens (fixed blue, no theme change) |
| **adaptive** | Light/White | Blue | Future = black, Cashflow = black | Navigation on light theme |
| **adaptive** | Dark | Blue | Future = white, Cashflow = white | Navigation on dark theme |
| **dark** | Dark/Colored | White | White | Explicit dark usage only |
| **light** | Light/White | Dark | Dark | Explicit light usage only |

---

## 3. Logo Sizing Standards

### Size Presets (defined in `components/ui/logo.tsx`)

| Size | Icon | Text | Divider | Gap | Min Height | Use Case |
|------|------|------|---------|-----|------------|----------|
| **xs** | 24px (h-6 w-6) | 14px (text-sm) | 16px | 8px | 24px | Compact/inline |
| **sm** | 32px (h-8 w-8) | 18px (text-lg) | 20px | 8px | 32px | Footer |
| **md** | 40px (h-10 w-10) | 20px (text-xl) | 24px | 12px | 40px | Dashboard headers |
| **lg** | 48px (h-12 w-12) | 24px (text-2xl) | 32px | 12px | 48px | Email headers |
| **xl** | 56px (h-14 w-14) | 30px (text-3xl) | 40px | 16px | 56px | Login screens |

### Spacing Rules

- **Minimum clear space:** 16px (1rem) around logo
- **Icon-to-text gap:** Defined by size preset (8-16px)
- **Divider padding:** 4px each side

---

## 4. Usage by Screen/Context

### ? Correct Usage (Final)

| Screen | Component | Size | Variant |
|--------|-----------|------|---------|
| Landing Page | `<Logo size="xl" variant="blue" />` | xl | blue |
| Admin Login | `<Logo size="lg" variant="blue" />` | lg | blue |
| AP Login | `<Logo size="lg" variant="blue" />` | lg | blue |
| AP Change Password | `<Logo size="lg" variant="blue" />` | lg | blue |
| Supplier Access | `<Logo size="lg" variant="blue" />` | lg | blue |
| Admin Dashboard Header | `<Logo size="sm" variant="adaptive" />` | sm | adaptive |
| Supplier Dashboard Header | `<Logo size="sm" variant="adaptive" />` | sm | adaptive |
| Email Templates | `getEmailLogoHtml` | lg | light/dark |
| Footer (all pages) | `FooterLogo` or `BRAND.footerText` | sm | adaptive |

---

## 5. Violations Found & Fixes Applied

### ? Violation 1: Duplicate Inline Logo in Landing Page

**Location:** `app/page.tsx`  
**Issue:** Inline SVG logo definition duplicated instead of using shared component  
**Impact:** Inconsistent rendering, maintenance burden

**Before:**
```tsx
export const LogoIcon = ({ className = "w-12 h-12" }) => (
  <div className="relative">
    <svg aria-hidden="true" className={className} fill="currentColor" viewBox="0 0 80 80">
      ...
    </svg>
  </div>
)
```

**After:**
```tsx
import { Logo } from "@/components/ui/logo"
// Usage: <Logo size="xl" variant="blue" />
```

**Status:** ? FIXED

---

### ? Violation 2: Company Name Inconsistency

**Locations:**
- `lib/constants/brand.ts`
- Page footers

**Resolution:**
- Legal entity: **Future Mining Finance (Pty) Ltd**
- Trading name: **Future Cashflow**

**Status:** ? FIXED

---

### ? Violation 3: Email Template Using Text Emoji

**Location:** `lib/services/email.ts`  
**Issue:** Email headers used emoji text instead of logo

**Status:** ?? TEMPLATE HELPER CREATED - Migration still needed

---

### ? Violation 4: Variant Misuse Across Screens

**Issue:** Landing/login and nav used the same colors or wrong variants.

**Resolution:**
- Landing/login are locked to `variant="blue"`.
- Nav is locked to `variant="adaptive"`.

**Status:** ? FIXED

---

### ?? Issue 5: Unused Placeholder Logo Files

**Location:** `public/placeholder-logo.svg`, `public/placeholder-logo.png`  
**Issue:** Files exist but are not used

**Status:** ?? PENDING REVIEW

---

## 6. Component API Reference

### LogoIcon Component

```tsx
import { LogoIcon } from "@/components/ui/logo"

<LogoIcon 
  className="h-10 w-10"
  variant="adaptive" // adaptive | blue | dark | light
/>
```

### Logo Component (Full)

```tsx
import { Logo } from "@/components/ui/logo"

<Logo 
  size="md"           // xs | sm | md | lg | xl
  variant="adaptive" // adaptive | blue | dark | light
  showText={true}
  className=""
  iconClassName=""
/>
```

### FooterLogo Component

```tsx
import { FooterLogo } from "@/components/ui/logo"

<FooterLogo 
  variant="adaptive"
  showLegal={true}
/>
```

### Email Logo Helper

```tsx
import { getEmailLogoHtml } from "@/components/ui/logo"

const html = getEmailLogoHtml("light")
```

---

## 7. Files Modified

| File | Change |
|------|--------|
| `components/ui/logo.tsx` | Finalized variants, adaptive rules, blue lock, email helper |
| `app/page.tsx` | Uses `Logo` variant blue |
| `app/login/**` | Uses `Logo` variant blue |
| `components/admin/dashboard-header.tsx` | Uses `Logo` variant adaptive |
| `components/supplier/supplier-header.tsx` | Uses `Logo` variant adaptive |
| `LOGO_INSTRUCTIONS.md` | Source of truth instructions |

---

## 8. Recommendations

### Immediate Actions
1. ? Use `<Logo>` component everywhere.
2. ? Use `variant="blue"` for landing/login only.
3. ? Use `variant="adaptive"` for nav only.
4. ?? Migrate email templates to `getEmailLogoHtml`.

### Future Improvements
1. Export official logo as PNG/SVG for external use
2. Consider adding animated logo variant for loading states
3. Create design tokens file for Figma/design tool sync
4. Add logo to favicon and PWA manifest

---

## 9. Brand Color Reference

| Name | Hex | Token | Usage |
|------|-----|-------|-------|
| **Brand Blue** | #2563eb | `--brand-blue` | Logo, dividers, icon |
| **Dark Text** | #000000 | n/a | "Future" / "Cashflow" on white (nav) |
| **White** | #ffffff | n/a | Wordmark on dark (nav) |

---

## 10. Compliance Checklist

- [x] Single source of truth for logo (`components/ui/logo.tsx`)
- [x] Landing/login locked to blue variant
- [x] Nav locked to adaptive variant
- [x] Adaptive wordmark black on light, white on dark
- [x] Icon/divider always brand blue in nav
- [ ] Email service fully migrated to new helpers
- [ ] Placeholder files removed/replaced

---

**End of Audit Report**
