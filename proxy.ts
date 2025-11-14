import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifySession, verifySupplierSession } from "./lib/auth/session"

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl

	// Public routes that don't require authentication
	const publicRoutes = ["/", "/login", "/login/admin", "/login/ap", "/supplier/access"]

	if (publicRoutes.includes(pathname)) {
		return NextResponse.next()
	}

	// Check for admin/AP routes
	if (pathname.startsWith("/admin") || pathname.startsWith("/ap")) {
		const token = request.cookies.get("session")?.value

		if (!token) {
			return NextResponse.redirect(new URL("/login", request.url))
		}

		const session = await verifySession(token)

		if (!session) {
			return NextResponse.redirect(new URL("/login", request.url))
		}

		// Check role-based access
		if (pathname.startsWith("/admin") && session.role !== "admin") {
			return NextResponse.redirect(new URL("/ap/dashboard", request.url))
		}

		if (pathname.startsWith("/ap") && session.role !== "accounts_payable") {
			return NextResponse.redirect(new URL("/admin/dashboard", request.url))
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
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
