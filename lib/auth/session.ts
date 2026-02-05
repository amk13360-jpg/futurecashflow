import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")

export interface SessionData {
  userId: number
  username: string
  email: string
  role: "admin" | "accounts_payable" | "auditor"
  buyerId?: number
  fullName?: string
  buyerName?: string
}

export interface SupplierSessionData {
  supplierId: number
  email: string
  name: string
}

// Create session token for users
export async function createSession(data: SessionData): Promise<string> {
  const token = await new SignJWT({ ...data })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("4h") // 4 hours - extended for long operations like CSV uploads
    .sign(SECRET_KEY)

  return token
}

// Create session token for suppliers
export async function createSupplierSession(data: SupplierSessionData): Promise<string> {
  const token = await new SignJWT({ ...data, type: "supplier" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h") // 2 hours for suppliers
    .sign(SECRET_KEY)

  return token
}

// Verify and decode session token
export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY)
    return payload as SessionData
  } catch (error) {
    return null
  }
}

// Verify supplier session token
export async function verifySupplierSession(token: string): Promise<SupplierSessionData | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY)
    if ((payload as any).type === "supplier") {
      return payload as SupplierSessionData
    }
    return null
  } catch (error) {
    return null
  }
}

// Get current session from cookies
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("session")?.value
  if (!token) return null
  return verifySession(token)
}

// Get current supplier session from cookies
export async function getSupplierSession(): Promise<SupplierSessionData | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("supplier_session")?.value
  if (!token) return null
  return verifySupplierSession(token)
}

// Set session cookie
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 4, // 4 hours
    path: "/",
  })
}

// Set supplier session cookie
export async function setSupplierSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set("supplier_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 120, // 2 hours
    path: "/",
  })
}

// Clear session cookie
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete("session")
  cookieStore.delete("supplier_session")
}

// Check if session token is close to expiring (within 1 hour)
export async function shouldRefreshSession(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY)
    const exp = payload.exp
    if (!exp) return false
    const now = Math.floor(Date.now() / 1000)
    const timeRemaining = exp - now
    // Refresh if less than 1 hour remaining
    return timeRemaining < 60 * 60
  } catch {
    return false
  }
}

// Refresh session - creates new token with same data but extended expiration
export async function refreshSession(token: string): Promise<string | null> {
  const session = await verifySession(token)
  if (!session) return null
  return createSession(session)
}
