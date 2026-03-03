# UI Alignment & Visual Polish Checklist

**Platform:** Future Mining Finance (Pty) Ltd — SCF Platform  
**Scope:** All floating / alignment / visual layout issues excluded from functional QA  
**Date:** 2026

---

> These items were explicitly excluded from the QA audit. None block core functionality. All are visual polish and quality-of-life improvements to be addressed in a dedicated UI sprint.

---

## SECTION 1 — Header & Navigation Floating Issues

- [ ] **FLOAT-01 · Floating username in admin header**  
  The global CSS `a { min-height: 44px }` rule forces anchor elements to 44px tall, making the username text appear to float above the vertical midline inside the topbar. Verify fix is applied in `app/admin/layout.tsx` header region.

- [ ] **FLOAT-02 · Floating username in supplier header**  
  Same 44px anchor height issue causes the logged-in supplier's name to appear detached from its surrounding row. Verify `app/supplier/layout.tsx` header is using a flex-center container.

- [ ] **FLOAT-03 · Floating username in AP portal header**  
  Same issue in AP layout. Verify `app/ap/layout.tsx` header renders username at vertical midline, not floating above it.

- [ ] **FLOAT-04 · Floating breadcrumb text**  
  Breadcrumb `<li>`, `<a>`, and `<span>` elements are not flex-centered, causing the label text and the separator chevron to sit on different visual baselines. Global fix exists in `app/globals.css` — verify it is applied and visible on all 18+ detail pages that use `<Breadcrumbs />`.

- [ ] **FLOAT-05 · Breadcrumb separator chevron misalignment**  
  The `>` / chevron separator icon inside breadcrumbs does not share the same horizontal midline as the text labels. Requires `display: flex; align-items: center` on all breadcrumb list items.

- [ ] **FLOAT-06 · Sidebar nav link vertical drift (admin)**  
  Some sidebar nav items in `app/admin/layout.tsx` may render icon + label pairs with the icon sitting slightly above the text baseline. Verify all 12+ nav links are flex-centered.

- [ ] **FLOAT-07 · Sidebar nav link vertical drift (supplier)**  
  Verify supplier sidebar nav links (`app/supplier/layout.tsx`) — icon and label must sit on the same vertical midline.

- [ ] **FLOAT-08 · Sidebar nav link vertical drift (AP portal)**  
  Verify AP sidebar nav links (`app/ap/layout.tsx`) — same icon-label alignment check.

---

## SECTION 2 — Badge & Inline Element Alignment

- [ ] **BADGE-01 · Status badge vertical drift in tables**  
  Badges placed next to text inside `<td>` elements (non-flex context) drift 2–4px upward from the text midline. Global fix `vertical-align: middle` exists in `app/globals.css` — verify all table status columns across admin/supplier/AP list pages show badges level with their row text.

- [ ] **BADGE-02 · Inline status badges in card headings**  
  Supplier status, application status, and offer status badges placed inside card `<h3>` / `<p>` headings must align with text characters. Check all detail page cards: `app/admin/suppliers/[id]`, `app/admin/applications/[supplierId]`, `app/admin/buyers/[id]`.

- [ ] **BADGE-03 · Mine cession status badge alignment (application detail)**  
  The read-only mine cession status badge (recently changed from a toggle) in `app/admin/applications/[supplierId]/client.tsx` — confirm it aligns flush with the surrounding label text.

- [ ] **BADGE-04 · Require-cession-approval indicator badge (buyers table)**  
  New shield icon indicator added to buyers list — verify it renders at the same vertical midline as the buyer name text in the table row.

- [ ] **BADGE-05 · Offer status badge alignment in supplier offers list**  
  Status pills (Pending / Accepted / Expired) in `app/supplier/offers/page.tsx` — verify alignment in all row states.

---

## SECTION 3 — Card & Typography Visual Issues

- [ ] **CARD-01 · Card title line-height clipping**  
  Any `CardTitle` or heading using `leading-none` (line-height: 1.0) will clip ascenders and descenders on fonts like Inter. Global safe line-height fix exists in `app/globals.css` — verify no card titles on any page appear clipped or visually cut off at top/bottom.

- [ ] **CARD-02 · Inconsistent heading scale across pages**  
  Page titles, section headings, and body text do not follow a consistent typographic scale (H1 → H2 → body). Audit visual weight on: admin dashboard, supplier dashboard, AP dashboard, buyer detail page, supplier detail page.

- [ ] **CARD-03 · Dashboard card content density too low**  
  Admin and AP dashboard cards use large padding with small content — too much whitespace. Cards were identified in `UI_UX_COMPREHENSIVE_AUDIT_2026.md` (M-02) as needing optimized content-to-card-size ratio.

- [ ] **CARD-04 · Icon + label pairs in card headers not centered**  
  Several card headers use an icon beside a title without `flex items-center`, causing the icon to sit high relative to the text. Check all pages with icon-prefixed card headers.

---

## SECTION 4 — Container & Layout Width Consistency

- [ ] **LAYOUT-01 · Inconsistent container max-widths**  
  Some pages may still use `max-w-4xl`, `max-w-5xl`, or inconsistent widths instead of the standardized `max-w-7xl` (1280px). Audit every admin, supplier, and AP page for container width consistency.

- [ ] **LAYOUT-02 · Full-width vs constrained layout mismatch**  
  Certain forms and detail pages break out of the standard container and go edge-to-edge while sibling pages do not. Check buyer wizard (`app/admin/buyers/page.tsx`), supplier detail, and invoice upload pages.

- [ ] **LAYOUT-03 · Page header section alignment**  
  The title + action button row at the top of list pages (e.g., "Invoices | + New Invoice") should have consistent spacing and vertical alignment. Audit all 10+ admin list pages and compare.

---

## SECTION 5 — Mobile & Responsive Layout

- [ ] **MOBILE-01 · Table horizontal overflow on mobile**  
  Wide data tables (invoices, suppliers, offer batches, payments) overflow horizontally on screens < 768px. Audit identified in `UI_UX_COMPREHENSIVE_AUDIT_2026.md` (M-03). Card-based mobile fallback view is the recommended solution.

- [ ] **MOBILE-02 · Admin buyer wizard steps not tested on mobile**  
  The 4-step buyer wizard in `app/admin/buyers/page.tsx` uses a multi-column step layout. Verify step indicators and form fields reflow correctly on small screens.

- [ ] **MOBILE-03 · Bank change request date picker on mobile**  
  The new effective date `<input type="date">` fields in `app/admin/bank-changes/page.tsx` — verify touch input and layout on mobile viewport.

---

## SECTION 6 — Loading & Transition Polish

- [ ] **LOAD-01 · Missing skeleton loaders (specific pages)**  
  Verify skeleton loaders (not blank page flash) are present on initial load for:  
  - `app/admin/invoices/page.tsx`  
  - `app/admin/offer-batches/page.tsx`  
  - `app/admin/payments/page.tsx`  
  - `app/supplier/invoices/page.tsx`  
  - `app/supplier/offers/page.tsx`

- [ ] **LOAD-02 · Micro-interactions absent on interactive elements**  
  Buttons, cards, and table rows should have subtle hover/press transitions. `UI_UX_COMPREHENSIVE_AUDIT_2026.md` (L-01) identified this as making the app feel static. Verify `transition-all duration-200` or equivalent is present on all interactive elements.

- [ ] **LOAD-03 · No page-level loading state on navigation**  
  When navigating between admin sections (e.g., Invoices → Offers), there is no top progress bar or page-level loading indicator. Users see a blank white flash until the server component resolves.

---

## SECTION 7 — Empty States

- [ ] **EMPTY-01 · Verify all empty state components replaced**  
  `UI_UX_COMPREHENSIVE_AUDIT_2026.md` (M-05) identified generic "No data" messages across all list pages. Verify the `empty-state.tsx` component with CTAs and guidance text is used on every table. Pages to check:  
  - `app/admin/documents/page.tsx`  
  - `app/admin/reports/page.tsx`  
  - `app/supplier/reports/page.tsx`  
  - `app/ap/reports/page.tsx`

---

## SECTION 8 — Success & Celebration States

- [ ] **SUCCESS-01 · Success celebrations only show toast — no animation**  
  `UI_UX_COMPREHENSIVE_AUDIT_2026.md` (L-02) / CLIENT_ISSUES_RESOLUTION_REPORT (UXL-02) marked as **PARTIALLY ADDRESSED**. Key milestone actions (first invoice accepted, cession agreement signed, first payment released) show a toast only. A confetti animation or visual celebration component was planned but not fully implemented.

- [ ] **SUCCESS-02 · Cession agreement signing success screen**  
  After a supplier signs the cession agreement in `app/supplier/cession-agreement/page.tsx`, the success state is a static message. Consider a stronger success screen with animation and a clear next-step CTA.

---

## SECTION 9 — Contextual Help & Discoverability

- [ ] **HELP-01 · No tooltips on complex or financial fields**  
  `CLIENT_ISSUES_RESOLUTION_REPORT` (UXL-03) — **OUTSTANDING**.  
  Fields lacking contextual tooltips include:  
  - Discount rate / advance rate on offer batches  
  - Payment capture type / value on buyer settings  
  - Require cession approval toggle on buyer wizard  
  - Bank change effective date field

- [ ] **HELP-02 · No keyboard shortcuts for power users**  
  `CLIENT_ISSUES_RESOLUTION_REPORT` (UXL-04) — **OUTSTANDING**.  
  Common shortcuts not implemented:  
  - `Cmd/Ctrl + K` — global search  
  - `Cmd/Ctrl + S` — save form  
  - `Esc` — close dialogs / cancel edits  
  - Arrow keys — navigate table rows

---

## SECTION 10 — Logo & Branding Visual Consistency

- [ ] **LOGO-01 · Email template header still uses text/emoji placeholder**  
  `LOGO_STANDARDIZATION_AUDIT.md` (Violation 3) — **PARTIALLY FIXED**.  
  `lib/services/email.ts` — email headers use text content, not the proper `getEmailLogoHtml()` helper that was created. Migrate all 4 email functions (OTP, supplier welcome, offer notification, AP welcome) to use the HTML logo helper for consistent branded headers.

- [ ] **LOGO-02 · `lib/services/email-templates.ts` dead code with stale branding**  
  `CLIENT_ISSUES_RESOLUTION_REPORT` (CQ-04) — dead file contains hardcoded "Future Cashflow" in HTML headers. Not imported anywhere so zero runtime impact, but confusing and should be deleted. Safe to remove in cleanup sprint.

- [ ] **LOGO-03 · `styles/globals.css` OKLCH token system — import not confirmed**  
  `FINDINGS_REPORT.md` notes `styles/globals.css` defines a separate OKLCH token system but is "not yet confirmed as imported". Verify whether it is actually in the build chain or orphaned. If orphaned, either import it or delete it to eliminate dual CSS token systems.

- [ ] **LOGO-04 · Footer logo / legal text visual consistency**  
  Verify all page footers (admin, supplier, AP) use `FooterLogo` component or `BRAND.footerText` constant, not hardcoded strings. Copyright year should show `© 2026 Future Mining Finance (Pty) Ltd`.

---

## SECTION 11 — Minor Visual Inconsistencies (Low Priority)

- [ ] **MINOR-01 · Dark mode logo variant on supplier/admin nav**  
  `LOGO_STANDARDIZATION_AUDIT.md` specifies `variant="adaptive"` for nav headers. Verify on dark theme that the wordmark correctly shows white text (`Future = white, Cashflow = white`) with the blue icon.

- [ ] **MINOR-02 · Theme toggle placement inconsistency**  
  Theme toggle appears in different positions across portals. Review `app/admin/layout.tsx`, `app/supplier/layout.tsx`, `app/ap/layout.tsx` for consistent placement.

- [ ] **MINOR-03 · Focus ring visibility**  
  Verify `focus-visible:ring` styles are visible and consistent on all interactive elements (buttons, inputs, links) for keyboard navigation. Relevant for WCAG 2.1 AA compliance check.

---

## Summary by Priority

| Priority | Items | IDs |
|---|---|---|
| **HIGH** (visible on every page) | 8 | FLOAT-01 to FLOAT-04, BADGE-01, CARD-01, LOAD-01, LAYOUT-01 |
| **MEDIUM** (visible in specific contexts) | 14 | FLOAT-05 to FLOAT-08, BADGE-02 to BADGE-05, CARD-02 to CARD-04, LAYOUT-02, LAYOUT-03, MOBILE-01, MOBILE-02 |
| **LOW** (polish / roadmap) | 13 | MOBILE-03, LOAD-02, LOAD-03, EMPTY-01, SUCCESS-01, SUCCESS-02, HELP-01, HELP-02, LOGO-01 to LOGO-04, MINOR-01 to MINOR-03 |

**Total items: 35**

---

*Generated: 2026 — Future Mining Finance (Pty) Ltd SCF Platform — UI Sprint Backlog*
