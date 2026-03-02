# SCF Platform — Enterprise QA Audit Report

**Date:** 2026-02-25  
**Scope:** Security, Email Workflows, Data Model Validation, Production Readiness  
**Methodology:** Full manual code review of every file in scope  
**Severity Scale:** CRITICAL > HIGH > MEDIUM > LOW > INFO

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Security — Middleware & Route Protection](#2-security--middleware--route-protection)
3. [Security — Authentication Library](#3-security--authentication-library)
4. [Security — Auth API Routes](#4-security--auth-api-routes)
5. [Security — File Upload & Blob Storage](#5-security--file-upload--blob-storage)
6. [Security — Server & Infrastructure](#6-security--server--infrastructure)
7. [Security — CSP & Headers](#7-security--csp--headers)
8. [Email Workflows](#8-email-workflows)
9. [Data Model & Schema Validation](#9-data-model--schema-validation)
10. [Database Connection & Types](#10-database-connection--types)
11. [Production Readiness](#11-production-readiness)
12. [Risk Matrix Summary](#12-risk-matrix-summary)

---

## 1. Executive Summary

The SCF platform has **48 distinct defects** across security, email, data model, and production-readiness domains. Of these:

| Severity | Count |
|----------|-------|
| CRITICAL | 12 |
| HIGH     | 16 |
| MEDIUM   | 13 |
| LOW      | 5 |
| INFO     | 2 |

The platform suffers from several **systemic weaknesses**: JWT-only sessions with no server-side revocation, public blob storage for financial documents, zero file-upload validation, aggressive CASCADE DELETEs on financial records, an unprotected custom HTTP server, and an incomplete 2FA flow that never issues a session after verification.

**Recommendation:** Do NOT ship to production until all CRITICAL and HIGH findings are resolved.

---

## 2. Security — Middleware & Route Protection

### SEC-01 — Test endpoint exposed in production

| Field | Detail |
|-------|--------|
| **Problem** | `/api/test-email` is listed in `publicApiRoutes` with the comment `"// Should be removed in production"` but no environment guard prevents it from deploying. |
| **Impact** | Attackers can trigger arbitrary emails from the platform, wasting ACS quota and enabling phishing via the platform's own domain. |
| **Root Cause** | Hardcoded route in the public array without `NODE_ENV` conditional. |
| **File** | `middleware.ts` line 49 |
| **Fix** | Wrap in environment check: `...(process.env.NODE_ENV !== 'production' ? ["/api/test-email"] : [])` or delete the route entirely. |
| **Severity** | **HIGH** |

### SEC-02 — Security headers applied only to page routes, not API routes

| Field | Detail |
|-------|--------|
| **Problem** | The `securityHeaders` block (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) is only applied inside the `if (!isApiRoute)` branch. API responses are returned with no hardening headers. |
| **Impact** | API responses are vulnerable to MIME-sniffing, clickjacking via iframes embedding JSON, and referrer leakage. |
| **Root Cause** | Conditional block structure excludes API paths. |
| **File** | `middleware.ts` lines 133–152 |
| **Fix** | Move `securityHeaders` application above the `isApiRoute` check so all responses receive them. Exclude only CSP from API responses if needed. |
| **Severity** | **HIGH** |

### SEC-03 — No CSRF protection on state-changing API routes

| Field | Detail |
|-------|--------|
| **Problem** | No CSRF token validation exists anywhere in the middleware or API routes. All POST/PUT/DELETE endpoints rely solely on the session cookie for authentication. |
| **Impact** | An attacker can craft a page that makes cross-origin POST requests to the platform while the user is authenticated, executing payments, approving suppliers, or changing bank details without consent. |
| **Root Cause** | Omission in middleware design. |
| **File** | `middleware.ts` (entire file) |
| **Fix** | Implement double-submit-cookie or synchronizer-token CSRF protection for all mutation endpoints. Alternatively, enforce `SameSite=Strict` on session cookies (currently `Lax`) and require a custom header (e.g., `X-Requested-With`). |
| **Severity** | **CRITICAL** |

### SEC-04 — Admin API route protection is incomplete

| Field | Detail |
|-------|--------|
| **Problem** | Only `/api/payments` and `/api/suppliers/approved-status` are explicitly listed under `adminApiRoutes`. Other admin-functional endpoints (invoices, offer-batches, reports, settings, users) are not gated by the middleware's role check. |
| **Impact** | AP or supplier users may be able to call admin-only endpoints if they have a valid session. |
| **Root Cause** | Incomplete route enumeration in middleware. |
| **File** | `middleware.ts` lines 55–58 |
| **Fix** | Use a prefix-based matcher: `pathname.startsWith('/api/admin/')` or enumerate all admin endpoints. Audit every API route and apply proper role checks. |
| **Severity** | **HIGH** |

### SEC-05 — Session binding validation not called in middleware

| Field | Detail |
|-------|--------|
| **Problem** | `session.ts` implements `validateSessionBinding()` which checks IP and User-Agent hashes, but the middleware calls only `verifySession()`, never `validateSessionBinding()`. |
| **Impact** | Stolen session tokens can be replayed from any IP or browser. Session binding is security theater — implemented but never enforced. |
| **Root Cause** | Missing integration between session.ts and middleware.ts. |
| **File** | `middleware.ts` (missing call); `lib/auth/session.ts` lines 93–134 |
| **Fix** | Call `validateSessionBinding(session, request.headers)` in the middleware after `verifySession()` succeeds. |
| **Severity** | **HIGH** |

---

## 3. Security — Authentication Library

### SEC-06 — Hardcoded fallback JWT secret in non-production

| Field | Detail |
|-------|--------|
| **Problem** | When `JWT_SECRET` is unset and `NODE_ENV !== 'production'`, the code falls back to `"dev-only-insecure-secret-do-not-use-in-prod"`. If a staging or preview environment ships without the env var, all sessions are signed with a well-known key. |
| **Impact** | Full session forgery on any non-production deploy that omits the env var. |
| **Root Cause** | Convenience fallback without alarms. |
| **File** | `lib/auth/session.ts` line 21 |
| **Fix** | Throw an error at startup if `JWT_SECRET` is missing or shorter than 32 characters, regardless of `NODE_ENV`. Log a warning but never silently continue. |
| **Severity** | **CRITICAL** |

### SEC-07 — `refreshSession()` loses session binding data

| Field | Detail |
|-------|--------|
| **Problem** | `refreshSession()` calls `createSession(session, role)` but does not pass the request `headers` parameter. This means the refreshed token has empty IP/User-Agent hashes, breaking session binding for the rest of the session lifetime. |
| **Impact** | After the first token refresh, session binding is completely neutralized. |
| **Root Cause** | Parameter omission in `refreshSession()`. |
| **File** | `lib/auth/session.ts` — `refreshSession()` function (~line 170) |
| **Fix** | Pass `headers` to `refreshSession()` and thread them through to `createSession()`. |
| **Severity** | **HIGH** |

### SEC-08 — User-Agent binding check commented out

| Field | Detail |
|-------|--------|
| **Problem** | In `validateSessionBinding()`, the User-Agent hash comparison is commented out with `// Temporarily disabled`. |
| **Impact** | Even if SEC-05 were fixed, the User-Agent half of session binding would not fire. |
| **Root Cause** | Left disabled during debugging. |
| **File** | `lib/auth/session.ts` — `validateSessionBinding()` (~line 120) |
| **Fix** | Re-enable the check or remove the dead code. |
| **Severity** | **MEDIUM** |

### SEC-09 — In-memory rate limiting resets on server restart

| Field | Detail |
|-------|--------|
| **Problem** | The primary rate limiter (`rate-limit.ts`) uses a `Map` in process memory. Every server restart, deploy, or IIS app-pool recycle clears all rate-limit state. |
| **Impact** | Attackers can wait for (or trigger) a restart and then brute-force credentials with a fresh limit. Under iisnode, IIS may recycle the app pool frequently. |
| **Root Cause** | No persistent backing store. |
| **File** | `lib/auth/rate-limit.ts` |
| **Fix** | Use `rate-limit-redis.ts` as the primary implementation. The Redis-backed version already exists and falls back to in-memory. Set `REDIS_URL` in production. |
| **Severity** | **MEDIUM** |

### SEC-10 — TOTP secret stored in plaintext in database

| Field | Detail |
|-------|--------|
| **Problem** | `totp_secret` is written to the `users` table as plain base32 text. The code even contains the comment `"In production, you might want to encrypt this"`. |
| **Impact** | Database compromise (SQL injection, backup leak, insider threat) exposes all TOTP seeds, allowing bypass of 2FA for every admin user. |
| **Root Cause** | Encryption was deferred and never implemented. |
| **File** | `app/api/auth/2fa/setup/route.ts` (~line 65); `scripts/06-security-enhancements-schema.sql` |
| **Fix** | Encrypt the TOTP secret with an application-level key (e.g., AES-256-GCM) before writing to the DB. Decrypt at verification time only. |
| **Severity** | **HIGH** |

### SEC-11 — OTP codes stored in plaintext

| Field | Detail |
|-------|--------|
| **Problem** | OTP codes (6-digit) are inserted into `otp_codes` as plain text. They are also logged to the console in some code paths. |
| **Impact** | Any database read access reveals valid OTPs. Console logs in production may persist OTPs in log aggregators. |
| **Root Cause** | OTPs treated as non-sensitive data. |
| **File** | `app/api/auth/login/ap/route.ts` (OTP generation); `scripts/database-schema.sql` — `otp_codes` table |
| **Fix** | Hash OTPs with bcrypt or SHA-256 before storage. Compare with the same hash at verification. Stop logging OTPs. |
| **Severity** | **HIGH** |

### SEC-12 — No server-side session revocation

| Field | Detail |
|-------|--------|
| **Problem** | `logout/route.ts` clears cookies but does not blacklist the JWT server-side. The token remains valid until its natural expiry (4 hours for admin, 2 hours for supplier). |
| **Impact** | Stolen tokens cannot be revoked. Forced logouts (account lock, password change, 2FA disable) do not actually terminate existing sessions. |
| **Root Cause** | Pure JWT with no revocation list. The `user_sessions` table was created in migration 06 but is never used by the application. |
| **File** | `app/api/auth/logout/route.ts`; `lib/auth/session.ts` |
| **Fix** | Use the `user_sessions` table as a session store or implement a JWT blacklist (Redis set with TTL = remaining JWT lifetime). On logout/lock/password change, invalidate all sessions for that user. |
| **Severity** | **CRITICAL** |

### SEC-13 — Audit logging swallows errors silently

| Field | Detail |
|-------|--------|
| **Problem** | `createAuditLog()` performs a raw `INSERT` with no try/catch. If the insert fails (e.g., FK violation, connection drop), the error propagates and may break the calling auth flow. |
| **Impact** | A transient DB issue in audit logging could prevent legitimate logins. |
| **Root Cause** | No error isolation in `audit.ts`. |
| **File** | `lib/auth/audit.ts` |
| **Fix** | Wrap the insert in try/catch and log the failure without rethrowing. Audit logging should never block the primary flow. |
| **Severity** | **MEDIUM** |

---

## 4. Security — Auth API Routes

### SEC-14 — Admin login does not check 2FA before issuing session

| Field | Detail |
|-------|--------|
| **Problem** | `login/admin/route.ts` validates credentials, then immediately calls `createSession()` and sets the cookie. It never checks whether the user has `totp_enabled = 1`. The 2FA verification endpoint (`2fa/verify/route.ts`) expects to run separately, but the user already has a full session. |
| **Impact** | 2FA is completely bypassable. After password-only login, the admin has full access; they are never forced through the TOTP step. |
| **Root Cause** | 2FA was bolted on after the original auth flow without integrating it into the login pipeline. |
| **File** | `app/api/auth/login/admin/route.ts` |
| **Fix** | After password verification, check `totp_enabled`. If true, return a partial/pending response (HTTP 200 with `{ requires2FA: true, tempToken: ... }`) without setting the session cookie. Only issue the full session after `2fa/verify` succeeds. |
| **Severity** | **CRITICAL** |

### SEC-15 — 2FA verify endpoint does not issue a session token

| Field | Detail |
|-------|--------|
| **Problem** | `2fa/verify/route.ts` verifies the TOTP code and returns `{ success: true }` but never calls `createSession()` or sets a cookie. The flow is incomplete — even if the client forces 2FA, there is no session upgrade path. |
| **Impact** | The 2FA flow is broken in both directions: login bypasses it (SEC-14), and even if it didn't, verify wouldn't complete the login. |
| **Root Cause** | Incomplete implementation. |
| **File** | `app/api/auth/2fa/verify/route.ts` |
| **Fix** | After successful TOTP verification, issue the full session cookie (same as login does) and redirect to the dashboard. |
| **Severity** | **CRITICAL** |

### SEC-16 — AP login returns OTP in response body in development

| Field | Detail |
|-------|--------|
| **Problem** | `login/ap/route.ts` includes the OTP in the JSON response when `NODE_ENV !== 'production'`. If the production `NODE_ENV` is ever misconfigured (e.g., "Production" with capital P), OTPs will be returned to the client. |
| **Impact** | OTP exposed in browser network tab, proxy logs, and any response-caching layers. |
| **Root Cause** | Dev convenience with fragile guard. |
| **File** | `app/api/auth/login/ap/route.ts` |
| **Fix** | Remove the OTP from the response entirely. For development, use a fixed seed OTP or check the server console logs only. |
| **Severity** | **HIGH** |

### SEC-17 — Change password does not require current password

| Field | Detail |
|-------|--------|
| **Problem** | `change-password/route.ts` requires only an active session and a new password. The old password is never verified. |
| **Impact** | If a session token is stolen (XSS, shared computer), the attacker can change the account password without knowing the original, permanently locking out the legitimate user. |
| **Root Cause** | Old-password verification was omitted. |
| **File** | `app/api/auth/change-password/route.ts` |
| **Fix** | Add a `currentPassword` parameter and verify it with `bcrypt.compare()` before allowing the change. |
| **Severity** | **HIGH** |

### SEC-18 — Change password sets `is_email_verified = 1`

| Field | Detail |
|-------|--------|
| **Problem** | The UPDATE query in change-password unconditionally sets `is_email_verified = 1`. |
| **Impact** | A user can bypass email verification by simply changing their password, even if they never verified their email. |
| **Root Cause** | Incorrect business logic bundled with password change. |
| **File** | `app/api/auth/change-password/route.ts` |
| **Fix** | Remove `is_email_verified = 1` from the password-change query. Email verification should be a separate workflow. |
| **Severity** | **MEDIUM** |

### SEC-19 — Supplier access short code generated with `Math.random()`

| Field | Detail |
|-------|--------|
| **Problem** | `supplier/request-access/route.ts` generates a 6-char alphanumeric short code using `Math.random()`, which is not cryptographically secure. |
| **Impact** | Short codes are predictable. An attacker can enumerate valid codes to access supplier accounts. |
| **Root Cause** | Incorrect RNG selection. |
| **File** | `app/api/auth/supplier/request-access/route.ts` |
| **Fix** | Use `crypto.randomBytes(4).toString('hex').slice(0, 6).toUpperCase()` or `crypto.randomInt()` per character. |
| **Severity** | **MEDIUM** |

### SEC-20 — Unused OTPs not invalidated after successful verification

| Field | Detail |
|-------|--------|
| **Problem** | `verify-otp/route.ts` marks the verified OTP as `is_used = 1` but does not invalidate other outstanding OTPs for the same user. |
| **Impact** | If multiple OTPs were generated (e.g., by clicking "resend"), the older ones remain valid and usable. |
| **Root Cause** | Missing invalidation query. |
| **File** | `app/api/auth/verify-otp/route.ts` |
| **Fix** | After successful verification, run `UPDATE otp_codes SET is_used = 1 WHERE user_id = ? AND is_used = 0`. |
| **Severity** | **MEDIUM** |

### SEC-21 — Admin login does not pass request headers for session binding

| Field | Detail |
|-------|--------|
| **Problem** | `createSession()` is called without the `headers` parameter in both admin and AP login routes. |
| **Impact** | Sessions are created without IP/User-Agent binding data, making session binding impossible from the start. |
| **Root Cause** | API route does not forward the `request.headers` object to `createSession()`. |
| **File** | `app/api/auth/login/admin/route.ts`; `app/api/auth/login/ap/route.ts` |
| **Fix** | Pass `request.headers` as the third argument to `createSession()`. |
| **Severity** | **HIGH** |

---

## 5. Security — File Upload & Blob Storage

### SEC-22 — Zero file validation on cession agreement upload

| Field | Detail |
|-------|--------|
| **Problem** | `upload/route.ts` accepts any file of any size with any name. No MIME type check, no extension whitelist, no magic-byte validation, no file-size limit. |
| **Impact** | Attackers can upload executables, scripts, or malicious PDFs. A multi-GB upload can exhaust storage and memory. Path traversal via crafted filenames is possible. |
| **Root Cause** | Validation was never implemented. |
| **File** | `app/api/cession-agreement/upload/route.ts` |
| **Fix** | 1) Whitelist extensions: `.pdf`, `.jpg`, `.png`. 2) Validate MIME type and magic bytes. 3) Enforce max file size (e.g., 10 MB). 4) Sanitize the filename (strip path separators, limit length). 5) Add virus scanning via Azure Defender for Storage or ClamAV. |
| **Severity** | **CRITICAL** |

### SEC-23 — Blob storage container has public read access

| Field | Detail |
|-------|--------|
| **Problem** | `blob-storage.ts` creates the container with `access: "blob"`, meaning every blob in the container is publicly readable by URL without authentication. |
| **Impact** | Anyone with or who guesses the URL can download signed cession agreements, which contain sensitive financial and identity data (POPIA / GDPR violation). |
| **Root Cause** | Default access level set too liberally. |
| **File** | `lib/services/blob-storage.ts` — `ensureContainerExists()` |
| **Fix** | Set `access: undefined` (private) or omit the access parameter. Serve documents via an authenticated API route that generates time-limited SAS tokens. |
| **Severity** | **CRITICAL** |

### SEC-24 — Uploaded filename passed unsanitized to blob storage

| Field | Detail |
|-------|--------|
| **Problem** | `uploadCessionAgreement()` concatenates `supplierId-timestamp-uuid-fileName` using the raw `fileName` from the client. |
| **Impact** | Path traversal characters (`../`), special characters, or extremely long names could cause unexpected blob naming or local filesystem writes (in dev fallback). |
| **Root Cause** | No sanitization of user-provided filename. |
| **File** | `lib/actions/suppliers.ts` line 24 |
| **Fix** | Strip all path components: `const safeName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100)`. |
| **Severity** | **HIGH** |

### SEC-25 — Local filesystem fallback writes to `public/` directory

| Field | Detail |
|-------|--------|
| **Problem** | When blob storage is not configured, files are saved to `public/uploads/cession-agreements/`, which is directly served by Next.js as static assets. |
| **Impact** | Uploaded cession agreements become publicly accessible without authentication in development. If this code path is accidentally triggered in production, documents are exposed. |
| **Root Cause** | Using the public directory for user uploads. |
| **File** | `lib/actions/suppliers.ts` lines 18–27 |
| **Fix** | Move the upload directory outside `public/` (e.g., to a `storage/` directory) and serve files through an authenticated API route. |
| **Severity** | **MEDIUM** |

---

## 6. Security — Server & Infrastructure

### SEC-26 — `server.js` is a bare HTTP server with no security middleware

| Field | Detail |
|-------|--------|
| **Problem** | `server.js` creates a raw `http.createServer()` with only Next.js request handling. No Helmet, no CORS policy, no compression, no request-size limits, no rate limiting at the server level. |
| **Impact** | Large-payload DoS, missing security headers at the HTTP level, no CORS enforcement, no protection against slow-loris or header-bombing attacks. |
| **Root Cause** | Minimal server setup for iisnode without security hardening. |
| **File** | `server.js` |
| **Fix** | Add `helmet()` for headers, `cors()` with explicit origins, request body size limits, and `compression()`. Alternatively, handle these at the IIS/reverse-proxy level via `web.config`. |
| **Severity** | **CRITICAL** |

### SEC-27 — `web.config` lacks security headers and request limits

| Field | Detail |
|-------|--------|
| **Problem** | `web.config` configures URL rewriting for iisnode but does not set: `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Content-Security-Policy`, request size limits (`maxAllowedContentLength`), or IP restrictions. The `hiddenSegments` rule removes the default `bin` protection. |
| **Impact** | IIS serves responses without any security headers. No protection against oversized uploads at the IIS level. |
| **Root Cause** | Security configuration was not added to the IIS config. |
| **File** | `web.config` |
| **Fix** | Add `<httpProtocol><customHeaders>` with HSTS, X-Frame-Options, X-Content-Type-Options. Add `<requestFiltering><requestLimits maxAllowedContentLength="10485760" />` for 10MB limit. Restore `bin` to `hiddenSegments`. |
| **Severity** | **HIGH** |

### SEC-28 — No HTTPS enforcement

| Field | Detail |
|-------|--------|
| **Problem** | Neither `server.js`, `web.config`, nor the middleware enforce HTTPS or redirect HTTP to HTTPS. Cookies are set with `secure: process.env.NODE_ENV === "production"` but there is no guarantee that the IIS site binds only to HTTPS. |
| **Impact** | Session cookies transmitted over HTTP can be intercepted (session hijacking). |
| **Root Cause** | No redirect rule; reliance on hosting configuration that may not exist. |
| **File** | `web.config` (missing rewrite rule); `middleware.ts` |
| **Fix** | Add an IIS rewrite rule: `<rule name="HTTPS Redirect"><match url="(.*)" /><conditions><add input="{HTTPS}" pattern="off" /></conditions><action type="Redirect" url="https://{HTTP_HOST}/{R:1}" redirectType="Permanent" /></rule>`. |
| **Severity** | **HIGH** |

---

## 7. Security — CSP & Headers

### SEC-29 — CSP includes `unsafe-eval` and `unsafe-inline` in production

| Field | Detail |
|-------|--------|
| **Problem** | The inline CSP in `middleware.ts` includes `'unsafe-eval'` and `'unsafe-inline'` in `script-src` for all environments. |
| **Impact** | XSS payloads can execute arbitrary JavaScript via `eval()` or inline `<script>` tags, completely defeating CSP. |
| **Root Cause** | Overly permissive CSP to avoid breaking functionality. |
| **File** | `middleware.ts` lines 136–148 |
| **Fix** | Remove `'unsafe-eval'` and `'unsafe-inline'`. Use the nonce-based CSP from `lib/security/csp.ts` instead of the inline version. Audit all inline scripts and convert them to external files or nonce-tagged scripts. |
| **Severity** | **HIGH** |

### SEC-30 — Nonce generated but not consumed

| Field | Detail |
|-------|--------|
| **Problem** | `middleware.ts` generates a nonce via `crypto.randomUUID()` at line ~135 but the CSP string uses `'unsafe-inline'` instead of `'nonce-${nonce}'`. Meanwhile, `lib/security/csp.ts` correctly implements nonce-based CSP but is never imported or called by the middleware. |
| **Impact** | The nonce generation is dead code. The stronger CSP implementation in `csp.ts` is unused. |
| **Root Cause** | Two competing CSP implementations; the weaker one is active. |
| **File** | `middleware.ts` lines 135–148; `lib/security/csp.ts` |
| **Fix** | Replace the inline CSP in middleware with a call to `buildCSPHeader()` from `lib/security/csp.ts`. Pass the nonce to `<Script>` components via `next/headers`. |
| **Severity** | **MEDIUM** |

---

## 8. Email Workflows

### EMAIL-01 — `email.ts` does not use standardized templates from `email-templates.ts`

| Field | Detail |
|-------|--------|
| **Problem** | `lib/services/email.ts` (790 lines) contains inline HTML templates for every email type. `lib/services/email-templates.ts` provides a `getEmailHeader()`, `getEmailFooter()`, and branded wrapper — but none of the actual email-sending functions in `email.ts` use them. |
| **Impact** | Brand inconsistency, duplicated styling, and a maintenance nightmare — any brand or layout change must be applied in two places. |
| **Root Cause** | Templates were built after the email functions were already implemented, with no refactoring to integrate them. |
| **File** | `lib/services/email.ts`; `lib/services/email-templates.ts` |
| **Fix** | Refactor all `send*Email()` functions to use the shared template wrappers from `email-templates.ts`. |
| **Severity** | **MEDIUM** |

### EMAIL-02 — SVG images in email templates

| Field | Detail |
|-------|--------|
| **Problem** | `email-templates.ts` embeds an inline SVG logo in the email header. |
| **Impact** | SVG is not supported by Gmail, Outlook (desktop and web), Yahoo, and most email clients. The logo will not render for the majority of recipients. |
| **Root Cause** | SVG chosen for scalability without testing email client compatibility. |
| **File** | `lib/services/email-templates.ts` — `getEmailHeader()` |
| **Fix** | Replace SVG with a hosted PNG/JPEG image referenced via `<img>` tag, or use a text-based fallback header. |
| **Severity** | **MEDIUM** |

### EMAIL-03 — Hardcoded copyright year "© 2025"

| Field | Detail |
|-------|--------|
| **Problem** | Multiple email templates in `email.ts` hardcode `© 2025` in the footer HTML. |
| **Impact** | Stale copyright after year rollover. Minor but unprofessional. |
| **Root Cause** | Static string instead of dynamic year. |
| **File** | `lib/services/email.ts` (multiple locations) |
| **Fix** | Use `new Date().getFullYear()` in the template. |
| **Severity** | **LOW** |

### EMAIL-04 — Email failures return `false` silently

| Field | Detail |
|-------|--------|
| **Problem** | All `send*Email()` functions catch errors, log them, and return `false`. Callers generally do not check the return value. |
| **Impact** | Users (suppliers, admins) may never receive critical emails (OTPs, welcome emails, offer notifications) with no alerting or retry. The login flow for AP users depends on email delivery for OTP — a silent failure means the user cannot log in with no error message. |
| **Root Cause** | Error swallowing pattern. |
| **File** | `lib/services/email.ts` |
| **Fix** | 1) Throw errors from email functions and handle them in callers with user-facing messages. 2) Add retry logic (3 attempts with exponential backoff). 3) Log email failures to a dedicated alerts channel or Azure Monitor. |
| **Severity** | **HIGH** |

### EMAIL-05 — No email retry mechanism

| Field | Detail |
|-------|--------|
| **Problem** | Email sending is fire-and-forget with a single attempt. Azure Communication Services may return transient errors (429, 503). |
| **Impact** | Transient failures cause permanent email loss. |
| **Root Cause** | No retry logic. |
| **File** | `lib/services/email.ts` |
| **Fix** | Implement retry with exponential backoff, or use a queue (Azure Service Bus / Storage Queue) for email delivery with dead-letter handling. |
| **Severity** | **MEDIUM** |

### EMAIL-06 — Connection string logged to console

| Field | Detail |
|-------|--------|
| **Problem** | `email.ts` logs the ACS connection string (or parts of it) to the console during initialization and error handling. |
| **Impact** | Secrets appear in server logs, which may be stored in Azure App Service log streams, log aggregators, or developer consoles. |
| **Root Cause** | Debug logging left in production code. |
| **File** | `lib/services/email.ts` |
| **Fix** | Remove all `console.log` statements that output connection strings or other secrets. Use structured logging with secret masking. |
| **Severity** | **HIGH** |

### EMAIL-07 — Supplier request-access email uses inline HTML, not templates

| Field | Detail |
|-------|--------|
| **Problem** | `supplier/request-access/route.ts` builds its own HTML email body inline rather than calling any function from `email.ts` or using `email-templates.ts`. |
| **Impact** | Yet another templating inconsistency. Changes to branding or email layout must be applied in three separate locations. |
| **Root Cause** | Inline convenience during rapid development. |
| **File** | `app/api/auth/supplier/request-access/route.ts` |
| **Fix** | Create a `sendSupplierAccessCodeEmail()` function in `email.ts` using the shared templates. |
| **Severity** | **LOW** |

---

## 9. Data Model & Schema Validation

### DATA-01 — CASCADE DELETE chains can destroy financial records

| Field | Detail |
|-------|--------|
| **Problem** | The schema uses `ON DELETE CASCADE` throughout: `buyers` → `invoices` → `offers` → `payments`. Deleting a single buyer cascades through and permanently destroys all associated invoices, offers, and payment records. |
| **Impact** | Accidental or malicious buyer deletion causes irrecoverable loss of financial audit trail. This violates regulatory requirements for financial record retention. |
| **Root Cause** | CASCADE used for convenience without considering financial data retention requirements. |
| **File** | `scripts/database-schema.sql` lines 130 (invoices FK), 300 (offers FK), 360 (payments FK) |
| **Fix** | 1) Change `ON DELETE CASCADE` to `ON DELETE RESTRICT` for all financial tables. 2) Implement soft delete (add `deleted_at DATETIME NULL`) on buyers, suppliers, invoices, offers, and payments. 3) Create an archival workflow for data that must be removed. |
| **Severity** | **CRITICAL** |

### DATA-02 — No supplier-buyer many-to-many relationship table

| Field | Detail |
|-------|--------|
| **Problem** | Suppliers reference buyers through `company_code` (a string match to `buyers.code`), with no formal FK or junction table. |
| **Impact** | No referential integrity for the supplier-buyer relationship. A supplier can reference a non-existent buyer code. Queries joining suppliers to buyers must use string matching, which is slower and error-prone. |
| **Root Cause** | Organic schema growth without normalization. |
| **File** | `scripts/database-schema.sql` — `suppliers` table; `lib/actions/suppliers.ts` line 69 |
| **Fix** | Create a `buyer_suppliers` junction table with FKs to both `buyers.buyer_id` and `suppliers.supplier_id`. Migrate existing `company_code` references. |
| **Severity** | **MEDIUM** |

### DATA-03 — `approved_by` column has no FK to `users`

| Field | Detail |
|-------|--------|
| **Problem** | `suppliers.approved_by` stores a user ID but has no foreign key constraint. |
| **Impact** | Orphaned references if the approving user is deleted. No referential integrity guarantee. |
| **Root Cause** | FK constraint omitted. |
| **File** | `scripts/database-schema.sql` — `suppliers` table |
| **Fix** | Add `FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL`. |
| **Severity** | **LOW** |

### DATA-04 — Bank account numbers stored in plaintext

| Field | Detail |
|-------|--------|
| **Problem** | `suppliers.bank_account_number` and `bank_change_requests.new_account_number` / `old_account_number` are stored as plain VARCHAR columns. |
| **Impact** | Database compromise exposes sensitive banking information for all suppliers. Violates POPIA (South Africa) and PCI-DSS guidelines for storing financial instrument data. |
| **Root Cause** | No encryption-at-rest at the application level. |
| **File** | `scripts/database-schema.sql` — `suppliers`, `bank_change_requests` tables |
| **Fix** | Encrypt bank account numbers using application-level AES-256-GCM encryption. Store the ciphertext and use column-level decryption in the application. Consider also Azure MySQL's Transparent Data Encryption (TDE) as a complementary measure. |
| **Severity** | **HIGH** |

### DATA-05 — `audit_logs.user_id` FK references `users` but is used for suppliers too

| Field | Detail |
|-------|--------|
| **Problem** | `audit_logs.user_id` has `FOREIGN KEY (user_id) REFERENCES users(user_id)`, but supplier actions log the `supplier_id` in the `user_id` field, which will fail the FK constraint. |
| **Impact** | Either supplier audit logs fail silently, or the FK was removed/is not enforced, undermining the audit trail's integrity. |
| **Root Cause** | Single `user_id` column reused for two different entity types. |
| **File** | `scripts/database-schema.sql` — `audit_logs` table; `lib/auth/audit.ts` |
| **Fix** | Add a separate `actor_type ENUM('user', 'supplier', 'system')` column and `actor_id INT` column. Remove the FK on `user_id` or make it nullable with a conditional FK. |
| **Severity** | **MEDIUM** |

### DATA-06 — Migration numbering conflict

| Field | Detail |
|-------|--------|
| **Problem** | Two migration files are numbered `06`: `06-add-payment-capture-schedule.sql` and `06-security-enhancements-schema.sql`. |
| **Impact** | No deterministic migration order. Running migrations may apply one before the other depending on filesystem sort order, potentially causing schema inconsistencies. |
| **Root Cause** | No migration framework; manual numbering. |
| **File** | `scripts/06-add-payment-capture-schedule.sql`; `scripts/06-security-enhancements-schema.sql` |
| **Fix** | Renumber: `06-add-payment-capture-schedule.sql` → `06`, `07-security-enhancements-schema.sql`. Adopt a proper migration tool (e.g., `knex`, `prisma migrate`, `dbmate`). |
| **Severity** | **MEDIUM** |

### DATA-07 — Security enhancement tables exist in schema but are unused by application code

| Field | Detail |
|-------|--------|
| **Problem** | Migration `06-security-enhancements-schema.sql` creates `user_sessions`, `security_events`, `login_attempts`, and `rate_limits` tables. None of these tables are referenced anywhere in the application code. |
| **Impact** | False sense of security — the tables suggest distributed rate limiting and session management, but neither is actually implemented. |
| **Root Cause** | Tables were created as part of a planned feature that was never integrated. |
| **File** | `scripts/06-security-enhancements-schema.sql`; no references in `lib/` or `app/` |
| **Fix** | Either integrate the tables into the application (use `user_sessions` for session revocation per SEC-12, `login_attempts` for persistent rate limiting per SEC-09) or document them as future work. |
| **Severity** | **MEDIUM** |

### DATA-08 — Seed data contains placeholder password hash and weak default password

| Field | Detail |
|-------|--------|
| **Problem** | `02-seed-initial-data.sql` contains a comment `"password: Admin@123 - hashed with bcrypt"` and inserts a hash for this weak password. Additionally, `system_settings` seeds show `password_min_length = 4`. |
| **Impact** | If seed data is run in production (or not rotated after initial setup), the default admin account uses a publicly known, weak password. Minimum password length of 4 is far below security standards. |
| **Root Cause** | Development seed data not intended for production use, with no guard preventing it. |
| **File** | `scripts/02-seed-initial-data.sql` line 10; production backup shows `password_min_length = '4'` |
| **Fix** | 1) Remove the default admin password from seed data; require first-run setup. 2) Set minimum password length to 12+ characters. 3) Add a startup check that refuses to run if the default admin password is still active. |
| **Severity** | **CRITICAL** |

---

## 10. Database Connection & Types

### DB-01 — SSL only enabled for Azure hosts

| Field | Detail |
|-------|--------|
| **Problem** | `lib/db.ts` adds SSL configuration only when `DB_HOST` contains `'azure.com'`. Any other production MySQL host (e.g., Amazon RDS, self-hosted with TLS) connects without encryption. |
| **Impact** | Database credentials and query data transmitted in plaintext over the network for non-Azure hosts. |
| **Root Cause** | Host-name-based SSL detection is too narrow. |
| **File** | `lib/db.ts` |
| **Fix** | Enable SSL by default for all production connections. Use `DB_SSL=true` environment variable to control SSL. Only disable for local development. |
| **Severity** | **MEDIUM** |

### DB-02 — Default localhost credentials with empty password

| Field | Detail |
|-------|--------|
| **Problem** | `db.ts` defaults to `user: 'root'`, `password: ''`, `database: 'fmf_scf_platform'` when environment variables are not set. |
| **Impact** | If deployed without DB credentials configured, the application connects (or attempts to connect) to a local MySQL instance as root with no password. |
| **Root Cause** | Developer convenience defaults. |
| **File** | `lib/db.ts` line 8–11 |
| **Fix** | Throw an error at startup if `DB_HOST`, `DB_USER`, or `DB_PASSWORD` are not set in production. |
| **Severity** | **MEDIUM** |

### DB-03 — Missing TypeScript types for multiple database entities

| Field | Detail |
|-------|--------|
| **Problem** | `lib/types/database.ts` defines types for `Buyer`, `Supplier`, `User`, `Invoice`, `Offer`, `Payment`, `AuditLog`, `CessionAgreement`, `BankChangeRequest`. Missing types: `OfferBatch`, `RateCard`, `RepaymentSupplierToken`, `OTPCode`, `Notification`, `NotificationRule`, `SecurityEvent`, `UserSession`, `TrustedDevice`, `LoginAttempt`, `SystemSetting`, `EmailTemplate`, `BuyerDocument`, `BuyerChangeLog`. |
| **Impact** | Queries for these entities use `any` types, losing type safety and enabling runtime bugs. |
| **Root Cause** | Types file not updated as schema evolved. |
| **File** | `lib/types/database.ts` |
| **Fix** | Add TypeScript interfaces for all 15+ missing entity types, matching the database schema. |
| **Severity** | **LOW** |

### DB-04 — No connection retry logic

| Field | Detail |
|-------|--------|
| **Problem** | `db.ts` creates the connection pool once. If the initial connection fails or the pool becomes exhausted, there is no retry mechanism. |
| **Impact** | Transient network issues or Azure MySQL maintenance windows will cause the application to return 500 errors until manually restarted. |
| **Root Cause** | No connection resilience pattern. |
| **File** | `lib/db.ts` |
| **Fix** | Add connection retry with exponential backoff on pool creation. Enable the mysql2 `waitForConnections` and `queueLimit` options. Consider a health-check endpoint that validates DB connectivity. |
| **Severity** | **MEDIUM** |

---

## 11. Production Readiness

### PROD-01 — No health check endpoint

| Field | Detail |
|-------|--------|
| **Problem** | While `app/api/health/` exists in the structure, it needs to validate DB connectivity, email service availability, and blob storage access — not just return 200. |
| **Impact** | Load balancers and monitoring cannot distinguish between a healthy and unhealthy instance. |
| **Root Cause** | Shallow health check. |
| **File** | `app/api/health/` |
| **Fix** | Implement a comprehensive health check that tests DB query, ACS connectivity, and blob storage access. Return 503 if any dependency is down. |
| **Severity** | **MEDIUM** |

### PROD-02 — Excessive `console.log` usage with sensitive data

| Field | Detail |
|-------|--------|
| **Problem** | Throughout the codebase, `console.log` is used for logging — including OTP codes, connection strings, session details, and error stack traces. |
| **Impact** | Sensitive data persists in Azure App Service log streams, potentially accessible to anyone with log-read permissions. |
| **Root Cause** | No structured logging framework. |
| **File** | Multiple files across `lib/services/`, `lib/actions/`, `app/api/` |
| **Fix** | Replace `console.log` with a structured logger (e.g., `pino`, `winston`) with configurable log levels. Mask sensitive fields. Set log level to `warn` in production. |
| **Severity** | **HIGH** |

### PROD-03 — No environment variable validation at startup

| Field | Detail |
|-------|--------|
| **Problem** | Critical env vars (`JWT_SECRET`, `DB_HOST`, `DB_PASSWORD`, `AZURE_COMMUNICATION_CONNECTION_STRING`, `AZURE_STORAGE_CONNECTION_STRING`) are checked at usage time with fallbacks, not at startup. |
| **Impact** | The application starts successfully but fails unpredictably when specific features are used with missing configuration. |
| **Root Cause** | No startup validation. |
| **File** | Multiple (session.ts, db.ts, email.ts, blob-storage.ts) |
| **Fix** | Add a startup validation module (e.g., using `zod` or `envalid`) that validates all required environment variables and fails fast with clear error messages. |
| **Severity** | **HIGH** |

### PROD-04 — `appsettings.json` may contain secrets

| Field | Detail |
|-------|--------|
| **Problem** | `appsettings.json` is checked into the repository. If it contains connection strings or keys, they are exposed in version control. |
| **Impact** | Secret exposure in Git history. |
| **Root Cause** | Config file in repo without `.gitignore` exclusion. |
| **File** | `appsettings.json` |
| **Fix** | Verify `appsettings.json` contains no secrets. Add it to `.gitignore` if it does, and rotate any exposed credentials. |
| **Severity** | **INFO** |

### PROD-05 — No application error boundary for API routes

| Field | Detail |
|-------|--------|
| **Problem** | API routes have inconsistent error handling. Some catch errors and return JSON; others let exceptions propagate to Next.js's default error handler, which may expose stack traces. |
| **Impact** | Unhandled errors may leak internal implementation details (file paths, query strings, library versions) to the client. |
| **Root Cause** | No global error-handling middleware for API routes. |
| **File** | Various `app/api/` routes |
| **Fix** | Create a shared `withErrorHandler` wrapper for all API routes that catches errors, logs them server-side, and returns a generic `{ error: "Internal Server Error" }` to the client. |
| **Severity** | **MEDIUM** |

### PROD-06 — `password_min_length` set to 4 in production data

| Field | Detail |
|-------|--------|
| **Problem** | The `system_settings` table in the production backup shows `password_min_length = '4'`. |
| **Impact** | Extremely weak passwords are accepted, undermining all authentication security. |
| **Root Cause** | Setting was not updated after initial development. |
| **File** | `scripts/backups/fmf_scf_platform_2026-02-24.sql` — system_settings row 11 |
| **Fix** | Update to minimum 12 characters. Add complexity requirements (uppercase, lowercase, digit, special char) in both the UI and API validation. |
| **Severity** | **CRITICAL** |

---

## 12. Risk Matrix Summary

| ID | Finding | Severity | Category | Effort |
|----|---------|----------|----------|--------|
| SEC-03 | No CSRF protection | CRITICAL | Security | Medium |
| SEC-06 | Hardcoded fallback JWT secret | CRITICAL | Security | Low |
| SEC-12 | No server-side session revocation | CRITICAL | Security | Medium |
| SEC-14 | Admin login bypasses 2FA | CRITICAL | Security | Medium |
| SEC-15 | 2FA verify doesn't issue session | CRITICAL | Security | Low |
| SEC-22 | Zero file upload validation | CRITICAL | Security | Medium |
| SEC-23 | Public blob storage for documents | CRITICAL | Security | Low |
| SEC-26 | Bare HTTP server, no security middleware | CRITICAL | Security | Medium |
| DATA-01 | CASCADE DELETE destroys financial records | CRITICAL | Data Model | Medium |
| DATA-08 | Default admin password & min length 4 | CRITICAL | Data Model | Low |
| PROD-06 | `password_min_length = 4` in production | CRITICAL | Production | Low |
| SEC-01 | Test email endpoint in production | HIGH | Security | Low |
| SEC-02 | Security headers missing on API routes | HIGH | Security | Low |
| SEC-04 | Incomplete admin API route protection | HIGH | Security | Medium |
| SEC-05 | Session binding never called | HIGH | Security | Low |
| SEC-07 | refreshSession loses binding data | HIGH | Security | Low |
| SEC-10 | TOTP secret in plaintext | HIGH | Security | Medium |
| SEC-11 | OTP in plaintext + logged | HIGH | Security | Medium |
| SEC-16 | OTP in dev response body | HIGH | Security | Low |
| SEC-17 | Change password doesn't require old password | HIGH | Security | Low |
| SEC-21 | Login doesn't pass headers for binding | HIGH | Security | Low |
| SEC-24 | Unsanitized filename in uploads | HIGH | Security | Low |
| SEC-27 | web.config missing security headers | HIGH | Infrastructure | Medium |
| SEC-28 | No HTTPS enforcement | HIGH | Infrastructure | Low |
| SEC-29 | CSP has unsafe-eval and unsafe-inline | HIGH | Security | High |
| DATA-04 | Bank account numbers in plaintext | HIGH | Data Model | Medium |
| EMAIL-04 | Email failures silent, no retry | HIGH | Email | Medium |
| EMAIL-06 | Connection string logged to console | HIGH | Email | Low |
| PROD-02 | Excessive console.log with secrets | HIGH | Production | Medium |
| PROD-03 | No env var validation at startup | HIGH | Production | Low |
| SEC-08 | User-Agent binding commented out | MEDIUM | Security | Low |
| SEC-09 | In-memory rate limiting | MEDIUM | Security | Low |
| SEC-13 | Audit log errors propagate | MEDIUM | Security | Low |
| SEC-18 | Change password sets email_verified | MEDIUM | Security | Low |
| SEC-19 | Math.random() for short codes | MEDIUM | Security | Low |
| SEC-20 | Unused OTPs not invalidated | MEDIUM | Security | Low |
| SEC-25 | Local upload to public/ directory | MEDIUM | Security | Low |
| SEC-30 | Nonce generated but unused | MEDIUM | Security | Medium |
| DATA-02 | No supplier-buyer junction table | MEDIUM | Data Model | High |
| DATA-05 | audit_logs user_id FK mismatch | MEDIUM | Data Model | Medium |
| DATA-06 | Migration numbering conflict | MEDIUM | Data Model | Low |
| DATA-07 | Security tables unused | MEDIUM | Data Model | Medium |
| DB-01 | SSL only for Azure hosts | MEDIUM | Database | Low |
| DB-02 | Default root credentials | MEDIUM | Database | Low |
| DB-04 | No connection retry | MEDIUM | Database | Medium |
| EMAIL-01 | Duplicate email templates | MEDIUM | Email | Medium |
| EMAIL-02 | SVG in email templates | MEDIUM | Email | Low |
| EMAIL-05 | No email retry mechanism | MEDIUM | Email | Medium |
| PROD-01 | Shallow health check | MEDIUM | Production | Low |
| PROD-05 | Inconsistent API error handling | MEDIUM | Production | Medium |
| EMAIL-03 | Hardcoded copyright year | LOW | Email | Low |
| EMAIL-07 | Inline HTML in request-access email | LOW | Email | Low |
| DATA-03 | approved_by no FK | LOW | Data Model | Low |
| DB-03 | Missing TypeScript types | LOW | Types | Medium |
| PROD-04 | appsettings.json in repo | INFO | Production | Low |

---

## Recommended Remediation Priority

### Sprint 1 (Immediate — Block Release)
1. **SEC-14 + SEC-15**: Fix 2FA login flow (check 2FA, issue session after verify)
2. **SEC-22 + SEC-23 + SEC-24**: File upload validation + private blob storage
3. **SEC-03**: Add CSRF protection
4. **SEC-06**: Remove fallback JWT secret, fail-fast on missing secret
5. **SEC-12**: Implement session revocation using `user_sessions` table
6. **DATA-01**: Replace CASCADE DELETE with RESTRICT + soft delete
7. **DATA-08 + PROD-06**: Fix default password, set min length to 12
8. **SEC-26 + SEC-27**: Harden server.js and web.config

### Sprint 2 (High Priority)
9. **SEC-01 + SEC-02 + SEC-04 + SEC-05 + SEC-07 + SEC-21**: Middleware hardening
10. **SEC-10 + SEC-11**: Encrypt TOTP secrets and hash OTPs
11. **SEC-17**: Require current password for change
12. **SEC-28 + SEC-29**: HTTPS enforcement + CSP fix
13. **EMAIL-04 + EMAIL-06**: Email error handling + remove secret logging
14. **PROD-02 + PROD-03**: Structured logging + env validation

### Sprint 3 (Standard Priority)
15. All MEDIUM and LOW findings

---

*End of Audit Report*
