import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"

// SECURITY: Lazily resolve JWT_SECRET so the module can be imported at build time
// (during `next build`, env vars like JWT_SECRET are not available).
// The actual validation happens on first use at runtime.
let _secretKey: Uint8Array | null = null

function getSecretKey(): Uint8Array {
  if (_secretKey) return _secretKey

  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret || jwtSecret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRITICAL: JWT_SECRET environment variable must be set with at least 32 characters in production")
    }
    console.warn("WARNING: JWT_SECRET not properly configured. Using insecure default for development only.")
  }

  _secretKey = new TextEncoder().encode(
    jwtSecret || (process.env.NODE_ENV !== "production" ? "dev-only-insecure-secret-do-not-use-in-prod" : "")
  )
  return _secretKey
}

// Session binding configuration
const ENABLE_SESSION_BINDING = process.env.ENABLE_SESSION_BINDING !== "false"

export interface SessionData {
  userId: number
  username: string
  email: string
  role: "admin" | "accounts_payable" | "auditor"
  buyerId?: number
  fullName?: string
  buyerName?: string
  // Session binding fields (optional for backwards compatibility)
  ipHash?: string
  userAgentHash?: string
}

export interface SupplierSessionData {
  supplierId: number
  email: string
  name: string
  // Session binding fields
  ipHash?: string
  userAgentHash?: string
}

/**
 * Generate a hash for session binding
 * Uses SHA-256 to create a fingerprint without storing raw data
 */
export function generateBindingHash(value: string): string {
  // Dynamic require to avoid breaking Edge Runtime (middleware)
  // This function is only called from server routes, never from middleware
  const { createHash } = require("crypto")
  return createHash("sha256").update(value).digest("hex").substring(0, 16)
}

/**
 * Extract client fingerprint from request headers
 */
export function getClientFingerprint(headers: Headers): { ipHash: string; userAgentHash: string } {
  // Get IP address
  const ip = headers.get("x-forwarded-for")?.split(",")[0].trim() 
    || headers.get("x-real-ip") 
    || headers.get("cf-connecting-ip") 
    || "unknown"
  
  // Get User-Agent
  const userAgent = headers.get("user-agent") || "unknown"
  
  return {
    ipHash: generateBindingHash(ip),
    userAgentHash: generateBindingHash(userAgent)
  }
}

/**
 * Validate session binding (IP and User-Agent match)
 * Returns true if binding is valid or disabled
 */
export function validateSessionBinding(
  session: SessionData | SupplierSessionData,
  headers: Headers
): { valid: boolean; reason?: string } {
  // Skip validation if session binding is disabled or session has no binding data
  if (!ENABLE_SESSION_BINDING || !session.ipHash) {
    return { valid: true }
  }

  const currentFingerprint = getClientFingerprint(headers)
  
  // Check IP binding (strict)
  if (session.ipHash !== currentFingerprint.ipHash) {
    return { valid: false, reason: "IP address mismatch" }
  }
  
  // Check User-Agent binding (optional - can be disabled for mobile apps)
  // User-Agent changes are less suspicious than IP changes
  // Uncomment the following to enable strict user-agent checking:
  // if (session.userAgentHash !== currentFingerprint.userAgentHash) {
  //   return { valid: false, reason: "User-Agent mismatch" }
  // }
  
  return { valid: true }
}

// Create session token for users
export async function createSession(data: SessionData, headers?: Headers): Promise<string> {
  const sessionData = { ...data }
  
  // Add session binding if headers provided
  if (headers && ENABLE_SESSION_BINDING) {
    const fingerprint = getClientFingerprint(headers)
    sessionData.ipHash = fingerprint.ipHash
    sessionData.userAgentHash = fingerprint.userAgentHash
  }
  
  const token = await new SignJWT({ ...sessionData })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("4h") // 4 hours - extended for long operations like CSV uploads
    .sign(getSecretKey())

  return token
}

// Create session token for suppliers
export async function createSupplierSession(data: SupplierSessionData, headers?: Headers): Promise<string> {
  const sessionData = { ...data, type: "supplier" }
  
  // Add session binding if headers provided
  if (headers && ENABLE_SESSION_BINDING) {
    const fingerprint = getClientFingerprint(headers)
    ;(sessionData as any).ipHash = fingerprint.ipHash
    ;(sessionData as any).userAgentHash = fingerprint.userAgentHash
  }
  
  const token = await new SignJWT({ ...sessionData })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h") // 2 hours for suppliers
    .sign(getSecretKey())

  return token
}

// Verify and decode session token
export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    // Validate required fields exist before casting
    if (
      typeof payload.userId === "number" &&
      typeof payload.username === "string" &&
      typeof payload.email === "string" &&
      typeof payload.role === "string"
    ) {
      return payload as unknown as SessionData
    }
    return null
  } catch (error) {
    return null
  }
}

// Verify supplier session token
export async function verifySupplierSession(token: string): Promise<SupplierSessionData | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    // Validate required fields exist before casting
    if (
      (payload as any).type === "supplier" &&
      typeof payload.supplierId === "number" &&
      typeof payload.email === "string" &&
      typeof payload.name === "string"
    ) {
      return payload as unknown as SupplierSessionData
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
    const { payload } = await jwtVerify(token, getSecretKey())
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
// Accepts optional headers to preserve session binding (IP/UserAgent)
export async function refreshSession(token: string, headers?: Headers): Promise<string | null> {
  const session = await verifySession(token)
  if (!session) return null
  return createSession(session, headers)
}
