# Security Fix: G-01 Authentication & Access Control Leakage

## Issue Summary
Admin, Buyer (AP), and Supplier login paths were exposed or discoverable to other roles, creating a security vulnerability.

## Fixes Applied

### 1. ✅ Removed Admin Login from Home Page
**File:** `app/page.tsx`
**Change:** Removed the "Admin Login" button from the public home page
**Impact:** Admin login is no longer discoverable from the home page. Only AP and Supplier logins are displayed.

### 2. ✅ Removed "Back to Home" Link from Admin Login
**File:** `app/login/admin/page.tsx`
**Change:** Removed the "Back to home" navigation link that exposed the admin login URL
**Impact:** Admin users cannot navigate back to home from the admin login page, preventing enumeration of the login path.

### 3. ✅ Enhanced Middleware Role-Based Access Control
**File:** `middleware.ts`
**Changes:**
- Removed `/login/admin` from public routes list
- Added strict role-based access control preventing cross-role navigation
- Admin users attempting to access `/ap` routes are not redirected to admin dashboard (prevents enumeration)
- AP users attempting to access `/admin` routes are redirected to home only, not admin
- Added comments explaining the security architecture

**Impact:** 
- Users cannot access routes belonging to other roles
- Invalid access attempts don't reveal the existence of other role's paths
- Cleaner separation of authentication contexts

### 4. ✅ Proper Role-Based Isolation
**Architecture:**
- **Admin Login:** `/login/admin` (non-discoverable, no public links)
- **AP Login:** `/login/ap` (discoverable from home page)
- **Supplier Login:** `/supplier/access` (discoverable from home page)

## Access Control Rules

### Admin Users
- Can access: `/admin/**` routes
- Cannot see: AP or Supplier login options
- If they try to access `/ap/**`: redirected to home

### AP Users (Accounts Payable)
- Can access: `/ap/**` routes
- Cannot access: Admin routes
- If they try to access `/admin/**`: redirected to home

### Supplier Users
- Can access: `/supplier/**` routes
- Cannot see: Admin or AP login options
- Separate authentication context with isolated session management

## Testing Checklist

- [ ] Navigate to home page - only see "Accounts Payable Login" and "Supplier Login"
- [ ] Direct URL access to `/login/admin` should work (authenticated users only)
- [ ] From AP login, clicking back goes to home (not disclosing admin path)
- [ ] AP users trying to access `/admin/dashboard` get redirected to home
- [ ] Admin users trying to access `/ap/dashboard` get redirected to home
- [ ] Verify role validation in session middleware
- [ ] Check no hardcoded links to admin login anywhere in public code

## Related Components
- Session management: `lib/auth/session.ts`
- Login API routes: `app/api/auth/login/`
- Middleware enforcement: `middleware.ts`
- Home page: `app/page.tsx`
- Admin login page: `app/login/admin/page.tsx`
- AP login page: `app/login/ap/page.tsx`

## Security Notes
- The admin login path is now **non-discoverable** from the public interface
- All role-based redirects are designed to **not reveal** the existence of alternative paths
- Users cannot enumerate login endpoints for other roles
- Cross-role access attempts fail safely without exposing alternative authentication options
