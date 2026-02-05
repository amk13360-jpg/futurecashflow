import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifySession, verifySupplierSession, shouldRefreshSession, refreshSession } from "./lib/auth/session"

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl

	// Public routes that don't require authentication
	// NOTE: /login/admin is INTENTIONALLY NOT listed here - it's protected and non-discoverable
	const publicRoutes = ["/", "/landing", "/login/ap", "/supplier/access"]

	if (publicRoutes.includes(pathname) || pathname.startsWith("/(public)") || pathname.startsWith("/_next") || pathname.startsWith("/api")) {
		return NextResponse.next()
	}

	// Protect admin login path - only allow direct access, no redirects to reveal it
	if (pathname === "/login/admin") {
		return NextResponse.next()
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
				const response = NextResponse.next()
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

		return NextResponse.next()
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

		return NextResponse.next()
	}

	return NextResponse.next()
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
