# Enterprise QA Audit Report — FLOW 1: Admin Dashboard, Login & Buyer Creation

**Platform:** SCF (Supply Chain Finance) — Next.js App Router + TypeScript + TailwindCSS  
**Audit Date:** 2025-07-14  
**Scope:** Admin Login, Admin Dashboard, Buyer Management (Create/Edit/Suspend), Admin Layout, Authentication System, Database Schema, API Routes, Admin Settings, Admin Vendors, Admin Suppliers, Middleware  
**File Count Inspected:** 25+  
**Total Defects Found:** 32

---

## Severity Legend

| Severity     | Meaning |
|-------------|---------|
| **CRITICAL** | Security vulnerability or data-corruption risk exploitable in production |
| **HIGH**     | Functional bug that causes incorrect behaviour, data loss, or privilege escalation |
| **MEDIUM**   | Logic flaw, UX gap, or code-quality issue that affects reliability or maintainability |
| **LOW**      | Minor code-quality, dead-code, or cosmetic issue |

---

## 1 — SECURITY

### DEF-001: Session Binding Completely Bypassed at Login (CRITICAL)

**Problem:** `createSession()` in both the admin login API and the OTP verification API is called **without** the `headers` parameter. The session-binding feature (IP hash + User-Agent hash) exists in `session.ts` but is never activated because `headers` is never passed during the two places sessions are actually created.

**Impact:** Session-hijacking attacks are viable. A stolen JWT can be replayed from any IP or browser.

**Root Cause:** The `headers` parameter on `createSession(data, headers?)` is optional; callers silently omit it.

**Files:**
- [app/api/auth/login/admin/route.ts](app/api/auth/login/admin/route.ts#L108-L115) — `createSession({...})` — no `headers`
- [app/api/auth/verify-otp/route.ts](app/api/auth/verify-otp/route.ts#L121-L128) — `createSession({...})` — no `headers`
- [lib/auth/session.ts](lib/auth/session.ts#L112) — signature `createSession(data, headers?)`

**Fix:**
```ts
// admin/route.ts line ~108
const token = await createSession({
  userId: user.user_id,
  username: user.username,
  email: user.email,
  role: user.role,
  buyerId: user.buyer_id,
  fullName: user.full_name,
}, request.headers) // ← pass headers

// verify-otp/route.ts line ~121 — same fix
```

---

### DEF-002: Session Refresh Loses Session Binding (CRITICAL)

**Problem:** `refreshSession()` calls `createSession(session)` without passing `headers`. Even if DEF-001 were fixed, every sliding-window refresh would silently strip the IP/UA fingerprint from the new token.

**Impact:** After the first session refresh (within 1hr of expiry), sessions revert to unbound — defeating the entire session-binding security layer.

**Root Cause:** `refreshSession()` receives only the old token, not the current request headers.

**File:** [lib/auth/session.ts](lib/auth/session.ts#L253-L257)

**Fix:**
```ts
export async function refreshSession(token: string, headers?: Headers): Promise<string | null> {
  const session = await verifySession(token)
  if (!session) return null
  return createSession(session, headers)
}
```
Update the middleware caller at [middleware.ts](middleware.ts#L168) to pass `request.headers`.

---

### DEF-003: No CSRF Protection on Any Auth Endpoint (CRITICAL)

**Problem:** All POST auth routes (`/api/auth/login/admin`, `/api/auth/login/ap`, `/api/auth/logout`, `/api/auth/verify-otp`, `/api/auth/change-password`) accept requests without any CSRF token validation.

**Impact:** An attacker can craft a malicious page that triggers login, logout, or password changes on behalf of an authenticated user using a cross-site form submission or `fetch()` + cookie auto-attach.

**Root Cause:** No CSRF middleware or token-checking is implemented.

**Files:**
- [app/api/auth/login/admin/route.ts](app/api/auth/login/admin/route.ts)
- [app/api/auth/login/ap/route.ts](app/api/auth/login/ap/route.ts)
- [app/api/auth/logout/route.ts](app/api/auth/logout/route.ts)
- [app/api/auth/verify-otp/route.ts](app/api/auth/verify-otp/route.ts)
- [app/api/auth/change-password/route.ts](app/api/auth/change-password/route.ts)

**Fix:** Implement `Origin` / `Referer` header validation or a double-submit CSRF cookie pattern on all POST API routes. At minimum, validate that the `Origin` header matches the application host. `SameSite: 'lax'` on the session cookie mitigates only simple form-based attacks, not `fetch()` with `credentials: 'include'`.

---

### DEF-004: CSP Allows `'unsafe-eval'` and `'unsafe-inline'` in Production (HIGH)

**Problem:** The production CSP header includes `script-src 'self' 'unsafe-eval' 'unsafe-inline'`. CSP nonces are generated in middleware but **never injected** into the CSP `script-src` directive.

**Impact:** XSS payloads can execute arbitrary inline scripts and `eval()`-based attacks in production. The generated nonce is wasted.

**Root Cause:** The `buildCSPHeader()` function receives a `nonce` parameter but never uses it in the output string.

**File:** [middleware.ts](middleware.ts#L13-L41) — `buildCSPHeader(nonce, isDev)` ignores `nonce`

**Fix:**
```ts
// Production CSP should be:
`script-src 'self' 'nonce-${nonce}'`,
`style-src 'self' 'nonce-${nonce}'`,
// Remove 'unsafe-eval' and 'unsafe-inline'
```
Ensure all inline scripts reference the nonce via the `x-csp-nonce` response header.

---

### DEF-005: Dev-Only Secret Fallback for JWT Signing (HIGH)

**Problem:** When `JWT_SECRET` is not set (or is < 32 chars) ,and the environment is not production, the system falls back to a hardcoded insecure default. If a staging/preview deploy accidentally ships without `JWT_SECRET`, sessions are signed with a well-known secret.

**Impact:** Any attacker can forge valid session tokens for staging environments.

**Root Cause:** `getSecretKey()` uses a hardcoded fallback in non-production.

**File:** [lib/auth/session.ts](lib/auth/session.ts#L12-L18)

**Fix:** Throw in all environments (or at least log a very loud warning and use a per-boot random value):
```ts
if (!jwtSecret || jwtSecret.length < 32) {
  if (process.env.NODE_ENV === 'production') throw new Error(...)
  console.error("CRITICAL: JWT_SECRET not configured — generating ephemeral key")
  return new TextEncoder().encode(crypto.randomUUID() + crypto.randomUUID())
}
```

---

### DEF-006: Test Email Endpoint Exposed in Production (MEDIUM)

**Problem:** `/api/test-email` is listed in `publicApiRoutes` with the comment `"// Should be removed in production"` but no conditional guard prevents it from shipping.

**Impact:** Unauthenticated users can trigger email sends (potential spam relay or information disclosure).

**Root Cause:** Hardcoded entry with only a code comment as "protection."

**File:** [middleware.ts](middleware.ts#L49)

**Fix:** Either remove the entry entirely or guard with:
```ts
...(process.env.NODE_ENV !== 'production' ? ["/api/test-email"] : []),
```

---

### DEF-007: `clearSession()` Deletes Both Cookie Types Unconditionally (MEDIUM)

**Problem:** `clearSession()` deletes both `session` and `supplier_session` cookies regardless of which user type is logging out.

**Impact:** If an admin is also somehow testing a supplier flow in the same browser, logging out of one destroys the other. More importantly, this signals to an attacker that both session cookie names exist.

**Root Cause:** No discrimination by session type.

**File:** [lib/auth/session.ts](lib/auth/session.ts#L237-L241)

**Fix:** Accept a `type` parameter or clear only the relevant cookie:
```ts
export async function clearSession(type?: 'admin' | 'supplier'): Promise<void> {
  const cookieStore = await cookies()
  if (!type || type === 'admin') cookieStore.delete("session")
  if (!type || type === 'supplier') cookieStore.delete("supplier_session")
}
```

---

### DEF-008: Password Change Endpoint Does Not Require Old Password (MEDIUM)

**Problem:** `/api/auth/change-password` relies solely on an active session — it does not ask for the current password before setting a new one.

**Impact:** If an attacker has an active session (e.g., via session hijacking), they can change the victim's password without knowing the original.

**Root Cause:** The route was designed for first-login password changes but is accessible anytime.

**File:** [app/api/auth/change-password/route.ts](app/api/auth/change-password/route.ts)

**Fix:** Require `currentPassword` for non-first-login scenarios:
```ts
if (!user.must_change_password) {
  // Verify current password before allowing change
}
```

---

## 2 — AUTHENTICATION & SESSION MANAGEMENT

### DEF-009: Account Lock Threshold (3) Inconsistent with Rate Limit (5) (HIGH)

**Problem:** The admin login API locks accounts after 3 failed attempts (hardcoded `>= 3` check), but the rate limiter allows 5 requests per 15 minutes. This means the account is locked before rate limiting kicks in, making the rate limiter irrelevant for brute force protection.

**Impact:** The rate limiter provides a false sense of security; it never fires for the account-lock use case.

**Root Cause:** Two independent protection mechanisms with uncoordinated thresholds.

**File:** [app/api/auth/login/admin/route.ts](app/api/auth/login/admin/route.ts) — account lock check vs. rate limit config

**Fix:** Align thresholds — either lock at `>= 5` or rate-limit at `3` attempts. Better: make both values configurable from the settings table.

---

### DEF-010: AP Login Blindly Selects First User for Buyer (HIGH)

**Problem:** When an AP user logs in with a mine code, the query fetches all AP users for that buyer but always picks `users[0]` without matching by username or email.

**Impact:** If a buyer has multiple AP users, all of them authenticate as the **first** AP user, receiving that user's session and permissions. This is an identity-confusion vulnerability.

**Root Cause:** The login query filters only by `buyer_id` + `role` + `active_status`, not by the individual user's identity.

**File:** [app/api/auth/login/ap/route.ts](app/api/auth/login/ap/route.ts#L57-L67)

**Fix:** Add a `username` or `email` parameter to the AP login form and include it in the WHERE clause:
```sql
SELECT * FROM users WHERE buyer_id = ? AND role = ? AND active_status = ? AND (username = ? OR email = ?)
```

---

### DEF-011: OTP Codes Never Cleaned Up from Database (MEDIUM)

**Problem:** After OTP verification, used/expired OTP codes remain in the `otp_codes` table indefinitely.

**Impact:** Database bloat over time; old OTP codes sitting in the table are a minor data leak risk.

**Root Cause:** No `DELETE` or `UPDATE` query marks OTPs as used or purges expired entries.

**File:** [app/api/auth/verify-otp/route.ts](app/api/auth/verify-otp/route.ts)

**Fix:** After successful verification, delete or mark the OTP:
```ts
await query("DELETE FROM otp_codes WHERE user_id = ? AND code = ?", [user.user_id, otp])
```
Also add a scheduled job or query to purge expired OTPs.

---

### DEF-012: In-Memory Rate Limiting Fails in Multi-Instance / Serverless Deployments (MEDIUM)

**Problem:** `rate-limit.ts` uses an in-memory `Map` for tracking attempts. In serverless (Vercel, Azure Functions) or multi-instance deployments, each cold start or instance gets its own map.

**Impact:** Rate limiting is effectively bypassed — an attacker gets N × allowance (where N = number of instances). The `setInterval` cleanup may not run reliably in serverless.

**Root Cause:** Architecture-level: in-memory state in a stateless runtime.

**File:** [lib/auth/rate-limit.ts](lib/auth/rate-limit.ts)

**Fix:** Enable `rate-limit-redis.ts` (which already exists) by default when `REDIS_URL` is configured, or use an edge-compatible store (e.g., Upstash Redis).

---

### DEF-013: Session Timeout Setting in UI is Decorative (MEDIUM)

**Problem:** The Admin Settings page shows a `session_timeout_minutes` input (default 30), but JWT expiry is hardcoded to `"4h"` in `createSession()`. Changing the setting has zero effect.

**Impact:** Administrators believe they are controlling session duration but are not. Compliance audits expecting configurable timeouts will flag this.

**Root Cause:** The settings table value is never read by the JWT signing logic.

**Files:**
- [app/admin/settings/page.tsx](app/admin/settings/page.tsx#L470-L471) — UI shows `session_timeout_minutes`
- [lib/auth/session.ts](lib/auth/session.ts#L126) — `.setExpirationTime("4h")` hardcoded

**Fix:** Read the setting at session creation time:
```ts
const timeoutMinutes = await getSystemSetting('session_timeout_minutes') || 240
.setExpirationTime(`${timeoutMinutes}m`)
```

---

## 3 — DASHBOARD

### DEF-014: Dashboard Does Not Guard Null Session (HIGH)

**Problem:** `AdminDashboardPage` calls `getSession()` but never checks the result. If the session is null (expired, cookie missing while the middleware race condition allows a render), all subsequent DB queries execute without authorization context.

**Impact:** Dashboard may render for unauthenticated users in edge cases (e.g., during middleware upgrade, or SSR cache reuse).

**Root Cause:** Missing null check after `getSession()`.

**File:** [app/admin/dashboard/page.tsx](app/admin/dashboard/page.tsx#L19)

**Fix:**
```ts
const session = await getSession()
if (!session || session.role !== 'admin') {
  redirect('/login/admin')
}
```

---

### DEF-015: Dashboard Uses Hardcoded Notifications (MEDIUM)

**Problem:** `DashboardHeader` defines notifications as a static array of 3 items. "Mark all read" and "View all" buttons do nothing.

**Impact:** Users see fake notification data. The UI is misleading; no actual notification system is connected.

**Root Cause:** Placeholder data never replaced with real API calls.

**File:** [components/admin/dashboard-header.tsx](components/admin/dashboard-header.tsx#L79-L83)

**Fix:** Either connect to a real notifications API or hide the bell icon until implemented. At minimum, label it as "Coming soon."

---

### DEF-016: Dashboard Header Fetches Session via Unauthenticated `/api/session` (MEDIUM)

**Problem:** `DashboardHeader` makes a client-side `fetch('/api/session')` on mount with no error UI or loading state. If the API returns an error, `sessionRole` silently stays `null` and navigation links default to admin links.

**Impact:** If the session API is slow or unavailable, the role-aware navigation shows incorrect links temporarily. Non-admin users could momentarily see admin nav links.

**Root Cause:** No loading skeleton or error boundary around role-dependent navigation.

**File:** [components/admin/dashboard-header.tsx](components/admin/dashboard-header.tsx#L36-L47)

**Fix:** Add a loading state and guard the nav render until role is resolved:
```tsx
const [loading, setLoading] = useState(true)
// In fetch: setLoading(false) in .then and .catch
// In render: if (loading) return <HeaderSkeleton />
```

---

## 4 — BUYER MANAGEMENT

### DEF-017: Direct State Mutation During Render (HIGH)

**Problem:** Line 101 of the buyers page directly mutates `formData` during the render phase:
```ts
if (!formData.payment_capture_schedule) formData.payment_capture_schedule = 'daily';
```
This bypasses React's state management and can cause inconsistent renders, stale closures, and infinite loops in strict mode.

**Impact:** Unpredictable UI behaviour; React's reconciliation may not detect the change, causing the form to show stale values.

**Root Cause:** Imperative mutation instead of setting the default in the initial state.

**File:** [app/admin/buyers/page.tsx](app/admin/buyers/page.tsx#L101)

**Fix:** Set the default in `useState` initialization (which already includes it at line 242: `payment_capture_schedule: 'daily'`). Delete line 101 entirely.

---

### DEF-018: Double Data Fetching on Initial Load (HIGH)

**Problem:** Two `useEffect` hooks both call `loadData()`:
1. **Effect 1** (line 114): Fires on `[statusFilter, riskFilter]` changes
2. **Effect 2** (line 152): Fires on `[searchTerm]` changes with a 300ms debounce

On initial mount, **both** execute simultaneously since all dependencies are at their initial values. This causes two parallel identical API calls.

**Impact:** Doubled server load on every page visit; potential race conditions if responses arrive out of order.

**Root Cause:** Separate effects with overlapping initial trigger conditions.

**File:** [app/admin/buyers/page.tsx](app/admin/buyers/page.tsx#L114-L158)

**Fix:** Merge into a single effect:
```ts
useEffect(() => {
  const timer = setTimeout(() => loadData(), searchTerm ? 300 : 0);
  return () => clearTimeout(timer);
}, [statusFilter, riskFilter, searchTerm]);
```

---

### DEF-019: `handleCreate()` Skips Step 4 Settings Validation (MEDIUM)

**Problem:** `handleCreate()` checks only `name`, `code`, and `contact_email`, then directly submits. It never calls `validateStep(4)`, which checks that min invoice < max invoice and min days < max days.

**Impact:** Buyers can be created with `min_invoice_amount >= max_invoice_amount` or `min_days_to_maturity >= max_days_to_maturity`, creating invalid business rules.

**Root Cause:** The create handler bypasses the wizard Step 4 validation.

**File:** [app/admin/buyers/page.tsx](app/admin/buyers/page.tsx#L162-L168)

**Fix:**
```ts
async function handleCreate() {
  // Validate all steps before submit
  for (let step = 1; step <= 4; step++) {
    if (!validateStep(step)) {
      setCreateStep(step);
      return;
    }
  }
  // proceed with createBuyer(...)
}
```

---

### DEF-020: Step 3 (Address) Has No Validation at All (MEDIUM)

**Problem:** `validateStep(3)` is never checked — the function only handles steps 1, 2, and 4. All address fields are optional with no format validation.

**Impact:** Users can advance past the address step without entering any location data, but the Review step shows empty address fields with no warning. Compliance may require at least a city and province.

**Root Cause:** `validateStep()` has no `if (step === 3)` block.

**File:** [app/admin/buyers/page.tsx](app/admin/buyers/page.tsx#L249-L286)

**Fix:** Add address validation if business rules require it, or at least add a soft warning in the Review step when address fields are empty.

---

### DEF-021: No Client-Side Duplicate Buyer Code Check (MEDIUM)

**Problem:** Duplicate buyer codes are only checked server-side in `createBuyer()`. Users type a code, go through 5 wizard steps, and only then get a "duplicate code" error — losing all their input context.

**Impact:** Poor UX — the user must restart the wizard after a late-stage server error.

**Root Cause:** No preemptive check before step progression.

**File:** [app/admin/buyers/page.tsx](app/admin/buyers/page.tsx#L253-L256) — `validateStep(1)` doesn't check uniqueness

**Fix:** Add an async debounced check in Step 1:
```ts
// On code input blur:
const existing = await fetch(`/api/buyers/check-code?code=${code}`)
if (existing.exists) setFormErrors({ code: 'Code already in use' })
```

---

### DEF-022: `console.log` in Production Code (LOW)

**Problem:** Two `console.log` statements log full buyers result and rate cards result on every data fetch.

**Impact:** Sensitive buyer data leaks to browser dev console in production builds.

**Root Cause:** Debug logging not removed.

**File:** [app/admin/buyers/page.tsx](app/admin/buyers/page.tsx#L130-L131)

**Fix:** Remove both `console.log` lines.

---

### DEF-023: Buyer Creation Auto-Creates AP User Without Explicit Confirmation (MEDIUM)

**Problem:** `createBuyer()` in `lib/actions/buyers.ts` automatically creates an AP user (with welcome email) whenever `contact_email` is provided. If AP user creation fails, **the buyer is rolled back** (deleted). This is not surfaced in the wizard UI — the admin doesn't know an AP user will be auto-created.

**Impact:** Buyer creation silently fails if the email service is down or the username-generation logic encounters edge cases. Admins receive a generic error with no insight into the root cause.

**Root Cause:** Buyer + AP user creation is coupled without clear UI communication.

**File:** [lib/actions/buyers.ts](lib/actions/buyers.ts#L278-L302)

**Fix:** Either make AP user creation a separate explicit step after buyer creation, or clearly indicate in the wizard Review step that an AP user and welcome email will be generated. Also: don't roll back the buyer if only the email send fails — separate the two concerns.

---

## 5 — BUYER DETAIL PAGE

### DEF-024: No NaN Guard on Buyer ID Param (MEDIUM)

**Problem:** The buyer detail page converts `params.id` to `Number(...)` without checking for `NaN`. If the URL contains a non-numeric ID (e.g., `/admin/buyers/abc`), `Number("abc")` returns `NaN`, which is passed to all DB queries.

**Impact:** DB queries with `WHERE buyer_id = NaN` return empty results with no user-facing error message, just a blank page.

**Root Cause:** Missing input validation on route parameter.

**File:** [app/admin/buyers/[id]/page.tsx](app/admin/buyers/%5Bid%5D/page.tsx)

**Fix:**
```ts
const buyerId = Number(params.id)
if (isNaN(buyerId)) {
  // Show error or redirect
  toast.error('Invalid buyer ID')
  router.push('/admin/buyers')
  return
}
```

---

### DEF-025: Base64 File Upload for Documents (MEDIUM)

**Problem:** Document uploads in the buyer detail page convert files to base64 in the browser using `FileReader.readAsDataURL()`. The entire base64 string is sent in the request body and stored in the database.

**Impact:** Memory pressure for large files (base64 is ~33% larger). Browser tabs can crash with files > 10-20 MB. Database rows bloat with binary data.

**Root Cause:** No streaming upload or cloud storage integration (Azure Blob, S3).

**File:** [app/admin/buyers/[id]/page.tsx](app/admin/buyers/%5Bid%5D/page.tsx) — file upload handler

**Fix:** Implement presigned URL uploads to Azure Blob Storage, store only the blob URL in the database.

---

## 6 — ADMIN SETTINGS

### DEF-026: Role Enum Mismatch Between UI and Database (HIGH)

**Problem:** The settings page user creation form offers roles `"ap_user"` and `"buyer_admin"`, but the database schema defines the `users.role` enum as `('admin', 'accounts_payable', 'auditor')`.

**Impact:** Creating a user with role `"ap_user"` or `"buyer_admin"` will cause a MySQL constraint violation error. These roles don't exist in the database.

**Root Cause:** UI and DB schema evolved independently.

**Files:**
- [app/admin/settings/page.tsx](app/admin/settings/page.tsx#L41) — `role: "ap_user" as "admin" | "ap_user" | "buyer_admin"`
- [app/admin/settings/page.tsx](app/admin/settings/page.tsx#L616-L617) — `<SelectItem value="ap_user">` and `<SelectItem value="buyer_admin">`
- [scripts/database-schema.sql](scripts/database-schema.sql) — `role ENUM('admin','accounts_payable','auditor')`

**Fix:** Align the UI with the DB enum:
```tsx
<SelectItem value="accounts_payable">Accounts Payable</SelectItem>
<SelectItem value="auditor">Auditor</SelectItem>
```

---

### DEF-027: Settings Saved onBlur Without Confirmation (MEDIUM)

**Problem:** All settings inputs fire `handleSave()` on `onBlur`. An accidental click away from an input saves whatever is in it — including partial edits, accidental deletions, or empty values.

**Impact:** Accidental configuration changes with no undo, no confirmation dialog, and no "Save" button to make the action intentional.

**Root Cause:** UX design chose auto-save without safeguards.

**File:** [app/admin/settings/page.tsx](app/admin/settings/page.tsx#L271-L493) — all `onBlur` handlers

**Fix:** Add a "Save Changes" button with dirty-state tracking, or at minimum add a confirmation toast with an "Undo" option.

---

## 7 — ADMIN SUPPLIERS

### DEF-028: Non-Functional Search and Filter Controls (HIGH)

**Problem:** The suppliers list page renders a search `<Input>` and a "Filter" `<Button>`, but neither has any state, onChange handler, or click handler. They are completely inert.

**Impact:** Users see search/filter UI that does nothing — actively misleading. There's no way to find a specific supplier without scrolling.

**Root Cause:** Server component renders static HTML with no interactivity.

**File:** [app/admin/suppliers/page.tsx](app/admin/suppliers/page.tsx#L69-L79)

**Fix:** Convert to a client component with state management, or extract the search bar into a client component with query-param-based filtering via `useSearchParams()`.

---

### DEF-029: No Pagination on Suppliers List (MEDIUM)

**Problem:** `getAllSuppliers()` fetches all suppliers from the database with no `LIMIT` or pagination. The page renders every supplier in a single list.

**Impact:** Performance degrades linearly with supplier count. At 1000+ suppliers, the page becomes unusably slow.

**Root Cause:** No pagination implemented at the API or UI level.

**File:** [app/admin/suppliers/page.tsx](app/admin/suppliers/page.tsx)

**Fix:** Add cursor or offset pagination to the query and UI.

---

## 8 — LAYOUT & COMPONENTS

### DEF-030: Dead Imports in Admin Shell (LOW)

**Problem:** `admin-shell.tsx` imports `Link` from `next/link` and `Logo` from `@/components/ui/logo`, but neither is used in the component.

**Impact:** Dead code; increases bundle size marginally and misleads future developers.

**Root Cause:** Imports left over from refactoring when the Logo was moved into `DashboardHeader`.

**File:** [components/layouts/admin-shell.tsx](components/layouts/admin-shell.tsx#L4-L6)

**Fix:** Remove unused imports:
```tsx
// Remove:
import Link from "next/link"
import { Logo } from "@/components/ui/logo"
```

---

### DEF-031: Logout Does Not Use CSRF-Safe Method (MEDIUM)

**Problem:** The `handleLogout` in `DashboardHeader` calls `fetch('/api/auth/logout', { method: 'POST' })` without any CSRF token. Combined with the `SameSite: 'lax'` cookie, a malicious site can still trigger a logout (lax allows top-level navigation POST but also most `fetch` requests aren't blocked unless the spec changes).

**Impact:** Cross-site logout attacks can terminate user sessions.

**Root Cause:** No CSRF protection (related to DEF-003).

**File:** [components/admin/dashboard-header.tsx](components/admin/dashboard-header.tsx#L125)

**Fix:** Send a CSRF token with the logout request, or verify the `Origin` header on the server.

---

## 9 — DATABASE SCHEMA

### DEF-032: `payment_capture_schedule` Column Missing from Main Schema (MEDIUM)

**Problem:** The main `database-schema.sql` does not include `payment_capture_schedule` on the `buyers` table. It only exists in `06-add-payment-capture-schedule.sql` migration. Fresh deployments running only the main schema will break buyers creation (column doesn't exist).

**Impact:** Deployment failures if the migration order is not followed exactly. The main schema is not self-contained.

**Root Cause:** Migration was not back-merged into the base schema file.

**File:**
- [scripts/database-schema.sql](scripts/database-schema.sql) — `buyers` table — column absent
- [scripts/06-add-payment-capture-schedule.sql](scripts/06-add-payment-capture-schedule.sql) — column added here

**Fix:** Add `payment_capture_schedule ENUM('immediate','daily','weekly','monthly') DEFAULT 'daily'` to the `buyers` CREATE TABLE in the main schema file.

---

## Summary by Severity

| Severity | Count | IDs |
|----------|-------|-----|
| CRITICAL | 3 | DEF-001, DEF-002, DEF-003 |
| HIGH     | 8 | DEF-004, DEF-005, DEF-009, DEF-010, DEF-014, DEF-017, DEF-018, DEF-026, DEF-028 |
| MEDIUM   | 17 | DEF-006, DEF-007, DEF-008, DEF-011, DEF-012, DEF-013, DEF-015, DEF-016, DEF-019, DEF-020, DEF-021, DEF-023, DEF-024, DEF-025, DEF-027, DEF-029, DEF-031, DEF-032 |
| LOW      | 2 | DEF-022, DEF-030 |

## Priority Remediation Order

1. **Immediate (Sprint 0):** DEF-001, DEF-002, DEF-003, DEF-004, DEF-005, DEF-010
2. **Next Sprint:** DEF-009, DEF-014, DEF-017, DEF-018, DEF-026, DEF-028
3. **Planned:** DEF-006, DEF-008, DEF-011, DEF-012, DEF-013, DEF-019, DEF-023, DEF-027, DEF-029, DEF-031, DEF-032
4. **Backlog:** DEF-007, DEF-015, DEF-016, DEF-020, DEF-021, DEF-022, DEF-024, DEF-025, DEF-030

---

*End of FLOW 1 Audit Report*
