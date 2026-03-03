/**
 * TOTP (Time-based One-Time Password) Authentication
 * Implements RFC 6238 compliant TOTP for two-factor authentication
 * 
 * Usage:
 * 1. Generate secret for user: generateTOTPSecret()
 * 2. Generate QR code URL: generateTOTPUri(secret, email)
 * 3. Verify token: verifyTOTP(token, secret)
 */

import { createHmac, randomBytes } from "crypto"

// TOTP Configuration
const TOTP_CONFIG = {
  // Time step in seconds (standard is 30)
  timeStep: 30,
  // Number of digits in the OTP (standard is 6)
  digits: 6,
  // Algorithm (SHA1 is most compatible with authenticator apps)
  algorithm: "sha1" as const,
  // Window for time drift tolerance (1 = check previous and next period)
  window: 1,
  // Issuer name for authenticator apps
  issuer: "SCF Platform",
}

// Base32 alphabet for secret encoding
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

/**
 * Encode buffer to Base32 (RFC 4648)
 */
function base32Encode(buffer: Buffer): string {
  let result = ""
  let bits = 0
  let value = 0

  for (const byte of buffer) {
    value = (value << 8) | byte
    bits += 8

    while (bits >= 5) {
      result += BASE32_ALPHABET[(value >>> (bits - 5)) & 0x1f]
      bits -= 5
    }
  }

  if (bits > 0) {
    result += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f]
  }

  return result
}

/**
 * Decode Base32 string to buffer
 */
function base32Decode(encoded: string): Buffer {
  const cleaned = encoded.toUpperCase().replace(/[^A-Z2-7]/g, "")
  const bytes: number[] = []
  let bits = 0
  let value = 0

  for (const char of cleaned) {
    const index = BASE32_ALPHABET.indexOf(char)
    if (index === -1) continue

    value = (value << 5) | index
    bits += 5

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }

  return Buffer.from(bytes)
}

/**
 * Generate a cryptographically secure TOTP secret
 * Returns Base32 encoded secret (20 bytes = 160 bits)
 */
export function generateTOTPSecret(): string {
  const secretBytes = randomBytes(20)
  return base32Encode(secretBytes)
}

/**
 * Generate TOTP URI for QR code (otpauth:// format)
 * Compatible with Google Authenticator, Authy, Microsoft Authenticator, etc.
 */
export function generateTOTPUri(secret: string, userEmail: string, issuer?: string): string {
  const encodedIssuer = encodeURIComponent(issuer || TOTP_CONFIG.issuer)
  const encodedEmail = encodeURIComponent(userEmail)
  const encodedSecret = encodeURIComponent(secret)

  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${encodedSecret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${TOTP_CONFIG.digits}&period=${TOTP_CONFIG.timeStep}`
}

/**
 * Generate TOTP code for a given secret and time
 */
function generateTOTPCode(secret: string, time: number): string {
  const secretBuffer = base32Decode(secret)
  
  // Calculate time counter
  const counter = Math.floor(time / TOTP_CONFIG.timeStep)
  
  // Convert counter to 8-byte buffer (big-endian)
  const counterBuffer = Buffer.alloc(8)
  counterBuffer.writeBigInt64BE(BigInt(counter))

  // Generate HMAC-SHA1
  const hmac = createHmac(TOTP_CONFIG.algorithm, secretBuffer)
  hmac.update(counterBuffer)
  const hash = hmac.digest()

  // Dynamic truncation
  const offset = hash[hash.length - 1] & 0x0f
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff)

  // Generate OTP
  const otp = binary % Math.pow(10, TOTP_CONFIG.digits)
  return otp.toString().padStart(TOTP_CONFIG.digits, "0")
}

/**
 * Verify TOTP token
 * Checks current time period and allows for time drift within window
 */
export function verifyTOTP(token: string, secret: string): boolean {
  // Validate input
  if (!token || !secret) return false
  if (!/^\d{6}$/.test(token)) return false

  const now = Math.floor(Date.now() / 1000)

  // Check current time and adjacent windows for time drift tolerance
  for (let i = -TOTP_CONFIG.window; i <= TOTP_CONFIG.window; i++) {
    const checkTime = now + i * TOTP_CONFIG.timeStep
    const expectedToken = generateTOTPCode(secret, checkTime)
    
    // Use timing-safe comparison to prevent timing attacks
    if (timingSafeEqual(token, expectedToken)) {
      return true
    }
  }

  return false
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * Generate current TOTP code (for testing/debugging only)
 */
export function getCurrentTOTP(secret: string): string {
  const now = Math.floor(Date.now() / 1000)
  return generateTOTPCode(secret, now)
}

/**
 * Get time remaining until next TOTP code
 */
export function getTimeRemaining(): number {
  const now = Math.floor(Date.now() / 1000)
  return TOTP_CONFIG.timeStep - (now % TOTP_CONFIG.timeStep)
}

/**
 * Generate backup codes for account recovery
 * Returns 10 single-use 8-character codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    const code = randomBytes(4).toString("hex").toUpperCase()
    // Format as XXXX-XXXX for readability
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`)
  }
  return codes
}

/**
 * Get the HMAC key for backup code hashing.
 * Uses BACKUP_CODE_SECRET env var, falling back to JWT_SECRET.
 * Never uses a hardcoded value in production.
 */
function getBackupCodeKey(): string {
  const key = process.env.BACKUP_CODE_SECRET || process.env.JWT_SECRET
  if (!key && process.env.NODE_ENV === "production") {
    throw new Error("CRITICAL: BACKUP_CODE_SECRET or JWT_SECRET must be set in production")
  }
  return key || "dev-only-backup-code-key"
}

/**
 * Hash backup code for secure storage
 */
export function hashBackupCode(code: string): string {
  const normalized = code.replace(/-/g, "").toUpperCase()
  return createHmac("sha256", getBackupCodeKey())
    .update(normalized)
    .digest("hex")
}

/**
 * Verify backup code against stored hash
 */
export function verifyBackupCode(code: string, hash: string): boolean {
  const codeHash = hashBackupCode(code)
  return timingSafeEqual(codeHash, hash)
}
