# `DashboardHeader` Component

**File:** `components/admin/dashboard-header.tsx`  
**Type:** Client Component (`"use client"`)  
**Used by:** Admin layout, Supplier layout, AP layout

---

## Overview

The `DashboardHeader` is the top navigation bar rendered on every authenticated portal page. It is role-aware — its navigation links, breadcrumb labels, home URL, and profile role text all adapt automatically based on the session role fetched from `/api/session`.

---

## Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `userName` | `string` | No | Override the display name shown in the profile button. Falls back to session `fullName`, then `username`, then `"Admin User"`. |

---

## Features

### 1. Brand Anchor (Left)
- Renders `<Logo size="md" variant="adaptive" showText={true} />` — theme-aware (blue icon, black/white wordmark).
- Wrapped in an `<a>` pointing to the role-appropriate home URL:

| Role | Home URL |
|---|---|
| `admin` | `/admin` |
| `accounts_payable` | `/ap/dashboard` |
| `supplier` | `/supplier/dashboard` |

### 2. Page Context Label (Left, hidden on mobile)
- Shows a two-line label: `{pageContextSection}` (muted, xs) above `{pageTitle}` (medium weight, sm).
- Hidden for `accounts_payable` role — AP portal does not show this label.

### 3. Primary Navigation Links (Center, lg screens only)
Role-specific quick-nav links rendered as styled `<Link>` elements with active-state highlighting (`bg-accent`):

| Role | Links |
|---|---|
| `admin` | Dashboard · Buyers · Offer Batches |
| `supplier` | Dashboard · Offers · Cession Agreement |
| `accounts_payable` | *(none — nav hidden for AP)* |

### 4. Breadcrumb (Center, md screens only)
Inline `<nav aria-label="Breadcrumb">` showing `{pageContextSection} > {pageTitle}`.  
Currently static — `pageTitle` is hardcoded to `'Dashboard'` and should be updated to accept a dynamic title prop for non-dashboard pages.

### 5. Notifications Bell (Right)
- Shows an unread count badge (`bg-error`, white text) when unread notifications exist.
- Clicking opens a dropdown panel listing up to 3 notification items with title, subtitle, time, and read/unread styling.
- **Note:** Notifications are currently hardcoded mock data. Real data integration is pending.

### 6. Profile Dropdown (Right)
- Avatar circle showing 2-letter initials derived from the display name.
- Shows `{displayName}` label on `sm+` screens.
- Dropdown contains:
  - Avatar + name + role label header panel
  - **Profile** button (currently no-op)
  - **Settings** button (currently no-op)
  - **Sign out** button → calls `POST /api/auth/logout`, then redirects to `/`

---

## Session Fetching

On mount, the component calls `GET /api/session` to resolve:
- `data.role` → drives all role-conditional rendering
- `data.fullName` / `data.username` → drives `sessionName`

The fetch is guarded with a `mounted` flag to prevent state updates after unmount.

---

## Initials Calculation

```ts
const parts = displayName.trim().split(/\s+/)
// Single word → first 2 chars:  "Lucas" → "LU"
// Multi word  → first + last:   "Swelihle Lucas" → "SL"
```

---

## Styling Notes

| Element | Key Classes |
|---|---|
| Header bar | `sticky top-0 z-50 bg-card/95 backdrop-blur-sm shadow-sm border-b` |
| Max-width container | `max-w-7xl px-4 sm:px-6 h-16` |
| Nav links (active) | `font-medium text-foreground bg-accent` |
| Nav links (inactive) | `text-muted-foreground hover:text-foreground` |
| Bell / icon buttons | `w-10 h-10 border rounded-lg hover:border-primary` |
| Profile button | `border rounded-lg hover:border-primary px-2 py-1.5` |
| Sign out | `text-error hover:bg-error/[0.08]` |

---

## Known Gaps

| ID | Issue | Priority |
|---|---|---|
| FLOAT-01–03 | Floating username text — verify `displayName` span is inside a `flex items-center` parent on all three portals | HIGH |
| — | `pageTitle` is hardcoded `'Dashboard'` — does not reflect non-dashboard pages | MEDIUM |
| — | Notifications are hardcoded mock data — real API integration missing | MEDIUM |
| — | Profile and Settings buttons have no `href` or action | LOW |
| HELP-02 | No keyboard shortcuts (Esc to close dropdowns is the only implicit one) | LOW |

---

## Usage

```tsx
// In admin layout
import { DashboardHeader } from "@/components/admin/dashboard-header"

// Without prop — resolves name from session
<DashboardHeader />

// With prop override
<DashboardHeader userName="Swelihle Lucas" />
```

---

*Last updated: March 3, 2026 — Future Mining Finance (Pty) Ltd*
