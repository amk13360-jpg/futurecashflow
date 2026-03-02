import bcrypt from "bcryptjs"
import { randomBytes, randomInt } from "crypto"

// Hash password with increased work factor for security
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12) // Increased from 10 to 12 rounds
  return bcrypt.hash(password, salt)
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Generate cryptographically secure OTP code (6 digits)
export function generateOTP(): string {
  // Use crypto.randomInt for cryptographically secure random numbers
  return randomInt(100000, 999999).toString()
}

// Generate cryptographically secure token for supplier invites
export function generateToken(): string {
  // Use crypto.randomBytes for cryptographically secure random bytes
  return randomBytes(32).toString("hex")
}

// Generate a readable temporary password for supplier credential emails
// Format: 3 uppercase + 3 lowercase + 3 digits, shuffled (9 chars total)
export function generateTemporaryPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"
  const lower = "abcdefghjkmnpqrstuvwxyz"
  const digits = "23456789"
  const bytes = randomBytes(12)
  const parts = [
    upper[bytes[0] % upper.length],
    upper[bytes[1] % upper.length],
    upper[bytes[2] % upper.length],
    lower[bytes[3] % lower.length],
    lower[bytes[4] % lower.length],
    lower[bytes[5] % lower.length],
    digits[bytes[6] % digits.length],
    digits[bytes[7] % digits.length],
    digits[bytes[8] % digits.length],
  ]
  // Fisher-Yates shuffle using crypto bytes
  for (let i = parts.length - 1; i > 0; i--) {
    const j = bytes[i] % (i + 1)
    ;[parts[i], parts[j]] = [parts[j], parts[i]]
  }
  return parts.join("")
}
