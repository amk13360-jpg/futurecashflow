import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifySession, verifySupplierSession, shouldRefreshSession, refreshSession } from "./lib/auth/session"

// CSP Nonce generation (inline to avoid import issues in Edge runtime)
function generateCSPNonce(): string {
	const array = new Uint8Array(16)
	crypto.getRandomValues(array)
	return Buffer.from(array).toString("base64")
}

// Build CSP header with nonce
function buildCSPHeader(nonce: string, isDev: boolean): string {
	if (isDev) {
		return [
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
			"style-src 'self' 'unsafe-inline'",
			"img-src 'self' data: blob: https: http:",
			"font-src 'self' data:",
			"connect-src 'self' https: http: ws: wss:",
			"frame-ancestors 'self'",
		].join("; ")
	}

	return [
		"default-src 'self'",
		"script-src 'self' 'unsafe-eval' 'unsafe-inline'",
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' data: blob: https:",
		"font-src 'self' data:",
		"connect-src 'self' https:",
		"frame-ancestors 'self'",
		"form-action 'self'",
		"base-uri 'self'",
		"object-src 'none'",
		"upgrade-insecure-requests",
	].join("; ")
}

// Public API routes that don't require authentication
const publicApiRoutes = [
	"/api/auth/login/admin",
	"/api/auth/login/ap",
	"/api/auth/verify-otp",
	"/api/auth/supplier",
	"/api/auth/2fa",
	"/api/health",
	"/api/test-email", // Should be removed in production
]

// API routes that require admin authentication
const adminApiRoutes = [
	"/api/payments",
	"/api/suppliers/approved-status",
]

// API routes that require any authenticated user (admin or AP)
const protectedApiRoutes = [
	"/api/session",
	"/api/suppliers",
	"/api/invoices",
	"/api/notifications",
]

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl
	const isDev = process.env.NODE_ENV !== "production"

	// Generate CSP nonce for this request
	const nonce = generateCSPNonce()

	// Public routes that don't require authentication
	// NOTE: /login/admin is INTENTIONALLY NOT listed here - it's protected and non-discoverable
const publicRoutes = ["/", "/landing", "/login/ap", "/supplier/access", "/supplier/login"]

	// Handle API routes with proper authentication
	if (pathname.startsWith("/api")) {
		// Allow public API routes
		if (publicApiRoutes.some(route => pathname.startsWith(route))) {
			return NextResponse.next()
		}

		// Cession agreement API - requires supplier session
		if (pathname.startsWith("/api/cession-agreement")) {
			const token = request.cookies.get("supplier_session")?.value
			if (!token) {
				return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
			}
			const session = await verifySupplierSession(token)
			if (!session) {
				return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
			}
			return NextResponse.next()
		}

		// Protected API routes - require session
		const token = request.cookies.get("session")?.value
		if (!token) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const session = await verifySession(token)
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		// Admin-only API routes
		if (adminApiRoutes.some(route => pathname.startsWith(route))) {
			if (session.role !== "admin") {
				return NextResponse.json({ error: "Forbidden" }, { status: 403 })
			}
		}

		return NextResponse.next()
	}

	if (publicRoutes.includes(pathname) || pathname.startsWith("/(public)") || pathname.startsWith("/_next")) {
		return addSecurityHeaders(NextResponse.next(), nonce, isDev)
	}

	// Protect admin login path - only allow direct access, no redirects to reveal it
	if (pathname === "/login/admin") {
		return addSecurityHeaders(NextResponse.next(), nonce, isDev)
	}

	// Check for admin/AP routes
	if (pathname.startsWith("/admin") || pathname.startsWith("/ap")) {
		const token = request.cookies.get("session")?.value

		if (!token) {
			// Redirect to appropriate login page based on route
			const loginUrl = pathname.startsWith("/admin") ? "/login/admin" : "/login/ap"
			return NextResponse.redirect(new URL(loginUrl, request.url))
		}

		const session = await verifySession(token)

		if (!session) {
			// Redirect to appropriate login page based on route
			const loginUrl = pathname.startsWith("/admin") ? "/login/admin" : "/login/ap"
			return NextResponse.redirect(new URL(loginUrl, request.url))
		}

		// Strict role-based access control - prevent cross-role access
		if (pathname.startsWith("/admin")) {
			if (session.role !== "admin") {
				// Do not redirect to home - prevent enumeration. Redirect to their own dashboard
				const redirectUrl = session.role === "accounts_payable" ? "/ap/dashboard" : "/"
				return NextResponse.redirect(new URL(redirectUrl, request.url))
			}
		}

		if (pathname.startsWith("/ap")) {
			if (session.role !== "accounts_payable") {
				// Do not redirect to admin. Redirect to home
				return NextResponse.redirect(new URL("/", request.url))
			}
		}

		// Sliding session: refresh token if it's close to expiring (within 1 hour)
		const needsRefresh = await shouldRefreshSession(token)
		if (needsRefresh) {
			const newToken = await refreshSession(token)
			if (newToken) {
				const response = addSecurityHeaders(NextResponse.next(), nonce, isDev)
				response.cookies.set("session", newToken, {
					httpOnly: true,
					secure: process.env.NODE_ENV === "production",
					sameSite: "lax",
					maxAge: 60 * 60 * 4, // 4 hours
					path: "/",
				})
				return response
			}
		}

		return addSecurityHeaders(NextResponse.next(), nonce, isDev)
	}

	// Check for supplier routes
	if (pathname.startsWith("/supplier")) {
		const token = request.cookies.get("supplier_session")?.value

		if (!token) {
			return NextResponse.redirect(new URL("/supplier/access", request.url))
		}

		const session = await verifySupplierSession(token)

		if (!session) {
			return NextResponse.redirect(new URL("/supplier/access", request.url))
		}

		return addSecurityHeaders(NextResponse.next(), nonce, isDev)
	}

	return addSecurityHeaders(NextResponse.next(), nonce, isDev)
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse, nonce: string, isDev: boolean): NextResponse {
	// CSP header
	response.headers.set("Content-Security-Policy", buildCSPHeader(nonce, isDev))
	
	// Pass nonce to pages via header (for inline scripts)
	response.headers.set("x-csp-nonce", nonce)
	
	// Additional security headers
	response.headers.set("X-DNS-Prefetch-Control", "on")
	response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
	response.headers.set("X-Frame-Options", "SAMEORIGIN")
	response.headers.set("X-Content-Type-Options", "nosniff")
	response.headers.set("X-XSS-Protection", "1; mode=block")
	response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
	response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
	
	return response
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
