# Future Mining Project - File-by-File Findings

## Batch 1 - Core layout + global styling + theme/toasts + core config

- app/globals.css
  - Imports Tailwind.
  - Defines CSS variables for brand/semantic/neutral tokens, charts, radius, sidebar, and light/dark overrides.
  - Global element styling for border/outline, body typography, headings, focus-visible, transitions, and selection.

- styles/globals.css
  - Defines a separate OKLCH token system + @theme inline mapping + base layer applies.
  - Uses Geist fonts via CSS variables.
  - Not yet confirmed as imported.

- tailwind.config.js
  - Tailwind class-based dark mode.
  - Extends brand/semantic/neutral colors and adds Inter font stack.
  - Adds blink animation.

- postcss.config.mjs
  - Tailwind PostCSS plugin configured.

- next.config.mjs
  - Ignore TS build errors; unoptimized images; exposes env vars.

- components.json
  - Shadcn config points Tailwind CSS to app/globals.css.

- app/layout.tsx
  - Uses Inter font; imports app/globals.css; wraps app in ThemeRoot + Sonner Toaster.

- app/(public)/layout.tsx
  - Uses ThemeProvider + ThemeToggle + ClientToaster; adds skip link and fixed theme toggle.

- components/ThemeRoot.tsx
  - Wraps children in ThemeProvider with system theme and disableTransitionOnChange.

- components/theme-provider.tsx
  - Returns null until mounted (delays render until hydration).

- components/theme-toggle.tsx
  - Button uses background/foreground/border/accent tokens; toggles light/dark.

- components/ui/sonner.tsx
  - Sonner toaster uses CSS variables for background/text/border.

- components/ClientToaster.tsx, components/ui/toaster.tsx, components/ui/toast.tsx
  - Radix toast layout and styling; uses z-index 100 viewport; variants for destructive.

## Batch 2 - app root + auth/login + AP pages

- app/page.tsx
  - Home/landing route for app root.
  - Fixed header with translucent background: `bg-background/80 backdrop-blur-sm border-b` and `z-50`.
  - Main content centered; uses `Logo` component and CTA button.
  - CTA: Button `variant="outline"` with `hover:shadow-lg`, `hover:scale-105`, rounded-full, large padding.
  - Footer positioned absolute bottom with muted text.
  - Uses `ThemeToggle` in header; page wrapper uses `bg-background` and `text-foreground`.

- app/error.tsx
  - Global error UI using Card + AlertTriangle icon.
  - Destructive accent: `bg-destructive/10`, `text-destructive` for icon.
  - Error digest shown in `bg-muted` with `font-mono`.
  - Dev-only error message in `bg-muted` with `overflow-auto`.
  - Buttons use `variant=default` and `variant=outline`.

- app/admin/error.tsx
  - Admin-specific error UI, similar to global but with extra description and reload controls.
  - Uses destructive icon background (`bg-destructive/10`) and `text-destructive` icon.
  - Dev-only: shows stack trace with tiny font.
  - Buttons: `size=sm`, includes dashboard link.

- app/login/admin/page.tsx
  - Admin login with `ThemeToggle`, background radial glow overlays via absolute circles:
    - `bg-primary/20` and `bg-primary/10` + `blur-3xl` + `rounded-full`.
  - Card uses `bg-card shadow-none border-0`.
  - Error alert uses `bg-error/10 border-error`.
  - Inputs have `focus-visible:ring-primary` and ring offset.

- app/login/ap/page.tsx
  - Accounts Payable login with 2-step flow: credentials -> OTP.
  - Same background overlay circles as admin login (primary/20 and primary/10, blur-3xl).
  - Error alert uses `bg-error/10 border-error`.
  - OTP step uses default `Alert` and `Button variant="ghost"` for back.

- app/login/ap/change-password/page.tsx
  - Change password flow with validation list.
  - Background overlay circles same as other login pages.
  - Icon badge: `bg-primary/10` circle with `KeyRound` icon in `text-primary`.
  - Validation items color: green when valid (`text-green-600 dark:text-green-400`), muted otherwise.
  - Error alert uses `bg-red-500/10 border-red-500`.
  - Password requirements panel: `bg-muted/50 p-4 rounded-lg`.

- app/ap/dashboard/page.tsx
  - AP dashboard fetches session and invoices; refreshes every 30s.
  - Welcome card: `bg-card shadow-xl p-8 border rounded-2xl` and a vertical `bg-primary` bar.
  - Error box uses `bg-destructive/10 border-destructive/20 text-destructive`.
  - Action cards use translucent backgrounds and blur: `bg-card/50 backdrop-blur` + `hover:shadow-xl` + `hover:border-primary/50`.
  - Icons use `bg-primary/10` or `bg-accent-green/10` or `bg-muted` with text colors.
  - Recent Activity card uses `bg-card/50 shadow-xl backdrop-blur`.

- app/ap/reports/page.tsx
  - Reports view with Tabs; `bg-muted/30` page background.
  - Summary cards show totals; tables use muted borders and hover `bg-muted/10`.
  - Invoice amount uses `text-accent-green`.
  - Empty states show muted icon + button.

- app/ap/invoices/page.tsx
  - Invoices list with metrics, search/filter/download controls, details dialog.
  - Page background `bg-muted/30`.
  - Table rows hover `bg-muted/50`.
  - Amount text uses `text-emerald-600 dark:text-emerald-400`.
  - Dialog uses `DialogContent` with `max-w-lg`.

- app/ap/invoices/upload/page.tsx
  - Upload AP CSV; two-column layout with preview.
  - File input styled with `file:*` utilities; uses `file:border-input` and `hover:file:bg-accent`.
  - Preview list uses `border rounded-lg text-sm` entries.
  - Results uses alerts with bullet list (note mojibake '‚Ä¢' appears).

- app/ap/invoices/loading.tsx
  - Returns null (no loading UI).

- app/ap/vendors/upload/page.tsx
  - Upload vendor CSV; similar structure to AP upload.
  - Preview list uses `border rounded-lg text-sm` entries.
  - Results alert includes `text-green-500` on check icon; mojibake bullets present.

## Batch 3 - supplier pages + admin dashboards/pages

- app/supplier/access/page.tsx
  - Supplier token verification UI with same background overlay circles as login pages (`bg-primary/20` and `bg-primary/10`, blur-3xl).
  - Card uses `bg-card shadow-none border-0`; icon in `bg-muted border border-border rounded-full`.
  - Error alert uses `bg-error/10 border-error`.

- app/supplier/access/loading.tsx
  - Returns null.

- app/supplier/dashboard/page.tsx
  - Server component uses `use()` to resolve promises (profile, offers, cession, payments).
  - Action-required banner uses amber colors (`bg-amber-500/10`, `border-amber-500/50`, icon `text-amber-600`).
  - MetricCard variants for warning/success/primary/default; main page uses `bg-muted/30`.
  - Offers list cards use `border`, `rounded-lg`; amounts in `text-green-600`.

- app/supplier/offers/page.tsx
  - Offers selection UI; uses Checkbox, summary panel sticky top-4.
  - Selected card uses `border-primary ring-2 ring-primary/20`; unselected hover `hover:border-muted-foreground/50`.
  - Discount in `text-red-600`, net in `text-green-600`.
  - Summary alert and action button; page background `bg-muted/30`.

- app/supplier/offers/[offerId]/page.tsx
  - Offer detail page with static sample data.
  - Emphasis colors: discount `text-red-600`, net `text-green-600`, alert with green check icon.
  - Buttons for accept/reject; reject uses `variant=outline`.

- app/supplier/cession-agreement/page.tsx
  - Standing cession status UI; badge variants for status.
  - Approved alert uses green background/border: `bg-green-50 dark:bg-green-950/30`.
  - Addendums list uses `bg-muted` icon container.

- app/supplier/cession-agreement/upload/page.tsx
  - Upload page with centered card, `bg-background shadow border rounded`.
  - Error text uses `text-red-600`.
  - Toast messages contain mojibake check/cross characters (‚úì/‚úó).

- app/admin/dashboard/page.tsx
  - Admin dashboard with MetricCard grid and quick action cards.
  - Quick action cards use left border accent colors (`border-l-blue-500`, purple/green/amber) and hover translate.
  - Tabs list uses `bg-muted/50 border`.

- app/admin/offer-batches/loading.tsx
  - Skeleton-based loading UI with `bg-card border-b` header skeleton.

- app/admin/offer-batches/page.tsx
  - Batch management UI; stats cards with colored icon backgrounds (`bg-blue-500/10`, `bg-amber-500/10`, etc.).
  - Status badges set via class map (bg-gray/amber/blue/green/red/purple) with white text.
  - Dialogs for create/view batches; invoice selection list uses `hover:bg-muted/50`.
  - Uses `bg-primary/5` summary panel.

- app/admin/invoices/page.tsx
  - Invoices list with selection; eligible invoices show checkboxes.
  - EmptyState for no invoices; uses `bg-muted/30` page background.

- app/admin/payments/page.tsx
  - Tabs: queue, payments, repayments.
  - Export buttons styled `variant=outline` and `bg-transparent`.
  - Lists are card rows with borders; status badges vary per state.

- app/admin/reports/page.tsx
  - Tabs for offer acceptance, disbursements, supplier status, audit logs.
  - Tables use `hover:bg-muted/50` rows; acceptance counts colored green/red.
  - Filter card with date inputs and status select.

- app/admin/settings/page.tsx
  - Settings tabs for general/finance/notifications/security/users/database.
  - Users table in `border rounded-lg` with action icons (edit/reset/toggle/delete).
  - Database section uses `bg-muted/50` info panel and amber warning panel.

- app/admin/suppliers/page.tsx
  - Suppliers table with search/filter; card has `border-t-2 border-t-primary/20`.
  - Status badges include custom `bg-green-600` for Active.
  - Row action button shown on hover via `opacity-0 group-hover:opacity-100`.

- app/admin/buyers/page.tsx
  - Large buyer management UI with summary cards, table, dialogs, and multi-step create flow.
  - Status/risk badges use explicit pastel backgrounds (green/gray/red/yellow/blue/purple/orange).
  - Error banner uses `bg-red-100 border-red-300 text-red-800`.
  - Create dialog uses stepper with navigation footer `bg-muted/30 border-t`.

- app/admin/buyers/[id]/page.tsx
  - Buyer detail UI with tabs; stats cards show colored text (blue/green).
  - Document upload dropzone uses `border-2 border-dashed` and green highlight when file selected.
  - Badge colors for statuses (green/red/yellow) and risk tiers (blue/purple/orange).

- app/admin/bank-changes/page.tsx
  - Pending requests use amber warning block + green-highlight new bank panel.
  - Processed list uses conditional bg (`bg-green-100` or `bg-red-100`) and rejection reason in red panel.

- app/admin/vendors/upload/page.tsx
  - Vendor CSV upload; file input uses `file:bg-primary` and `file:text-primary-foreground`.
  - Results alerts list mojibake bullets (‚Ä¢).

- app/admin/applications/[supplierId]/page.tsx & client.tsx
  - Server wrapper validates supplierId; client handles approve/reject/request docs.
  - UI uses centered cards, action buttons; toasts with mojibake check/cross.

- app/admin/documents/[cessionId]/page.tsx & client.tsx
  - Server wrapper validates cessionId; client review UI.
  - Buttons for approve/reject; status displayed in badge.
  - Toaster messages contain mojibake check/cross.

## Batch 4 - API routes (server logic)

- app/api/auth/login/admin/route.ts
  - Admin login: validates username/password, checks failed_login_attempts >= 3, verifies bcrypt hash, resets attempts, creates session + cookie, writes audit logs.
  - Returns JSON user info on success; 401 on invalid credentials; 403 on locked.

- app/api/auth/login/ap/route.ts
  - AP login via mineCode: lookup buyer by code, then first active AP user, verify password.
  - Generates OTP (10 min), stores in otp_codes, sends email via Azure service; audits OTP generation.
  - Returns OTP in dev only.

- app/api/auth/verify-otp/route.ts
  - Verifies OTP, expiry, marks used; loads user, buyer name; creates session + cookie.
  - Returns mustChangePassword flag.

- app/api/auth/change-password/route.ts
  - Requires session; validates strong password regex; hashes with bcrypt; updates user and flags; audit log.

- app/api/auth/logout/route.ts
  - Clears session; audit log for user or supplier; maps auditor role to admin for audit.

- app/api/auth/supplier/verify-token/route.ts
  - Validates supplier access token, expiry, marks used; creates supplier session + cookie; audit log.

- app/api/session/route.ts
  - Returns current session details or 401 if not authenticated.

- app/api/suppliers/route.ts
  - Admin sees all suppliers; AP users see suppliers filtered by buyer code; others get empty list.

- app/api/invoices/route.ts
  - Returns invoices for current session via action; empty list on error.

- app/api/payments/route.ts
  - Admin sees all payments; AP users see by buyer; others empty.

- app/api/cession-agreement/template/route.ts
  - Generates PDF via supplier/buyer details + pdf generator; returns as attachment.

- app/api/cession-agreement/upload/route.ts
  - Supplier-only; accepts PDF via formData, stores via upload action, returns document URL.

- app/api/test-email/route.ts
  - Test email endpoint; logs env status; sends HTML email via Azure email service; returns success flag and timestamp.

## Batch 5 - components (admin/supplier) + UI primitives (part 1)

- components/admin/dashboard-header.tsx
  - Header bar with `bg-card border-b`; includes Logo, ThemeToggle, username, and Logout button (outline).

- components/admin/metric-card.tsx
  - MetricCard variants with colored icon backgrounds (`bg-emerald/amber/blue/primary/10`) and borders.
  - Card hover effects: shadow, scale, translate.
  - Trend indicator uses `text-emerald` or `text-red` with arrow glyphs (mojibake).

- components/supplier/supplier-header.tsx
  - Similar to admin header with `bg-card border-b`, ThemeToggle, Logout.

UI primitives:
- components/ui/accordion.tsx
  - Accordion items have `border-b`; trigger uses focus-visible ring, hover underline; chevron rotates on open.

- components/ui/alert-dialog.tsx
  - Overlay: `bg-black/50` with fade animations, `z-50`.
  - Content: centered fixed, `bg-background border border-border shadow-lg`, zoom/fade in/out.

- components/ui/alert.tsx
  - Alert base uses `bg-card text-card-foreground`, `border`, and grid layout; destructive variant uses `text-destructive`.

- components/ui/aspect-ratio.tsx
  - Wrapper around Radix AspectRatio (no extra styles).

- components/ui/avatar.tsx
  - Root is `size-8 rounded-full overflow-hidden`; fallback uses `bg-muted`.

- components/ui/badge.tsx
  - Variants: default/secondary/destructive/outline using primary/secondary/destructive/accent tokens.

- components/ui/breadcrumb.tsx
  - Muted breadcrumb list; link hover uses `text-foreground`.

- components/ui/button-group.tsx
  - Grouped button styling and separators; `ButtonGroupText` uses `bg-muted` and border.

- components/ui/button.tsx
  - Button variants: default/outline/secondary/ghost/link/destructive; focus ring uses `ring-ring/50`.

- components/ui/calendar.tsx
  - Custom DayPicker styles; uses primary/accent tokens for selection; dropdowns use `border-input` and `bg-popover`.

## Batch 6 - UI primitives (part 2)

- components/ui/card.tsx
  - Card base: `bg-card text-card-foreground border rounded-xl shadow-sm` with padding.

- components/ui/checkbox.tsx
  - Checked state uses `bg-primary text-primary-foreground` and `border-primary`.

- components/ui/dialog.tsx
  - Overlay: `bg-black/40` with `backdrop-blur-sm` (dark: `bg-black/60`).
  - Content: fixed centered, explicit colors `bg-white dark:bg-slate-950`, `border-gray-200 dark:border-gray-800`, `text-gray-900 dark:text-gray-50`.
  - Close button uses `bg-accent` when open.

- components/ui/drawer.tsx
  - Overlay `bg-black/50`.
  - Content uses `bg-background` and border per direction; handle bar `bg-muted` for bottom drawer.

- components/ui/dropdown-menu.tsx
  - Content uses explicit `bg-white` / `dark:bg-charcoal` with `border-gray-200` / `dark:border-gray-700`.
  - Destructive items use `text-destructive` and `focus:bg-destructive/10`.

- components/ui/input.tsx
  - Input uses `border-input` and `dark:bg-input/30`; selection uses primary tokens; focus ring via `ring-ring/50`.

- components/ui/label.tsx
  - Text label with `text-sm font-medium`; disabled opacity.

- components/ui/textarea.tsx
  - Textarea uses `border-input` and `dark:bg-input/30`; focus ring via `ring-ring/50`.

- components/ui/tabs.tsx
  - TabsList uses `bg-muted` pill; active tab uses `bg-background` and shadow.

- components/ui/table.tsx
  - Table rows hover `bg-muted/50`; footer uses `bg-muted/50`.

- components/ui/select.tsx
  - Trigger uses `border-input` and `dark:bg-input/30`.
  - Content uses `bg-popover text-popover-foreground` with border and shadow.

- components/ui/popover.tsx
  - Content uses `bg-white` / `dark:bg-charcoal`, `border-gray-200` / `dark:border-gray-700`, shadow.

- components/ui/sheet.tsx
  - Overlay `bg-black/50`; sheet content uses `bg-background` and slide-in/out per side.

- components/ui/tooltip.tsx
  - Tooltip content uses inverted colors: `bg-foreground text-background`, arrow matches foreground.

- components/ui/skeleton.tsx
  - Skeleton base `bg-muted animate-pulse`; card variants use `bg-card` + border.

## Batch 7 - UI primitives (part 3)

- components/ui/empty-state.tsx
  - EmptyState with optional icon; success variant uses emerald backgrounds; uses `animate-in fade-in zoom-in-50` on icon.

- components/ui/empty.tsx
  - Empty container uses `border-dashed`; `EmptyMedia` icon variant uses `bg-muted` and `text-foreground`.

- components/ui/feedback-banner.tsx
  - Feedback banner with colored theme variants (emerald/red/amber/blue) for background/border/text; dismiss button uses `hover:bg-black/10`.
  - FieldFeedback uses red/emerald background for inline form feedback.

- components/ui/field.tsx
  - Field layout utilities; checked field label uses `bg-primary/5` and `border-primary` (dark `bg-primary/10`).
  - FieldSeparator uses `bg-background` pill for separator label.

- components/ui/form.tsx
  - Form helpers; error text uses `text-destructive`.

- components/ui/input-group.tsx
  - InputGroup uses `border-input` and `dark:bg-input/30`; focus ring and error ring handled on group.
  - Addons use `text-muted-foreground`; InputGroupInput/textarea remove borders and rings.

- components/ui/input-otp.tsx
  - OTP slots use `border-input` and active ring; caret uses `bg-foreground`.

- components/ui/item.tsx
  - Item variants: outline/border, muted background; hover uses `bg-accent/50`.

- components/ui/kbd.tsx
  - Keycap uses `bg-muted text-muted-foreground`; special tooltip content styling.

- components/ui/loading-states.tsx
  - LoadingOverlay uses `bg-background/80` with `backdrop-blur-sm`; spinner uses `text-primary`.
  - SkeletonLoader uses `bg-muted animate-pulse`.

## Batch 8 - UI primitives (part 4)

- components/ui/logo.tsx
  - Logo system with brand guidance; uses Tailwind text classes (`text-blue-600`, `text-gray-900`, `text-white`); includes inline HTML string for email logo/footer with hardcoded hex colors.
  - Footer legal text uses © but mojibake appears in output (¬©).

- components/ui/pagination.tsx
  - Pagination uses Button variants; active uses outline, inactive ghost.

- components/ui/progress.tsx
  - Progress bar uses `bg-primary/20` track and `bg-primary` indicator.

- components/ui/radio-group.tsx
  - Radio uses `border-input`, checked indicator uses `fill-primary`.

- components/ui/resizable.tsx
  - Resizable handle uses `bg-border` and optional handle with border.

- components/ui/scroll-area.tsx
  - Scrollbar thumb uses `bg-border`; viewport focus ring uses `ring-ring/50`.

- components/ui/separator.tsx
  - Separator uses `bg-border` with orientation sizing.

- components/ui/sidebar.tsx
  - Large sidebar system using CSS vars `--sidebar-width`, `--sidebar-width-icon`.
  - Uses sidebar color tokens (`bg-sidebar`, `text-sidebar-foreground`, `bg-sidebar-accent`, `border-sidebar-border`).
  - Mobile uses Sheet (overlay). Desktop supports collapsed/expanded with transitions.

- components/ui/slider.tsx
  - Track `bg-muted`, range `bg-primary`, thumb `bg-white` with `border-primary` and ring.

- components/ui/spinner.tsx
  - Spinner icon uses `animate-spin`.

- components/ui/switch.tsx
  - Switch uses `bg-primary` when checked, `bg-input` when unchecked; thumb `bg-background`.

## Batch 9 - UI primitives (part 5)

- components/ui/toggle-group.tsx
  - Toggle group uses `data-[variant=outline]:shadow-xs`; items inherit toggle variants and remove border between.

- components/ui/toggle.tsx
  - Toggle uses `hover:bg-muted` and active state `bg-accent text-accent-foreground`.

- components/ui/use-mobile.tsx
  - Hook determines mobile under 768px.

- components/ui/use-toast.ts
  - Toast state management; limit 1; remove delay 1,000,000 ms.

- components/ui/carousel.tsx
  - Embla carousel wrapper; prev/next buttons are outlined and positioned outside with `absolute`.

- components/ui/chart.tsx
  - Chart container applies Recharts theme via CSS variables and style tag; tooltip/legend styling with `bg-background` and `border-border/50`.

- components/ui/collapsible.tsx
  - Radix collapsible wrapper without extra styles.

- components/ui/command.tsx
  - Command palette uses `bg-popover text-popover-foreground`; input wrapper has `border-b`.

- components/ui/context-menu.tsx
  - Context menu content uses explicit `bg-white/dark:bg-charcoal` and `border-gray` with shadow.

- components/ui/hover-card.tsx
  - Hover card uses `bg-popover text-popover-foreground` with border and shadow.

- components/ui/menubar.tsx
  - Menubar base `bg-background border shadow-xs`; menu content uses `bg-popover`.

- components/ui/navigation-menu.tsx
  - Navigation menu uses `bg-background` triggers with `hover:bg-accent`; viewport uses `bg-popover` and border.

## Batch 10 - hooks

- hooks/use-toast.ts
  - Toast store logic (same as components/ui/use-toast.ts): limit 1, remove delay 1,000,000 ms.

- hooks/use-mobile.ts
  - `useIsMobile` based on 768px breakpoint.

## Batch 11 - lib core (utils/db/brand)

- lib/utils.ts
  - `generateToken` (random alphanumeric) and `cn` (clsx + tailwind-merge). Note: `generateToken` is declared before imports (unusual order).

- lib/db.ts
  - MySQL pool config using env; adds SSL when host includes azure.com.
  - `query` ensures params array; `transaction` wrapper; `testConnection`.

- lib/constants/brand.ts
  - Brand constants for Future Cashflow / Future Mining Finance; includes color hex values and legal footer text.
  - Mojibake shows in copyright string (¬©).

## Batch 12 - lib/auth

- lib/auth/session.ts
  - JWT sessions with HS256; default secret fallback string.
  - User session 30 min; supplier session 2 hours; cookies `session` and `supplier_session` with `sameSite: lax`.

- lib/auth/password.ts
  - bcrypt hash/verify; OTP 6 digits; token generator 64 chars.

- lib/auth/audit.ts
  - Inserts audit_logs with user/action/entity/IP/agent.

## Batch 13 - lib/services

- lib/services/email.ts
  - Azure Communication Services email client; logs debug details.
  - sendOTPEmail + supplier welcome/approval emails use inline HTML with hardcoded colors; includes emojis and mojibake in logs/text.

- lib/services/email-templates.ts
  - Standard email header/footer templates with inline CSS; brand color constants defined.

- lib/services/blob-storage.ts
  - Azure Blob Storage helper: lazy client, auto-create container, upload/delete, public blob access.

## Batch 14 - lib/types

- lib/types/database.ts
  - Type interfaces for Buyer, Supplier, User, Invoice, Offer, Payment, AuditLog, CessionAgreement, BankChangeRequest.
  - Also defines generic CSV row types for vendor/AP uploads.

## Batch 15 - lib/utils PDF

- lib/utils/generateCessionAgreementPDF.ts
  - Creates A4 PDF with simple text layout, Helvetica, placeholder terms, signature line.
## Batch 16 - lib/actions (buyers, buyer-users, buyer-documents, admin, invoices, offer-batches, payments, reports, settings, standing-cession, suppliers, users)

- lib/actions/buyers.ts
  - Admin-only buyers CRUD with filters (status/risk/industry/search) and joins to rate_cards.
  - createBuyer: checks duplicate code, optionally assigns default rate card, inserts buyer with defaults (risk_tier B, industry mining, invoice amount/maturity bounds); auto-creates AP user (createUserForBuyer) from contact_email; deletes buyer on AP user creation failure.
  - generateUniqueUsername -> ensureUniqueUsername uses users.username uniqueness and caps length at 30 chars.
  - updateBuyer: dynamic update list, logs changes to buyer_change_log for critical fields (name/tax_id/risk_tier); change log requires approval flag false.
  - activateBuyer: validates required fields (name/code/contact_email) then sets active_status=active, approved_by/approved_at.
  - suspendBuyer: sets active_status=suspended, inserts change log with reason, audit log.
  - getBuyerUsers: returns AP users for buyer; getBuyerStats: aggregated counts and sums (invoices, offers, suppliers, financed, AP users).
  - getRateCards: active cards ordered default first.
  - getBuyerDocuments, getBuyerChangeLog: returns docs/logs with uploader/approver names.
  - calculateEffectiveRate: base_annual_rate + tier adjustment + optional days_brackets JSON; default base 18.00 and tier offsets if missing.

- lib/actions/buyer-users.ts
  - createUserForBuyer: admin-only; 4 AP users max per buyer; checks duplicate username/email; generates temp password (uppercase/lowercase/numbers/special) and activation token (7 days); inserts user with must_change_password=1, is_email_verified=0.
  - sendWelcomeEmailInternal: inline HTML email styles (blue #1e40af header/button, gray text #6b7280, warning block #fef3c7/#f59e0b). Mojibake in warning icon text (‚ö†Ô∏è).
  - sendWelcomeEmail: resets password + sends email.
  - resetUserPassword: admin reset, clears failed_login_attempts, sets active_status=active.

- lib/actions/buyer-documents.ts
  - uploadBuyerDocument: admin-only; accepts base64 file data; uploads to Azure Blob if configured or local /public/uploads/buyer-documents/<buyerId>.
  - uploadToBlobStorageForBuyer: builds uniqueName but calls uploadToBlobStorage with `buyer-${buyerId}-${fileName}` (uniqueName unused -> potential filename collision).
  - verifyBuyerDocument: sets verification_status, verified_by/at, rejection_reason; logs change and audit.
  - deleteBuyerDocument: deletes from blob or local file path; deletes DB row; logs change and audit.
  - getBuyerDocuments: allows any session (not admin-only) and joins uploader/verifier names.

- lib/actions/admin.ts
  - Admin-only dashboard metrics: pending cessions, total applications (pending/documents_submitted), approved suppliers, total payments last 48h.
  - getPendingApplications/cessions, getCessionById, bank change request list/all, supplier application details.
  - reviewCessionAgreement updates status + approved_by/at; no auto supplier approval.
  - approveBankChangeRequest uses transaction to update supplier bank details + request status; NOTE: uses `transaction(...)` but `transaction` is NOT imported (likely runtime error).
  - reviewSupplierApplication: on approved -> creates new supplier approval token (14 days) and sends approval email with access link; base URL uses NEXTAUTH_URL fallback.
  - releaseOffersForSupplier: admin-only manual offer release (calls manualGenerateOffersForSupplier).

- lib/actions/invoices.ts
  - CSV parsers for AP/vendor data (simple quoted CSV handling).
  - uploadAPData: AP-only; validates Company Code vs logged-in buyer; ensures buyer by company code; maps CSV to invoices (status matched) with many AP fields; errors on missing supplier; no auto offer generation.
  - uploadVendorData: admin/AP; AP restricted to own buyer code; updates or inserts suppliers; creates supplier invite tokens for NEW suppliers only; sends invite emails; logs audit.
  - getInvoicesForBuyer + getInvoicesForSession: AP sees invoices only (no offer join, offer_count=0); admin sees all invoices with offer_count; fallback empty.
  - Offer generation: createOffersForInvoices computes baseAmount=70% invoice amount; discount based on annualRate and daysToMaturity; creates offer, updates invoice to offered, creates supplier offer_access token.
  - autoGenerateOffersForEligibleInvoices/autoGenerateOffersForSupplier: gated by system setting enable_auto_offers; logs audit for non-empty results.
  - manualGenerateOffersForSupplier bypasses feature-flag.
  - getAllInvoices: returns invoices with offer_count (limit 100) without auth enforcement.

- lib/actions/offer-batches.ts
  - Admin-only batching: getEligibleInvoicesForBatching groups matched invoices by supplier; days_to_maturity via DATEDIFF.
  - createOfferBatch: normalizes scheduledSendAt (string/null); creates offer_batches row; creates offer per invoice (70% base, discount based on annualRate and days); updates invoices to offered; recalculates totals; deletes empty batch if no offers created.
  - Auto send mode: generates supplier offer_access token + short_code; updates batch status sent; emails supplier.
  - getOfferBatches, getBatchOffers, sendOfferBatch (pending_review -> sent), cancelOfferBatch (revert invoices, delete offers), excludeFromBatch (delete offers + revert invoices + recalc totals).

- lib/actions/payments.ts
  - getPaymentQueue: accepted offers without payments; includes supplier/buyer bank info.
  - queuePayments: creates payment with queued status + repayment record (expected_amount = net_payment_amount + discount_amount); payment_reference FMF + timestamp + offerId.
  - generatePaymentBatch: sets batch_id=BATCH<timestamp>, sets status processing, outputs CSV columns (payment ref, bank fields, amount).
  - markPaymentsCompleted: updates payments to completed + sets invoices to paid.
  - getRepayments: joins buyers/payments/suppliers/invoices; recordRepayment updates received_amount, status (partial/completed).

- lib/actions/reports.ts
  - Offer acceptance summary grouped by sent date + buyer/supplier; totals accepted/rejected/expired counts + values.
  - Disbursement tracker for payments with optional filters.
  - Supplier status report joins invoices/offers/payments/cession status.
  - Audit history with filters and hardcoded LIMIT to avoid mysql2 param issues.
  - System statistics (counts of suppliers/invoices/offers/payments/repayments/requests).
  - exportReportToCSV: headers from first row, values JSON-stringified.

- lib/actions/settings.ts
  - getSystemSettings: admin-only; returns key/value map; falls back to hardcoded defaults if query fails.
  - updateSystemSetting: inserts or updates system_settings; writes to audit_logs with action update_setting.
  - getSettingValue: safe query fallback to default.

- lib/actions/standing-cession.ts
  - Supplier session only; getStandingCession: current signed/approved standing cession with valid_until; uses is_standing flag.
  - createStandingCession: inserts pending standing cession with valid_until months; audit log; revalidate.
  - signStandingCession: sets document_url, signed_date, status signed.
  - createCessionAddendum: creates child cession_agreements with linked_invoice_ids JSON; requires standing cession.
  - getSupplierCessionStatus: returns standing cession + addendum counts; returns zeros if no session.
  - approveStandingCession/approveAddendum: admin-side updates status + audit.

- lib/actions/suppliers.ts
  - uploadCessionAgreement: uploads file to blob or local public/uploads/cession-agreements; inserts/updates cession_agreements (status pending).
  - getSupplierCessionAgreement: latest cession agreement for supplier.
  - getSupplierAndBuyerDetails: queries supplier by supplier_id; buyer by supplier.company_code.
  - getSupplierOffers: joins offers/invoices/buyers; sorted by sent_at.
  - getSupplierProfile: supplier details including bank info + statuses.
  - acceptOffer/rejectOffer: transactional updates offer status and invoice status; accepts trigger addendum creation via dynamic import.
  - acceptMultipleOffers: loops per offer with status checks/expiry, updates invoice status, logs audits; then creates addendum for accepted invoices.
  - getSupplierPayments: joins payments/offers/invoices/buyers.
  - updateSupplierProfile: updates contact fields only (person/phone/address) with audit.
  - requestBankChange: creates bank_change_requests row; uses current supplier bank details.
  - Note: imports are split and appear mid-file; `query` used earlier but import appears later (ESM hoisting still works, but style is inconsistent).

- lib/actions/users.ts
  - Admin-only user management for users table; roles are admin/ap_user/buyer_admin (note mismatch vs DB role enum which uses accounts_payable).
  - createUser: enforces buyer_id for non-admin; hashes password; inserts status active; audit log.
  - updateUser: dynamic update with email uniqueness check; updates updated_at.
  - resetUserPassword: hashes new password; audit.
  - deleteUser: soft delete via status=inactive; prevents self-delete.
  - toggleUserStatus: toggles active/inactive; prevents self-deactivation.

## Batch 17 - middleware/server/config/build files

- middleware.ts
  - Public routes: /, /landing, /login/ap, /supplier/access; /login/admin intentionally not public.
  - Protects /admin and /ap via session cookie; role checks redirect AP->home for admin route, admin->/ap/dashboard for AP route.
  - Supplier routes use supplier_session cookie with verifySupplierSession.

- server.js
  - Custom Next.js server using http.createServer; uses hostname from WEBSITE_HOSTNAME or localhost; port from PORT.

- appsettings.json
  - Contains plaintext DB credentials, JWT secret, and Azure Communication Services keys.
  - Includes NEXTAUTH_URL pointing to Azure app service.

- package.json
  - Next 16, React 19, tailwind 4 + radix UI + Azure SDK + mysql2; scripts dev/build/start/lint only.

- tsconfig.json
  - strict true, module esnext, target ES6, allowJs, noEmit, isolatedModules; duplicate .next/dev include paths and mixed Windows slashes.

- next-env.d.ts
  - Next.js type references; imports .next/dev/types/routes.d.ts.

- web.config
  - IISNode config: rewrite static to public{REQUEST_URI}, dynamic to server.js; NodeInspector rule; websockets disabled.

- azure-pipelines.yml
  - Builds on ubuntu-latest; Node 20; npm install/build; copies all files except .git/.venv/.vscode/*.md; zips and deploys to Azure Web App (node server.js).

- deploy-package.json
  - Minimal package for deployment; node >=18.

- .gitignore
  - Ignores .next, dist, build, envs, node_modules; ignores pnpm-lock.yaml (but file exists).

## Batch 18 - app error/loading + supplier cession pages + API routes

- app/error.tsx
  - Global error page (client); centered Card with destructive alert icon; shows error digest in monospace; dev-only error message in pre.
  - Styles: bg-background, destructive/10 icon chip, text-muted-foreground, buttons default/outline.

- app/admin/error.tsx
  - Admin-scoped error page (client); similar card with description; includes reload and dashboard link.
  - Styles: bg-background, destructive/10 icon, muted error blocks, small button sizes.

- app/supplier/cession-agreement/page.tsx
  - Supplier cession management; uses bg-muted/30 layout and SupplierHeader.
  - Standing cession card with primary/10 icon chip; Badge variants by status; Alert uses custom green background/border for approved.
  - Addendum list uses border + muted chip; Download buttons ghost/outline; uses text-muted-foreground, badge capitalization.

- app/supplier/cession-agreement/upload/page.tsx
  - Client form with upload; toast success/error; inline error in text-red-600.
  - Layout: full screen center, bg-muted/30, card shadow/border, primary link.

- app/supplier/access/loading.tsx and app/ap/invoices/loading.tsx
  - Both return null; no visual loading UI.

- app/admin/offer-batches/loading.tsx
  - Skeleton-based loading UI; bg-background, header/card skeletons; uses Card + Skeleton components.

- app/api/invoices/route.ts
  - GET proxies to getInvoicesForSession, returns 500 with empty array on error.

- app/api/suppliers/route.ts
  - GET: admin sees all suppliers; AP sees only buyer company_code suppliers; others get empty.

## Batch 19 - scripts (SQL + JS)

- scripts/01-create-database-schema.sql
  - Initial schema for buyers/suppliers/users/otp/invoices/offers/cession_agreements/payments/repayments/audit_logs/notifications/bank_change_requests/system_settings.
  - Roles in users enum: admin/accounts_payable/auditor; suppliers risk_tier low/medium/high.

- scripts/02-seed-initial-data.sql
  - Inserts sample buyers, admin + AP users (bcrypt placeholder), system settings, sample suppliers.

- scripts/03-update-schema-for-ap-data.sql
  - Adds AP CSV fields to invoices (company_code/vendor_number/document_number/etc), adds vendor fields to suppliers (company_code, bank fields, etc) and indexes.

- scripts/04-phase1-schema-updates.sql
  - Adds offer_batches table, trusted_devices, standing cession fields, short_code in supplier_tokens, notification_rules, email_templates, seed rules/templates.
  - Includes mojibake in template subjects (e.g., ìüéâî).

- scripts/05-buyer-onboarding-schema.sql
  - Adds buyer profile fields, eligibility config, rate_cards, buyer_documents, buyer_change_log, user first-login fields, indexes.

- scripts/analyze-batch.js
  - Connects to Azure MySQL with hardcoded credentials; prints eligible invoices, batches, offers, batch settings; includes ASCII table art with mojibake.

- scripts/check-offer-batches.js
  - DB fix script with hardcoded credentials; resets orphaned offered invoices, deletes empty batches; prints counts; includes emoji/mojibake text.

- scripts/database-schema.sql
  - Full schema export as of 2026-01-27 with all tables; includes buyer onboarding + batches + standing cession + tokens with short_code.

- scripts/db-describe.js, db-inspect-temp.js, extract-schema.js, test-create-batch.js
  - Utility scripts to inspect Azure MySQL schema/state; all include hardcoded DB creds; extract-schema writes scripts/database-schema.sql.

## Batch 20 - public assets/uploads

- public/service-worker.js
  - Minimal SW: skipWaiting on install, clients.claim on activate; fetch handler pass-through.

- public/placeholder-logo.svg
  - Inline SVG logo with black (#000) wordmark path + dark gray (#171717) icon path.

- public/placeholder.svg
  - Generic 1200x1200 placeholder with light gray background (#EAEAEA), gray strokes (#C9C9C9), white circle and dark gray icon (#666).

- public/placeholder-logo.png, public/placeholder-user.jpg, public/placeholder.jpg
  - Binary image placeholders (not human-readable here).

- public/uploads/*.csv
  - AP upload CSVs with columns: Company Code, Vendor Number/Name, Document fields, amounts, payment terms, Open Item, Text.
  - Vendor upload CSVs with columns: Company Code, Vendor Number/Name, address/contact/bank fields, VAT/registration, reconciliation GL.
  - Sample data includes AAP1001 and APP2025 company codes and multiple vendor/invoice rows.

- public/uploads/cession-agreements/*.pdf
  - Sample cession agreement PDFs (binary; filenames include supplierId + timestamp + uuid).

## Batch 21 - dist build output

- dist/package.json
  - Production bundle manifest; dependencies subset, includes @vercel/analytics in dist only.

- dist/server.js
  - Same as root server.js.

- dist/public
  - Mirrors root public (placeholders, uploads, service-worker.js).

- dist/.next
  - Build artifacts: manifests, required-server-files, routes, server/static assets, cache/types; BUILD_ID; trace files.
  - Example file: dist/.next/package.json contains {"type":"commonjs"}.

## Batch 22 - documentation files (root)

- ACCESSIBILITY_IMPLEMENTATION_GUIDE.md
  - WCAG 2.1 AA guidance, form/feedback/loading/table best practices, animation and motion-safe guidance; multiple code examples; mojibake in emoji symbols.

- DEPLOYMENT_CHECKLIST.md
  - Pre-deploy checklist, file change list, steps for testing, rollback plan, success metrics; mojibake in emoji list markers.

- LOGO_STANDARDIZATION_AUDIT.md
  - Brand naming standardization (Future Cashflow vs Future Mining Finance), logo variants/colors, size presets; notes unused placeholder logo files; documents email template migration.

- PROJECT_COMPLETION_SUMMARY.md
  - UI/UX enhancements overview, components updated, color preservation claims; mojibake in emoji markers.

- QUICK_REFERENCE.md
  - Developer quick guide for FeedbackBanner/loading states/form labels; lists design tokens and color hexes; mojibake in emoji markers.

- SECURITY_FIX_G-01.md
  - Security summary for admin login discoverability and middleware role isolation changes.

- UI_UX_ENHANCEMENTS.md
  - Detailed component-by-component enhancements and UX guidelines; notes opacity overlays for preserved colors; mojibake in emoji markers.

- UX_FIX_G-04.md
  - Details toast feedback additions and auto-offer disablement; notes admin manual release; mojibake in emoji markers.

## Batch 23 - repo metadata + lockfiles

- .git/config + .git/HEAD
  - Remote origin points to Azure DevOps repo; branch master.

- package-lock.json / pnpm-lock.yaml
  - Dependency lockfiles with full transitive tree, resolved versions, integrity hashes (large, not expanded here).

- tsconfig.tsbuildinfo
  - TypeScript incremental build cache (binary).
## Batch 24 - Logo system (fonts/colors/variants)

- components/ui/logo.tsx
  - Logo icon is an inline SVG chevron mark (2 stacked chevrons) using `fill="currentColor"` and `viewBox="0 0 80 80"`.
  - Color variants (applied to icon + both word spans + divider):
    - default: `text-blue-600` + divider `bg-blue-600` (Tailwind blue-600 = #2563eb).
    - light: `text-white` + divider `bg-white`.
    - dark: `text-gray-900` + divider `bg-gray-900`.
  - Typography: both ìFutureî and ìCashflowî use `font-bold` and the same text color; no per-word weight or color differences in code. There is no explicit font-family here; the logo inherits the pageís font stack.
  - Size presets (icon/text/divider/gap):
    - xs: 24px / text-sm (14px) / divider h-4 (16px) / gap-2 (8px)
    - sm: 32px / text-lg (18px) / divider h-5 (20px) / gap-2 (8px)
    - md: 40px / text-xl (20px) / divider h-6 (24px) / gap-3 (12px)
    - lg: 48px / text-2xl (24px) / divider h-8 (32px) / gap-3 (12px)
    - xl: 56px / text-3xl (30px) / divider h-10 (40px) / gap-4 (16px)
  - Gap between icon and text is controlled by size preset; divider is a 1px vertical line with height by size.
  - FooterLogo uses `Logo size="sm"` and legal text in `text-muted-foreground` (light) or `text-gray-300` (light variant), with mojibake in © string (¬©).
  - Email logo helper: `getEmailLogoHtml()` uses inline font-family `system-ui, -apple-system, sans-serif`; text color is #2563eb for dark variant, #ffffff for light variant; divider uses same as text color. (bgColor computed but not used in output).

- lib/constants/brand.ts
  - Brand color hexes: primary #2563eb, primaryLight #3b82f6, primaryDark #1d4ed8.
  - Trading name: ìFuture Cashflowî; Legal: ìFuture Mining Finance (Pty) Ltdî; NCRCP18174.

- app/globals.css
  - No explicit font-family is set; body defines size/line-height/letter-spacing only. Logo text therefore inherits the site font stack (Tailwind defaults or any other page-level font override).
  - Note: global brand blue is defined as #3594F7 in CSS variables, which differs from Logoís Tailwind blue-600 (#2563eb).
